import React, { useState, useEffect, useMemo } from 'react';
import { knowledgeApi, botsApi } from '../services/api';
import {
    Database,
    Plus,
    Search,
    Trash2,
    CloudUpload,
    Filter,
    FileText,
    Info,
    ChevronRight,
    Clock,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import CustomSelect from '../components/CustomSelect';

const Knowledge = () => {
    const [knowledge, setKnowledge] = useState([]);
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingIds, setDeletingIds] = useState(new Set());

    // Ingestion States
    const [ingestTab, setIngestTab] = useState('manual'); // 'manual' | 'bulk'
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        botId: 'global',
    });
    const [isUploading, setIsUploading] = useState(false);

    // List States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBot, setFilterBot] = useState('all');

    // RAG Playground States
    const [ragQuery, setRagQuery] = useState('');
    const [ragBotId, setRagBotId] = useState('global');
    const [ragResult, setRagResult] = useState(null);
    const [testingRag, setTestingRag] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [kRes, bRes] = await Promise.all([
                knowledgeApi.getAll(),
                botsApi.getAll(),
            ]);
            setKnowledge(kRes.data);
            setBots(bRes.data);
        } catch (err) {
            console.error('Error fetching knowledge data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddKnowledge = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await knowledgeApi.create({
                ...formData,
                botId: formData.botId === 'global' ? null : formData.botId,
                isGlobal: formData.botId === 'global',
            });
            setFormData({ title: '', content: '', botId: 'global' });
            fetchData();
        } catch (err) {
            console.error('Error adding knowledge:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa tri thức này không?')) return;
        try {
            setDeletingIds(prev => new Set(prev).add(id));
            await knowledgeApi.delete(id);
            fetchData();
        } catch (err) {
            console.error('Error deleting knowledge:', err);
        } finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleTestRAG = async () => {
        if (!ragQuery) return;
        try {
            setTestingRag(true);
            const { data } = await knowledgeApi.testRAG(ragQuery, ragBotId);
            setRagResult(data.context);
        } catch (err) {
            setRagResult(`Error: ${err.message}`);
        } finally {
            setTestingRag(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        try {
            setIsUploading(true);
            await knowledgeApi.upload(formData);
            fetchData();
        } catch (err) {
            console.error('File upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const filteredKnowledge = useMemo(() => {
        return knowledge.filter(item => {
            const matchesSearch = (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.content?.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesFilter = filterBot === 'all' ||
                (filterBot === 'global' && item.isGlobal) ||
                (item.botId === filterBot);
            return matchesSearch && matchesFilter;
        });
    }, [knowledge, searchQuery, filterBot]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[5%]">
            {/* Header Stats */}
            <div className="flex flex-col md:flex-row gap-4 bg-surface-glass/30 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Database size={20} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white leading-tight">Vector Database</h1>
                        <p className="text-[10px] text-muted-foreground font-medium">{knowledge.length} Entries</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-1 border-l border-white/5 pl-4">
                    <Info size={16} className="text-info shrink-0" />
                    <p className="text-[10px] text-muted leading-relaxed">
                        Hệ thống Retrieval-Augmented Generation (RAG) sử dụng Qdrant Vector DB để cung cấp ngữ cảnh chính xác cho AI.
                        Bạn có thể nạp tri thức toàn cục hoặc giới hạn cho từng Bot cụ thể.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Ingestion Section */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="glass-card overflow-hidden">
                        <div className="flex border-b border-border">
                            <button
                                onClick={() => setIngestTab('manual')}
                                className={clsx(
                                    "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all",
                                    ingestTab === 'manual' ? "bg-white/5 text-primary border-b-2 border-primary" : "text-muted hover:text-white"
                                )}
                            >
                                Manual Ingestion
                            </button>
                            <button
                                onClick={() => setIngestTab('bulk')}
                                className={clsx(
                                    "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all",
                                    ingestTab === 'bulk' ? "bg-white/5 text-primary border-b-2 border-primary" : "text-muted hover:text-white"
                                )}
                            >
                                Bulk Upload
                            </button>
                        </div>

                        <div className="p-6">
                            {ingestTab === 'manual' ? (
                                <form className="space-y-4" onSubmit={handleAddKnowledge}>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Document Title</label>
                                        <input
                                            type="text"
                                            className="input-field w-full px-4 py-3 text-sm"
                                            placeholder="e.g., Nội dung kênh chat"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <CustomSelect
                                        label="Scope Assignment"
                                        options={[
                                            { id: 'global', name: 'Global Knowledge (All Bots)', description: 'Shared across all AI agents' },
                                            ...bots.map(bot => ({ id: bot._id, name: `Bot: ${bot.name}`, description: bot.discordName }))
                                        ]}
                                        value={formData.botId}
                                        onChange={(val) => setFormData({ ...formData, botId: val })}
                                        icon={Database}
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Knowledge Content</label>
                                        <textarea
                                            className="input-field w-full px-4 py-3 min-h-[160px] resize-none"
                                            placeholder="Paste the raw text content here..."
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />}
                                        {isSubmitting ? 'Processing...' : 'Process & Embed'}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <label className={clsx(
                                        "border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-12 transition-all cursor-pointer group min-h-[300px]",
                                        isUploading ? "opacity-50 cursor-wait bg-white/5" : "hover:border-primary/50 hover:bg-primary/5"
                                    )}>
                                        <input type="file" className="hidden" accept=".txt,.md" onChange={handleFileUpload} disabled={isUploading} />
                                        {isUploading ? (
                                            <Loader2 size={48} className="text-primary animate-spin mb-4" />
                                        ) : (
                                            <CloudUpload size={48} className="text-muted group-hover:text-primary transition-colors mb-4" />
                                        )}
                                        <p className="font-bold text-lg mb-1">{isUploading ? 'Nạp dữ liệu...' : 'Click to Upload'}</p>
                                        <p className="text-xs text-muted text-center max-w-[200px]">
                                            Drop your .txt or .md files here to start bulk embedding.
                                        </p>
                                    </label>
                                    <div className="bg-info/5 border border-info/20 rounded-xl p-4 flex gap-3">
                                        <Info size={16} className="text-info shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-muted leading-relaxed">
                                            Lưu ý: Hệ thống tự động phân tách tài liệu thành các đoạn (chunks) tối ưu để embedding.
                                            Dung lượng tối đa 5MB mỗi file.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Database & Playground Section */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    {/* RAG Playground */}
                    <div className="glass-card">
                        <div className="bg-white/2 px-6 py-4 border-b border-border font-bold text-sm flex items-center justify-between">
                            <span className="flex items-center gap-2 text-primary font-black tracking-tighter uppercase"><Search size={16} /> RAG Playground</span>
                            <span className="text-[10px] text-muted opacity-50">Test vector retrieval accuracy</span>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                    <input
                                        type="text"
                                        className="input-field w-full pl-10 pr-4 py-3"
                                        placeholder="Ask a question to see what AI retrieves..."
                                        value={ragQuery}
                                        onChange={e => setRagQuery(e.target.value)}
                                    />
                                </div>
                                <CustomSelect
                                    className="w-60"
                                    options={[
                                        { id: 'global', name: 'Global Engine' },
                                        ...bots.map(bot => ({ id: bot._id, name: bot.name }))
                                    ]}
                                    value={ragBotId}
                                    onChange={setRagBotId}
                                    placeholder="Scope: Global"
                                />
                                <button
                                    onClick={handleTestRAG}
                                    disabled={testingRag}
                                    className="btn-primary px-6 py-3 min-w-[100px]"
                                >
                                    {testingRag ? <Loader2 size={16} className="animate-spin" /> : 'Run Test'}
                                </button>
                            </div>

                            {ragResult && (
                                <div className="bg-black/40 border border-border rounded-xl p-5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Retrieved Context Result</p>
                                        <div className="flex gap-4">
                                            <span className="text-[9px] font-bold text-success border border-success/30 px-2 py-0.5 rounded bg-success/5">Score: 0.92</span>
                                            <span className="text-[9px] font-bold text-info border border-info/30 px-2 py-0.5 rounded bg-info/5">Chunks: 1</span>
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto text-sm leading-relaxed text-muted bg-white/2 p-4 rounded-lg font-medium scrollbar-thin italic border border-border/50">
                                        "{ragResult}"
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Knowledge Database */}
                    <div className="glass-card flex-1 flex flex-col min-h-[500px]">
                        <div className="bg-white/2 px-6 py-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="font-black text-sm uppercase tracking-tighter flex items-center gap-2">
                                <FileText size={16} className="text-info" /> Knowledge Inventory
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Quick filter..."
                                        className="bg-background border border-border rounded-full pl-8 pr-4 py-1.5 text-[10px] w-40 outline-none focus:border-primary transition-all"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <CustomSelect
                                    className="w-48"
                                    options={[
                                        { id: 'all', name: 'All Items' },
                                        { id: 'global', name: 'Global Only' },
                                        ...bots.map(bot => ({ id: bot._id, name: bot.name }))
                                    ]}
                                    value={filterBot}
                                    onChange={setFilterBot}
                                    placeholder="Filter by Bot"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin max-h-[600px]">
                            {loading ? (
                                <div className="p-20 text-center text-muted animate-pulse flex flex-col items-center gap-4">
                                    <Loader2 size={32} className="animate-spin text-primary" />
                                    <p className="font-bold tracking-widest text-[10px] uppercase">Retrieving Vector Nodes...</p>
                                </div>
                            ) : filteredKnowledge.length === 0 ? (
                                <div className="p-20 text-center text-muted flex flex-col items-center gap-4">
                                    <Database size={48} className="opacity-20" />
                                    <p className="font-bold text-sm">No knowledge entries matched your criteria.</p>
                                    <button onClick={() => { setSearchQuery(''); setFilterBot('all') }} className="text-primary text-xs font-bold hover:underline">Clear all filters</button>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredKnowledge.map((item) => (
                                        <div key={item._id} className="p-6 hover:bg-white/1 transition-all group flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-white/3 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                                <FileText size={18} className="text-muted group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-sm text-white truncate max-w-[70%] group-hover:text-primary transition-colors">
                                                        {item.title || 'Untitled Knowledge Node'}
                                                    </h4>
                                                    <span className={clsx(
                                                        "text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border",
                                                        item.isGlobal
                                                            ? "bg-info/5 text-info border-info/20"
                                                            : "bg-primary/5 text-primary border-primary/20"
                                                    )}>
                                                        {item.isGlobal ? 'Global' : 'Exclusive'}
                                                    </span>
                                                    {!item.isGlobal && (
                                                        <span className="text-[9px] text-muted font-bold truncate opacity-60">
                                                            {bots.find(b => b._id === item.botId)?.name || 'Unknown Bot'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted line-clamp-1 opacity-70 leading-relaxed font-medium italic">
                                                    "{item.content}"
                                                </p>
                                                <div className="flex items-center gap-4 pt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[9px] font-bold text-muted flex items-center gap-1">
                                                        <Clock size={10} /> {new Date(item.timestamp || Date.now()).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-muted flex items-center gap-1">
                                                        <ChevronRight size={10} /> {item.content.length} characters
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete tri thức"
                                                    disabled={deletingIds.has(item._id)}
                                                >
                                                    {deletingIds.has(item._id) ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white/2 px-6 py-3 border-t border-border flex justify-between items-center shrink-0">
                            <p className="text-[10px] text-muted font-bold">Showing {filteredKnowledge.length} of {knowledge.length} entries</p>
                            <button className="text-primary hover:underline text-[10px] font-bold uppercase tracking-widest" onClick={fetchData}>Refresh Inventory</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Knowledge;
