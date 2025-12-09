

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PromptTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface EditPromptTemplatePageProps {
  prompts?: PromptTemplate[];
  onSave: (prompt: PromptTemplate) => void;
  onDelete: (promptId: string) => void;
}

const emptyPrompt: Omit<PromptTemplate, 'id'> = {
  name: '',
  prompt: '',
};

const EditPromptTemplatePage: React.FC<EditPromptTemplatePageProps> = ({ prompts = [], onSave, onDelete }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === undefined || id === 'new';
  
  const initialPrompt = useMemo(() => {
    if (isNew) {
      return emptyPrompt;
    }
    return prompts.find(p => p.id === id) || emptyPrompt;
  }, [id, prompts, isNew]);

  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPrompt(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!prompt.name) {
      alert("Prompt name is required.");
      return;
    }
     if (!prompt.prompt) {
      alert("Prompt content cannot be empty.");
      return;
    }
    const promptToSave: PromptTemplate = isNew 
      ? { ...(prompt as Omit<PromptTemplate, 'id'>), id: uuidv4() } 
      : (prompt as PromptTemplate);
    onSave(promptToSave);
  };

  const formInputClass = "mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent";
  const formLabelClass = "block text-sm font-medium text-text-secondary";
  const formTextareaClass = `${formInputClass} min-h-[300px] resize-y font-mono text-sm`;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="bg-secondary p-6 md:p-8 rounded-lg shadow-2xl border border-tertiary max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-accent mb-6">{isNew ? 'Create New Prompt Template' : `Editing "${prompt.name}"`}</h1>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className={formLabelClass}>Prompt Name *</label>
            <input type="text" name="name" id="name" value={prompt.name} onChange={handleChange} className={formInputClass} required />
          </div>

          <div>
            <label htmlFor="prompt" className={formLabelClass}>Prompt Content *</label>
            <p className="text-xs text-text-secondary opacity-70 mb-2">This is the full instruction that will be sent to the AI when this prompt is selected. You can use placeholders like {'{{user}}'} and {'{{char}}'} which will be replaced with the current user and character names.</p>
            <textarea name="prompt" id="prompt" value={prompt.prompt} onChange={handleChange} className={formTextareaClass} />
          </div>
        </div>
        
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {!isNew && (
            <button onClick={() => onDelete((prompt as PromptTemplate).id)} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-danger hover:bg-danger/90 btn-boop">Delete Prompt</button>
          )}
          <div className="flex-grow"></div>
          <button onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover btn-boop">Save Prompt</button>
        </div>
      </div>
    </div>
  );
};

export default EditPromptTemplatePage;