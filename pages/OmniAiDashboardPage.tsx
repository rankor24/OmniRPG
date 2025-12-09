import React, { useState, useEffect, useMemo } from 'react';
import { get, keys as idbKeys } from 'idb-keyval';
import type { Character, AppSettings, Lorebook, Persona, PromptTemplate, Memory, Reflection, Conversation, ChatMessage, ExpBreakdown, ManualExpLogEntry, ReflectionProposal, RatingExpLogEntry } from '../types';
import { calculateExp, EXP_VALUES, getLevel, LEVEL_NAMES } from '../services/expManager';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BrainIcon, FileTextIcon, LayoutDashboardIcon, WrenchScrewdriverIcon } from '../components/icons';
import OmniEyeLogo from '../components/OmniEyeLogo';
import FileUpload from '../components/FileUpload';

interface OmniAiDashboardPageProps {
  characters: Character[];
  lorebooks: Lorebook[];
  appSettings: AppSettings;
  omniAiId: string;
  personas: Persona[];
  prompts: PromptTemplate[];
  allMemories: Memory[];
  onUpdateOmniAICharacter: (character: Character) => void;
}

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-colors ${isActive ? 'border-b-2 border-accent text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
        {children}
    </button>
);

const ExpLogView: React.FC<{ expData: ExpBreakdown, manualExpLog: ManualExpLogEntry[], allReflections: Reflection[], ratingExpLog: RatingExpLogEntry[] }> = ({ expData, manualExpLog, allReflections, ratingExpLog }) => {
    const learningLogItems = useMemo(() => {
        return allReflections
            .flatMap(r => r.proposals.map(p => ({ ...p, reflection: r })))
            .filter(p => p.status === 'approved')
            .map(p => ({
                timestamp: p.reflection.timestamp,
                source: 'Learning',
                details: `Approved '${p.action} ${p.type}' proposal`,
                amount: p.type === 'conversation' ? EXP_VALUES.PROPOSAL_APPROVED_MINOR : p.action === 'add' ? EXP_VALUES.PROPOSAL_APPROVED_ADD : p.action === 'edit' ? EXP_VALUES.PROPOSAL_APPROVED_EDIT : EXP_VALUES.PROPOSAL_APPROVED_DELETE
            }));
    }, [allReflections]);
    
    const interactionLogItems = useMemo(() => {
        const manualItems = manualExpLog.map(log => ({ timestamp: log.timestamp, source: 'Manual Tip', details: log.reason, amount: log.amount }));
        const ratingItems = ratingExpLog.map(log => ({ timestamp: log.timestamp, source: 'Rating', details: `Rated message "${log.messagePreview.substring(0, 30)}..."`, amount: log.expChange }));
        return [...manualItems, ...ratingItems].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [manualExpLog, ratingExpLog]);

    return (
        <div className="space-y-6">
            <section className="bg-secondary p-6 rounded-lg border border-tertiary shadow-lg">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Creation EXP</h3>
                <ExpLogTable items={expData.creation.details.map(d => ({ timestamp: 'N/A', source: 'Creation', details: `${d.name} (${d.count})`, amount: d.points }))} />
            </section>
             <section className="bg-secondary p-6 rounded-lg border border-tertiary shadow-lg">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Interaction EXP</h3>
                <ExpLogTable items={interactionLogItems} />
                <p className="text-sm text-text-secondary mt-2">...plus {expData.interaction.details.find(d=>d.name==='Messages')?.points || 0} EXP from {expData.interaction.details.find(d=>d.name==='Messages')?.count || 0} total messages sent.</p>
            </section>
             <section className="bg-secondary p-6 rounded-lg border border-tertiary shadow-lg">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Learning EXP</h3>
                <ExpLogTable items={learningLogItems} />
            </section>
        </div>
    );
};

const ExpLogTable: React.FC<{ items: { timestamp: string, source: string, details: string, amount: number }[] }> = ({ items }) => {
    if (items.length === 0) return <p className="text-sm text-text-secondary italic">No log entries for this category yet.</p>;
    return (
        <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-tertiary sticky top-0">
                    <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Source</th>
                        <th className="p-2">Details</th>
                        <th className="p-2 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-tertiary/50">
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="p-2 whitespace-nowrap text-text-secondary">{item.timestamp !== 'N/A' ? new Date(item.timestamp).toLocaleDateString() : 'Initial'}</td>
                            <td className="p-2 text-text-primary">{item.source}</td>
                            <td className="p-2 text-text-secondary truncate max-w-xs" title={item.details}>{item.details}</td>
                            <td className={`p-2 text-right font-semibold whitespace-nowrap ${item.amount > 0 ? 'text-accent' : 'text-danger'}`}>{item.amount > 0 ? '+' : ''}{item.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const OmniAiDashboardPage: React.FC<OmniAiDashboardPageProps> = (props) => {
  const [omniAiCharacter, setOmniAiCharacter] = useState<Character | null>(null);
  const [expData, setExpData] = useState<ExpBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'log'>('dashboard');
  
  const [allReflections, setAllReflections] = useState<Reflection[]>([]);
  const [manualExpLog, setManualExpLog] = useState<ManualExpLogEntry[]>([]);
  const [ratingExpLog, setRatingExpLog] = useState<RatingExpLogEntry[]>([]);

  useEffect(() => {
    const char = props.characters.find(c => c.id === props.omniAiId);
    if (char) {
      setOmniAiCharacter(char);
    }
  }, [props.characters, props.omniAiId]);

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      try {
        const allKeys = await idbKeys();
        
        const reflectionKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('reflections_'));
        const allReflectionsData: Reflection[] = (await Promise.all(reflectionKeys.map(key => get<Reflection[]>(key as any)))).flat().filter(Boolean) as Reflection[];
        setAllReflections(allReflectionsData);

        let totalMessages = 0;
        const conversationLsKeys = Object.keys(localStorage).filter(key => key.startsWith('conversations_'));
        const historyPromises = [];
        for (const key of conversationLsKeys) {
          const storedConvos = localStorage.getItem(key);
          if (storedConvos) {
            const convos: Conversation[] = JSON.parse(storedConvos);
            for (const convo of convos) {
              historyPromises.push(get<ChatMessage[]>(`chatHistory_${convo.id}`));
            }
          }
        }
        const histories = await Promise.all(historyPromises);
        histories.forEach(h => { totalMessages += (h?.length || 0); });
        
        const manualExpLogData = await get<ManualExpLogEntry[]>('manual_exp_log') || [];
        setManualExpLog(manualExpLogData);
        
        const ratingExpLogData = await get<RatingExpLogEntry[]>('rating_exp_log') || [];
        setRatingExpLog(ratingExpLogData);

        const breakdown = await calculateExp(props.personas, props.characters, props.prompts, props.lorebooks, allReflectionsData, totalMessages, manualExpLogData, ratingExpLogData, props.allMemories);
        setExpData(breakdown);

      } catch (e) {
        console.error("EXP calculation failed", e);
      } finally {
        setLoading(false);
      }
    };
    calculate();
  }, [props.personas, props.characters, props.prompts, props.lorebooks, props.allMemories]);
  
  const handleSave = () => {
    if (omniAiCharacter) {
        props.onUpdateOmniAICharacter(omniAiCharacter);
        alert("OmniAI persona updated!");
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOmniAiCharacter(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const { levelInfo, chartData } = useMemo(() => {
    if (!expData) return { levelInfo: null, chartData: [] };
    const level = getLevel(expData.total);
    const data = [
        { name: 'Creation', value: expData.creation.value, color: '#7F5AF0' },
        { name: 'Interaction', value: expData.interaction.value, color: '#06b6d4' },
        { name: 'Learning', value: expData.learning.value, color: '#84cc16' },
    ].filter(item => item.value > 0);
    return { levelInfo: level, chartData: data };
  }, [expData]);
  
  const formSectionTitleClass = "text-xl font-semibold text-text-primary mb-4 border-b border-tertiary pb-2";
  const formTextareaClass = (height = '120px') => `mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent min-h-[${height}]`;
  
  if (loading || !omniAiCharacter || !expData || !levelInfo) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
            <OmniEyeLogo className="w-32 h-32 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-text-primary mb-2">OmniAI Command Center</h1>
            <p className="text-text-secondary">Manage OmniAI's core persona and track its growth.</p>
        </header>

        <div className="mb-8 border-b border-tertiary flex justify-center">
            <TabButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
                <LayoutDashboardIcon className="w-5 h-5" /> Dashboard
            </TabButton>
            <TabButton isActive={activeTab === 'editor'} onClick={() => setActiveTab('editor')}>
                <WrenchScrewdriverIcon className="w-5 h-5" /> Editor
            </TabButton>
             <TabButton isActive={activeTab === 'log'} onClick={() => setActiveTab('log')}>
                <FileTextIcon className="w-5 h-5" /> Log
            </TabButton>
        </div>

        {activeTab === 'dashboard' && (
            <section className="bg-secondary p-6 rounded-lg border border-tertiary shadow-lg animate-fade-in">
                <h2 className={formSectionTitleClass}>Experience Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-2 space-y-4">
                        <p className="text-lg font-bold text-accent">Level {levelInfo.level}: {LEVEL_NAMES[Math.min(levelInfo.level - 1, LEVEL_NAMES.length - 1)]}</p>
                        <div className="w-full bg-tertiary rounded-full h-4 border border-primary">
                            <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${levelInfo.progress * 100}%` }}></div>
                        </div>
                        <div className="flex justify-between text-sm text-text-secondary">
                            <span>Total EXP: {expData.total.toLocaleString()}</span>
                            <span>Next Level: {Math.ceil(levelInfo.needed).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={40} paddingAngle={5}>
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="p-2 bg-primary/80 border border-tertiary rounded-md"><p className="label text-accent">{`${payload[0].name}: ${payload[0].value.toLocaleString()} EXP`}</p></div> : null} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div className="mt-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Cognitive Levels</h3>
                    <ol className="list-decimal list-inside text-text-secondary space-y-1 text-sm">
                        {LEVEL_NAMES.map((name, index) => (
                            <li key={index} className={levelInfo.level === (index + 1) ? 'font-bold text-accent' : ''}>
                                Level {index + 1}: {name}
                            </li>
                        ))}
                    </ol>
                </div>
            </section>
        )}
        
        {activeTab === 'editor' && (
             <section className="bg-secondary p-6 rounded-lg border border-tertiary shadow-lg animate-fade-in">
                <h2 className={formSectionTitleClass}>OmniAI Persona Editor</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FileUpload label="Character Avatar" currentImage={omniAiCharacter.avatar} onFileUpload={(base64) => setOmniAiCharacter(p => p ? ({...p, avatar: base64}) : null)} sfwMode={props.appSettings.sfwMode} />
                        <FileUpload label="Chat Background" currentImage={omniAiCharacter.chatBackground} onFileUpload={(base64) => setOmniAiCharacter(p => p ? ({...p, chatBackground: base64}) : null)} sfwMode={props.appSettings.sfwMode} />
                    </div>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Name</label>
                      <input type="text" name="name" id="name" value={omniAiCharacter.name} onChange={handleChange} className="mt-1 block w-full bg-tertiary border border-tertiary rounded-md shadow-sm py-2 px-3 text-text-primary focus:outline-none focus:ring-accent focus:border-accent" required/>
                    </div>
                    <div>
                      <label htmlFor="tagline" className="block text-sm font-medium text-text-secondary">Tagline</label>
                      <textarea name="tagline" id="tagline" value={omniAiCharacter.tagline} onChange={handleChange} className={formTextareaClass('80px')} />
                    </div>
                    <div>
                        <label htmlFor="core" className="block text-sm font-medium text-text-secondary">Core Details</label>
                        <textarea name="core" id="core" value={omniAiCharacter.core} onChange={handleChange} className={formTextareaClass('80px')} />
                    </div>
                    <div>
                        <label htmlFor="personality" className="block text-sm font-medium text-text-secondary">Personality</label>
                        <textarea name="personality" id="personality" value={omniAiCharacter.personality} onChange={handleChange} className={formTextareaClass('200px')} />
                    </div>
                    <div>
                        <label htmlFor="background" className="block text-sm font-medium text-text-secondary">Background / Backstory</label>
                        <textarea name="background" id="background" value={omniAiCharacter.background} onChange={handleChange} className={formTextareaClass('150px')} />
                    </div>
                    <div>
                        <label htmlFor="exampleMessage" className="block text-sm font-medium text-text-secondary">Example Messages (Defines general writing style)</label>
                        <textarea name="exampleMessage" id="exampleMessage" value={omniAiCharacter.exampleMessage} onChange={handleChange} className={formTextareaClass()} />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSave} className="py-2 px-6 border border-transparent rounded-md text-sm font-medium text-primary bg-accent hover:bg-accent-hover btn-boop">Save Changes</button>
                    </div>
                </div>
            </section>
        )}
        
        {activeTab === 'log' && (
            <div className="animate-fade-in">
                <ExpLogView expData={expData} manualExpLog={manualExpLog} allReflections={allReflections} ratingExpLog={ratingExpLog} />
            </div>
        )}

      </div>
    </div>
  );
};

export default OmniAiDashboardPage;