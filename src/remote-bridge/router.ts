import * as vscode from 'vscode';

export interface BridgeContext {
    platform: 'discord' | 'telegram';
    channelId: string;
    userId: string;
    username: string;
    threadId?: string; // For Discord threads or Telegram topics
}

export interface BridgeMessage {
    text: string;
    context: BridgeContext;
}

export type MessageHandler = (response: string) => Promise<void>;

export class BridgeRouter {
    private static instance: BridgeRouter;
    private isEnabled = false;

    private constructor() { }

    public static getInstance(): BridgeRouter {
        if (!BridgeRouter.instance) {
            BridgeRouter.instance = new BridgeRouter();
        }
        return BridgeRouter.instance;
    }

    public async handleMessage(message: BridgeMessage, reply: MessageHandler): Promise<void> {
        console.log(`[Bridge] Msg from ${message.context.username}: ${message.text}`);

        // Simple Command Handling
        if (message.text.startsWith('/')) {
            await this.handleCommand(message, reply);
            return;
        }

        // Context Injection
        const editor = vscode.window.activeTextEditor;
        let systemPrompt = "You are Antigravity, a remote coding assistant connected via bridge.";

        if (editor) {
            const fileName = vscode.workspace.asRelativePath(editor.document.uri);
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);

            systemPrompt += `\n\n[Active Context]
File: ${fileName}
Language: ${editor.document.languageId}`;

            if (selectedText.trim().length > 0) {
                systemPrompt += `\nSelected Code:\n\`\`\`\n${selectedText}\n\`\`\``;
            } else {
                // If no selection, maybe just show the visible range or first 50 lines?
                // For now, let's just note the file is open.
                systemPrompt += `\n(User is viewing this file)`;
            }
        } else {
            systemPrompt += `\n(No active editor in VS Code)`;
        }

        // TODO: Invoke Actual LLM here.
        // For MVP, we mock the LLM response to verify connectivity.
        const mockResponse = `[Antigravity] I received your message: "${message.text}"\n\nContext: ${editor ? vscode.workspace.asRelativePath(editor.document.uri) : 'None'}`;

        await reply(mockResponse);
    }

    private async handleCommand(message: BridgeMessage, reply: MessageHandler): Promise<void> {
        const [cmd, ...args] = message.text.split(' ');

        if (cmd === '/ping') {
            await reply('Pong! Bridge is active.');
            return;
        }

        if (cmd === '/status') {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await reply(`Active File: ${vscode.workspace.asRelativePath(editor.document.uri)}`);
            } else {
                await reply('No active file.');
            }
            return;
        }

        if (cmd === '/read') {
            if (args.length === 0) {
                await reply('Usage: /read <relative/path/to/file>');
                return;
            }
            const targetPath = args[0];
            // Simple file read simulation
            const files = await vscode.workspace.findFiles(targetPath, null, 1);
            if (files.length > 0) {
                const doc = await vscode.workspace.openTextDocument(files[0]);
                await reply(`File: ${targetPath}\n\`\`\`\n${doc.getText().slice(0, 1000)}\n...\n\`\`\``);
            } else {
                await reply(`File not found: ${targetPath}`);
            }
            return;
        }

        await reply(`Unknown command: ${cmd}`);
    }
}
