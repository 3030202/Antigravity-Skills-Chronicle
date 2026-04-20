import { Skill } from '../../types';
import { SkillCard } from './SkillCard';
import { motion } from 'framer-motion';

interface SkillGridProps {
    skills: Skill[];
    onToggleSkill: (skillName: string) => void;
}

export function SkillGrid({ skills, onToggleSkill }: SkillGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
            {skills.map((skill, index) => (
                <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <SkillCard skill={skill} onToggle={onToggleSkill} />
                </motion.div>
            ))}
        </div>
    );
}
