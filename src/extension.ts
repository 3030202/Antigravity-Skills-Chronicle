import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { BridgeManager } from './remote-bridge/manager';
import { HistoryExtractor } from './core/historyExtractor';
import { IndexManager } from './core/indexManager';
import { CommandTreeProvider } from './providers/CommandTreeProvider';
import { AssetTreeProvider } from './providers/AssetTreeProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Antigravity Extension (Lazy Load) is now active!');

    let openDashboard = vscode.commands.registerCommand('antigravity.openDashboard', () => {
        AntigravityPanel.createOrShow(context.extensionUri, context);
    });

    context.subscriptions.push(openDashboard);

    const provider = new AntigravityViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('antigravity.dashboardView', provider)
    );

    // Initialize Remote Bridge
    const bridgeManager = new BridgeManager(context);
    context.subscriptions.push({ dispose: () => bridgeManager.dispose() });
    console.log('Antigravity: Remote Bridge Initialized');

    // ---------------------------------------------------------------------------
    // Sidebar / Activity Bar Providers
    // ---------------------------------------------------------------------------
    const commandProvider = new CommandTreeProvider(context);
    vscode.window.registerTreeDataProvider('antigravity-commands', commandProvider);

    const assetProvider = new AssetTreeProvider(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
    vscode.window.registerTreeDataProvider('antigravity-assets', assetProvider);

    context.subscriptions.push(vscode.commands.registerCommand('antigravity.forgeSkill', async () => {
        const skillName = await vscode.window.showInputBox({ prompt: 'Enter new Skill name (e.g. data-analyst)', placeHolder: 'data-analyst' });
        if (skillName) {
            vscode.window.showInformationMessage(`Forging new skill: ${skillName}...`);
            // Minimal shell execution or open dashboard to trigger backend
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('antigravity.batchExport', () => {
        vscode.window.showInformationMessage('Initializing Batch Export...');
        vscode.commands.executeCommand('antigravity.openDashboard').then(() => {
            setTimeout(() => {
                if (AntigravityPanel.currentPanel) {
                    AntigravityPanel.currentPanel.webview.postMessage({ command: 'receiveBatchExportTrigger' });
                }
            }, 1500);
        });
    }));

    // ---------------------------------------------------------------------------
    // Status Bar Implementation
    // ---------------------------------------------------------------------------
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = 'antigravity.openDashboard';
    statusBar.tooltip = 'Open Skills Chronicle Dashboard';
    context.subscriptions.push(statusBar);

    const resourceManager = new ResourceManager(context);

    const updateStatusBar = () => {
        const skillsCount = resourceManager.getSkills().length;
        const workflowsCount = resourceManager.getWorkflows().length;
        const rulesCount = resourceManager.getRules().length;
        statusBar.text = `$(history) ${skillsCount} Skills | $(zap) ${workflowsCount} Workflows | $(scale) ${rulesCount} Rules`;
        statusBar.show();
    };

    // Initial update
    updateStatusBar();

    // Listen for workspace changes/editor shifts to update counts for the current context
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
        resourceManager.updateWorkspaceContext();
        updateStatusBar();
    }));

    // Register a refresh command that also updates status bar
    let refreshCommand = vscode.commands.registerCommand('antigravity.refreshDashboard', () => {
        resourceManager.updateWorkspaceContext();
        updateStatusBar();
        if (AntigravityPanel.currentPanel) {
            AntigravityPanel.currentPanel.webview.postMessage({ command: 'refreshAll' });
        }
    });
    context.subscriptions.push(refreshCommand);

    // Reveal in Explorer Command
    let revealCommand = vscode.commands.registerCommand('antigravity.revealInExplorer', (filePath: string) => {
        if (!filePath) return;
        const uri = vscode.Uri.file(filePath);
        vscode.commands.executeCommand('revealFileInOS', uri);
    });
    context.subscriptions.push(revealCommand);
}


// ---------------------------------------------------------------------------
// Supporter Manager (Golden Key Protocol)
// Open-sourced: all users are now Golden Supporters. Thank you for being here.
// ---------------------------------------------------------------------------
class SupporterManager {
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    public isSupporter(): boolean {
        return true;
    }

    public validateKey(_key: string): boolean {
        return true;
    }

    public resetSupporter() {
        // no-op
    }
}

// ---------------------------------------------------------------------------
// Resource Manager
// ---------------------------------------------------------------------------
class ResourceManager {
    private _workspaceRoot: string;
    private _homeDir: string;
    private _context: vscode.ExtensionContext;
    private _supporterManager: SupporterManager;
    private _indexManager: IndexManager;
    private _ignoredDirs = ['node_modules', '.git', 'dist', 'build', '.venv', 'venv', '__pycache__', 'out'];

    private _pinnedPaths: Set<string> = new Set();

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._workspaceRoot = this._getActiveWorkspaceRoot();
        this._homeDir = os.homedir();
        this._supporterManager = new SupporterManager(context);
        this._indexManager = new IndexManager();
        this._loadPinnedItems();
    }

    private _loadPinnedItems() {
        const pinned = this._context.globalState.get<string[]>('pinnedAssets', []);
        this._pinnedPaths = new Set(pinned);
    }

    private _savePinnedItems() {
        this._context.globalState.update('pinnedAssets', Array.from(this._pinnedPaths));
    }

    public togglePin(path: string) {
        if (this._pinnedPaths.has(path)) {
            this._pinnedPaths.delete(path);
        } else {
            this._pinnedPaths.add(path);
        }
        this._savePinnedItems();
    }

    public isPinned(path: string): boolean {
        return this._pinnedPaths.has(path);
    }

    public updateWorkspaceContext() {
        this._workspaceRoot = this._getActiveWorkspaceRoot();
    }

    private _getActiveWorkspaceRoot(): string {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
            if (workspaceFolder) return workspaceFolder.uri.fsPath;
        }
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    public getSupporterStatus(): boolean {
        return this._supporterManager.isSupporter();
    }

    public validateSupporterKey(key: string): boolean {
        return this._supporterManager.validateKey(key);
    }


    public getMemo(skillPath: string): string {
        const metadata = this._indexManager.getSkillMetadata(skillPath);
        return metadata?.memo || '';
    }

    public saveMemo(skillPath: string, content: string) {
        const metadata = this._indexManager.getSkillMetadata(skillPath) || {};
        metadata.memo = content;
        this._indexManager.saveSkillMetadata(skillPath, metadata);
    }

    public getConversationMetadata(id: string): any {
        return this._indexManager.getConversationMetadata(id) || {};
    }

    public saveConversationMetadata(id: string, metadata: any) {
        this._indexManager.saveConversationMetadata(id, metadata);
    }

    public static extractFullConversation(filePath: string): string {
        try {
            const buffer = fs.readFileSync(filePath);
            if (filePath.endsWith('.json')) {
                const data = JSON.parse(buffer.toString('utf-8'));
                let md = `# Conversation Record (${path.basename(filePath)})\n\n`;
                if (data.messages && Array.isArray(data.messages)) {
                    data.messages.forEach((m: any) => {
                        md += `### ${m.role?.toUpperCase() || 'UNKNOWN'}\n${m.content || m.text || ''}\n\n---\n\n`;
                    });
                }
                return md;
            } else {
                // PB Extraction Logic (Full Scan with Relaxed Printable Segment Detection)
                // Strategy: Scan for continuous printable character segments (min 20 chars)
                // This handles Protobuf's wire format where strings are interspersed with binary control bytes

                let md = `# [PREVIEW] PB Chronicle: ${path.basename(filePath)}\n\n> [!NOTE]\n> This is a raw extraction from a Protobuf binary file. Structure may be approximate.\n\n`;

                const segments: string[] = [];
                let currentSegment = '';
                const MIN_SEGMENT_LENGTH = 20;

                // Scan byte-by-byte for printable UTF-8 sequences
                for (let i = 0; i < buffer.length && segments.length < 500; i++) {
                    const byte = buffer[i];
                    // Printable ASCII (space to ~) or continuation of multi-byte UTF-8
                    const isPrintableAscii = byte >= 0x20 && byte <= 0x7E;
                    const isUtf8Start = byte >= 0xC0 && byte <= 0xF4;
                    const isUtf8Cont = byte >= 0x80 && byte <= 0xBF;
                    const isNewline = byte === 0x0A || byte === 0x0D;

                    if (isPrintableAscii || isNewline) {
                        currentSegment += String.fromCharCode(byte);
                    } else if (isUtf8Start) {
                        // Attempt to decode multi-byte UTF-8 character
                        let charLen = 0;
                        if ((byte & 0xE0) === 0xC0) charLen = 2;
                        else if ((byte & 0xF0) === 0xE0) charLen = 3;
                        else if ((byte & 0xF8) === 0xF0) charLen = 4;

                        if (i + charLen <= buffer.length) {
                            const slice = buffer.slice(i, i + charLen);
                            try {
                                const char = slice.toString('utf-8');
                                if (char && !char.includes('\uFFFD')) {
                                    currentSegment += char;
                                    i += charLen - 1; // Advance index (loop will add 1)
                                } else {
                                    // Invalid UTF-8, flush segment
                                    if (currentSegment.length >= MIN_SEGMENT_LENGTH) {
                                        segments.push(currentSegment.trim());
                                    }
                                    currentSegment = '';
                                }
                            } catch {
                                if (currentSegment.length >= MIN_SEGMENT_LENGTH) {
                                    segments.push(currentSegment.trim());
                                }
                                currentSegment = '';
                            }
                        }
                    } else {
                        // Non-printable byte: flush current segment if long enough
                        if (currentSegment.length >= MIN_SEGMENT_LENGTH) {
                            segments.push(currentSegment.trim());
                        }
                        currentSegment = '';
                    }
                }
                // Flush final segment
                if (currentSegment.length >= MIN_SEGMENT_LENGTH) {
                    segments.push(currentSegment.trim());
                }

                // Filter out noise: IDs, hashes, file paths
                const filtered = segments.filter(s => {
                    const hasSpace = s.includes(' ');
                    const hasMultilang = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(s);
                    const isLikelyHash = /^[a-f0-9\-]{20,}$/i.test(s.replace(/\s/g, ''));
                    const isLikelyPath = /^[a-z]:[\\\/]/i.test(s) || s.startsWith('/') || s.includes('node_modules');
                    const isLikelyCode = /^(import |export |const |let |var |function |class |if |for |while )/.test(s);
                    return (hasSpace || hasMultilang) && !isLikelyHash && !isLikelyPath && s.length > 30;
                });

                if (filtered.length > 0) {
                    // Limit output to first 100 blocks to avoid overwhelming preview
                    filtered.slice(0, 100).forEach((m, i) => {
                        md += `#### Content Block ${i + 1}\n${m}\n\n---\n\n`;
                    });
                    if (filtered.length > 100) {
                        md += `\n> [!TIP]\n> Showing 100 of ${filtered.length} extracted blocks. Full content may require advanced parsing.\n`;
                    }
                } else {
                    md += "_No readable text blocks found in this binary. The file may be encrypted or use a non-standard encoding._";
                }
                return md;
            }
        } catch (e) {
            return `# Error\nFailed to read conversation: ${e}`;
        }
    }

    public getWorkspaceRoot(): string {
        return this._workspaceRoot;
    }

    public getGlobalConfig() {
        return this._context.globalState.get('antigravity.globalPaths', {
            skills: 'global_skills',
            workflows: 'global_workflows',
            rules: 'rules'
        });
    }

    public saveGlobalConfig(config: any) {
        this._context.globalState.update('antigravity.globalPaths', config);
    }

    public getSkills(): any[] {
        const skills: any[] = [];
        const config = this.getGlobalConfig();
        const globalPath = path.join(this._homeDir, '.gemini', 'antigravity', config.skills || 'global_skills');

        // Fallback for legacy 'skills' folder if 'global_skills' doesn't exist but 'skills' does, AND user hasn't explicitly set it (default)
        // Actually, let's just respect the config. If user wants 'skills', they set 'skills'.
        // But for migration, if global_skills is missing and skills exists, we might want to hint? 
        // For now, adhere to strict config.

        skills.push(...this._scanSkills(globalPath, 'global'));

        const localPath = path.join(this._workspaceRoot, '.agent', 'skills');
        skills.push(...this._scanSkills(localPath, 'local'));

        // Sort alphabetically
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }

    public getWorkflows(): any[] {
        const workflows: any[] = [];
        const config = this.getGlobalConfig();
        const globalPath = path.join(this._homeDir, '.gemini', 'antigravity', config.workflows || 'global_workflows');
        workflows.push(...this._scanMarkdownFiles(globalPath, 'global', 'workflow'));
        const localPath = path.join(this._workspaceRoot, '.agent', 'workflows');
        workflows.push(...this._scanMarkdownFiles(localPath, 'local', 'workflow'));
        return workflows.sort((a, b) => a.name.localeCompare(b.name));
    }

    public getRules(): any[] {
        const rules: any[] = [];
        const config = this.getGlobalConfig();

        // 1. Classic GEMINI.md
        const globalGeminiMd = path.join(this._homeDir, '.gemini', 'GEMINI.md');
        if (fs.existsSync(globalGeminiMd)) {
            rules.push({
                name: 'Global Config (GEMINI.md)',
                path: globalGeminiMd,
                source: 'global',
                type: 'rule',
                content: fs.readFileSync(globalGeminiMd, 'utf-8')
            });
        }

        // 2. Configured Global Rules Folder or File
        const globalRulesPath = path.join(this._homeDir, '.gemini', 'antigravity', config.rules || 'rules');
        if (fs.existsSync(globalRulesPath)) {
            if (fs.statSync(globalRulesPath).isFile()) {
                rules.push({
                    name: path.basename(globalRulesPath),
                    path: globalRulesPath,
                    source: 'global',
                    type: 'rule',
                    content: fs.readFileSync(globalRulesPath, 'utf-8'),
                    isPinned: this.isPinned(globalRulesPath)
                });
            } else {
                rules.push(...this._scanMarkdownFiles(globalRulesPath, 'global', 'rule'));
            }
        }

        const localPath = path.join(this._workspaceRoot, '.agent', 'rules');
        rules.push(...this._scanMarkdownFiles(localPath, 'local', 'rule'));
        return rules;
    }

    private _scanSkills(dir: string, source: 'local' | 'global'): any[] {
        if (!fs.existsSync(dir)) return [];
        const results: any[] = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    const skillPath = path.join(dir, entry.name);
                    const metadata = this._parseSkillMetadata(skillPath);
                    const stats = fs.statSync(skillPath);

                    // Check if directory is empty (ignore hidden files)
                    const subEntries = fs.readdirSync(skillPath);
                    const isEmpty = subEntries.filter(f => !f.startsWith('.')).length === 0;

                    results.push({
                        name: metadata.name || entry.name,
                        description: metadata.description || '',
                        active: true,
                        path: skillPath,
                        source: source,
                        theme: metadata.theme,
                        cover: this._resolveAssetPath(skillPath, metadata.cover),
                        avatar: this._resolveAssetPath(skillPath, metadata.avatar),
                        lastModified: stats.mtime.getTime(),
                        meta: metadata.customFields,
                        files: [],
                        isBroken: metadata.isBroken || false,
                        isEmpty: isEmpty,
                        isPinned: this.isPinned(skillPath)
                    });
                }
            }
        } catch (e) { }
        return results;
    }

    public getSkillFiles(skillPath: string): any[] {
        return this._scanFilesRecursive(skillPath, 0);
    }

    private _scanFilesRecursive(dir: string, depth: number): any[] {
        if (depth > 5) return []; // Safety limit
        const files: any[] = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith('.') || this._ignoredDirs.includes(entry.name)) continue;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    files.push({
                        name: entry.name,
                        type: 'directory',
                        path: fullPath,
                        children: this._scanFilesRecursive(fullPath, depth + 1)
                    });
                } else {
                    files.push({ name: entry.name, type: 'file', path: fullPath });
                }
            }
        } catch (e) { }
        return files;
    }

    private _scanMarkdownFiles(dir: string, source: 'local' | 'global', type: 'workflow' | 'rule'): any[] {
        if (!fs.existsSync(dir)) return [];
        const results: any[] = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.md')) {
                    const fullPath = path.join(dir, entry.name);
                    results.push({
                        name: entry.name,
                        path: fullPath,
                        source: source,
                        type: type,
                        content: fs.readFileSync(fullPath, 'utf-8'),
                        isPinned: this.isPinned(fullPath)
                    });
                }
            }
        } catch (e) { }
        return results;
    }

    private _parseSkillMetadata(skillPath: string): any {
        let name = path.basename(skillPath);
        let description = '';
        let theme = '#991b1b'; // Default to Chronicle Red
        let cover = undefined;
        let avatar = undefined;
        let customFields: any = {};
        let isBroken = false;

        const skillMdPath = path.join(skillPath, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
            try {
                // Multi-encoding detection
                const buffer = fs.readFileSync(skillMdPath);
                let content = '';

                // Detection: Check for UTF-16 BOM
                if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
                    content = buffer.toString('utf16le');
                } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
                    content = buffer.toString('utf16le');
                } else {
                    content = buffer.toString('utf8');
                    if (content.slice(0, 100).includes('\uFFFD')) {
                        content = buffer.toString('latin1');
                    }
                }

                const fmMatch = content.trim().match(/^---\s*([\s\S]*?)\s*---/);
                if (fmMatch) {
                    try {
                        customFields = this._parseYamlNested(fmMatch[1]);
                        if (customFields.name) name = customFields.name;
                        if (customFields.description) description = customFields.description;

                        // Extract Avatar from complex V10/V11 Identity structure
                        // Support: avatar, x-identity.portrait, x-identity.avatar
                        const identity = customFields['x-identity'] || {};
                        avatar = customFields.avatar || identity.portrait || identity.avatar;

                        // Extract Cover
                        cover = customFields.cover;
                    } catch (err) {
                        isBroken = true;
                    }
                }
            } catch (e) {
                isBroken = true;
            }
        }

        const configPath = path.join(skillPath, '.antigravity.json');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                if (config.theme) theme = config.theme;
                if (config.cover) cover = config.cover;
                if (config.avatar) avatar = config.avatar;
                Object.assign(customFields, config);
            } catch (e) { }
        }

        // --- ASSET RESOLUTION STRATEGY ---
        // 1. Resolve YAML/JSON specified avatar
        if (avatar) {
            avatar = this._resolveAssetPath(skillPath, avatar);
        }

        // 2. Fallback to default locations if no avatar found yet
        if (!avatar) {
            const possibleAvatars = [
                path.join(skillPath, 'assets', 'avatar.png'),
                path.join(skillPath, 'assets', 'portrait_final.png'), // V10 Standard
                path.join(skillPath, 'avatar.png')
            ];
            for (const p of possibleAvatars) {
                if (fs.existsSync(p)) {
                    avatar = p;
                    break;
                }
            }
        }

        // 3. Resolve cover image
        if (cover) {
            cover = this._resolveAssetPath(skillPath, cover);
        } else {
            const possibleCovers = [path.join(skillPath, 'assets', 'cover.png'), path.join(skillPath, 'cover.png')];
            for (const p of possibleCovers) {
                if (fs.existsSync(p)) {
                    cover = p;
                    break;
                }
            }
        }

        if (!cover) cover = 'rgba(255,255,255,0.02)';

        return { name, description, theme, cover, avatar, customFields, isBroken };
    }

    private _parseYamlNested(yaml: string): Record<string, any> {
        const lines = yaml.split('\n');
        const root: any = {};
        // Stack stores the current node and its indentation level
        const stack: { indent: number; node: any; key?: string; type: 'object' | 'array' }[] = [
            { indent: -1, node: root, type: 'object' }
        ];

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const indent = line.search(/\S/);

            // Pop stack if current indent is less than OR equal to previous siblings
            // This ensures we always find the correct parent for the current level
            while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
                stack.pop();
            }

            let currentParent = stack[stack.length - 1];

            // 1. Check for Key-Value pair (key: value)
            const match = trimmed.match(/^([\w_-]+)\s*:\s*(.*)$/);
            if (match) {
                const key = match[1];
                let value: any = match[2].trim();

                if (value === '' || value === '>' || value === '|') {
                    // Start of a nested object or array
                    const newNode = {};
                    if (currentParent.type === 'object') {
                        currentParent.node[key] = newNode;
                    } else {
                        currentParent.node.push({ [key]: newNode });
                    }
                    stack.push({ indent, node: newNode, key, type: 'object' });
                } else {
                    // Scalar value
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    } else if (!isNaN(Number(value)) && value !== '' && !value.includes('/')) {
                        // Avoid simple number parsing for paths like "2026/01/22"
                        value = Number(value);
                    } else if (value.toLowerCase() === 'true') {
                        value = true;
                    } else if (value.toLowerCase() === 'false') {
                        value = false;
                    }

                    if (currentParent.type === 'object') {
                        currentParent.node[key] = value;
                    } else {
                        currentParent.node.push(value);
                    }
                }
            }
            // 2. Check for Array item (- value)
            else if (trimmed.startsWith('- ')) {
                const valuePart = trimmed.slice(2).trim();

                // If parent isn't an array yet, transform it (if it's empty)
                if (currentParent.type !== 'array') {
                    const grandParent = stack[stack.length - 2];
                    if (grandParent && currentParent.key) {
                        // Current parent was assumed to be object, but it's an array field
                        grandParent.node[currentParent.key] = [];
                        currentParent.node = grandParent.node[currentParent.key];
                        currentParent.type = 'array';
                    }
                }

                if (valuePart.includes(':') && !valuePart.includes('./') && !valuePart.includes('http')) {
                    // Array of objects (simple detection)
                    const [k, ...vParts] = valuePart.split(':');
                    const v = vParts.join(':').trim();
                    const obj = { [k.trim()]: v };
                    currentParent.node.push(obj);
                } else {
                    currentParent.node.push(valuePart);
                }
            }
        }
        return root;
    }

    private _stringToColor(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        let color = '#';
        for (let i = 0; i < 3; i++) color += ('00' + ((hash >> (i * 8)) & 0xFF).toString(16)).substr(-2);
        return color;
    }

    private _resolveAssetPath(skillPath: string, assetName: string | undefined): string | undefined {
        if (!assetName) return undefined;
        if (assetName.startsWith('http') || assetName.startsWith('vscode-webview-resource:')) return assetName;

        const fullPath = path.isAbsolute(assetName) ? assetName : path.join(skillPath, assetName);
        if (fs.existsSync(fullPath)) {
            if (AntigravityPanel.currentPanel) {
                return AntigravityPanel.currentPanel.webview.asWebviewUri(vscode.Uri.file(fullPath)).toString();
            }
            return vscode.Uri.file(fullPath).toString().replace('file://', 'vscode-resource://');
        }
        return undefined;
    }
}

// ---------------------------------------------------------------------------
// Panel Logic
// ---------------------------------------------------------------------------
class AntigravityPanel {
    public static currentPanel: AntigravityPanel | undefined;
    public get webview() { return this._panel.webview; }
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _resourceManager: ResourceManager;
    private _historyExtractor: HistoryExtractor;

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        if (AntigravityPanel.currentPanel) {
            AntigravityPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }
        const globalPath = vscode.Uri.file(path.join(os.homedir(), '.gemini', 'antigravity'));
        const panel = vscode.window.createWebviewPanel(
            'antigravityDashboard',
            'Antigravity Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    extensionUri,
                    vscode.Uri.file(path.join(os.homedir(), '.gemini')),
                    ...(vscode.workspace.workspaceFolders?.map(folder => folder.uri) || [])
                ]
            }
        );
        AntigravityPanel.currentPanel = new AntigravityPanel(panel, extensionUri, context);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._resourceManager = new ResourceManager(context);
        this._historyExtractor = new HistoryExtractor();

        this._update();

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'getSkills': this._sendSkills(); return;
                    case 'getWorkflows': {
                        const wfs = this._resourceManager.getWorkflows().map(wf => {
                            const indexMeta = this._resourceManager['_indexManager']?.getWorkflowMetadata(wf.name) || {};
                            return { ...wf, ...indexMeta };
                        });
                        this._panel.webview.postMessage({ command: 'updateWorkflows', payload: wfs });
                        return;
                    }
                    case 'getRules': this._panel.webview.postMessage({ command: 'updateRules', payload: this._resourceManager.getRules() }); return;
                    case 'getSkillFiles':
                        const files = this._resourceManager.getSkillFiles(message.payload.path);
                        this._panel.webview.postMessage({ command: 'updateSkillFiles', payload: { path: message.payload.path, files } });
                        return;
                    case 'getConnectivity':
                        this._handleGetConnectivity();
                        return;
                    case 'getActivity':
                        this._handleGetActivity();
                        return;
                    case 'readFile': this._handleReadFile(message.payload.path); return;
                    case 'getMemo':
                        const memo = this._resourceManager.getMemo(message.payload.path);
                        this._panel.webview.postMessage({ command: 'updateMemo', payload: { path: message.payload.path, content: memo } });
                        return;
                    case 'saveMemo': this._resourceManager.saveMemo(message.payload.path, message.payload.content); return;
                    case 'saveSkillMetadata':
                        this._resourceManager['_indexManager']?.saveSkillMetadata(message.payload.name, message.payload.metadata);
                        return;
                    case 'saveWorkflowMetadata':
                        this._resourceManager['_indexManager']?.saveWorkflowMetadata(message.payload.name, message.payload.metadata);
                        return;
                    case 'getSupporterStatus':
                        this._panel.webview.postMessage({ command: 'supporterStatus', payload: this._resourceManager.getSupporterStatus() });
                        return;
                    case 'validateKey':
                        const isValid = this._resourceManager.validateSupporterKey(message.payload.key);
                        if (isValid) vscode.window.showInformationMessage('🎉 Welcome, Golden Supporter! The Chronicle has been updated.');
                        else vscode.window.showErrorMessage('Invalid Golden Key. Please check your BMC welcome note.');
                        this._panel.webview.postMessage({ command: 'supporterStatus', payload: isValid });
                        return;
                    case 'openExternal':
                        if (message.payload) {
                            vscode.env.openExternal(vscode.Uri.parse(message.payload));
                        }
                        return;
                    case 'uploadSkillMedia':
                        this._handleUploadSkillMedia(message.payload);
                        return;
                    case 'getSystemStatus':
                        this._handleGetSystemStatus();
                        return;
                    case 'refreshAll':
                        this._sendSkills();
                        this._panel.webview.postMessage({ command: 'updateWorkflows', payload: this._resourceManager.getWorkflows() });
                        this._panel.webview.postMessage({ command: 'updateRules', payload: this._resourceManager.getRules() });
                        this._handleGetConnectivity();
                        this._handleGetActivity();
                        this._handleGetSystemStatus();
                        vscode.window.setStatusBarMessage('Chronicle assets synchronized.', 3000);
                        return;
                    case 'revealInExplorer':
                        vscode.commands.executeCommand('antigravity.revealInExplorer', message.payload.path);
                        return;
                    case 'togglePin':
                        this._resourceManager.togglePin(message.payload.path);
                        this._sendSkills();
                        this._panel.webview.postMessage({ command: 'updateWorkflows', payload: this._resourceManager.getWorkflows() });
                        this._panel.webview.postMessage({ command: 'updateRules', payload: this._resourceManager.getRules() });
                        return;
                    case 'getGlobalConfig':
                        this._panel.webview.postMessage({ command: 'updateGlobalConfig', payload: this._resourceManager.getGlobalConfig() });
                        return;
                    case 'saveGlobalConfig':
                        this._resourceManager.saveGlobalConfig(message.payload);
                        // Refresh all to apply new paths
                        this._sendSkills();
                        this._panel.webview.postMessage({ command: 'updateWorkflows', payload: this._resourceManager.getWorkflows() });
                        this._panel.webview.postMessage({ command: 'updateRules', payload: this._resourceManager.getRules() });
                        vscode.window.showInformationMessage('Global paths updated.');
                        return;

                    // History Extractor Handlers
                    case 'getConversations':
                        try {
                            const convs = await this._historyExtractor.getAllConversations();
                            // Attach tags from globalState
                            const enrichedConvs = convs.map(c => {
                                const meta = this._resourceManager.getConversationMetadata(c.id);
                                return { ...c, tags: meta.tags || [] };
                            });
                            const activeProjectName = vscode.workspace.name || '';
                            this._panel.webview.postMessage({ command: 'updateConversations', payload: { conversations: enrichedConvs, activeProjectName } });
                            if (message.payload?.showToast) {
                                vscode.window.showInformationMessage('Chronicle Status: History Synced');
                            }
                        } catch (e: any) {
                            vscode.window.showErrorMessage(`History Sync Failed: ${e.message}`);
                        }
                        return;
                    case 'getConversationPreview':
                        try {
                            const markdown = await this._historyExtractor.getConversationMarkdown(message.payload.id, message.payload.metadata);
                            this._panel.webview.postMessage({ command: 'updateConversationPreview', payload: { id: message.payload.id, markdown } });
                        } catch (e: any) {
                            vscode.window.showErrorMessage(`Preview Failed: ${e.message}`);
                        }
                        return;
                    case 'saveConversation':
                        try {
                            const markdown = await this._historyExtractor.getConversationMarkdown(message.payload.id, message.payload.metadata);
                            const defaultUri = vscode.Uri.file(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || os.homedir());
                            const safeSummary = message.payload.metadata.summary.replace(/[\/\?<>\\:\*\|":]/g, '_').trim();
                            const uri = await vscode.window.showSaveDialog({
                                defaultUri: vscode.Uri.joinPath(defaultUri, `${safeSummary} - ${message.payload.id}.md`),
                                filters: { 'Markdown': ['md'] }
                            });
                            if (uri) {
                                fs.writeFileSync(uri.fsPath, markdown, 'utf8');
                                vscode.window.showInformationMessage(`Conversation Extracted & Saved to ${uri.fsPath}`);
                            }
                        } catch (e: any) {
                            vscode.window.showErrorMessage(`Extraction Failed: ${e.message}`);
                        }
                        return;
                    case 'saveConversationMetadata':
                        this._resourceManager.saveConversationMetadata(message.payload.id, message.payload.metadata);
                        return;
                    case 'batchExportConversations':
                        try {
                            const destFolderUri = await vscode.window.showOpenDialog({
                                canSelectFiles: false,
                                canSelectFolders: true,
                                canSelectMany: false,
                                openLabel: 'Select Export Destination Folder'
                            });

                            if (destFolderUri && destFolderUri[0]) {
                                const destPath = destFolderUri[0].fsPath;

                                vscode.window.withProgress({
                                    location: vscode.ProgressLocation.Notification,
                                    title: 'Executing Robust Chronicle Extraction (V2)',
                                    cancellable: false
                                }, async (progress) => {
                                    try {
                                        progress.report({ message: 'Initiating deep binary decryption and semantic mapping...' });
                                        const resultMessage = await this._historyExtractor.exportAllConversations(destPath);
                                        vscode.window.showInformationMessage(`[V2 Export Complete] ${resultMessage}`);
                                    } catch (err: any) {
                                        console.error(`[Batch Export Error]`, err);
                                        vscode.window.showErrorMessage(`Extraction Failed: ${err.message}`);
                                    }
                                });
                            }
                        } catch (e: any) {
                            vscode.window.showErrorMessage(`Batch Extraction Failed: ${e.message}`);
                        }
                        return;
                    case 'searchConversations':
                        try {
                            const matchedIds = await this._historyExtractor.searchConversations(message.payload.query);
                            this._panel.webview.postMessage({ command: 'searchConversationsResult', payload: matchedIds });
                        } catch (e: any) {
                            vscode.window.showErrorMessage(`Search Failed: ${e.message}`);
                            this._panel.webview.postMessage({ command: 'searchConversationsResult', payload: null });
                        }
                        return;
                }
            },
            null,
            this._disposables
        );

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    private _sendSkills() {
        const skills = this._resourceManager.getSkills();
        const skillsWithUris = skills.map(skill => {
            if (skill.cover && !skill.cover.startsWith('http') && !skill.cover.startsWith('data:')) {
                skill.cover = this._panel.webview.asWebviewUri(vscode.Uri.file(skill.cover)).toString();
            }
            if (skill.avatar && !skill.avatar.startsWith('http') && !skill.avatar.startsWith('data:')) {
                skill.avatar = this._panel.webview.asWebviewUri(vscode.Uri.file(skill.avatar)).toString();
            }

            // Inject Physical Index Metadata
            const meta = this._resourceManager['getMemo'] ? { memo: this._resourceManager.getMemo(skill.name) } : {};
            const indexMeta = this._resourceManager['_indexManager']?.getSkillMetadata(skill.name) || {};

            return { ...skill, ...indexMeta };
        });
        this._panel.webview.postMessage({ command: 'updateSkills', payload: skillsWithUris });
    }

    private _handleGetConnectivity() {
        const skills = this._resourceManager.getSkills();
        const workflows = this._resourceManager.getWorkflows();
        const connections: any[] = [];

        for (const wf of workflows) {
            // 1. Workflow -> Skill (Expert Trigger)
            for (const skill of skills) {
                const skillId = skill.name.toLowerCase();
                // Simple pattern for skill mentions like `eng-react-ui`, `@eng-react-ui`
                const pattern = new RegExp(`(@${skillId}|${skillId})`, 'gi');
                if (wf.content && pattern.test(wf.content)) {
                    connections.push({ from: wf.name, to: skill.name, type: 'workflow-skill' });
                }
            }

            // 2. Workflow -> Workflow (Sequence Chain)
            for (const targetWf of workflows) {
                if (wf.name === targetWf.name) continue;
                const wfId = targetWf.name.replace('.md', '').toLowerCase();
                const pattern = new RegExp(`(/?${wfId})`, 'gi');
                if (wf.content && pattern.test(wf.content)) {
                    connections.push({ from: wf.name, to: targetWf.name, type: 'workflow-workflow' });
                }
            }
        }
        this._panel.webview.postMessage({ command: 'updateConnectivity', payload: connections });
    }


    private _handleGetActivity() {
        // Concept: Check modification time of logs
        const homeDir = os.homedir();
        const logPath = path.join(homeDir, '.gemini', 'antigravity', 'logs');
        const activeSkills: any[] = [];
        if (fs.existsSync(logPath)) {
            const files = fs.readdirSync(logPath);
            const now = Date.now();
            for (const file of files) {
                const fullPath = path.join(logPath, file);
                const stats = fs.statSync(fullPath);
                // Active if modified in last 12 hours
                if (now - stats.mtimeMs < 12 * 3600000) {
                    // Extract skill name from log filename if possible
                    const name = file.replace('.log', '').replace(/_/g, ' ');
                    const estimatedTokens = Math.floor(stats.size / 4);
                    activeSkills.push({
                        name: name,
                        tokens: estimatedTokens,
                        lastActive: stats.mtimeMs
                    });
                }
            }
        }

        // Sort by most recent
        activeSkills.sort((a, b) => b.lastActive - a.lastActive);

        // Send top 5 recent activities
        this._panel.webview.postMessage({ command: 'updateActivity', payload: activeSkills.slice(0, 5) });
    }

    private _handleGetSystemStatus() {
        // Check for common LSP extensions or server processes (simplified)
        const hasWindsurfLSP = vscode.extensions.getExtension('visualstudio.html-language-features') !== undefined;
        const status = {
            lspConnected: hasWindsurfLSP,
            csrfActive: true,
            roleStandard: 'ChronicleCore V2.0.10'
        };
        this._panel.webview.postMessage({ command: 'updateSystemStatus', payload: status });
    }

    private async _handleUploadSkillMedia(payload: { skillPath: string, type: 'avatar' | 'cover', data: string }) {
        try {
            const { skillPath, type, data } = payload;
            const assetsDir = path.join(skillPath, 'assets');
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
            }

            const fileName = `${type}.png`; // Standardize on PNG
            const filePath = path.join(assetsDir, fileName);

            // Strip base64 prefix
            const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');

            fs.writeFileSync(filePath, new Uint8Array(buffer));
            vscode.window.showInformationMessage(`Successfully uploaded ${type} to ${path.basename(skillPath)}`);

            // Refresh skills list
            this._sendSkills();
        } catch (e) {
            vscode.window.showErrorMessage(`Failed to upload media: ${e}`);
        }
    }

    private async _handleReadFile(filePath: string) {
        try {
            if (fs.existsSync(filePath)) {
                if (fs.statSync(filePath).isDirectory()) return;
                const content = fs.readFileSync(filePath, 'utf-8');
                this._panel.webview.postMessage({ command: 'fileContent', payload: { path: filePath, content } });
            }
        } catch (e) { }
    }

    public dispose() {
        AntigravityPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }

    private _update() { this._panel.webview.html = this._getHtmlForWebview(this._panel.webview); }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const webDistPath = vscode.Uri.joinPath(this._extensionUri, 'web', 'dist');
        const indexHtmlPath = vscode.Uri.joinPath(webDistPath, 'index.html');
        let htmlContent = '<h1>Error: Webview build not found. Please run build.</h1>';

        try {
            if (fs.existsSync(indexHtmlPath.fsPath)) {
                htmlContent = fs.readFileSync(indexHtmlPath.fsPath, 'utf-8');
            }
        } catch (e) {
            console.error('Failed to read index.html', e);
        }

        const baseUri = webview.asWebviewUri(webDistPath);

        // Remove existing CSP
        htmlContent = htmlContent.replace(/<meta http-equiv="Content-Security-Policy" [^>]*>/gi, '');

        // CRITICAL: Remove crossorigin attribute (Vite adds this, but it breaks vscode-resource:// loading)
        htmlContent = htmlContent.replace(/\s+crossorigin/gi, '');

        // Replace relative paths with absolute baseUri paths
        htmlContent = htmlContent.replace(/(src|href)="\.\/assets\//gi, `$1="${baseUri}/assets/`);

        // Robust CSP
        const metaCsp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'; img-src ${webview.cspSource} https: data: blob: vscode-resource:; font-src ${webview.cspSource}; connect-src ${webview.cspSource} https: ws:;">`;

        // Inject CSP into <head>
        return htmlContent.replace('<head>', `<head>\n${metaCsp}`);
    }
}

class AntigravityViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) { }
    resolveWebviewView(webviewView: vscode.WebviewView) { webviewView.webview.options = { enableScripts: true }; webviewView.webview.html = `<!DOCTYPE html><html><body><p>Sidebar</p></body></html>`; }
}
