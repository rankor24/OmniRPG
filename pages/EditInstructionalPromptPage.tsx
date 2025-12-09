

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { AppSettings, InstructionalPrompt } from '../types';
import { DEFAULT_INSTRUCTIONAL_PROMPTS } from '../data/prompts/instructional-prompts';

interface EditInstructionalPromptPageProps {
  appSettings: AppSettings;
  onSaveAppSettings: (settings: AppSettings) => void;
}

const EditInstructionalPromptPage: React.FC<EditInstructionalPromptPageProps> = ({ appSettings, onSaveAppSettings }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [prompt, setPrompt] = useState<InstructionalPrompt | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const defaultPrompt = useMemo(() => {
    return DEFAULT_INSTRUCTIONAL_PROMPTS.find(p => p.id === id);
  }, [id]);

  useEffect(() => {
    const p = appSettings.instructionalPrompts.find(p => p.id === id);
    if (p) {
      setPrompt(p);
      setEditedContent(p.prompt);
    } else {
      navigate('/prompts');
    }
  }, [id, appSettings.instructionalPrompts, navigate]);

  const handleSave = () => {
    if (!prompt) return;
    const updatedPrompts = appSettings.instructionalPrompts.map(p => 
        p.id === id ? { ...p, prompt: editedContent, timestamp: new Date().toISOString() } : p
    );
    onSaveAppSettings({ ...appSettings, instructionalPrompts: updatedPrompts });
    navigate('/prompts');
  };

  const handleReset = () => {
    if (defaultPrompt) {
        setEditedContent(defaultPrompt.prompt);
    }
  };

  const formLabelClass = "block text-sm font-medium text-text-secondary";
  const formTextareaClass = `mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent min-h-[400px] resize-y font-mono text-sm`;

  if (!prompt) return null;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="bg-secondary p-6 md:p-8 rounded-lg shadow-2xl border border-tertiary max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-accent mb-2">{prompt.name}</h1>
        <p className="text-text-secondary mb-6">{prompt.description}</p>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="prompt" className={formLabelClass}>Prompt Content</label>
            <textarea name="prompt" id="prompt" value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className={formTextareaClass} />
          </div>
        </div>
        
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <button onClick={handleReset} className="py-2 px-4 border border-text-secondary rounded-md text-sm font-medium text-text-primary hover:bg-tertiary btn-boop">Reset to Default</button>
          <div className="flex gap-3">
              <button onClick={() => navigate('/prompts')} className="py-2 px-4 border border-text-secondary rounded-md text-sm font-medium text-text-primary hover:bg-tertiary btn-boop">Cancel</button>
              <button onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover btn-boop">Save Instruction</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInstructionalPromptPage;