import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class AssetTreeProvider implements vscode.TreeDataProvider<AssetItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AssetItem | undefined | void> = new vscode.EventEmitter<AssetItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<AssetItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string | undefined) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AssetItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AssetItem): Thenable<AssetItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve(this.getAssetsInDir(path.join(this.workspaceRoot, '.agent', element.label as string)));
        } else {
            return Promise.resolve([
                new AssetItem('skills', vscode.TreeItemCollapsibleState.Collapsed, 'symbol-class'),
                new AssetItem('workflows', vscode.TreeItemCollapsibleState.Collapsed, 'symbol-event'),
                new AssetItem('rules', vscode.TreeItemCollapsibleState.Collapsed, 'symbol-rule')
            ]);
        }
    }

    private getAssetsInDir(dirPath: string): AssetItem[] {
        if (!fs.existsSync(dirPath)) {
            return [];
        }

        try {
            const items = fs.readdirSync(dirPath);
            const validAssets: AssetItem[] = [];

            for (const itemName of items) {
                const itemPath = path.join(dirPath, itemName);
                const stat = fs.statSync(itemPath);

                if (stat.isDirectory()) {
                    // Check if it's a skill folder (contains SKILL.md)
                    if (fs.existsSync(path.join(itemPath, 'SKILL.md'))) {
                        const fileUri = vscode.Uri.file(path.join(itemPath, 'SKILL.md'));
                        validAssets.push(new AssetItem(itemName, vscode.TreeItemCollapsibleState.None, 'book', {
                            command: 'vscode.open',
                            title: 'Open File',
                            arguments: [fileUri]
                        }));
                    }
                } else if (stat.isFile() && itemPath.endsWith('.md')) {
                    // It's a markdown file (like a workflow or rule)
                    const fileUri = vscode.Uri.file(itemPath);
                    validAssets.push(new AssetItem(itemName.replace('.md', ''), vscode.TreeItemCollapsibleState.None, 'file-text', {
                        command: 'vscode.open',
                        title: 'Open File',
                        arguments: [fileUri]
                    }));
                }
            }
            return validAssets;
        } catch (e) {
            console.error('Error reading assets:', e);
            return [];
        }
    }
}

export class AssetItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconName: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        this.iconPath = new vscode.ThemeIcon(iconName);
    }
}
