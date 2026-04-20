import { Client, GatewayIntentBits, ChannelType, TextChannel, ThreadChannel, Message } from 'discord.js';
import * as vscode from 'vscode';
import { BridgeRouter } from './router';

export class DiscordBridge {
    private client: Client;
    private token: string;
    private router: BridgeRouter;
    private channelName = 'antigravity-sessions';
    private activeThread: ThreadChannel | null = null;

    constructor(token: string) {
        this.token = token;
        this.router = BridgeRouter.getInstance();
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ]
        });

        this.setupListeners();
    }

    private setupListeners() {
        this.client.once('ready', async () => {
            console.log(`[Bridge-Discord] Logged in as ${this.client.user?.tag}`);
            await this.ensureSessionThread();
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            if (message.channelId !== this.activeThread?.id) return;

            await this.router.handleMessage({
                text: message.content,
                context: {
                    platform: 'discord',
                    channelId: message.channelId,
                    userId: message.author.id,
                    username: message.author.username,
                    threadId: message.channel.isThread() ? message.channel.id : undefined
                }
            }, async (response) => {
                await message.reply(response);
            });
        });
    }

    private async ensureSessionThread() {
        if (!this.client.isReady()) return;

        // Find the guild and channel
        // For MVP, we just look at the first guild the bot is in, 
        // and find a channel named 'antigravity-sessions'.
        const guild = this.client.guilds.cache.first();
        if (!guild) {
            console.error('[Bridge-Discord] Bot is not in any guild.');
            return;
        }

        let channel = guild.channels.cache.find(c => c.name === this.channelName && c.type === ChannelType.GuildText) as TextChannel;

        if (!channel) {
            // Try fetching active threads just in case cache is empty
            const channels = await guild.channels.fetch();
            channel = channels.find(c => c?.name === this.channelName && c?.type === ChannelType.GuildText) as TextChannel;
        }

        if (!channel) {
            console.error(`[Bridge-Discord] Channel '${this.channelName}' not found in guild '${guild.name}'. Please create it.`);
            return;
        }

        // Create or Resume Thread for this Workspace
        const workspaceName = vscode.workspace.name || 'Untitled-Workspace';
        const threadName = `[Project] ${workspaceName}`;

        // Check active threads first
        const { threads } = await channel.threads.fetchActive();
        let thread = threads.find(t => t.name === threadName);

        if (!thread) {
            // Try to find in archived
            // For MVP, just create new
            thread = await channel.threads.create({
                name: threadName,
                autoArchiveDuration: 60,
                reason: 'Antigravity Session for ' + workspaceName
            });
            await thread.send(`🔌 **Antigravity Bridge Connected**\nWorkspace: \`${workspaceName}\`\nReady for commands.`);
        } else {
            await thread.send(`🔌 **Antigravity Bridge Reconnected**`);
        }

        this.activeThread = thread;
        console.log(`[Bridge-Discord] Attached to thread: ${threadName}`);
    }

    public async connect() {
        try {
            await this.client.login(this.token);
        } catch (error) {
            console.error('[Bridge-Discord] Login failed:', error);
            vscode.window.showErrorMessage('Antigravity Discord Bridge failed to login. Check your token.');
        }
    }

    public async disconnect() {
        if (this.activeThread) {
            await this.activeThread.send('🔌 **Antigravity Bridge Discarded** (VS Code Closed)');
        }
        await this.client.destroy();
        console.log('[Bridge-Discord] Disconnected.');
    }
}
