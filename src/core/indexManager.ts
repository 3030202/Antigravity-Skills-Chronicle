import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface IndexData {
    conversations: Record<string, any>; // ID -> metadata
    skills: Record<string, any>;       // name -> metadata
    workflows: Record<string, any>;    // name -> metadata
}

export class IndexManager {
    private _indexPath: string;

    constructor() {
        // Use the global gravity root for the index
        const homeDir = os.homedir();
        const gravityRoot = path.join(homeDir, '.gemini', 'antigravity');

        if (!fs.existsSync(gravityRoot)) {
            fs.mkdirSync(gravityRoot, { recursive: true });
        }

        this._indexPath = path.join(gravityRoot, 'chronicle_index.json');
    }

    public readIndex(): IndexData {
        if (!fs.existsSync(this._indexPath)) {
            return { conversations: {}, skills: {}, workflows: {} };
        }
        try {
            const content = fs.readFileSync(this._indexPath, 'utf-8');
            return JSON.parse(content) as IndexData;
        } catch (e) {
            console.error(`Failed to read chronicle index:`, e);
            // Backup corrupted index
            fs.copyFileSync(this._indexPath, `${this._indexPath}.bak`);
            return { conversations: {}, skills: {}, workflows: {} };
        }
    }

    private _writeIndex(data: IndexData) {
        try {
            fs.writeFileSync(this._indexPath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (e) {
            console.error(`Failed to write chronicle index:`, e);
        }
    }

    // --- Conversation Metadata ---
    public getConversationMetadata(id: string): any | undefined {
        const data = this.readIndex();
        return data.conversations[id];
    }

    public saveConversationMetadata(id: string, metadata: any) {
        const data = this.readIndex();
        data.conversations[id] = metadata;
        this._writeIndex(data);
    }

    // --- Skill Metadata ---
    public getSkillMetadata(name: string): any | undefined {
        const data = this.readIndex();
        return data.skills[name];
    }

    public saveSkillMetadata(name: string, metadata: any) {
        const data = this.readIndex();
        data.skills[name] = metadata;
        this._writeIndex(data);
    }

    // --- Workflow Metadata ---
    public getWorkflowMetadata(name: string): any | undefined {
        const data = this.readIndex();
        return data.workflows[name];
    }

    public saveWorkflowMetadata(name: string, metadata: any) {
        const data = this.readIndex();
        data.workflows[name] = metadata;
        this._writeIndex(data);
    }
}
