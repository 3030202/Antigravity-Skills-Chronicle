import { Skill } from '../../types';
import { Power, Settings, FileText } from 'lucide-react';

interface SkillCardProps {
    skill: Skill;
    onToggle: (skillName: string) => void;
}

export function SkillCard({ skill, onToggle }: SkillCardProps) {
    return (
        <div className={`
      relative p-5 rounded-xl border transition-all duration-200 group
      ${skill.active
                ? 'bg-red-900/10 border-red-900/50 shadow-[0_0_15px_rgba(153,27,27,0.2)]'
                : 'bg-[#0b0b0d] border-white/5 hover:border-red-900/30'}
    `}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${skill.active ? 'bg-zinc-300 animate-pulse shadow-silver-glow' : 'bg-zinc-800'}`} />
                    <h3 className="font-bold text-lg text-white">{skill.name}</h3>
                </div>

                <button
                    onClick={() => onToggle(skill.name)}
                    className={`
            p-2 rounded-lg transition-colors
            ${skill.active
                            ? 'text-red-600 bg-red-900/20 hover:bg-red-900/30'
                            : 'text-zinc-600 hover:text-white hover:bg-zinc-800'}
          `}
                >
                    <Power className="w-5 h-5" />
                </button>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-500 mb-4 line-clamp-2 h-10">
                {skill.description}
            </p>

            {/* Footer Actions */}
            <div className="flex gap-2 pt-3 border-t border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                <button className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-700 transition-colors">
                    <FileText className="w-3 h-3" /> Memo
                </button>
                <button className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-700 transition-colors ml-auto">
                    <Settings className="w-3 h-3" /> Config
                </button>
            </div>
        </div>
    );
}
