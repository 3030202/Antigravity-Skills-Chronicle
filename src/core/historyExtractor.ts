import * as cp from 'child_process';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TrajectorySummary {
    id: string;
    summary: string;
    projectName: string;
    workspaceUri: string;
    createdTime: string;
    // Internal: which server this conversation belongs to (for later fetching)
    _serverPort?: string;
    _serverToken?: string;
}

interface ServerInstance {
    port: string;
    token: string;
}

export class HistoryExtractor {
    // Legacy single-server state (kept for backward compat with getConversationMarkdown fallback)
    private _port: string | null = null;
    private _token: string | null = null;
    // All discovered servers
    private _servers: ServerInstance[] = [];

    constructor() { }

    /**
     * Discovers all running Antigravity Language Server instances.
     * Each VS Code workspace has its own Language Server process.
     * Returns an array of { port, token } for each reachable instance.
     */
    private _discoverAllServers(): Promise<ServerInstance[]> {
        return new Promise((resolve) => {
            cp.exec('wmic process where "name like \'%language_server%\'" get commandline,processid', async (err, stdout) => {
                if (err) {
                    console.error("[Antigravity History] Error listing language_server processes.", err.message);
                    return resolve([]);
                }

                // Parse all PIDs and their CSRF tokens from wmic output
                const serverCandidates: { pid: string; token: string }[] = [];
                const lines = stdout.split('\n');

                for (let line of lines) {
                    line = line.trim();
                    if (!line.includes('language_server')) { continue; }
                    const parts = line.split(/\s+/);
                    const potentialPid = parts[parts.length - 1];
                    if (!/^\d+$/.test(potentialPid)) { continue; }

                    const tokenMatch = line.match(/--csrf_token\s+([a-zA-Z0-9\-]+)/);
                    const token = tokenMatch ? tokenMatch[1] : '';
                    serverCandidates.push({ pid: potentialPid, token });
                }

                if (serverCandidates.length === 0) {
                    console.error("[Antigravity History] No language_server processes found.");
                    return resolve([]);
                }

                // For each PID, find its listening port via netstat, then validate the API
                const discovered: ServerInstance[] = [];

                // Run netstat once and reuse
                cp.exec('netstat -ano', async (errNet, stdoutNet) => {
                    if (errNet) {
                        console.error("[Antigravity History] netstat failed.", errNet.message);
                        return resolve([]);
                    }

                    const netstatLines = stdoutNet.split('\n');

                    for (const candidate of serverCandidates) {
                        // Find all LISTENING ports owned by this PID
                        const listeningPorts: string[] = [];
                        for (const pl of netstatLines) {
                            if (pl.includes('LISTENING') && pl.trim().endsWith(candidate.pid)) {
                                const portMatch = pl.match(/127\.0\.0\.1:(\d+)/);
                                if (portMatch && !listeningPorts.includes(portMatch[1])) {
                                    listeningPorts.push(portMatch[1]);
                                }
                            }
                        }

                        // Check each port to find the API endpoint
                        for (const port of listeningPorts) {
                            try {
                                const ok = await this._checkApiPort(port, candidate.token);
                                if (ok) {
                                    discovered.push({ port, token: candidate.token });
                                    break; // One port per process is enough
                                }
                            } catch (_) { /* skip */ }
                        }
                    }

                    console.log(`[Antigravity History] Discovered ${discovered.length} Language Server(s) from ${serverCandidates.length} process(es).`);
                    resolve(discovered);
                });
            });
        });
    }

    /**
     * Tests if a port/token pair responds to the Antigravity API.
     */
    private _checkApiPort(port: string, token: string): Promise<boolean> {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port: port,
                path: '/exa.language_server_pb.LanguageServerService/GetAllCascadeTrajectories',
                method: 'POST',
                timeout: 3000,
                headers: {
                    'Content-Type': 'application/json',
                    'Connect-Protocol-Version': '1',
                    'X-Codeium-Csrf-Token': token
                }
            }, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
            req.write('{}');
            req.end();
        });
    }

    /**
     * Legacy single-server initialize (used as fallback for getConversationMarkdown).
     */
    public async initialize(): Promise<boolean> {
        const servers = await this._discoverAllServers();
        if (servers.length === 0) { return false; }
        // Use first available server as the legacy single connection
        this._port = servers[0].port;
        this._token = servers[0].token;
        this._servers = servers;
        return true;
    }

    /**
     * Queries a single server for all its conversation summaries.
     */
    private _fetchConversationsFromServer(server: ServerInstance): Promise<TrajectorySummary[]> {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port: server.port,
                path: '/exa.language_server_pb.LanguageServerService/GetAllCascadeTrajectories',
                method: 'POST',
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                    'Connect-Protocol-Version': '1',
                    'X-Codeium-Csrf-Token': server.token
                }
            }, (res) => {
                const chunks: any[] = [];
                res.on('data', d => chunks.push(d));
                res.on('end', () => {
                    try {
                        const buffer = Buffer.concat(chunks);
                        const data = JSON.parse(buffer.toString('utf8'));
                        const summaries = data.trajectorySummaries || {};
                        const ids = Object.keys(summaries);

                        const results: TrajectorySummary[] = [];
                        for (const id of ids) {
                            const sumData = summaries[id];
                            const summaryText = sumData.summary || 'Untitled';

                            let projectName = 'Uncategorized';
                            let workspaceUri = '';
                            if (sumData.workspaces && sumData.workspaces.length > 0 && sumData.workspaces[0].workspaceFolderAbsoluteUri) {
                                workspaceUri = sumData.workspaces[0].workspaceFolderAbsoluteUri;
                                const cleanUri = workspaceUri.replace(/^file:\/\/\//, '').replace(/\\/g, '/');
                                const parts = cleanUri.split('/').filter((p: string) => p.trim() !== '');
                                if (parts.length > 0) {
                                    projectName = parts[parts.length - 1];
                                }
                            }

                            results.push({
                                id,
                                summary: summaryText,
                                projectName,
                                workspaceUri,
                                createdTime: sumData.createdTime || new Date().toISOString(),
                                _serverPort: server.port,
                                _serverToken: server.token
                            });
                        }
                        resolve(results);
                    } catch (err) {
                        console.error(`[Antigravity History] Failed to parse response from port ${server.port}`, err);
                        resolve([]);
                    }
                });
            });

            req.on('timeout', () => { req.destroy(); resolve([]); });
            req.on('error', () => resolve([]));
            req.write('{}');
            req.end();
        });
    }

    /**
     * Retrieves ALL conversation summaries from ALL running Language Server instances.
     * Deduplicates by conversation ID and sorts by createdTime descending.
     */
    public async getAllConversations(): Promise<TrajectorySummary[]> {
        // Always re-discover to pick up newly opened workspaces
        const servers = await this._discoverAllServers();
        if (servers.length === 0) {
            throw new Error("Could not connect to any Antigravity Language Server. Please ensure Antigravity is running.");
        }

        // Update legacy fields for getConversationMarkdown fallback
        this._port = servers[0].port;
        this._token = servers[0].token;
        this._servers = servers;

        // Query all servers in parallel
        const allResults = await Promise.all(servers.map(s => this._fetchConversationsFromServer(s)));

        // Merge and deduplicate by ID (first occurrence wins)
        const seen = new Set<string>();
        const merged: TrajectorySummary[] = [];
        for (const batch of allResults) {
            for (const conv of batch) {
                if (!seen.has(conv.id)) {
                    seen.add(conv.id);
                    merged.push(conv);
                }
            }
        }

        // Deep Archive Unearthing - Append all raw .pb files from disk that the API hides!
        try {
            const conversationsDir = path.join(os.homedir(), '.gemini', 'antigravity', 'conversations');
            if (fs.existsSync(conversationsDir)) {
                const files = fs.readdirSync(conversationsDir);
                for (const f of files) {
                    if (f.endsWith('.pb')) {
                        const id = f.replace('.pb', '');
                        if (!seen.has(id)) {
                            const stat = fs.statSync(path.join(conversationsDir, f));
                            merged.push({
                                id,
                                summary: `Archived Chat (${id.substring(0, 8)})`,
                                projectName: 'Deep Archive',
                                workspaceUri: '',
                                createdTime: stat.mtime.toISOString(),
                                _serverPort: this._port, // Will use any valid server to decrypt
                                _serverToken: this._token
                            });
                            seen.add(id);
                        }
                    }
                }
            }
        } catch (e) { console.error("[Antigravity History] Archive scan failed", e); }

        // Sort by createdTime descending
        merged.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

        console.log(`[Antigravity History] Total conversations across all servers: ${merged.length} (from ${servers.length} server(s))`);
        return merged;
    }

    /**
     * Fetches a specific conversation and returns it as a Markdown string.
     * Uses the server info embedded in the metadata if available, 
     * otherwise falls back to the first known server.
     */
    public async getConversationMarkdown(id: string, metadata?: TrajectorySummary): Promise<string> {
        // Use the server that owns this conversation if known, otherwise fall back
        let port = metadata?._serverPort || this._port;
        let token = metadata?._serverToken || this._token;

        if (!port || !token) {
            const initialized = await this.initialize();
            if (!initialized) { throw new Error("Could not connect to Antigravity Language Server."); }
            port = this._port!;
            token = this._token!;
        }

        // [1] Dual-Combo Decryption: Instruct the server to securely mount the .pb payload into memory first.
        // This completely bypasses the arbitrary UI limitation of 10 items.
        await new Promise<void>((resolve) => {
            const reqLoad = http.request({
                hostname: '127.0.0.1',
                port: port as string,
                path: '/exa.language_server_pb.LanguageServerService/LoadTrajectory',
                method: 'POST',
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'Connect-Protocol-Version': '1',
                    'X-Codeium-Csrf-Token': token as string
                }
            }, (resLoad) => {
                resLoad.on('data', () => { }); // Drain
                resLoad.on('end', () => resolve());
            });
            reqLoad.on('error', () => resolve());
            reqLoad.on('timeout', () => { reqLoad.destroy(); resolve(); });
            reqLoad.write(JSON.stringify({ cascadeId: id }));
            reqLoad.end();
        });

        // [2] Quickly fetch the decrypted payload before it is purged!
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port: port as string,
                path: '/exa.language_server_pb.LanguageServerService/GetCascadeTrajectory',
                method: 'POST',
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json',
                    'Connect-Protocol-Version': '1',
                    'X-Codeium-Csrf-Token': token as string
                }
            }, (res) => {
                const chunks: any[] = [];
                res.on('data', d => chunks.push(d));
                res.on('end', () => {
                    try {
                        const buffer = Buffer.concat(chunks);
                        const data = JSON.parse(buffer.toString('utf8'));
                        const steps = (data.trajectory && data.trajectory.steps) ? data.trajectory.steps : [];

                        const title = metadata?.summary || 'Untitled Chronicle';
                        let md = `# ${title}\n\n`;
                        md += `> **Trajectory ID:** \`${id}\`\n`;
                        if (metadata?.workspaceUri) {
                            md += `> **Workspace:** \`${metadata.workspaceUri}\`\n`;
                        }
                        if (metadata?.createdTime) {
                            md += `> **Created At:** ${metadata.createdTime}\n`;
                        }
                        md += `\n---\n\n`;

                        for (const step of steps) {
                            if (step.type === "CORTEX_STEP_TYPE_USER_INPUT") {
                                const userMsg = step.userInput?.userResponse;
                                if (userMsg) {
                                    md += `## 💬 User\n\n${userMsg}\n\n`;
                                }
                            } else if (step.type === "CORTEX_STEP_TYPE_PLANNER_RESPONSE") {
                                const thinking = step.plannerResponse?.thinking;
                                const response = step.plannerResponse?.response;

                                if (thinking) {
                                    const formattedThinking = thinking.replace(/\n/g, '\n> ');
                                    md += `### 🧠 *Thinking*\n> ${formattedThinking}\n\n`;
                                }
                                if (response) {
                                    md += `## 🤖 Assistant\n\n${response}\n\n`;
                                }
                            }
                        }

                        resolve(md);
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout extracting conversation'));
            });

            req.on('error', reject);
            req.write(JSON.stringify({ cascadeId: id }));
            req.end();
        });
    }

    /**
     * Incrementally caches conversations and performs a full-text search.
     * Returns an array of conversation IDs that match the query.
     */
    public async searchConversations(query: string): Promise<string[]> {
        const homeDir = os.homedir();
        const cacheDir = path.join(homeDir, '.gemini', 'antigravity', '.search_cache');

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        const convs = await this.getAllConversations();
        const matchedIds: string[] = [];
        const lowerQuery = query.toLowerCase();

        for (const c of convs) {
            const cachePath = path.join(cacheDir, `${c.id}.md`);

            if (!fs.existsSync(cachePath)) {
                try {
                    const markdown = await this.getConversationMarkdown(c.id, c);
                    fs.writeFileSync(cachePath, markdown, 'utf8');
                } catch (e) {
                    console.error(`[Search Cache] Failed to cache ${c.id}`, e);
                    continue;
                }
            }

            try {
                const content = fs.readFileSync(cachePath, 'utf8');
                if (content.toLowerCase().includes(lowerQuery)) {
                    matchedIds.push(c.id);
                }
            } catch (e) {
                console.error(`[Search Cache] Failed to read ${cachePath}`, e);
            }
        }

        return matchedIds;
    }

    /**
     * Executes the V2 Robust Export logic, extracting all conversations and organizing them into project folders.
     */
    public async exportAllConversations(outputDir: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const servers = await this._discoverAllServers();
                if (servers.length === 0) {
                    return reject(new Error("No Language Servers found running. Please ensure Antigravity Agent UI is active."));
                }

                // Pick first working server for the extraction commands
                let activeServer: ServerInstance | null = null;
                for (const s of servers) {
                    const ok = await this._checkApiPort(s.port, s.token);
                    if (ok) {
                        activeServer = s;
                        break;
                    }
                }

                if (!activeServer) {
                    return reject(new Error("Could not verify API connection to any detected Language Server."));
                }

                const conversationsDir = path.join(os.homedir(), '.gemini', 'antigravity', 'conversations');
                if (!fs.existsSync(conversationsDir)) {
                    return reject(new Error(`Conversations directory not found: ${conversationsDir}`));
                }

                const files = fs.readdirSync(conversationsDir).filter(f => f.endsWith('.pb'));

                // Pre-map UI Titles and Workspace URIs from the active servers
                const uiMap = new Map<string, any>();
                for (const s of servers) {
                    try {
                        const sums = await this._fetchConversationsFromServer(s);
                        // Convert back to map representation for quick lookup by ID, including raw API fields
                        // Note: Our _fetchConversationsFromServer only returns TrajectorySummary items.
                        // To perfectly map it, we will use our existing `servers` array to do one raw fetch per server
                        await new Promise<void>((innerRes) => {
                            const req = http.request({
                                hostname: '127.0.0.1',
                                port: s.port,
                                path: '/exa.language_server_pb.LanguageServerService/GetAllCascadeTrajectories',
                                method: 'POST',
                                timeout: 5000,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Connect-Protocol-Version': '1',
                                    'X-Codeium-Csrf-Token': s.token
                                }
                            }, (res) => {
                                let data = '';
                                res.on('data', d => data += d);
                                res.on('end', () => {
                                    try {
                                        const parsed = JSON.parse(data);
                                        const sums = parsed.trajectorySummaries || {};
                                        for (const uuid of Object.keys(sums)) {
                                            uiMap.set(uuid, sums[uuid]);
                                        }
                                    } catch (e) { }
                                    innerRes();
                                });
                            });
                            req.on('error', () => innerRes());
                            req.write('{}');
                            req.end();
                        });
                    } catch (e) { }
                }

                let successCount = 0;

                // Local helper to parse PB
                const cascadeToMarkdown = (traj: any) => {
                    let md = `# Trajectory: ${traj.trajectoryId || traj.cascadeId}\n\n`;
                    md += `*Exported via Antigravity History Extractor*\n\n`;

                    if (traj.steps) {
                        traj.steps.forEach((step: any) => {
                            if (step.type === "CORTEX_STEP_TYPE_USER_INPUT") {
                                const userMsg = step.userInput?.userResponse;
                                if (userMsg) md += `## 💬 USER\n\n${userMsg}\n\n`;
                            } else if (step.type === "CORTEX_STEP_TYPE_PLANNER_RESPONSE") {
                                const thinking = step.plannerResponse?.thinking;
                                const response = step.plannerResponse?.response;
                                if (thinking) {
                                    const formattedThinking = thinking.replace(/\n/g, '\n> ');
                                    md += `### 🧠 *Thinking*\n> ${formattedThinking}\n\n`;
                                }
                                if (response) {
                                    md += `## 🤖 ANTIGRAVITY\n\n${response}\n\n`;
                                }
                            } else if (step.intent) {
                                md += `## USER\n${step.intent}\n\n`;
                            } else if (step.modelResponses) {
                                step.modelResponses.forEach((mr: any) => {
                                    if (mr.content?.text) {
                                        md += `## ANTIGRAVITY\n${mr.content.text}\n\n`;
                                    }
                                });
                            }
                        });
                    }
                    return md;
                };

                for (let i = 0; i < files.length; i++) {
                    const uuid = files[i].replace('.pb', '');
                    try {
                        // 1. Instruct server to load file into memory
                        await new Promise<void>((loadRes) => {
                            const reqLoad = http.request({
                                hostname: '127.0.0.1',
                                port: activeServer!.port,
                                path: '/exa.language_server_pb.LanguageServerService/LoadTrajectory',
                                method: 'POST',
                                timeout: 5000,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Connect-Protocol-Version': '1',
                                    'X-Codeium-Csrf-Token': activeServer!.token
                                }
                            }, (resLoad) => {
                                resLoad.on('data', () => { });
                                resLoad.on('end', () => loadRes());
                            });
                            reqLoad.on('error', () => loadRes());
                            reqLoad.write(JSON.stringify({ cascadeId: uuid }));
                            reqLoad.end();
                        });

                        // 2. Fetch the decrypted payload
                        const data: any = await new Promise((dataRes) => {
                            const reqData = http.request({
                                hostname: '127.0.0.1',
                                port: activeServer!.port,
                                path: '/exa.language_server_pb.LanguageServerService/GetCascadeTrajectory',
                                method: 'POST',
                                timeout: 10000,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Connect-Protocol-Version': '1',
                                    'X-Codeium-Csrf-Token': activeServer!.token
                                }
                            }, (res) => {
                                let body = '';
                                res.on('data', d => body += d);
                                res.on('end', () => {
                                    try {
                                        dataRes(JSON.parse(body));
                                    } catch (e) { dataRes(null); }
                                });
                            });
                            reqData.on('error', () => dataRes(null));
                            reqData.write(JSON.stringify({ cascadeId: uuid }));
                            reqData.end();
                        });

                        if (data && data.trajectory) {
                            let title = "Conversation";
                            let workspaceName = "Uncategorized";

                            if (uiMap.has(uuid)) {
                                const cached = uiMap.get(uuid);
                                if (cached.summary) title = cached.summary;
                                if (cached.workspaces && cached.workspaces.length > 0 && cached.workspaces[0].workspaceFolderAbsoluteUri) {
                                    const cleanUri = cached.workspaces[0].workspaceFolderAbsoluteUri.replace(/^file:\/\/\//, '').replace(/\\/g, '/');
                                    const parts = cleanUri.split('/').filter((p: string) => p.trim() !== '');
                                    if (parts.length > 0) workspaceName = parts[parts.length - 1];
                                }
                            } else {
                                if (data.trajectory.steps && data.trajectory.steps.length > 0) {
                                    const inputStep = data.trajectory.steps.find((s: any) => s.type === "CORTEX_STEP_TYPE_USER_INPUT" || s.intent);
                                    const rawMsg = (inputStep?.userInput?.userResponse) || (inputStep?.intent) || "";
                                    if (rawMsg && rawMsg.trim().length > 0) {
                                        title = rawMsg.trim().substring(0, 40);
                                    }
                                }
                                if (data.trajectory.metadata?.workspaces?.length > 0) {
                                    const w = data.trajectory.metadata.workspaces[0];
                                    if (w.workspaceFolderAbsoluteUri) {
                                        const cleanUri = w.workspaceFolderAbsoluteUri.replace(/^file:\/\/\//, '').replace(/\\/g, '/');
                                        const parts = cleanUri.split('/').filter((p: string) => p.trim() !== '');
                                        if (parts.length > 0) workspaceName = parts[parts.length - 1];
                                    }
                                } else if (data.trajectory.steps) {
                                    const st = data.trajectory.steps.find((s: any) => s.type === "CORTEX_STEP_TYPE_USER_INPUT" && s.userInput?.activeUserState);
                                    if (st && st.userInput.activeUserState) {
                                        let uri = "";
                                        const us = st.userInput.activeUserState;
                                        if (us.activeDocument?.workspaceUri) uri = us.activeDocument.workspaceUri;
                                        else if (us.openDocuments?.length > 0) uri = us.openDocuments[0].workspaceUri;
                                        if (uri) {
                                            const cleanUri = uri.replace(/^file:\/\/\//, '').replace(/\\/g, '/');
                                            const parts = cleanUri.split('/').filter((p: string) => p.trim() !== '');
                                            if (parts.length > 0) workspaceName = parts[parts.length - 1];
                                        }
                                    }
                                }
                            }

                            if (title.length < 2) title = `Conversation_${uuid.substring(0, 8)}`;

                            title = title.replace(/[\\/\?<>\\:\*\|"\n\r\t]/g, '_').trim();
                            workspaceName = workspaceName.replace(/[\\/\?<>\\:\*\|"\n\r\t]/g, '_').trim();

                            const projectFolder = path.join(outputDir, workspaceName);
                            if (!fs.existsSync(projectFolder)) {
                                fs.mkdirSync(projectFolder, { recursive: true });
                            }

                            const md = cascadeToMarkdown(data.trajectory);

                            fs.writeFileSync(path.join(projectFolder, `${title} - ${uuid}.json`), JSON.stringify(data, null, 2));
                            fs.writeFileSync(path.join(projectFolder, `${title} - ${uuid}.md`), md);

                            successCount++;
                        }
                    } catch (e) {
                        console.error(`[History Extractor] Error exporting ${uuid}`, e);
                    }
                }

                resolve(`Successfully recovered ${successCount}/${files.length} conversations to ${outputDir}.`);
            } catch (err: any) {
                reject(err);
            }
        });
    }
}
