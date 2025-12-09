
import React from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { ChatMessage, AppSettings } from '../../types';
import ChatMessageComponent from '../ChatMessage';

interface MessageListProps {
  messages: ChatMessage[];
  chatPartnerName: string;
  chatPartnerAvatar: string;
  isLoading: boolean;
  
  // Virtuoso ref replacing standard scroll refs
  virtuosoRef: React.RefObject<VirtuosoHandle>;
  onAtBottomStateChange?: (atBottom: boolean) => void;
  
  // Props for ChatMessageComponent
  editingMessageId: string | null;
  sfwMode: boolean;
  isTransparentMode: boolean;
  onStartEdit: (messageId: string) => void;
  onSaveEdit: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onReroll: (messageId: string) => void;
  onVersionChange: (messageId: string, newIndex: number) => void;
  onRatingChange: (messageId: string, versionIndex: number, rating: number, reasons?: string[], comment?: string) => void;
  onDelete: (messageId: string) => void;
  onProposalAction: (messageId: string, proposalId: string, status: 'approved' | 'rejected') => void;
  onToolProposalApprove: (messageId: string) => void;
  onToolProposalReject: (messageId: string) => void;
  appSettings: AppSettings;
  onPlayAudio: (messageId: string, text: string) => void;
  isTtsLoading: boolean;
  isPlayingAudio: (messageId: string) => boolean;
}

const MessageList: React.FC<MessageListProps> = (props) => {
  const { 
      messages, chatPartnerName, chatPartnerAvatar, isLoading, virtuosoRef, onAtBottomStateChange,
      ...chatMessageProps 
  } = props;

  return (
    <div className="h-full">
      <Virtuoso
        ref={virtuosoRef}
        style={{ height: '100%' }}
        data={messages}
        followOutput="auto"
        atBottomStateChange={onAtBottomStateChange}
        initialTopMostItemIndex={messages.length - 1}
        increaseViewportBy={200}
        components={{
            Header: () => messages.length === 0 ? (
                <div className="text-center my-8 p-4 bg-black/30 rounded-lg mx-4 md:mx-6">
                  <p className="text-lg text-text-secondary italic">This is the beginning of your conversation with</p>
                  <h2 className="text-3xl font-bold text-accent mt-2">{chatPartnerName}</h2>
                </div>
            ) : <div className="h-4" />,
            Footer: () => (
                <>
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in-slide mb-2 px-4 md:px-6">
                        <div className="flex items-center max-w-3xl">
                            <div className="rounded-lg px-4 py-2 bg-secondary text-text-primary">
                            <p className="font-bold text-sm">{chatPartnerName} is thinking...</p>
                            </div>
                        </div>
                        </div>
                    )}
                    <div className="h-4" />
                </>
            )
        }}
        itemContent={(index, msg) => (
            <div className="px-4 md:px-6 py-1">
                <ChatMessageComponent
                    key={msg.id}
                    message={msg}
                    isEditing={chatMessageProps.editingMessageId === msg.id}
                    sfwMode={chatMessageProps.sfwMode}
                    isTransparentMode={chatMessageProps.isTransparentMode}
                    onStartEdit={chatMessageProps.onStartEdit}
                    onSaveEdit={chatMessageProps.onSaveEdit}
                    onCancelEdit={chatMessageProps.onCancelEdit}
                    onReroll={chatMessageProps.onReroll}
                    onVersionChange={chatMessageProps.onVersionChange}
                    onRatingChange={chatMessageProps.onRatingChange}
                    onDelete={chatMessageProps.onDelete}
                    onProposalAction={chatMessageProps.onProposalAction}
                    onToolProposalApprove={chatMessageProps.onToolProposalApprove}
                    onToolProposalReject={chatMessageProps.onToolProposalReject}
                    appSettings={chatMessageProps.appSettings}
                    enableTts={chatMessageProps.appSettings.enableTts}
                    onPlayAudio={chatMessageProps.onPlayAudio}
                    isTtsLoading={chatMessageProps.isTtsLoading}
                    isPlayingAudio={chatMessageProps.isPlayingAudio(msg.id)}
                />
            </div>
        )}
      />
    </div>
  );
};

export default MessageList;