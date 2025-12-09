
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { ChatMessage as Message, GeneratedImage, AppSettings, ReflectionProposal } from '../types';
import { EditIcon, RefreshIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, SpeakerOnIcon, SpeakerOffIcon, EyeIcon, ThumbsUpIcon, ThumbsDownIcon, SparklesIcon, CheckIcon, XIcon } from './icons';
import StarRating from './StarRating';
import RatingReasonModal from './RatingReasonModal';

interface ChatMessageProps {
  message: Message;
  isEditing: boolean;
  sfwMode: boolean;
  isTransparentMode: boolean;
  onStartEdit: (messageId: string) => void;
  onSaveEdit: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onReroll: (messageId: string) => void;
  onVersionChange: (messageId: string, newIndex: number) => void;
  onRatingChange: (messageId: string, versionIndex: number, rating: number, reasons?: string[], comment?: string) => void;
  onDelete: (messageId: string) => void;
  appSettings: AppSettings;
  onProposalAction: (messageId: string, proposalId: string, status: 'approved' | 'rejected') => void;
  onToolProposalApprove: (messageId: string) => void;
  onToolProposalReject: (messageId: string) => void;
  // TTS Props
  enableTts: boolean;
  onPlayAudio: (messageId: string, text: string) => void;
  isTtsLoading: boolean;
  isPlayingAudio: boolean;
}

const formatMessageContent = (content: string): React.ReactNode => {
    if (!content) return '';

    // Strip out all status blocks first.
    const textContentParts = content
        .replace(/\[CHARACTER STATUS\][\s\S]*?(?=\n\n|$)/s, '')
        .replace(/\[USER STATUS\][\s\S]*?(?=\n\n|$)/s, '')
        .trim();

    const italicizedContent = textContentParts.split(/(\*.*?\*)/g).map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
            return <i key={`content-${index}`}>{part.slice(1, -1)}</i>;
        }
        return part;
    });

    return (
        <>
            {italicizedContent}
        </>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isEditing,
  sfwMode,
  isTransparentMode,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onReroll,
  onVersionChange,
  onRatingChange,
  onDelete,
  appSettings,
  onProposalAction,
  onToolProposalApprove,
  onToolProposalReject,
  enableTts,
  onPlayAudio,
  isTtsLoading,
  isPlayingAudio,
}) => {
  const activeVersion = message.versions[message.activeVersionIndex];
  const [editedContent, setEditedContent] = useState(activeVersion.content);
  const [ratingModalState, setRatingModalState] = useState<{ isOpen: boolean; rating: number }>({ isOpen: false, rating: 0 });
  
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasContent = activeVersion.content.trim().length > 0;

  useLayoutEffect(() => {
    if (isEditing) {
      setEditedContent(activeVersion.content);
      if (textareaRef.current) {
        // textareaRef.current.focus({ preventScroll: true });
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  }, [isEditing, activeVersion.content]);

  const handleSave = () => {
    if (editedContent.trim()) {
      onSaveEdit(message.id, editedContent.trim());
    }
  };

  const handleDelete = () => {
    onDelete(message.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleRatingClick = (newRating: number) => {
    if (newRating === activeVersion.rating) {
      onRatingChange(message.id, message.activeVersionIndex, 0);
    } else {
      setRatingModalState({ isOpen: true, rating: newRating });
    }
  };

  const handleRatingSubmit = ({ reasons, comment }: { reasons: string[], comment: string }) => {
    onRatingChange(message.id, message.activeVersionIndex, ratingModalState.rating, reasons, comment);
    setRatingModalState({ isOpen: false, rating: 0 });
  };

  const bubbleClasses = isUser
    ? 'bg-accent text-white'
    : 'bg-secondary text-text-primary';

  return (
    <>
      <div className={`mb-2 w-full flex animate-fade-in-slide ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex items-start max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`rounded-lg shadow-md w-full flex flex-col ${bubbleClasses} ${!hasContent ? 'p-2' : 'px-4 py-2'} ${isTransparentMode ? '!bg-transparent !shadow-none' : ''} transition-opacity duration-300`}>
            {/* Top part: author and content/edit area */}
            <div>
              {hasContent && (
                <p className="font-bold text-sm mb-1">{message.authorName}</p>
              )}
              {isEditing ? (
                <div>
                  <textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent p-0 text-base text-inherit focus:outline-none focus:ring-0 border-0 resize-y min-h-24"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={onCancelEdit} className="py-1 px-2 text-xs rounded text-text-primary hover:bg-tertiary btn-boop">Cancel</button>
                    <button onClick={handleSave} className="py-1 px-2 text-xs rounded bg-accent text-primary hover:bg-accent-hover btn-boop">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  {hasContent && (
                    <div className="text-base whitespace-pre-wrap">{formatMessageContent(activeVersion.content)}</div>
                  )}
                  
                  {message.proposals && message.proposals.length > 0 && (
                    <div className={`${hasContent ? 'mt-3 pt-3 border-t border-white/10' : ''} space-y-2`}>
                      <h4 className="text-xs font-bold text-text-primary/80">OmniAI Suggestions:</h4>
                      {message.proposals.map(proposal => (
                        <div key={proposal.id} className={`bg-black/20 p-2 rounded-md transition-opacity ${proposal.status !== 'pending' ? 'opacity-60' : ''}`}>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-accent capitalize">{proposal.action} {proposal.type}</p>
                                <p className="text-xs text-text-primary/90 mt-1 italic">Rationale: {proposal.rationale}</p>
                            </div>
                            {proposal.status === 'pending' && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => onProposalAction(message.id, proposal.id, 'approved')} className="p-1.5 rounded-full hover:bg-green-500/20 text-green-400 transition-colors btn-boop" aria-label="Approve proposal">
                                        <ThumbsUpIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onProposalAction(message.id, proposal.id, 'rejected')} className="p-1.5 rounded-full hover:bg-red-500/20 text-danger transition-colors btn-boop" aria-label="Reject proposal">
                                        <ThumbsDownIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                          </div>
                          {proposal.status !== 'pending' && (
                            <p className={`text-xs font-bold mt-1 text-right ${proposal.status === 'approved' ? 'text-green-400' : 'text-danger'}`}>
                              Status: {proposal.status}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {message.toolCallProposals && (
                    <div className={`${hasContent ? 'mt-3 pt-3 border-t border-white/10' : ''} space-y-2`}>
                      {!hasContent && (
                        <h4 className="text-xs font-bold text-text-primary/80 flex items-center gap-2">
                          <SparklesIcon className="w-4 h-4" />
                          Proposed Action:
                        </h4>
                      )}
                      {message.toolCallProposals.tool_calls.map((call, index) => (
                          <div key={index} className="bg-black/20 p-2 rounded-md">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-grow min-w-0">
                                    <p className="text-xs font-mono text-accent">{call.function.name}</p>
                                    <pre className="text-xs text-text-secondary mt-1 bg-primary/30 p-1 rounded-sm whitespace-pre-wrap break-all">
                                        {JSON.stringify(JSON.parse(call.function.arguments), null, 2)}
                                    </pre>
                                </div>
                                {message.toolCallProposals?.status === 'pending' && (
                                    <div className="flex-shrink-0 flex items-center gap-1">
                                        <button onClick={() => onToolProposalReject(message.id)} className="p-1.5 rounded-full bg-danger/20 text-danger hover:bg-danger/40 btn-boop" aria-label="Reject proposal">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onToolProposalApprove(message.id)} className="p-1.5 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/40 btn-boop" aria-label="Approve proposal">
                                            <CheckIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                          </div>
                      ))}
                       {message.toolCallProposals.status !== 'pending' && (
                         <p className={`text-xs font-bold mt-1 text-right ${message.toolCallProposals.status === 'approved' ? 'text-green-400' : 'text-danger'}`}>
                            Status: {message.toolCallProposals.status}
                          </p>
                       )}
                    </div>
                  )}

                  {/* User uploaded images */}
                  {message.images && message.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image.url} 
                          alt={`user upload ${index + 1}`} 
                          className="max-w-[150px] max-h-[150px] rounded-lg object-cover" 
                        />
                      ))}
                    </div>
                  )}

                  {/* AI generated images */}
                  {message.generatedImages && message.generatedImages.length > 0 && (
                    <div className="mt-4">
                      <div className={`grid gap-4 ${message.generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {message.generatedImages.map((image, index) => (
                          <div key={index} className="bg-black/20 p-2 rounded-lg">
                             <a href={`data:image/jpeg;base64,${image.b64_json}`} download={`grok-generated-chat-${index}.jpeg`} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={`data:image/jpeg;base64,${image.b64_json}`} 
                                alt={image.revised_prompt} 
                                className="w-full rounded-md object-cover aspect-square mb-2" 
                              />
                            </a>
                            <p className="text-xs text-text-secondary italic">"{image.revised_prompt}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.timestamp && hasContent && (
                      <p className="text-right text-xs text-text-primary/60 mt-1.5" style={{fontSize: '0.65rem'}}>
                          {new Date(message.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                  )}
                </>
              )}
            </div>
            
            {(!isEditing && message.groundingChunks && message.groundingChunks.length > 0) && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <h4 className="text-xs font-bold text-text-primary/80 mb-1">Sources:</h4>
                <ul className="text-xs space-y-1">
                  {message.groundingChunks.map((chunk, index) => (
                    chunk.web && chunk.web.uri && (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-text-secondary pt-0.5">{index + 1}.</span>
                        <a 
                          href={chunk.web.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-accent hover:underline break-all"
                          title={chunk.web.title || chunk.web.uri}
                        >
                          {chunk.web.title || chunk.web.uri}
                        </a>
                      </li>
                    )
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom part: controls bar. Only appears when not editing and there is content */}
            {hasContent && !isEditing && (
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between min-h-[36px]">
                {/* Left side: Version switcher */}
                <div className="flex-1 min-w-0">
                  {isAssistant && message.versions.length > 1 && (
                    <div className="flex items-center text-xs text-text-secondary">
                      <button disabled={message.activeVersionIndex === 0} onClick={() => onVersionChange(message.id, message.activeVersionIndex - 1)} className="p-1 disabled:opacity-30 hover:text-text-primary transition-colors btn-boop"><ChevronLeftIcon /></button>
                      <span className="font-mono">{message.activeVersionIndex + 1} / {message.versions.length}</span>
                      <button disabled={message.activeVersionIndex === message.versions.length - 1} onClick={() => onVersionChange(message.id, message.activeVersionIndex + 1)} className="p-1 disabled:opacity-30 hover:text-text-primary transition-colors btn-boop"><ChevronRightIcon /></button>
                    </div>
                  )}
                </div>
                
                {/* Right side: Action buttons */}
                <div className="flex items-center gap-0">
                  {isAssistant && enableTts && (
                    <button
                      onClick={() => onPlayAudio(message.id, activeVersion.content)}
                      className="p-1.5 rounded-full hover:bg-black/20 text-text-secondary hover:text-text-primary transition-colors btn-boop"
                      aria-label={isPlayingAudio ? "Stop audio" : "Play audio"}
                      disabled={isTtsLoading}
                    >
                      {isTtsLoading ? (
                        <RefreshIcon className="w-4 h-4 animate-spin" />
                      ) : isPlayingAudio ? (
                        <SpeakerOffIcon className="w-4 h-4" />
                      ) : (
                        <SpeakerOnIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button onClick={() => onStartEdit(message.id)} className="p-1.5 rounded-full hover:bg-black/20 text-text-secondary hover:text-text-primary transition-colors btn-boop" aria-label="Edit message">
                    <EditIcon className="w-4 h-4" />
                  </button>
                  {isAssistant && (
                    <button onClick={() => onReroll(message.id)} className="p-1.5 rounded-full hover:bg-black/20 text-text-secondary hover:text-text-primary transition-colors btn-boop" aria-label="Reroll response">
                      <RefreshIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={handleDelete} className="p-1.5 rounded-full hover:bg-black/20 text-text-secondary hover:text-danger transition-colors btn-boop" aria-label="Delete message">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  {isAssistant && (
                    <div className="p-1.5">
                       <StarRating 
                          rating={activeVersion.rating} 
                          onRatingChange={handleRatingClick} 
                          size="w-4 h-4"
                       />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <RatingReasonModal
        isOpen={ratingModalState.isOpen}
        onClose={() => setRatingModalState({ isOpen: false, rating: 0 })}
        onSubmit={handleRatingSubmit}
        rating={ratingModalState.rating}
      />
    </>
  );
};

export default ChatMessage;
