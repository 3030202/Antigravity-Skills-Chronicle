import { FileNode } from '../../types';
import { Terminal } from 'lucide-react';

interface FilePreviewProps {
    file: FileNode | null;
}

export function FilePreview({ file }: FilePreviewProps) {
    if (!file) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-800 opacity-40 select-none">
                <Terminal size={48} className="mb-4" />
                <span className="text-[10px] uppercase font-black tracking-widest leading-none">Awaiting Data stream</span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0a0a0c]">
            <div className="px-6 py-3 border-b border-white/5 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-700 shadow-[0_0_8px_rgba(153,27,27,0.5)]" />
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-tight truncate max-w-sm">{file.name}</span>
                </div>
                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter shrink-0">{file.path.split('.').pop()?.toUpperCase()} OBJECT</div>
            </div>
            <div className="flex-1 p-8 overflow-auto font-mono text-sm leading-relaxed text-zinc-400 custom-scrollbar selection:bg-red-900/30">
                <pre className="whitespace-pre-wrap">{file.content || '// Content stream empty or binary target.'}</pre>
            </div>
        </div>
    );
}
