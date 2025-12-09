
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MaleHeadBeardIcon, BookOpenIcon, CogIcon, BrainIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, FemaleHeadIcon, BotIcon, LightBulbIcon, FileTextIcon, WrenchScrewdriverIcon, GlobeIcon, ChevronLeftIcon, SaveIcon } from './icons';
import OmniAiLogo from './OmniAiLogo';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, onSettingsClick, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 py-3 rounded-lg transition-colors duration-200 group btn-boop ${
      isActive ? 'bg-accent text-text-primary' : 'hover:bg-tertiary text-text-secondary'
    } ${isCollapsed ? 'justify-center px-2' : 'px-4'}`;

  // Check if we are in a chat/campaign
  const inChat = location.pathname.startsWith('/chat/');

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex h-full flex-col border-r border-tertiary bg-secondary transition-all duration-300 ease-in-out md:relative md:h-auto md:flex-shrink-0 ${isCollapsed ? 'w-16 p-2' : 'w-64 p-4'}`}>
      <div className="mb-8 flex justify-center relative">
        {inChat && !isCollapsed && (
             <button 
                onClick={() => navigate('/campaigns')} 
                className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-text-secondary hover:text-accent transition-colors"
                title="Back to World Selection"
             >
                 <ChevronLeftIcon className="w-5 h-5" />
             </button>
        )}
        <button onClick={onLogout} className="transition-all duration-300 ease-in-out btn-boop" title="Log Out / Return to PIN screen">
            <OmniAiLogo className={isCollapsed ? "w-10 h-10" : "w-24 h-24"} />
        </button>
      </div>
      <nav className="flex-grow space-y-2 overflow-y-auto no-scrollbar">
        {/* Main Navigation Logic */}
        {inChat ? (
             <div className={`flex items-center gap-4 py-3 px-4 rounded-lg bg-tertiary/50 text-accent ${isCollapsed ? 'justify-center px-2' : ''}`}>
                <GlobeIcon className="w-6 h-6 flex-shrink-0 animate-pulse" />
                {!isCollapsed && <span className="font-semibold">Active Campaign</span>}
             </div>
        ) : (
            <NavLink to="/campaigns" className={navLinkClass} title="Worlds">
              <GlobeIcon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="font-semibold">Select World</span>}
            </NavLink>
        )}

        <NavLink to="/library/character/omni-ai/edit" className={navLinkClass} title="GM Settings">
          <BotIcon className="w-6 h-6 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">GM Settings</span>}
        </NavLink>
        <NavLink to="/lorebooks" className={navLinkClass} title="Lorebook & NPCs">
          <BookOpenIcon className="w-6 h-6 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Lorebook</span>}
        </NavLink>
        
        {/* New RPG Sections */}
        <NavLink to="/journal" className={navLinkClass} title="Campaign Journal">
          <BrainIcon className="w-6 h-6 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Journal</span>}
        </NavLink>
        <NavLink to="/quests" className={navLinkClass} title="Quest Log">
          <FileTextIcon className="w-6 h-6 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Quest Log</span>}
        </NavLink>

        <div className="border-t border-tertiary my-2"></div>

        <NavLink to="/prompts" className={navLinkClass} title="Prompts">
          <LightBulbIcon className="w-6 h-6 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Prompts</span>}
        </NavLink>
        <NavLink to="/personas" className={navLinkClass} title="Players">
          <MaleHeadBeardIcon className="w-6 h-6 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Players</span>}
        </NavLink>
        <NavLink to="/embeddings" className={navLinkClass} title="Embeddings">
          <WrenchScrewdriverIcon className="w-6 h-6 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Embeddings</span>}
        </NavLink>
        <NavLink to="/reflections" className={navLinkClass} title="Reflections">
          <FileTextIcon className="w-6 h-6 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Reflections</span>}
        </NavLink>
      </nav>
      <div className="mt-auto space-y-2">
        <button 
          onClick={onSettingsClick} 
          className={`flex items-center w-full gap-4 py-3 rounded-lg hover:bg-tertiary text-text-secondary transition-colors duration-200 btn-boop ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
          title="Settings"
        >
          <CogIcon className="w-6 h-6 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Settings</span>}
        </button>
        <button 
          onClick={onToggle} 
          className={`flex items-center w-full gap-4 py-3 rounded-lg hover:bg-tertiary text-text-secondary transition-colors duration-200 btn-boop ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronDoubleRightIcon className="w-6 h-6 flex-shrink-0"/> : <ChevronDoubleLeftIcon className="w-6 h-6 flex-shrink-0"/>}
          {!isCollapsed && <span className="font-semibold">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
