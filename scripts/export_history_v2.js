const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const { execSync } = require('child_process');

console.log("==========================================");
console.log("🚀 Antigravity Ultimate History Extractor");
console.log("==========================================");

const outputDir = process.argv[2] || path.join(process.cwd(), 'history_backup');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Global Agent path
const conversationsDir = path.join(os.homedir(), '.gemini', 'antigravity', 'conversations');
const agent = new https.Agent({ rejectUnauthorized: false });

// 1. Get running server info
function getServerInfos() {
    console.log("[*] Searching for Language Servers...");
    const servers = [];
    try {
        const out = execSync('wmic process where "name like \'%language_server%\'" get commandline,processid').toString();
        const lines = out.split('\n');
        for (const line of lines) {
            if (line.includes('language_server')) {
                const tokenMatch = line.match(/--csrf_token\s+([a-zA-Z0-9\-]+)/);
                if (tokenMatch) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    servers.push({ pid, token: tokenMatch[1], ports: [] });
                }
            }
        }

        for (const s of servers) {
            try {
                const netOut = execSync(`netstat -ano | findstr "${s.pid}"`).toString();
                netOut.split('\n').forEach(l => {
                    if (l.includes('LISTENING') && l.includes(s.pid)) {
                        const portMatch = l.match(/127\.0\.0\.1:(\d+)/);
                        if (portMatch && !s.ports.includes(portMatch[1])) {
                            s.ports.push(portMatch[1]);
                        }
                    }
                });
            } catch (e) { }
        }
    } catch (e) {
        console.error("[-] Failed to find language servers.");
        process.exit(1);
    }
    return servers.filter(s => s.ports.length > 0);
}

// 2. Probe to find genuine API port
function apiRequest(port, token, endpoint, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const options = {
            hostname: '127.0.0.1',
            port: port,
            path: `/exa.language_server_pb.LanguageServerService/${endpoint}`,
            method: 'POST',
            agent: agent,
            headers: {
                'Content-Type': 'application/json',
                'Connect-Protocol-Version': '1',
                'X-Codeium-Csrf-Token': token
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    if (!body) return resolve({});
                    try { resolve(JSON.parse(body)); }
                    catch (e) { resolve({}); }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function probeApiPort(server) {
    for (const port of server.ports) {
        try {
            await apiRequest(port, server.token, "GetAllCascadeTrajectories", {});
            return port;
        } catch (e) {
            // Try next port
        }
    }
    return null;
}

// Convert cascade to MD
function cascadeToMarkdown(traj) {
    let md = `# Trajectory: ${traj.trajectoryId || traj.cascadeId}\n\n`;
    md += `*Exported via Ultimate Extractor*\n\n`;

    if (traj.steps) {
        traj.steps.forEach(step => {
            if (step.type === "CORTEX_STEP_TYPE_USER_INPUT") {
                const userMsg = step.userInput && step.userInput.userResponse;
                if (userMsg) {
                    md += `## 💬 USER\n\n${userMsg}\n\n`;
                }
            } else if (step.type === "CORTEX_STEP_TYPE_PLANNER_RESPONSE") {
                const thinking = step.plannerResponse && step.plannerResponse.thinking;
                const response = step.plannerResponse && step.plannerResponse.response;

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
                step.modelResponses.forEach(mr => {
                    if (mr.content && mr.content.text) {
                        md += `## ANTIGRAVITY\n${mr.content.text}\n\n`;
                    }
                });
            }
        });
    }
    return md;
}

async function extractAll() {
    const servers = getServerInfos();
    if (servers.length === 0) {
        console.error("[-] No Language Servers found running! Please open Antigravity Agent UI.");
        return;
    }

    // Pick first working server
    let activeServer = null;
    let apiPort = null;
    for (const s of servers) {
        const port = await probeApiPort(s);
        if (port) {
            activeServer = s;
            apiPort = port;
            break;
        }
    }

    if (!activeServer) {
        console.error("[-] Could not connect to API on any detected port.");
        return;
    }

    console.log(`[+] Connected to Language Server (PID: ${activeServer.pid}, API Port: ${apiPort})`);

    // Read all UUIDs explicitly from filesystem!
    if (!fs.existsSync(conversationsDir)) {
        console.error(`[-] Conversations directory not found: ${conversationsDir}`);
        return;
    }

    const files = fs.readdirSync(conversationsDir).filter(f => f.endsWith('.pb'));
    console.log(`[*] Found ${files.length} physical conversation files on disk.`);

    let successCount = 0;

    // Build a map of known UUIDs to their API titles and workspaces
    const uiMap = new Map();
    try {
        const fetchSummaries = async (server) => {
            return new Promise((resolve) => {
                const req = https.request({
                    hostname: '127.0.0.1',
                    port: server.port,
                    path: '/exa.language_server_pb.LanguageServerService/GetAllCascadeTrajectories',
                    method: 'POST',
                    timeout: 5000,
                    headers: {
                        'Content-Type': 'application/json',
                        'Connect-Protocol-Version': '1',
                        'X-Codeium-Csrf-Token': server.token
                    },
                    agent: new https.Agent({ rejectUnauthorized: false })
                }, (res) => {
                    let data = '';
                    res.on('data', d => data += d);
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            resolve(parsed.trajectorySummaries || {});
                        } catch (e) { resolve({}); }
                    });
                });
                req.on('error', () => resolve({}));
                req.write('{}');
                req.end();
            });
        };

        for (const s of servers) {
            const apiPort = await probeApiPort(s);
            if (apiPort) {
                const sums = await fetchSummaries({ port: apiPort, token: s.token });
                for (const uuid of Object.keys(sums)) {
                    uiMap.set(uuid, sums[uuid]);
                }
            }
        }
        console.log(`[*] Successfully mapped ${uiMap.size} UI titles from Language Servers.`);
    } catch (e) {
        console.log("[-] Warning: Failed to pre-map UI titles.");
    }

    for (let i = 0; i < files.length; i++) {
        const uuid = files[i].replace('.pb', '');
        console.log(`\n[>] Processing ${i + 1}/${files.length}: ${uuid}`);

        try {
            // [1] Instruct server to load file into memory
            await apiRequest(apiPort, activeServer.token, "LoadTrajectory", { cascadeId: uuid });

            // [2] Quickly fetch the decrypted payload
            const data = await apiRequest(apiPort, activeServer.token, "GetCascadeTrajectory", { cascadeId: uuid });

            if (data && data.trajectory) {
                let title = "Conversation";
                let workspaceName = "Uncategorized";

                // First, try matching the exact UI mapping
                if (uiMap.has(uuid)) {
                    const cached = uiMap.get(uuid);
                    if (cached.summary) title = cached.summary;
                    if (cached.workspaces && cached.workspaces.length > 0 && cached.workspaces[0].workspaceFolderAbsoluteUri) {
                        const cleanUri = cached.workspaces[0].workspaceFolderAbsoluteUri.replace(/^file:\/\/\//, '').replace(/\\/g, '/');
                        const parts = cleanUri.split('/').filter(p => p.trim() !== '');
                        if (parts.length > 0) workspaceName = parts[parts.length - 1];
                    }
                } else {
                    // Fallback to JSON payload parsing
                    if (data.trajectory.steps && data.trajectory.steps.length > 0) {
                        const inputStep = data.trajectory.steps.find(s => s.type === "CORTEX_STEP_TYPE_USER_INPUT" || s.intent);
                        const rawMsg = (inputStep && inputStep.userInput && inputStep.userInput.userResponse) || (inputStep && inputStep.intent) || "";
                        if (rawMsg && rawMsg.trim().length > 0) {
                            title = rawMsg.trim().substring(0, 40);
                        }
                    }
                    if (data.trajectory.metadata && data.trajectory.metadata.workspaces && data.trajectory.metadata.workspaces.length > 0) {
                        const w = data.trajectory.metadata.workspaces[0];
                        if (w.workspaceFolderAbsoluteUri) {
                            const cleanUri = w.workspaceFolderAbsoluteUri.replace(/^file:\/\/\//, '').replace(/\\/g, '/');
                            const parts = cleanUri.split('/').filter(p => p.trim() !== '');
                            if (parts.length > 0) workspaceName = parts[parts.length - 1];
                        }
                    } else if (data.trajectory.steps) {
                        const st = data.trajectory.steps.find(s => s.type === "CORTEX_STEP_TYPE_USER_INPUT" && s.userInput && s.userInput.activeUserState);
                        if (st && st.userInput.activeUserState) {
                            let uri = "";
                            if (st.userInput.activeUserState.activeDocument && st.userInput.activeUserState.activeDocument.workspaceUri) uri = st.userInput.activeUserState.activeDocument.workspaceUri;
                            else if (st.userInput.activeUserState.openDocuments && st.userInput.activeUserState.openDocuments.length > 0) uri = st.userInput.activeUserState.openDocuments[0].workspaceUri;
                            if (uri) {
                                const cleanUri = uri.replace(/^file:\/\/\//, '').replace(/\\/g, '/');
                                const parts = cleanUri.split('/').filter(p => p.trim() !== '');
                                if (parts.length > 0) workspaceName = parts[parts.length - 1];
                            }
                        }
                    }
                }

                if (title.length < 2) title = `Conversation_${uuid.substring(0, 8)}`;

                // Sanitize file paths while keeping spaces!
                title = title.replace(/[\\/\?<>\\:\*\|"\n\r\t]/g, '_').trim();
                workspaceName = workspaceName.replace(/[\\/\?<>\\:\*\|"\n\r\t]/g, '_').trim();

                const projectFolder = path.join(outputDir, workspaceName);
                if (!fs.existsSync(projectFolder)) {
                    fs.mkdirSync(projectFolder, { recursive: true });
                }

                const md = cascadeToMarkdown(data.trajectory);

                // Write files in project folder
                fs.writeFileSync(path.join(projectFolder, `${title} - ${uuid}.json`), JSON.stringify(data, null, 2));
                fs.writeFileSync(path.join(projectFolder, `${title} - ${uuid}.md`), md);

                console.log(`    [+] Exported: [${workspaceName}] ${title}`);
                successCount++;
            } else {
                console.log(`    [-] Failed to decrypt: Server returned empty trajectory.`);
            }
        } catch (e) {
            console.log(`    [-] Error: ${e.message}`);
        }
    }

    console.log(`\n==========================================`);
    console.log(`✅ Ultimate Extraction Complete!`);
    console.log(`✅ Successfully recovered ${successCount}/${files.length} conversations.`);
    console.log(`✅ Saved to: ${outputDir}`);
    console.log(`==========================================`);
}

extractAll();
