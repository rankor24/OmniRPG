
import React, { useState, useMemo, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { Reflection } from '../../types';
import SearchSortBar from '../SearchSortBar';

interface CognitiveLogViewProps {
  allReflections: Reflection[];
}

const CognitiveLogView: React.FC<CognitiveLogViewProps> = ({ allReflections }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const processedReflections = useMemo(() => {
    let filtered = allReflections;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.characterName.toLowerCase().includes(term) ||
        r.conversationPreview.toLowerCase().includes(term) ||
        r.thoughts.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [allReflections, searchTerm, sortOption]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <SearchSortBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortOption={sortOption}
        onSortChange={setSortOption}
        sortOptions={[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
        ]}
        placeholder="Search thoughts, characters, or chats..."
        className="flex-shrink-0 sticky top-0 bg-primary/95 backdrop-blur-sm z-10 py-2"
      />

      {processedReflections.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-tertiary rounded-lg">
            <p className="text-lg text-text-secondary">No log entries found.</p>
        </div>
      ) : (
        <div className="flex-grow min-h-0">
            <Virtuoso
                ref={virtuosoRef}
                data={processedReflections}
                style={{ height: '100%' }}
                className="custom-scrollbar"
                itemContent={(index, r) => (
                    <div className="pb-4 pr-2">
                        <div className="bg-secondary p-4 rounded-lg border border-tertiary shadow-sm hover:border-accent/50 transition-colors animate-fade-in-slide">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-accent text-lg">{r.characterName}</span>
                                    <div className="text-xs text-text-secondary mt-0.5 flex flex-wrap gap-2 items-center">
                                        <span>{new Date(r.timestamp).toLocaleString()}</span>
                                        <span className="w-1 h-1 rounded-full bg-text-secondary/50"></span>
                                        <span className="italic truncate max-w-[200px]" title={r.conversationPreview}>Chat: {r.conversationPreview}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-tertiary/30 p-3 rounded-md border-l-2 border-accent mb-3">
                                <p className="text-text-primary/90 text-sm italic leading-relaxed">"{r.thoughts}"</p>
                            </div>

                            {r.proposals.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {r.proposals.map(p => (
                                        <span key={p.id} className={`text-[10px] px-2 py-1 rounded border uppercase font-bold flex items-center gap-1 ${
                                            p.status === 'approved' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 
                                            p.status === 'rejected' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 
                                            'border-accent/30 bg-accent/10 text-accent'
                                        }`}>
                                            {p.status === 'approved' && '✓'}
                                            {p.status === 'rejected' && '✗'}
                                            {p.status === 'pending' && '○'}
                                            {p.action} {p.type}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] text-text-secondary uppercase tracking-wider">No Proposals</p>
                            )}
                        </div>
                    </div>
                )}
            />
        </div>
      )}
    </div>
  );
};

export default CognitiveLogView;
