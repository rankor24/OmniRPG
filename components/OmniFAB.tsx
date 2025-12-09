import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
// FIX: Import ActionChatPageContext from types.ts where it is defined.
import { useActionChat } from '../contexts/ActionChatContext';
import type { ActionChatPageContext } from '../types';
import { SparklesIcon } from './icons';

const FAB_VISIBLE_PATHS: { path: string, context: ActionChatPageContext }[] = [
    { path: '/prompts', context: 'prompts' },
    { path: '/personas', context: 'personas' },
    { path: '/library', context: 'characters' },
    { path: '/lorebooks', context: 'lorebooks' },
    { path: '/memory-cortex', context: 'memories' },
];

const OmniFAB: React.FC = () => {
    const { openChat, isOpen } = useActionChat();
    const location = useLocation();

    const pageContext = useMemo((): ActionChatPageContext | null => {
        for (const route of FAB_VISIBLE_PATHS) {
            if (location.pathname.startsWith(route.path)) {
                return route.context;
            }
        }
        return null;
    }, [location.pathname]);
    
    if (!pageContext || isOpen) {
        return null;
    }

    return (
        <button
            onClick={() => openChat(pageContext)}
            className="fixed bottom-6 right-6 bg-accent text-primary rounded-full p-4 shadow-lg hover:bg-accent-hover transition-all duration-300 ease-in-out transform hover:scale-110 z-40 animate-fade-in btn-boop"
            aria-label="Open OmniAI Action Chat"
        >
            <SparklesIcon className="w-8 h-8" />
        </button>
    );
}

export default OmniFAB;