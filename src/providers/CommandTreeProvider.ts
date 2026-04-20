import * as vscode from 'vscode';

export class CommandTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    constructor(private context: vscode.ExtensionContext) { }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.getCommands());
        }
    }

    private getCommands(): vscode.TreeItem[] {
        const createItem = (label: string, commandId: string, tooltip: string, iconId: string) => {
            const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
            item.command = {
                command: commandId,
                title: label,
            };
            item.tooltip = tooltip;
            item.iconPath = new vscode.ThemeIcon(iconId);
            return item;
        };

        return [
            createItem('Launch Dashboard', 'antigravity.openDashboard', 'Open the main Antigravity Dashboard', 'rocket'),
            createItem('Forge New Skill', 'antigravity.forgeSkill', 'Create a new AI skill from template', 'add'),
            createItem('Batch Export History', 'antigravity.batchExport', 'Export all conversation history to Markdown', 'cloud-download')
        ];
    }
}
