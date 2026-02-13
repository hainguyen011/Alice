import React, { useState, useEffect } from 'react';
import { botsApi, channelsApi } from '../services/api';
import { Bot, Plus, X, Save, Trash2, Cpu, Shield, Settings, Activity, Edit, RefreshCw } from 'lucide-react';
import BotCard from '../components/BotCard';
import CustomSelect from '../components/CustomSelect';
import { clsx } from 'clsx';

const Bots = () => {
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBot, setEditingBot] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // general, model, advanced
    const [availableModels, setAvailableModels] = useState([]);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        modelName: 'gemini-2.5-flash',
        bot_token: '',
        api_key: '',
        systemInstruction: '',
        isActive: true,
        ragMode: 'global',
        config: {
            colors: {
                success: '#00FFD1'
            }
        }
    });

    useEffect(() => {
        fetchBots();
        fetchModels();
    }, []);

    const fetchModels = async (apiKey = '') => {
        try {
            setIsFetchingModels(true);
            const { data } = await botsApi.listAvailableModels(apiKey);
            setAvailableModels(data);
        } catch (err) {
            console.error('Error fetching models:', err);
        } finally {
            setIsFetchingModels(false);
        }
    };

    const fetchBots = async () => {
        try {
            setLoading(true);
            const [{ data: botsData }, { data: channelsData }] = await Promise.all([
                botsApi.getAll(),
                channelsApi.getAll()
            ]);

            // Map channels to bots
            const enrichedBots = botsData.map(bot => ({
                ...bot,
                activeChannels: channelsData.filter(c => c.botId?._id === bot._id && c.isActive).length
            }));

            setBots(enrichedBots);
        } catch (err) {
            console.error('Error fetching bots and channels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncMetadata = async (bot) => {
        try {
            await botsApi.syncMetadata(bot._id);
            fetchBots(); // Refresh list to see new metadata
        } catch (err) {
            alert(`Sync failed: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleOpenModal = (bot = null) => {
        setActiveTab('general');
        if (bot) {
            setEditingBot(bot);
            setFormData({
                name: bot.name,
                modelName: bot.modelName || 'gemini-2.5-flash',
                bot_token: '',
                api_key: bot.api_key || '',
                systemInstruction: bot.systemInstruction || '',
                isActive: bot.isActive,
                ragMode: bot.ragMode || 'global',
                config: {
                    colors: {
                        success: bot.config?.colors?.success || '#00FFD1'
                    }
                }
            });
        } else {
            setEditingBot(null);
            setFormData({
                name: '',
                modelName: 'gemini-2.5-flash',
                bot_token: '',
                api_key: '',
                systemInstruction: '',
                isActive: true,
                ragMode: 'global',
                config: {
                    colors: {
                        success: '#00FFD1'
                    }
                }
            });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const data = { ...formData };
            if (!data.bot_token && editingBot) delete data.bot_token;
            if (!data.api_key && editingBot) delete data.api_key;

            if (editingBot) {
                await botsApi.update(editingBot._id, data);
            } else {
                await botsApi.create(data);
            }
            setModalOpen(false);
            fetchBots();
        } catch (err) {
            alert(`Error saving bot: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editingBot) return;
        if (!confirm(`Bạn có chắc muốn xóa bot "${editingBot.name}"?`)) return;
        try {
            setIsDeleting(true);
            await botsApi.delete(editingBot._id);
            setModalOpen(false);
            fetchBots();
        } catch (err) {
            alert(`Error deleting bot: ${err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleStatus = async (bot) => {
        try {
            await botsApi.update(bot._id, { isActive: !bot.isActive });
            fetchBots();
        } catch (err) {
            alert(`Error toggling status: ${err.message}`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[5%]">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-glass/30 py-3 px-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white leading-tight">Bot Persona Management</h1>
                        <p className="text-[10px] text-muted-foreground font-medium">Configure and manage AI assistants</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hidden xl:block">
                        <p className="text-[8px] uppercase tracking-tighter text-muted font-bold">Active Instances</p>
                        <p className="text-sm font-black text-success leading-none mt-0.5">{bots.filter(b => b.isActive).length}</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary flex-1 md:flex-none py-2 px-4 shadow-lg shadow-primary/20 text-xs"
                    >
                        <Plus size={16} /> Create New Bot
                    </button>
                </div>
            </div>

            {/* Bots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                    ))
                ) : bots.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-card">
                        <Bot size={48} className="mx-auto text-muted mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-muted">No bots found</h3>
                        <p className="text-sm text-muted/60 mb-6">Start by creating your first AI persona.</p>
                        <button onClick={() => handleOpenModal()} className="btn-outline">Create Bot</button>
                    </div>
                ) : (
                    bots.map(bot => (
                        <BotCard
                            key={bot._id}
                            bot={bot}
                            onEdit={handleOpenModal}
                            onToggle={toggleStatus}
                            onSync={handleSyncMetadata}
                        />
                    ))
                )}
            </div>

            {/* Modal: Bot Configuration */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

                    <div className="glass-card w-full max-w-2xl max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-white/[0.02] px-8 py-6 border-b border-border flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Edit size={20} />
                                </div>
                                <h2 className="text-xl font-black tracking-tight">
                                    {editingBot ? 'Edit Persona' : 'Craft New Persona'}
                                </h2>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-muted hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex px-8 border-b border-border bg-white/[0.01]">
                            {[
                                { id: 'general', label: 'Identity', icon: Bot },
                                { id: 'model', label: 'Engine & API', icon: Cpu },
                                { id: 'advanced', label: 'Advanced Settings', icon: Settings }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all",
                                        activeTab === tab.id
                                            ? "border-primary text-primary bg-primary/5"
                                            : "border-transparent text-muted hover:text-white"
                                    )}
                                >
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <form id="bot-form" onSubmit={handleSubmit} className="space-y-8">
                                {activeTab === 'general' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Display Name</label>
                                            <input
                                                type="text"
                                                className="input-field w-full py-4 text-base font-bold"
                                                placeholder="e.g. Alice, Jarvis..."
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">System Instruction</label>
                                                <span className="text-[10px] text-muted/50 font-medium italic">Defines personality & rules</span>
                                            </div>
                                            <textarea
                                                className="input-field w-full min-h-[200px] leading-relaxed resize-none"
                                                placeholder="Describe how the bot should behave, its knowledge limits, personality traits..."
                                                value={formData.systemInstruction}
                                                onChange={e => setFormData({ ...formData, systemInstruction: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'model' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Discord Bot Token</label>
                                                <input
                                                    type="password"
                                                    className="input-field w-full"
                                                    placeholder={editingBot ? "••••••••••••••••" : "Discord application token"}
                                                    value={formData.bot_token}
                                                    onChange={e => setFormData({ ...formData, bot_token: e.target.value })}
                                                    required={!editingBot}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Gemini API Key</label>
                                                <input
                                                    type="password"
                                                    className="input-field w-full"
                                                    placeholder="Use global key if empty"
                                                    value={formData.api_key}
                                                    onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">AI Model Selection</label>
                                                <button
                                                    type="button"
                                                    onClick={() => fetchModels(formData.api_key)}
                                                    className={clsx(
                                                        "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all text-primary hover:text-primary-light",
                                                        isFetchingModels && "animate-pulse"
                                                    )}
                                                >
                                                    <RefreshCw size={10} className={isFetchingModels ? "animate-spin" : ""} />
                                                    {isFetchingModels ? 'Scanning...' : 'Refresh Models'}
                                                </button>
                                            </div>

                                            <CustomSelect
                                                options={availableModels.length > 0 ? availableModels : [
                                                    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast, efficient for daily tasks' },
                                                    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Great for general use' },
                                                    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Powerful reasoning for complex tasks' }
                                                ]}
                                                value={formData.modelName}
                                                onChange={(val) => setFormData({ ...formData, modelName: val })}
                                                placeholder="Choose Gemini Engine..."
                                                icon={Cpu}
                                            />

                                            {availableModels.find(m => m.id === formData.modelName)?.description && (
                                                <p className="text-[10px] text-muted leading-relaxed px-1">
                                                    {availableModels.find(m => m.id === formData.modelName).description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'advanced' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">RAG Intelligence Mode</label>
                                                <div className="space-y-3">
                                                    {[
                                                        { id: 'global', name: 'Global Engine', desc: 'Accesses shared knowledge base' },
                                                        { id: 'isolated', name: 'Siloed Engine', desc: 'Only uses bot-specific data' },
                                                        { id: 'hybrid', name: 'Hybrid Engine', desc: 'Prioritizes private then shared data' }
                                                    ].map(mode => (
                                                        <div
                                                            key={mode.id}
                                                            onClick={() => setFormData({ ...formData, ragMode: mode.id })}
                                                            className={clsx(
                                                                "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                                                                formData.ragMode === mode.id
                                                                    ? "bg-info/10 border-info/50 text-white"
                                                                    : "bg-white/5 border-white/5 text-muted hover:border-white/20"
                                                            )}
                                                        >
                                                            <Shield size={16} className={formData.ragMode === mode.id ? "text-info" : "text-muted opacity-20"} />
                                                            <div>
                                                                <p className="font-bold text-xs">{mode.name}</p>
                                                                <p className="text-[9px] opacity-60">{mode.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Success Branding Color</label>
                                                    <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                                        <input
                                                            type="color"
                                                            className="h-10 w-10 bg-transparent border-none p-0 cursor-pointer rounded-lg overflow-hidden"
                                                            value={formData.config.colors.success}
                                                            onChange={e => setFormData({ ...formData, config: { colors: { success: e.target.value } } })}
                                                        />
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                className="w-full bg-background border border-white/10 rounded-lg px-3 py-3 text-xs font-mono focus:border-primary outline-none"
                                                                value={formData.config.colors.success}
                                                                onChange={e => setFormData({ ...formData, config: { colors: { success: e.target.value } } })}
                                                            />
                                                            <p className="text-[9px] text-muted mt-2">Used for embeds & UI accents</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold">Auto-Start Instance</p>
                                                        <p className="text-[10px] text-muted">Initialize bot on server startup</p>
                                                    </div>
                                                    <div
                                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                                        className={clsx(
                                                            "w-12 h-6 rounded-full transition-all cursor-pointer relative",
                                                            formData.isActive ? 'bg-success' : 'bg-gray-700'
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md",
                                                            formData.isActive ? 'left-7' : 'left-1'
                                                        )} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t border-border bg-white/[0.02] flex justify-between items-center">
                            {editingBot && (
                                <button
                                    onClick={handleDelete}
                                    type="button"
                                    className="text-red-500 hover:text-red-400 font-bold text-sm flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={16} /> {isDeleting ? 'Deleting...' : 'Delete Persona'}
                                </button>
                            )}
                            <div className="flex gap-4 ml-auto">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    type="button"
                                    className="btn-outline px-8"
                                >
                                    Cancel
                                </button>
                                <button
                                    form="bot-form"
                                    type="submit"
                                    className="btn-primary min-w-[180px] shadow-lg shadow-primary/20"
                                    disabled={isSubmitting || isDeleting}
                                >
                                    <Save size={18} /> {isSubmitting ? 'Saving...' : editingBot ? 'Save System Changes' : 'Initialize Persona'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bots;
