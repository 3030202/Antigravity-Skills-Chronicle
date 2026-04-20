import * as vscode from 'vscode';
import { DiscordBridge } from './discord';
import { TelegramBridge } from './telegram';

export class BridgeManager {
    private discordBridge: DiscordBridge | null = null;
    private telegramBridge: TelegramBridge | null = null;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.refresh();

        // Listen for config changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('antigravity.remote')) {
                console.log('[BridgeManager] Configuration changed, restarting bridges...');
                this.refresh();
            }
        });
    }

    private async refresh() {
        await this.deactivateBridges();
        await this.activateBridges();
    }

    private async activateBridges() {
        const config = vscode.workspace.getConfiguration('antigravity.remote');
        const discordToken = config.get<string>('discordToken');
        const telegramToken = config.get<string>('telegramToken');

        if (discordToken) {
            console.log('[BridgeManager] Activating Discord Bridge...');
            this.discordBridge = new DiscordBridge(discordToken);
            await this.discordBridge.connect();
        }

        if (telegramToken) {
            console.log('[BridgeManager] Activating Telegram Bridge...');
            this.telegramBridge = new TelegramBridge(telegramToken);
            await this.telegramBridge.connect();
        }
    }

    private async deactivateBridges() {
        if (this.discordBridge) {
            await this.discordBridge.disconnect();
            this.discordBridge = null;
        }
        if (this.telegramBridge) {
            await this.telegramBridge.disconnect();
            this.telegramBridge = null;
        }
    }

    public dispose() {
        this.deactivateBridges();
    }
}
