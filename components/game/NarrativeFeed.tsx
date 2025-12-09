
import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import { parseNarrative } from '../../services/actionParser';
import DiceRoller from './DiceRoller';

interface NarrativeFeedProps {
    messages: ChatMessage[];
    isTyping: boolean;
    font: string; // 'serif' | 'monospace'
}

const NarrativeFeed: React.FC<NarrativeFeedProps> = ({ messages, isTyping, font }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const fontFamily = font === 'monospace' ? 'font-mono' : 'font-serif';

    return (
        <div className={`h-full overflow-y-auto p-6 md:p-10 bg-primary ${fontFamily} text-lg leading-relaxed`}>
            {messages.map((msg) => {
                const content = msg.versions[msg.activeVersionIndex].content;
                const diceRoll = msg.diceRoll;

                if (msg.role === 'user') {
                    return (
                        <div key={msg.id} className="mb-6 pl-4 border-l-2 border-accent/50 text-text-secondary italic">
                            <span className="font-bold not-italic text-accent mr-2">You:</span>
                            {content}
                        </div>
                    );
                }

                const chunks = parseNarrative(content);
                return (
                    <div key={msg.id} className="mb-8 space-y-4 animate-fade-in-slide relative">
                        {diceRoll && (
                            <div className="absolute -top-12 right-0 z-20 pointer-events-none">
                                <DiceRoller result={diceRoll.result} />
                            </div>
                        )}
                        {chunks.map((chunk, idx) => {
                            if (chunk.type === 'dialogue') {
                                return <p key={idx} className="text-accent pl-4 font-bold border-l-4 border-tertiary">“{chunk.content.replace(/"/g, '')}”</p>;
                            } else if (chunk.type === 'action') {
                                return <p key={idx} className="text-text-secondary italic">*{chunk.content}*</p>;
                            } else {
                                return <p key={idx} className="text-text-primary">{chunk.content}</p>;
                            }
                        })}
                    </div>
                );
            })}
            
            {isTyping && (
                <div className="flex gap-2 text-text-secondary opacity-70 mb-4 animate-pulse">
                    <span>...</span>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default NarrativeFeed;
