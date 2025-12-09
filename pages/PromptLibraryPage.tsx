
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PromptTemplate, AppSettings, InstructionalPrompt } from '../types';
import { LightBulbIcon, WrenchScrewdriverIcon, PlusIcon, ChevronRightIcon } from '../components/icons';
import SearchSortBar from '../components/SearchSortBar';

interface PromptLibraryPageProps {
  prompts: PromptTemplate[];
  appSettings: AppSettings;
  onSaveAppSettings: (settings: AppSettings) => void;
}

type LibraryTab = 'one-time' | 'system';

const PromptLibraryPage: React.FC<PromptLibraryPageProps> = ({ prompts, appSettings }) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('one-time');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const navigate = useNavigate();

  const filteredOneTimePrompts = useMemo(() => {
    let sortedPrompts = [...prompts];
    
    if (searchTerm) {
        sortedPrompts = sortedPrompts.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.prompt.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    sortedPrompts.sort((a, b) => {
         switch (sortOption) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'newest': 
                 if (a.timestamp && b.timestamp) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                 return 0;
            default: return 0;
        }
    });

    return sortedPrompts;
  }, [prompts, searchTerm, sortOption]);

  const filteredSystemPrompts = useMemo(() => {
    let sortedPrompts = [...appSettings.instructionalPrompts];

    if (searchTerm) {
        sortedPrompts = sortedPrompts.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.usageContext?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    sortedPrompts.sort((a, b) => {
         switch (sortOption) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            // System prompts might not have timestamps consistently for sorting by date
            default: return 0;
        }
    });

    return sortedPrompts;
  }, [appSettings.instructionalPrompts, searchTerm, sortOption]);
  
  const TabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    count: number;
  }> = ({ label, icon, isActive, onClick, count }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-colors btn-boop ${
        isActive ? 'bg-accent text-primary' : 'hover:bg-tertiary/70 text-text-secondary'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary/20 text-text-primary' : 'bg-secondary text-text-secondary'}`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 md:p-6 lg:p-8 flex-shrink-0">
        <h1 className="text-3xl font-bold text-text-primary mb-1">Prompt Library</h1>
        <p className="text-text-secondary">Manage one-time templates and core system instructions.</p>
      </header>

      <div className="sticky top-0 bg-primary/80 backdrop-blur-sm z-10 px-4 md:px-6 lg:px-8 py-3 flex-shrink-0">
        <div className="bg-tertiary p-1 rounded-lg flex items-center gap-1 mb-4">
          <TabButton
            label="Templates"
            icon={<LightBulbIcon className="w-5 h-5" />}
            isActive={activeTab === 'one-time'}
            onClick={() => setActiveTab('one-time')}
            count={prompts.length}
          />
          <TabButton
            label="System"
            icon={<WrenchScrewdriverIcon className="w-5 h-5" />}
            isActive={activeTab === 'system'}
            onClick={() => setActiveTab('system')}
            count={appSettings.instructionalPrompts.length}
          />
        </div>

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
            placeholder="Search prompts..."
        />
      </div>

      <main className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8 pt-0 animate-fade-in">
        <div>
            {activeTab === 'one-time' && (
              <>
                <ul className="space-y-3">
                    <li key="new-prompt">
                        <Link to="/prompt/new/edit" className="block bg-secondary p-4 rounded-lg border-2 border-dashed border-tertiary hover:border-accent hover:text-accent transition-all group btn-boop">
                            <div className="flex items-center justify-center gap-3 py-8 text-text-secondary group-hover:text-accent transition-colors">
                                <PlusIcon className="w-6 h-6" />
                                <span className="font-bold">Create New Template</span>
                            </div>
                        </Link>
                    </li>
                    {filteredOneTimePrompts.map(prompt => (
                    <li key={prompt.id}>
                        <Link to={`/prompt/${prompt.id}/edit`} className="block bg-secondary p-4 rounded-lg border border-tertiary hover:border-accent transition-all group btn-boop">
                        <div className="flex justify-between items-start gap-4">
                            <h3 className="font-bold text-text-primary group-hover:text-accent transition-colors">{prompt.name}</h3>
                            <ChevronRightIcon className="w-5 h-5 text-text-secondary flex-shrink-0 transition-transform group-hover:translate-x-1" />
                        </div>
                        <p className="text-sm text-text-secondary mt-2 line-clamp-2" title={prompt.prompt}>
                            {prompt.prompt}
                        </p>
                        </Link>
                    </li>
                    ))}
                </ul>
                {filteredOneTimePrompts.length === 0 && (
                    <div className="text-center py-10 text-text-secondary">
                        <p>No prompt templates found.</p>
                    </div>
                )}
              </>
            )}
            {activeTab === 'system' && (
              <>
                <ul className="space-y-3">
                    {filteredSystemPrompts.map(prompt => (
                    <li key={prompt.id}>
                        <Link to={`/instructional-prompt/${prompt.id}/edit`} className="block bg-secondary p-4 rounded-lg border border-tertiary hover:border-accent transition-all group btn-boop">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h3 className="font-bold text-text-primary group-hover:text-accent transition-colors">{prompt.name}</h3>
                                <span className="text-xs bg-tertiary text-accent font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">{prompt.usageContext || 'System Instruction'}</span>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-text-secondary flex-shrink-0 transition-transform group-hover:translate-x-1" />
                        </div>
                        <p className="text-sm text-text-secondary mt-2 line-clamp-2" title={prompt.description}>
                            {prompt.description}
                        </p>
                        </Link>
                    </li>
                    ))}
                </ul>
                {filteredSystemPrompts.length === 0 && (
                  <div className="text-center py-10 text-text-secondary">
                      <p>No system instructions found.</p>
                  </div>
                )}
              </>
            )}
        </div>
      </main>
    </div>
  );
};

export default PromptLibraryPage;
