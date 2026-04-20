export interface Skill {
    name: string;
    description: string;
    active: boolean;
    path: string;
    source: 'local' | 'global';
    files?: FileNode[];
    // Visual Metadata
    cover?: string;
    theme?: string;
    avatar?: string;
    // Deep Config from Frontmatter
    meta?: Record<string, any>;
    lastModified?: number; // Fixed to number
    isBroken?: boolean;
    isEmpty?: boolean;
    isPinned?: boolean;
}

export interface Workflow {
    name: string;
    path: string;
    source: 'local' | 'global';
    type: 'workflow';
    content: string;
    isBroken?: boolean;
    isEmpty?: boolean;
    isPinned?: boolean;
}

export interface Rule {
    name: string;
    path: string;
    source: 'local' | 'global';
    type: 'rule';
    content: string;
    isBroken?: boolean;
    isEmpty?: boolean;
    isPinned?: boolean;
}

export interface FileNode {
    name: string;
    type: 'file' | 'directory';
    path: string;
    content?: string;
    children?: FileNode[];
}

export interface Conversation {
    id: string;
    summary: string;
    projectName: string;
    workspaceUri: string;
    createdTime: string;
    tags?: string[];
}

export interface WebviewMessage {
    command: string;
    payload: any;
}
