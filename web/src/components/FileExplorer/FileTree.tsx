import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { FileNode } from '../../types';

interface FileTreeProps {
    files: FileNode[];
    onSelect: (file: FileNode) => void;
}

export function FileTree({ files, onSelect }: FileTreeProps) {
    return (
        <div className="flex flex-col gap-1">
            {files.map((file) => (
                <FileTreeNode key={file.path} node={file} onSelect={onSelect} />
            ))}
        </div>
    );
}

function FileTreeNode({ node, onSelect }: { node: FileNode; onSelect: (f: FileNode) => void }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        if (node.type === 'directory') {
            setIsOpen(!isOpen);
        } else {
            onSelect(node);
        }
    };

    return (
        <div className="pl-2">
            <div
                onClick={handleClick}
                className="flex items-center gap-2 p-1 rounded-md hover:bg-white/5 cursor-pointer text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
                {node.type === 'directory' && (
                    <span className="opacity-70">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                {node.type === 'directory' ? <Folder size={14} className="text-zinc-500" /> : <File size={14} />}
                <span>{node.name}</span>
            </div>

            {isOpen && node.children && (
                <div className="pl-2 border-l border-white/5 ml-2">
                    <FileTree files={node.children} onSelect={onSelect} />
                </div>
            )}
        </div>
    );
}
