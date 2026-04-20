import { Bot } from 'grammy';
import * as vscode from 'vscode';
import { BridgeRouter } from './router';

export class TelegramBridge {
    private bot: Bot;
    private token: string;
    private router: BridgeRouter;
    private isRunning = false;

    constructor(token: string) {
        this.token = token;
        this.router = BridgeRouter.getInstance();
        this.bot = new Bot(token);

        this.setupListeners();
    }

    private setupListeners() {
        this.bot.on('message:text', async (ctx) => {
            const userId = ctx.from.id.toString();
            const username = ctx.from.username || ctx.from.first_name;
            const chatId = ctx.chat.id.toString();
            const threadId = ctx.message.message_thread_id?.toString();

            await this.router.handleMessage({
                text: ctx.message.text,
                context: {
                    platform: 'telegram',
                    channelId: chatId,
                    userId: userId,
                    username: username,
                    threadId: threadId
                }
            }, async (response) => {
                try {
                    await ctx.reply(response, {
                        message_thread_id: ctx.message.message_thread_id
                    });
                } catch (e) {
                    console.error('[Bridge-Telegram] Failed to reply:', e);
                }
            });
        });

        this.bot.catch((err) => {
            console.error('[Bridge-Telegram] Error:', err);
        });
    }

    public async connect() {
        if (this.isRunning) return;

        try {
            console.log('[Bridge-Telegram] Starting polling...');
            // Start polling (non-blocking)
            this.bot.start({
                onStart: (botInfo) => {
                    console.log(`[Bridge-Telegram] Started as @${botInfo.username}`);
                    this.isRunning = true;
                }
            });
        } catch (error) {
            console.error('[Bridge-Telegram] Start failed:', error);
            vscode.window.showErrorMessage('Antigravity Telegram Bridge failed to start. Check token.');
        }
    }

    public async disconnect() {
        if (!this.isRunning) return;
        await this.bot.stop();
        this.isRunning = false;
        console.log('[Bridge-Telegram] Stopped.');
    }
}
