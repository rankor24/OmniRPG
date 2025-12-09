
import React, { useMemo, useState, useCallback } from 'react';
import type { Reflection, Character, AppSettings, ReflectionProposal } from '../../types';
import { InboxIcon, XIcon } from '../icons';
import SearchSortBar from '../SearchSortBar';

// --- TYPE DEFINITIONS ---
type GroupByOption = 'character' | 'conversation' | 'date' | 'proposalType' | 'none';
type FlatProposal = ReflectionProposal & { parent: Reflection };

// --- PROPS ---
interface InboxViewProps {
  allReflections: Reflection[];
  onReviewClick: (reflection: Reflection) => void;
  onBatchUpdate: (proposalIdsToUpdate: Set<string>, status: 'rejected', rejectionReason?: string) => void;
  characters: Character[];
  appSettings: AppSettings;
}

// --- HELPER FUNCTIONS & COMPONENTS ---
const getRelativeDateGroup = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    if (dateDay.getTime() === today.getTime()) return "Today";
    if (dateDay.getTime() === yesterday.getTime()) return "Yesterday";
    if (dateDay >= startOfWeek) return "This Week";
    return "Older";
};
const DATE_GROUP_ORDER = ["Today", "Yesterday", "This Week", "Older"];

const GroupAccordion: React.FC<{ 
    title: React.ReactNode; 
    children: React.ReactNode; 
    count: number; 
    allIds: string[]; 
    selectedIds: Set<string>; 
    onSelectAll: (ids: string[]) => void; 
    onDeselectAll: (ids: string[]) => void;
    defaultOpen?: boolean;
}> = ({ title, children, count, allIds, selectedIds, onSelectAll, onDeselectAll, defaultOpen = false }) => {
    const isAllSelected = allIds.every(id => selectedIds.has(id));
    const handleSelectAllToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) onSelectAll(allIds);
        else onDeselectAll(allIds);
    };

    return (
        <details className='bg-secondary rounded-lg border border-tertiary open:border-accent' open={defaultOpen}>
            <summary className="p-3 cursor-pointer text-text-primary list-none flex justify-between items-center hover:bg-tertiary/50">
                <div className="flex items-center gap-3 font-semibold text-sm sm:text-base">
                    <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllToggle} className="h-4 w-4 rounded bg-primary border-tertiary text-accent focus:ring-accent" onClick={e => e.stopPropagation()} />
                    {title}
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-tertiary text-text-secondary text-xs font-bold rounded-full px-2 py-0.5">{count}</span>
                    <span className="text-accent transform transition-transform duration-200 detail-arrow">▼</span>
                </div>
            </summary>
            <div className="p-3 border-t border-tertiary/50 space-y-3">
                {children}
            </div>
        </details>
    );
};

const ProposalItem: React.FC<{ proposal: FlatProposal; onReview: (reflection: Reflection) => void; isSelected: boolean; onToggleSelect: (id: string) => void; }> = ({ proposal, onReview, isSelected, onToggleSelect }) => {
    return (
        <div className={`bg-primary/50 border border-tertiary/50 rounded-lg p-3 flex flex-col sm:flex-row gap-3 transition-colors ${isSelected ? 'border-accent' : ''}`}>
            <div className="flex-shrink-0 flex items-center justify-center sm:justify-start">
                 <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(proposal.id)} className="h-4 w-4 rounded bg-secondary border-tertiary text-accent focus:ring-accent mr-3" />
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-text-primary capitalize">{proposal.action} {proposal.type}</p>
                <p className="text-sm italic text-text-secondary/80 mt-1">"{proposal.rationale}"</p>
                <p className="text-xs text-text-secondary mt-2">
                    From chat with <span className="font-medium text-text-primary/90">{proposal.parent.characterName}</span> on {new Date(proposal.parent.timestamp).toLocaleDateString()}
                </p>
            </div>
            <div className="flex-shrink-0 flex sm:flex-col justify-end sm:justify-center items-center gap-2">
                <button 
                    onClick={() => onReview(proposal.parent)}
                    className="py-1 px-3 text-xs bg-tertiary text-text-primary rounded-md hover:bg-accent hover:text-primary btn-boop"
                >
                    Review Context
                </button>
            </div>
        </div>
    );
};

const BatchActionBar: React.FC<{ count: number; onReject: () => void; onClear: () => void; }> = ({ count, onReject, onClear }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-accent p-3 flex justify-between items-center z-20 animate-fade-in-slide sm:left-16 lg:left-64">
        <p className="text-sm font-semibold text-text-primary">{count} proposal{count > 1 ? 's' : ''} selected</p>
        <div className="flex gap-2">
            <button onClick={onClear} className="py-2 px-4 text-sm rounded-md text-text-primary hover:bg-tertiary btn-boop">Clear</button>
            <button onClick={onReject} className="py-2 px-4 text-sm rounded-md bg-danger text-white hover:bg-danger/80 btn-boop flex items-center gap-1.5"><XIcon className="w-4 h-4"/> Reject</button>
        </div>
    </div>
);


// --- MAIN VIEW COMPONENT ---
const InboxView: React.FC<InboxViewProps> = ({ allReflections, onReviewClick, onBatchUpdate, characters, appSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [selectedProposalIds, setSelectedProposalIds] = useState<Set<string>>(new Set());

  const { sfwMode } = appSettings;
  const characterMap = useMemo(() => new Map(characters.map(c => [c.id, c])), [characters]);

  const groupedAndSortedProposals = useMemo(() => {
    const allPendingProposals: FlatProposal[] = allReflections
        .flatMap(r => r.proposals.filter(p => p.status === 'pending').map(p => ({ ...p, parent: r })));

    const searched = allPendingProposals.filter(p => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            (p.parent.characterName).toLowerCase().includes(term) ||
            p.parent.conversationPreview.toLowerCase().includes(term) ||
            p.rationale.toLowerCase().includes(term) ||
            p.type.toLowerCase().includes(term) ||
            p.action.toLowerCase().includes(term)
        );
    });

    if (groupBy === 'none') {
        const sorted = [...searched].sort((a,b) => new Date(b.parent.timestamp).getTime() - new Date(a.parent.timestamp).getTime());
        return [{ key: 'all', title: 'All Pending Proposals', items: sorted, orderKey: 1, defaultOpen: true }];
    }
    
    // Helper to get max timestamp in a group for sorting groups by recency
    const getGroupMaxTime = (items: FlatProposal[]) => Math.max(...items.map(i => new Date(i.parent.timestamp).getTime()));

    const groups = new Map<string, { title: React.ReactNode; items: FlatProposal[]; orderKey: string | number, maxTime: number }>();

    searched.forEach(p => {
        let groupKey: string;
        let groupTitle: React.ReactNode;
        let orderKey: string | number;

        switch (groupBy) {
            case 'character':
                groupKey = p.parent.characterId;
                const char = characterMap.get(p.parent.characterId);
                groupTitle = <>{char?.name || p.parent.characterName}</>;
                orderKey = char?.name || p.parent.characterName;
                break;
            case 'conversation':
                groupKey = p.parent.conversationId;
                groupTitle = <span className="truncate" title={p.parent.conversationPreview}>Chat: "{p.parent.conversationPreview}"</span>;
                // Will be sorted by maxTime later
                orderKey = 0; 
                break;
            case 'date':
                groupKey = getRelativeDateGroup(p.parent.timestamp);
                groupTitle = groupKey;
                orderKey = DATE_GROUP_ORDER.indexOf(groupKey);
                break;
            case 'proposalType':
                groupKey = `${p.action}-${p.type}`;
                groupTitle = <span className="capitalize">{p.action} {p.type}</span>;
                orderKey = groupKey;
                break;
        }

        if (!groups.has(groupKey)) {
            groups.set(groupKey, { title: groupTitle, items: [], orderKey, maxTime: 0 });
        }
        const group = groups.get(groupKey)!;
        group.items.push(p);
        // Update group's max timestamp if current proposal is newer
        const pTime = new Date(p.parent.timestamp).getTime();
        if (pTime > group.maxTime) group.maxTime = pTime;
    });

    // Sort items within each group by date (newest first)
    groups.forEach(group => {
        group.items.sort((a, b) => new Date(b.parent.timestamp).getTime() - new Date(a.parent.timestamp).getTime());
    });
    
    // Sort the groups themselves
    return Array.from(groups.values()).sort((a, b) => {
        if (groupBy === 'conversation') {
            // Sort conversations by recency (newest activity at top)
            return b.maxTime - a.maxTime;
        }
        if (typeof a.orderKey === 'number' && typeof b.orderKey === 'number') return a.orderKey - b.orderKey;
        if (typeof a.orderKey === 'string' && typeof b.orderKey === 'string') return a.orderKey.localeCompare(b.orderKey);
        return 0;
    });

  }, [allReflections, searchTerm, groupBy, characterMap]);

  const handleToggleSelect = useCallback((proposalId: string) => {
    setSelectedProposalIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(proposalId)) newSet.delete(proposalId);
        else newSet.add(proposalId);
        return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((proposalIds: string[]) => {
    setSelectedProposalIds(prev => new Set([...prev, ...proposalIds]));
  }, []);

  const handleDeselectAll = useCallback((proposalIds: string[]) => {
    setSelectedProposalIds(prev => {
        const newSet = new Set(prev);
        proposalIds.forEach(id => newSet.delete(id));
        return newSet;
    });
  }, []);

  const handleBatchReject = () => {
    if (window.confirm(`Are you sure you want to reject ${selectedProposalIds.size} proposal(s)?`)) {
        onBatchUpdate(selectedProposalIds, 'rejected', 'Batch Rejected');
        setSelectedProposalIds(new Set());
    }
  };

  return (
    <div className="space-y-4 pb-20"> {/* Padding bottom for batch action bar */}
       
       <SearchSortBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search proposals..."
            className="sticky top-0 bg-primary/80 backdrop-blur-sm z-10 py-2 -mx-2 px-2"
       >
            <div className="relative min-w-[180px]">
                <select 
                    value={groupBy} 
                    onChange={(e) => setGroupBy(e.target.value as GroupByOption)} 
                    className="block w-full pl-3 pr-8 py-2 text-base border border-tertiary rounded-lg bg-tertiary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm appearance-none transition-all duration-200 cursor-pointer shadow-sm"
                    aria-label="Group by"
                >
                    <option value="none">Group: None (Default)</option>
                    <option value="conversation">Group: Conversation</option>
                    <option value="character">Group: Character</option>
                    <option value="date">Group: Date</option>
                    <option value="proposalType">Group: Type</option>
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                   <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
       </SearchSortBar>

      {groupedAndSortedProposals.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-tertiary rounded-lg">
          <InboxIcon className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <p className="text-lg text-text-secondary">{searchTerm ? `No pending proposals match "${searchTerm}".` : "Inbox Zero!"}</p>
          {!searchTerm && <p className="text-sm text-text-secondary opacity-70 mt-2">There are no pending proposals to review.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedAndSortedProposals.map((group, index) => (
            <GroupAccordion
              key={group.orderKey.toString() + index}
              count={group.items.length}
              title={group.title}
              allIds={group.items.map(p => p.id)}
              selectedIds={selectedProposalIds}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              defaultOpen={group.defaultOpen}
            >
              {group.items.map(proposal => (
                 <ProposalItem 
                    key={proposal.id} 
                    proposal={proposal} 
                    onReview={onReviewClick}
                    isSelected={selectedProposalIds.has(proposal.id)}
                    onToggleSelect={handleToggleSelect}
                 />
              ))}
            </GroupAccordion>
          ))}
        </div>
      )}

      {selectedProposalIds.size > 0 && (
          <BatchActionBar 
            count={selectedProposalIds.size}
            onReject={handleBatchReject}
            onClear={() => setSelectedProposalIds(new Set())}
          />
      )}
    </div>
  );
};

export default InboxView;
