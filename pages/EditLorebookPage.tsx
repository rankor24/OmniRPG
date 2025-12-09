import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Lorebook, LorebookEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { TrashIcon } from '../components/icons';

interface EditLorebookPageProps {
  lorebooks?: Lorebook[];
  onSave: (lorebook: Lorebook) => void;
  onDelete: (lorebookId: string) => void;
}

const emptyLorebook: Omit<Lorebook, 'id'> = {
  name: '',
  description: '',
  enabled: true,
  entries: [],
  timestamp: new Date().toISOString(),
};

const EditLorebookPage: React.FC<EditLorebookPageProps> = ({ lorebooks = [], onSave, onDelete }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isNew = id === undefined;

  const initialLorebook = useMemo(() => {
    if (!isNew) {
        return lorebooks.find(lb => lb.id === id) || { ...emptyLorebook, id };
    }
    return emptyLorebook;
  }, [id, lorebooks, isNew]);
  
  const [lorebook, setLorebook] = useState<Lorebook | Omit<Lorebook, 'id'>>(initialLorebook);
  const [movedEntries, setMovedEntries] = useState<{ entry: LorebookEntry, newLorebookId: string }[]>([]);

  useEffect(() => {
    setLorebook(initialLorebook);
    setMovedEntries([]); // Reset moved entries when the lorebook changes
  }, [initialLorebook]);
  
  useEffect(() => {
    const { scrollToEntryId } = location.state || {};
    if (scrollToEntryId) {
      setTimeout(() => { // Timeout to allow the DOM to render
        const element = document.getElementById(`entry-${scrollToEntryId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-entry');
          setTimeout(() => {
            element.classList.remove('highlight-entry');
          }, 2000);
        }
      }, 100);
    }
  }, [location.state]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    setLorebook(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleSave = () => {
    if (!lorebook.name) {
      alert("Lorebook name is required.");
      return;
    }
    
    const lorebookId = isNew ? uuidv4() : (lorebook as Lorebook).id;
    const sourceLorebookToSave: Lorebook = { ...(lorebook as Omit<Lorebook, 'id'>), id: lorebookId };
    
    onSave({ ...sourceLorebookToSave, timestamp: new Date().toISOString() });
    
    if (movedEntries.length > 0) {
        const updatesByLorebook = new Map<string, LorebookEntry[]>();
        movedEntries.forEach(({ entry, newLorebookId }) => {
            if (!updatesByLorebook.has(newLorebookId)) {
                updatesByLorebook.set(newLorebookId, []);
            }
            updatesByLorebook.get(newLorebookId)!.push(entry);
        });

        updatesByLorebook.forEach((entriesToAdd, lbId) => {
            const targetLorebook = lorebooks.find(lb => lb.id === lbId);
            if (targetLorebook) {
                const updatedTargetLorebook = {
                    ...targetLorebook,
                    entries: [...targetLorebook.entries, ...entriesToAdd],
                    timestamp: new Date().toISOString()
                };
                onSave(updatedTargetLorebook);
            }
        });
    }
    
    navigate('/lorebooks');
  };
  
  const handleAddEntry = () => {
    const newEntry: LorebookEntry = {
      id: uuidv4(),
      keywords: [],
      content: '',
      enabled: true,
      timestamp: new Date().toISOString(),
    };
    setLorebook(prev => ({ ...prev, entries: [...(prev.entries || []), newEntry] }));
  };
  
  const handleUpdateEntry = (updatedEntry: LorebookEntry) => {
    setLorebook(prev => ({
        ...prev,
        entries: (prev.entries || []).map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
    }));
  };
  
  const handleDeleteEntry = (entryId: string) => {
    setLorebook(prev => ({
        ...prev,
        entries: (prev.entries || []).filter(entry => entry.id !== entryId)
    }));
  };

  const handleMoveEntry = useCallback((entry: LorebookEntry, newLorebookId: string) => {
    setMovedEntries(prev => [...prev, { entry, newLorebookId }]);
    setLorebook(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== entry.id),
    }));
  }, []);

  const formInputClass = "mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent";
  const formLabelClass = "block text-sm font-medium text-text-secondary";
  const formTextareaClass = (height = '120px') => `${formInputClass} min-h-[${height}]`;

  return (
    <div className="bg-secondary p-6 md:p-8 rounded-lg shadow-2xl border border-tertiary">
      <h1 className="text-3xl font-bold text-accent mb-6">{isNew ? 'Create New Lorebook' : `Editing ${lorebook.name}`}</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4 border-b border-tertiary pb-2">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className={formLabelClass}>Lorebook Name *</label>
              <input type="text" name="name" id="name" value={lorebook.name} onChange={handleChange} className={formInputClass} required />
            </div>
            <div className="flex items-center">
                 <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={lorebook.enabled}
                    onChange={handleChange}
                    className="h-5 w-5 rounded bg-tertiary border-tertiary text-accent focus:ring-accent"
                  />
                  <span className="font-semibold text-text-primary">Enabled</span>
                </label>
            </div>
          </div>
          <div className="mt-6">
            <label htmlFor="description" className={formLabelClass}>Description</label>
            <textarea name="description" id="description" value={lorebook.description} onChange={handleChange} className={formTextareaClass('80px')} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4 border-b border-tertiary pb-2">Entries</h2>
          <div className="space-y-4">
            {lorebook.entries?.map(entry => (
              <LorebookEntryEditor 
                key={entry.id} 
                entry={entry} 
                onUpdate={handleUpdateEntry} 
                onDelete={handleDeleteEntry}
                onMove={handleMoveEntry}
                allLorebooks={lorebooks}
                currentLorebookId={(lorebook as Lorebook).id}
              />
            ))}
          </div>
           <button onClick={handleAddEntry} className="mt-6 py-2 px-4 border border-dashed border-tertiary text-text-secondary rounded-md text-sm font-medium hover:border-accent hover:text-text-primary transition-colors btn-boop">
             + Add New Entry
           </button>
        </section>
      </div>
      
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          {!isNew && (
            <button onClick={() => onDelete((lorebook as Lorebook).id)} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-danger hover:bg-danger/90 btn-boop">Delete Lorebook</button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover btn-boop">Save Lorebook</button>
        </div>
      </div>
    </div>
  );
};

interface LorebookEntryEditorProps {
    entry: LorebookEntry;
    onUpdate: (entry: LorebookEntry) => void;
    onDelete: (entryId: string) => void;
    onMove: (entry: LorebookEntry, newLorebookId: string) => void;
    allLorebooks: Lorebook[];
    currentLorebookId: string;
}

const LorebookEntryEditor: React.FC<LorebookEntryEditorProps> = ({ entry, onUpdate, onDelete, onMove, allLorebooks, currentLorebookId }) => {
    const [keywords, setKeywords] = useState(entry.keywords.join(', '));
    const [content, setContent] = useState(entry.content);
    const [enabled, setEnabled] = useState(entry.enabled);
    const [timestamp, setTimestamp] = useState(entry.timestamp);

    const handleKeywordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setKeywords(e.target.value);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEnabled(e.target.checked);
    };

    const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            setTimestamp(new Date(e.target.value).toISOString());
        }
    };

    const handleBlur = () => {
        const finalKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
        onUpdate({ ...entry, keywords: finalKeywords, content, enabled, timestamp });
    };

    const handleLorebookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLorebookId = e.target.value;
        if (newLorebookId && newLorebookId !== currentLorebookId) {
            onMove(entry, newLorebookId);
        }
    };


    return (
        <div className="bg-tertiary p-4 rounded-lg border border-tertiary" id={`entry-${entry.id}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Keywords (comma-separated)</label>
                    <textarea 
                        value={keywords} 
                        onChange={handleKeywordsChange}
                        onBlur={handleBlur}
                        className="w-full bg-secondary border border-tertiary rounded-md p-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        rows={2}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Content</label>
                    <textarea 
                        value={content} 
                        onChange={handleContentChange}
                        onBlur={handleBlur}
                        className="w-full bg-secondary border border-tertiary rounded-md p-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        rows={5}
                    />
                </div>
            </div>
            <div className="mt-3 flex justify-between items-center flex-wrap gap-2">
                 <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={handleEnabledChange}
                    onBlur={handleBlur}
                    className="h-4 w-4 rounded bg-secondary border-tertiary text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-text-primary">Enabled</span>
                </label>
                <div className="flex items-center gap-2">
                    <select 
                        value={currentLorebookId}
                        onChange={handleLorebookChange}
                        className="bg-secondary border border-tertiary rounded-md p-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        title="Move to another lorebook"
                    >
                        {allLorebooks.map(lb => (
                            <option key={lb.id} value={lb.id}>{lb.name}</option>
                        ))}
                    </select>
                    <input
                        type="datetime-local"
                        value={timestamp ? timestamp.slice(0, 16) : ''}
                        onChange={handleTimestampChange}
                        onBlur={handleBlur}
                        className="bg-secondary border border-tertiary rounded-md p-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button onClick={() => onDelete(entry.id)} className="text-text-secondary hover:text-danger transition-colors btn-boop" aria-label="Delete entry">
                        <TrashIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};


export default EditLorebookPage;
