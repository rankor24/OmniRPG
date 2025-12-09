

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Persona, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from '../components/FileUpload';

interface EditPersonaPageProps {
  personas?: Persona[];
  onSave: (persona: Persona) => void;
  onDelete: (personaId: string) => void;
  appSettings: AppSettings;
}

const emptyPersona: Omit<Persona, 'id'> = {
  name: '',
  avatar: 'https://photos.fife.usercontent.google.com/pw/AP1GczOOHB5sXxrnV_NMl8xC4iZOguD65lUmZWppm-_89CKz0evr1M25VEM0=w956-h956-s-no-gm?authuser=0',
  persona: '',
};

const EditPersonaPage: React.FC<EditPersonaPageProps> = ({ personas = [], onSave, onDelete, appSettings }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sfwMode = appSettings.sfwMode;
  const isNew = id === undefined || id === 'new';
  
  const initialPersona = useMemo(() => {
    if (isNew) {
      return emptyPersona;
    }
    return personas.find(p => p.id === id) || emptyPersona;
  }, [id, personas, isNew]);

  const [persona, setPersona] = useState(initialPersona);

  useEffect(() => {
    // This effect ensures that if the user navigates between editing different personas
    // without leaving the page, the form state updates correctly.
    setPersona(initialPersona);
  }, [initialPersona]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersona(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!persona.name) {
      alert("Persona name is required.");
      return;
    }
    const personaToSave: Persona = isNew 
      ? { ...(persona as Omit<Persona, 'id'>), id: uuidv4() } 
      : (persona as Persona);
    onSave(personaToSave);
  };

  const formInputClass = "mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent";
  const formLabelClass = "block text-sm font-medium text-text-secondary";
  const formTextareaClass = `${formInputClass} min-h-[150px]`;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="bg-secondary p-6 md:p-8 rounded-lg shadow-2xl border border-tertiary max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-accent mb-6">{isNew ? 'Create New Persona' : `Editing ${persona.name}`}</h1>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className={formLabelClass}>Persona Name *</label>
            <input type="text" name="name" id="name" value={persona.name} onChange={handleChange} className={formInputClass} required />
          </div>
          
          <FileUpload 
            label="Persona Avatar" 
            currentImage={persona.avatar} 
            onFileUpload={(base64) => setPersona(p => ({...p, avatar: base64}))} 
            sfwMode={sfwMode}
          />

          <div>
            <label htmlFor="persona" className={formLabelClass}>Persona Description</label>
            <p className="text-xs text-text-secondary opacity-70 mb-2">Describe your persona. This will be sent to the AI to represent you in the chat.</p>
            <textarea name="persona" id="persona" value={persona.persona} onChange={handleChange} className={formTextareaClass} />
          </div>
        </div>
        
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {!isNew && (
            <button onClick={() => onDelete((persona as Persona).id)} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-danger hover:bg-danger/90 btn-boop">Delete Persona</button>
          )}
          <div className="flex-grow"></div>
          <button onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover btn-boop">Save Persona</button>
        </div>
      </div>
    </div>
  );
};

export default EditPersonaPage;