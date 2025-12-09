
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Persona, AppSettings } from '../types';
import { EyeIcon } from '../components/icons';
import SearchSortBar from '../components/SearchSortBar';

interface MyPersonasPageProps {
  personas: Persona[];
  activePersonaId: string | null;
  onSetActive: (id: string) => void;
  appSettings: AppSettings;
}

const MyPersonasPage: React.FC<MyPersonasPageProps> = ({ personas, activePersonaId, onSetActive, appSettings }) => {
  const sfwMode = appSettings.sfwMode;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');

  const processedPersonas = useMemo(() => {
    const filtered = personas.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            p.name.toLowerCase().includes(term) ||
            p.persona.toLowerCase().includes(term)
        );
    });

    return filtered.sort((a, b) => {
        switch (sortOption) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'newest': 
                 // Assuming timestamp exists, else fallback to created order (index)
                 if (a.timestamp && b.timestamp) {
                     return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                 }
                 return 0; 
            default: return 0;
        }
    });
  }, [personas, searchTerm, sortOption]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Personas</h1>
        <p className="text-text-secondary">Create and manage the different identities you use in your chats.</p>
      </header>
      
      <SearchSortBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortOption={sortOption}
        onSortChange={setSortOption}
        sortOptions={[
            { value: 'name-asc', label: 'Name (A-Z)' },
            { value: 'name-desc', label: 'Name (Z-A)' },
            { value: 'newest', label: 'Newest' },
        ]}
        placeholder="Search personas..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {processedPersonas.map(persona => (
          <div key={persona.id} className="bg-secondary rounded-lg shadow-lg border border-tertiary flex flex-col">
            <div className="p-4 flex-grow">
              <div className="flex items-center gap-4 mb-4">
                {sfwMode ? (
                  <div className="w-16 h-16 rounded-full bg-tertiary flex items-center justify-center">
                    <EyeIcon className="w-8 h-8 text-text-secondary" />
                  </div>
                ) : (
                  <img 
                    src={persona.avatar} 
                    alt={persona.name} 
                    className="w-16 h-16 rounded-full object-cover bg-primary"
                  />
                )}
                <h3 className="text-xl font-bold text-text-primary truncate">{persona.name}</h3>
              </div>
              <p 
                className="text-sm text-text-secondary h-20 overflow-hidden" 
                style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}
                title={persona.persona}
              >
                {persona.persona}
              </p>
            </div>
            <div className="bg-tertiary/50 p-3 flex justify-between items-center">
                <Link to={`/persona/${persona.id}/edit`} className="text-sm font-medium text-accent hover:underline">
                    Edit
                </Link>
                {activePersonaId === persona.id ? (
                    <span className="text-sm font-semibold text-green-400">Active</span>
                ) : (
                    <button onClick={() => onSetActive(persona.id)} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors btn-boop">
                        Set Active
                    </button>
                )}
            </div>
          </div>
        ))}
        <Link to="/persona/new/edit" className="block group">
          <div className="h-full min-h-[260px] bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-tertiary hover:border-accent hover:text-accent transition-all duration-300 text-text-secondary">
            <div className="text-center">
              <span className="text-6xl font-thin">+</span>
              <p className="mt-2">Create New Persona</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MyPersonasPage;
