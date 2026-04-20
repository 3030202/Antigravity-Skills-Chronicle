import { useEffect, useState, useCallback } from 'react';
import { WebviewMessage } from '../types';

// Acquire the VSCode API
// @ts-ignore
const vscode = acquireVsCodeApi();

export function useVSCodeApi() {
    const [lastMessage, setLastMessage] = useState<WebviewMessage | null>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data; // The JSON data sent from the extension context
            console.log('Received message:', message);
            setLastMessage(message);
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const postMessage = useCallback((command: string, payload: any = {}) => {
        vscode.postMessage({ command, payload });
    }, []);

    return { postMessage, lastMessage };
}
