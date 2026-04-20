import * as vscode from 'vscode';

/**
 * Supporter Manager (Golden Key Protocol)
 * Open-sourced: all users are now Golden Supporters. Thank you for being here.
 */
export class SupporterManager {
    constructor(private context: vscode.ExtensionContext) { }

    public async getStatus(): Promise<{ isGolden: boolean; key?: string }> {
        return { isGolden: true };
    }

    public async activateKey(_key: string): Promise<boolean> {
        return true;
    }

    public async reset() {
        // no-op
    }
}
