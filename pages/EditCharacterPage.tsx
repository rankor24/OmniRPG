

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Character, Lorebook, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from '../components/FileUpload';
import { SEXUAL_REPRESENTATION_LOREBOOK_ID } from '../ids';
import CharacterGeneratorModal from '../components/CharacterGeneratorModal';
import { LightBulbIcon } from '../components/icons';

interface EditCharacterPageProps {
  characters?: Character[];
  lorebooks?: Lorebook[];
  onSave: (character: Character) => void;
  onDelete: (characterId: string) => void;
  appSettings: AppSettings;
}

const emptyCharacter: Omit<Character, 'id'> = {
  name: '',
  avatar: 'https://imagine-public.x.ai/imagine-public/images/c0a885ec-54cd-4a2c-87d3-cfcceb083d37.png',
  chatBackground: 'https://imagine-public.x.ai/imagine-public/images/c0a885ec-54cd-4a2c-87d3-cfcceb083d37.png',
  tagline: '',
  core: '',
  personality: '',
  background: '',
  kinks: '',
  scenario: '',
  firstMessage: '',
  exampleMessage: '',
  location: '',
  appearance: '',
  position: '',
  activeLorebookIds: [SEXUAL_REPRESENTATION_LOREBOOK_ID],
  initialRelationshipScore: 0,
  initialDominanceScore: 0,
};

const EditCharacterPage: React.FC<EditCharacterPageProps> = ({ characters = [], lorebooks = [], onSave, onDelete, appSettings }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNew = !id;
  
  const sourceCharacter = useMemo(() => {
    if (!isNew) { // Global edit
        const char = characters.find(c => c.id === id);
        if (!char || char.id === 'omni-ai') {
            // If the character is not found or is omni-ai, redirect to library.
            navigate('/library');
            return emptyCharacter;
        }
        return char;
    } else { // New character
        return emptyCharacter;
    }
  }, [id, characters, isNew, navigate]);

  const [character, setCharacter] = useState<Omit<Character, 'id'> | Character>(sourceCharacter);
  const sfwMode = appSettings.sfwMode;
  const [isGeneratorModalOpen, setGeneratorModalOpen] = useState(false);

  useEffect(() => {
    // This effect ensures that if the user navigates between editing different characters
    // without leaving the page (e.g., via a direct URL change), the form state updates correctly.
    setCharacter(sourceCharacter);
  }, [sourceCharacter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCharacter(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleLorebookToggle = (lorebookId: string) => {
    setCharacter(prev => {
      const currentIds = (prev as Character).activeLorebookIds || [];
      const newIds = currentIds.includes(lorebookId)
        ? currentIds.filter(id => id !== lorebookId)
        : [...currentIds, lorebookId];
      return { ...prev, activeLorebookIds: newIds };
    });
  };

  const handleSave = () => {
    if (!character.name) {
        alert("Character name is required.");
        return;
    }

    // Global save
    const charToSave: Character = isNew ? { ...(character as Omit<Character, 'id'>), id: uuidv4() } : (character as Character);
    onSave(charToSave);
  };
  
  const handleExport = () => {
    const charData = JSON.stringify(character, null, 2);
    const blob = new Blob([charData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name || 'character'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (!content) throw new Error("File is empty.");
          
          const importedData = JSON.parse(content);
          
          // Basic validation to see if it looks like a character object
          if (typeof importedData === 'object' && importedData !== null && 'name' in importedData && 'core' in importedData) {
            
            // If it's a new character, we don't want to import the ID.
            if (isNew) {
              const { id, ...charDataWithoutId } = importedData;
              setCharacter(charDataWithoutId);
            } else {
              // When editing, we overwrite the data but keep the original ID of the character being edited.
              const { id: _, ...charDataWithoutId } = importedData;
              setCharacter(prev => ({
                  ...(prev as Character), // cast to Character to ensure 'id' property is there
                  ...charDataWithoutId
              }));
            }
            
            alert("Character data imported successfully! Review and save the changes.");

          } else {
            throw new Error("Invalid character JSON file format.");
          }

        } catch (error) {
          alert(error instanceof Error ? error.message : "Failed to import character data. Please ensure it's a valid JSON file.");
          console.error("Import error:", error);
        } finally {
            // Reset file input to allow re-uploading the same file
            if (event.target) {
                event.target.value = '';
            }
        }
      };
      reader.readAsText(file);
    }
  };
  
  const handleGenerateFromText = (characterData: Partial<Character>) => {
    setCharacter(prev => ({ ...prev, ...characterData }));
  };

  const pageTitle = isNew ? 'Create New Character' : `Editing ${character.name}`;
    
  const saveButtonText = 'Save Character';

  const formSectionTitleClass = "text-xl font-semibold text-text-primary mb-4 border-b border-tertiary pb-2";
  const formInputClass = "mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent";
  const formLabelClass = "block text-sm font-medium text-text-secondary";
  const formTextareaClass = (height = '120px') => `${formInputClass} min-h-[${height}]`;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="bg-secondary p-6 md:p-8 rounded-lg shadow-2xl border border-tertiary">
        
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-accent">{pageTitle}</h1>
            <button
                onClick={() => setGeneratorModalOpen(true)}
                className="flex items-center gap-2 py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors btn-boop"
            >
                <LightBulbIcon className="w-5 h-5" />
                <span>Generate from Text</span>
            </button>
        </div>
        
        <div className="space-y-8">
            
            {/* Core Identity Section */}
            <section>
            <h2 className={formSectionTitleClass}>Core Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                <FileUpload label="Character Avatar" currentImage={character.avatar} onFileUpload={(base64) => setCharacter(p => ({...p, avatar: base64}))} sfwMode={sfwMode} />
                <FileUpload label="Chat Background" currentImage={character.chatBackground} onFileUpload={(base64) => setCharacter(p => ({...p, chatBackground: base64}))} sfwMode={sfwMode} />
                </div>
                <div className="space-y-4">
                    <div>
                    <label htmlFor="name" className={formLabelClass}>Character Name *</label>
                    <input type="text" name="name" id="name" value={character.name} onChange={handleChange} className={formInputClass} required/>
                    </div>
                    <div>
                    <label htmlFor="tagline" className={formLabelClass}>Tagline (Short description for card view)</label>
                    <textarea name="tagline" id="tagline" value={character.tagline} onChange={handleChange} className={formTextareaClass('60px')} />
                    </div>
                </div>
            </div>
            <div className="mt-6">
                <label htmlFor="core" className={formLabelClass}>Core Details (Age, Race, Occupation, etc.)</label>
                <textarea name="core" id="core" value={character.core} onChange={handleChange} className={formTextareaClass('80px')} />
            </div>
            </section>

            {/* Personality & Background Section */}
            <section>
            <h2 className={formSectionTitleClass}>Personality & Background</h2>
                <div className="space-y-6">
                    <div>
                    <label htmlFor="appearance" className={formLabelClass}>Appearance</label>
                    <textarea name="appearance" id="appearance" value={character.appearance} onChange={handleChange} className={formTextareaClass()} />
                    </div>
                    <div>
                    <label htmlFor="personality" className={formLabelClass}>Personality</label>
                    <textarea name="personality" id="personality" value={character.personality} onChange={handleChange} className={formTextareaClass()} />
                    </div>
                    <div>
                    <label htmlFor="background" className={formLabelClass}>Background / Backstory</label>
                    <textarea name="background" id="background" value={character.background} onChange={handleChange} className={formTextareaClass()} />
                    </div>
                    <div>
                    <label htmlFor="kinks" className={formLabelClass}>Kinks / Fetishes</label>
                    <textarea name="kinks" id="kinks" value={character.kinks} onChange={handleChange} className={formTextareaClass()} />
                    </div>
                </div>
            </section>

            {/* Roleplay Scenario Section */}
            <section>
            <h2 className={formSectionTitleClass}>Roleplay Scenario</h2>
            <div className="space-y-6">
                <div>
                    <label htmlFor="scenario" className={formLabelClass}>Scenario (Describe the starting scene and context of the roleplay)</label>
                    <textarea name="scenario" id="scenario" value={character.scenario} onChange={handleChange} className={formTextareaClass()} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="initialRelationshipScore" className={formLabelClass}>Initial Relationship Score (-100 to 100)</label>
                         <p className="text-xs text-text-secondary opacity-70 mb-2">Controls starting affection. -100 is hated, 100 is devoted.</p>
                        <input 
                            type="number" 
                            name="initialRelationshipScore" 
                            id="initialRelationshipScore" 
                            value={(character as Character).initialRelationshipScore ?? 0}
                            onChange={handleChange} 
                            className={formInputClass} 
                            min="-100" 
                            max="100" 
                        />
                    </div>
                    <div>
                        <label htmlFor="initialDominanceScore" className={formLabelClass}>Initial Dominance Score (-100 to 100)</label>
                         <p className="text-xs text-text-secondary opacity-70 mb-2">Controls starting power dynamic. -100 is submissive, 100 is defiant.</p>
                        <input 
                            type="number" 
                            name="initialDominanceScore" 
                            id="initialDominanceScore" 
                            value={(character as Character).initialDominanceScore ?? 0}
                            onChange={handleChange} 
                            className={formInputClass} 
                            min="-100" 
                            max="100" 
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="firstMessage" className={formLabelClass}>First Message (Greeting)</label>
                    <textarea name="firstMessage" id="firstMessage" value={character.firstMessage} onChange={handleChange} className={formTextareaClass()} />
                    </div>
                <div>
                    <label htmlFor="exampleMessage" className={formLabelClass}>Example Messages (Show how the character speaks)</label>
                    <textarea name="exampleMessage" id="exampleMessage" value={character.exampleMessage} onChange={handleChange} className={formTextareaClass()} />
                </div>
            </div>
            </section>

            {/* Lorebooks Section */}
            <section>
            <h2 className={formSectionTitleClass}>Active Lorebooks</h2>
            <p className="text-sm text-text-secondary opacity-70 mb-4">Select which lorebooks to activate for this character. The AI will pull context from these books if keywords are mentioned in conversation.</p>
            <div className="space-y-3">
                {lorebooks.length > 0 ? (
                lorebooks.map(lb => (
                    <label key={lb.id} className="flex items-center gap-3 bg-tertiary p-3 rounded-md cursor-pointer hover:bg-tertiary/70">
                    <input
                        type="checkbox"
                        checked={(character as Character).activeLorebookIds?.includes(lb.id) || false}
                        onChange={() => handleLorebookToggle(lb.id)}
                        className="h-5 w-5 rounded bg-secondary border-tertiary text-accent focus:ring-accent"
                    />
                    <div>
                        <span className="font-semibold text-text-primary">{lb.name}</span>
                        <p className="text-xs text-text-secondary">{lb.description}</p>
                    </div>
                    </label>
                ))
                ) : (
                <p className="text-text-secondary italic">No lorebooks have been created yet. <Link to="/lorebooks/new/edit" className="underline text-accent">Create one!</Link></p>
                )}
            </div>
            </section>

        </div>
        
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
                <button onClick={handleExport} className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors btn-boop">Export (JSON)</button>
                <label className="py-2 px-4 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors cursor-pointer btn-boop">
                    Import (JSON)
                    <input type="file" className="hidden" accept="application/json" onChange={handleImport} />
                </label>
            </div>
            <div className="flex gap-3">
            {!isNew && (
                <button onClick={() => onDelete((character as Character).id)} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-danger hover:bg-danger/90 btn-boop">Delete Character</button>
            )}
            <button onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover btn-boop">{saveButtonText}</button>
            </div>
        </div>
        </div>

        <CharacterGeneratorModal
            isOpen={isGeneratorModalOpen}
            onClose={() => setGeneratorModalOpen(false)}
            onGenerate={handleGenerateFromText}
            appSettings={appSettings}
        />
    </div>
  );
};

export default EditCharacterPage;