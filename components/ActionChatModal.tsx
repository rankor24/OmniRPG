import React, { useState, useEffect, useRef } from 'react';
import { useActionChat } from '../contexts/ActionChatContext';
import type { ActionChatMessage } from '../types';
import { XIcon, SparklesIcon, SendIcon, BotIcon, CheckIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';
import { proposeActionChat, executeActionChatProposals } from '../services/omniActionApi';

const ActionChatModal: React.FC = () => {
  const { isOpen, closeChat, pageContext, allData, dataModifiers } = useActionChat();
  const [messages, setMessages] = useState<ActionChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contextTitle = pageContext.page ? pageContext.page.charAt(0).toUpperCase() + pageContext.page.slice(1) : '';

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setUserInput('');
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: ActionChatMessage = { id: uuidv4(), role: 'user', content: userInput.trim() };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setUserInput('');
    setIsLoading(true);

    try {
        const responseMessage = await proposeActionChat(
            currentMessages, 
            pageContext,
            allData
        );
        setMessages(prev => [...prev, responseMessage]);
    } catch (error) {
        console.error("Action Chat Error:", error);
        const errorMessage: ActionChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleProposalResponse = async (proposalMessage: ActionChatMessage, approved: boolean) => {
    // Update the UI immediately
    const status = approved ? 'approved' : 'rejected';
    setMessages(prev => prev.map(msg => 
        msg.id === proposalMessage.id 
        ? { ...msg, toolCallProposals: { ...msg.toolCallProposals!, status } } 
        : msg
    ));

    if (approved) {
        setIsLoading(true);
        try {
            const historyUpToProposal = messages.slice(0, messages.findIndex(m => m.id === proposalMessage.id));
            const { summaryMessage, toolResultMessages } = await executeActionChatProposals(
                historyUpToProposal,
                proposalMessage,
                pageContext,
                allData,
                dataModifiers
            );
            // Add tool results and the final summary
            setMessages(prev => [...prev, ...toolResultMessages, summaryMessage]);
        } catch (error) {
             console.error("Action Chat Execution Error:", error);
            const errorMessage: ActionChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: `Sorry, I encountered an error during execution: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }
  };


  return (
    <>
        <div 
            className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeChat}
        />
        <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-secondary shadow-2xl border-l border-tertiary z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-tertiary">
                <div className="flex items-center gap-3">
                    <SparklesIcon className="w-6 h-6 text-accent" />
                    <h2 className="text-xl font-bold text-text-primary">OmniAI: <span className="text-accent">{contextTitle}</span></h2>
                </div>
                <button onClick={closeChat} className="p-2 rounded-full text-text-secondary hover:bg-tertiary hover:text-text-primary btn-boop">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>
            
            <main className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    if (msg.role === 'tool') {
                        return (
                            <div key={msg.id} className="text-center text-xs text-text-secondary italic bg-tertiary/50 p-1.5 rounded-md">
                                Executed: {msg.content}
                            </div>
                        );
                    }
                    const isUser = msg.role === 'user';
                    return (
                        <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && <BotIcon className="w-8 h-8 text-accent flex-shrink-0 mt-1" />}
                            <div className={`max-w-md rounded-lg px-4 py-2 ${isUser ? 'bg-accent text-white' : 'bg-tertiary text-text-primary'}`}>
                                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                {msg.toolCallProposals && (
                                    <div className="mt-2 space-y-2">
                                        {msg.toolCallProposals.tool_calls.map((call, index) => (
                                            <div key={index} className="bg-black/20 p-2 rounded-md">
                                                <p className="text-xs font-mono text-accent">{call.function.name}</p>
                                                <pre className="text-xs text-text-secondary mt-1 overflow-x-auto bg-primary/30 p-1 rounded-sm">
                                                    {JSON.stringify(JSON.parse(call.function.arguments), null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                        {msg.toolCallProposals.status === 'pending' && !isLoading && (
                                            <div className="flex justify-end gap-2 pt-2">
                                                <button onClick={() => handleProposalResponse(msg, false)} className="flex items-center gap-1 py-1 px-2 text-xs rounded bg-danger text-white hover:bg-danger/80 btn-boop">
                                                    <XIcon className="w-3 h-3" /> Reject
                                                </button>
                                                <button onClick={() => handleProposalResponse(msg, true)} className="flex items-center gap-1 py-1 px-2 text-xs rounded bg-green-600 text-white hover:bg-green-500 btn-boop">
                                                    <CheckIcon className="w-3 h-3" /> Approve
                                                </button>
                                            </div>
                                        )}
                                        {msg.toolCallProposals.status !== 'pending' && (
                                            <p className={`text-xs font-bold mt-1 text-right ${msg.toolCallProposals.status === 'approved' ? 'text-green-400' : 'text-danger'}`}>
                                                Status: {msg.toolCallProposals.status}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-start gap-3 max-w-xl">
                           <BotIcon className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                           <div className="rounded-lg px-4 py-2 bg-tertiary text-text-primary">
                             <div className="flex space-x-1">
                               <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                               <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                               <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                             </div>
                           </div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="flex-shrink-0 p-4 border-t border-tertiary">
                <div className="flex items-center gap-3 bg-tertiary rounded-lg p-1.5">
                     <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={`Ask OmniAI to edit ${contextTitle}...`}
                        className="flex-grow bg-tertiary border-none rounded-lg p-3 text-text-primary focus:outline-none focus:ring-0 resize-none"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !userInput.trim()}
                        className="bg-accent text-primary p-3 rounded-full hover:bg-accent-hover disabled:bg-secondary disabled:text-text-secondary transition-colors btn-boop"
                    >
                        <SendIcon />
                    </button>
                </div>
            </footer>
        </div>
    </>
  );
};

export default ActionChatModal;