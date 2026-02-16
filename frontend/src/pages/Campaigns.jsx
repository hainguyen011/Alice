import React, { useState, useEffect } from 'react';
import { campaignsApi, botsApi, channelsApi } from '../services/api';
import {
    Terminal, Plus, Play, RotateCcw,
    Check, Send, Trash2, Edit2,
    LayoutDashboard, BookOpen, Image as ImageIcon,
    Clock, Activity, AlertCircle, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [bots, setBots] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loadingChapters, setLoadingChapters] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        theme: '',
        style: 'GTA V Style',
        botId: '',
        channelId: '',
        cron: '0 9 * * 1',
        storyContext: '',
        nextChapterPrompt: '',
        apiKey: '',
        isActive: true,
        config: {
            reviewRequired: true,
            autoRegenerateOnFail: true,
            discordStructure: 'Standard Embed'
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cRes, bRes, chRes] = await Promise.all([
                campaignsApi.getAll(),
                botsApi.getAll(),
                channelsApi.getAll()
            ]);
            setCampaigns(cRes.data);
            setBots(bRes.data);
            setChannels(chRes.data);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu chiến dịch');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCampaign = async (campaign) => {
        setSelectedCampaign(campaign);
        fetchChapters(campaign._id);
    };

    const fetchChapters = async (id) => {
        try {
            setLoadingChapters(true);
            const res = await campaignsApi.getChapters(id);
            setChapters(res.data);
        } catch (error) {
            toast.error('Lỗi khi tải lịch sử chương');
        } finally {
            setLoadingChapters(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('💾 Saving campaign with data:', formData);
            if (editingCampaign) {
                await campaignsApi.update(editingCampaign._id, formData);
                toast.success('Đã cập nhật chiến dịch');
            } else {
                await campaignsApi.create(formData);
                toast.success('Đã tạo chiến dịch mới');
            }
            setShowForm(false);
            setEditingCampaign(null);
            fetchData();
        } catch (error) {
            console.error('❌ Save error:', error.response?.data || error.message);
            toast.error(`Lỗi khi lưu chiến dịch: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleGenerate = async (id, customInstruction = null) => {
        try {
            toast.loading('Đang tạo chương mới...', { id: 'genChapter' });
            await campaignsApi.generateNext(id, customInstruction);
            toast.success('Đã tạo chương mới thành công', { id: 'genChapter' });
            if (selectedCampaign?._id === id) fetchChapters(id);
        } catch (error) {
            toast.error('Lỗi khi tạo chương', { id: 'genChapter' });
        }
    };

    const handlePublish = async (chapterId) => {
        try {
            toast.loading('Đang đăng lên Discord...', { id: 'publish' });
            await campaignsApi.publishChapter(chapterId);
            toast.success('Đã đăng thành công', { id: 'publish' });
            fetchChapters(selectedCampaign._id);
        } catch (error) {
            toast.error('Lỗi khi đăng kịch bản', { id: 'publish' });
        }
    };

    const handleRegenerateContent = async (chapterId) => {
        try {
            toast.loading('Đang tạo lại kịch bản...', { id: 'regen' });
            await campaignsApi.regenerateContent(chapterId);
            toast.success('Đã làm mới nội dung', { id: 'regen' });
            fetchChapters(selectedCampaign._id);
        } catch (error) {
            toast.error('Lỗi khi tạo lại nội dung', { id: 'regen' });
        }
    };

    const handleRegenerateImage = async (chapterId) => {
        try {
            toast.loading('Đang vẽ lại hình ảnh...', { id: 'regenImg' });
            await campaignsApi.regenerateImage(chapterId, {});
            toast.success('Đã vẽ lại xong', { id: 'regenImg' });
            fetchChapters(selectedCampaign._id);
        } catch (error) {
            toast.error('Lỗi khi vẽ lại ảnh', { id: 'regenImg' });
        }
    };

    const deleteCampaign = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa chiến dịch này không?')) return;
        try {
            await campaignsApi.delete(id);
            toast.success('Đã xóa chiến dịch');
            fetchData();
        } catch (error) {
            toast.error('Lỗi khi xóa');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase group">
                        STORY <span className="text-red-600 transition-all group-hover:pl-2">CAMPAIGNS</span>
                    </h1>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Autonomous Comic & Narrative Protocol</p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditingCampaign(null);
                        setFormData({
                            name: '',
                            theme: '',
                            style: 'GTA V Style',
                            botId: '',
                            channelId: '',
                            cron: '0 9 * * 1',
                            storyContext: '',
                            nextChapterPrompt: '',
                            apiKey: '',
                            isActive: true,
                            config: {
                                reviewRequired: true,
                                autoRegenerateOnFail: true,
                                discordStructure: 'Standard Embed'
                            }
                        });
                    }}
                    className="flex items-center gap-3 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-sm transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-500/50"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Deploy New Campaign</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Campaigns List */}
                <div className="xl:col-span-4 space-y-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded border border-white/5" />)
                    ) : campaigns.length === 0 ? (
                        <div className="text-center py-20 bg-[#08080c] rounded border border-white/5">
                            <Terminal size={40} className="mx-auto text-gray-700 mb-4 opacity-20" />
                            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">No active campaigns found</p>
                        </div>
                    ) : (
                        campaigns.map(c => (
                            <div
                                key={c._id}
                                onClick={() => handleSelectCampaign(c)}
                                className={`group p-4 bg-[#08080c] border cursor-pointer transition-all relative overflow-hidden ${selectedCampaign?._id === c._id ? 'border-red-600/50 ring-1 ring-red-600/20 shadow-[0_0_15px_rgba(220,38,38,0.1)]' : 'border-white/5 hover:border-white/20'
                                    }`}
                            >
                                {c.isActive && (
                                    <div className="absolute top-0 right-0 p-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_5px_rgba(220,38,38,1)]" />
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{c.name}</h3>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingCampaign(c); setFormData(c); setShowForm(true); }} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                                            <Edit2 size={12} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteCampaign(c._id); }} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5 mb-4">
                                    <div className="flex items-center gap-2 text-[9px] text-gray-500 uppercase font-black">
                                        <Play size={8} className="text-red-600" />
                                        <span>Theme: {c.theme}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] text-gray-500 uppercase font-black">
                                        <BookOpen size={8} className="text-red-600" />
                                        <span>Chapter: {c.currentChapter}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] text-gray-500 uppercase font-black">
                                        <Clock size={8} className="text-red-600" />
                                        <span>Schedule: {c.cron}</span>
                                    </div>
                                    {c.nextChapterPrompt && (
                                        <div className="flex items-center gap-2 text-[9px] text-amber-500 uppercase font-black bg-amber-500/5 p-1 rounded border border-amber-500/10">
                                            <AlertCircle size={8} />
                                            <span className="truncate">Pending Prompt: {c.nextChapterPrompt}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Quick instruction for next chapter..."
                                        className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-[10px] text-white focus:border-red-600 outline-none transition-all font-mono"
                                        id={`quick-prompt-${c._id}`}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const input = document.getElementById(`quick-prompt-${c._id}`);
                                            handleGenerate(c._id, input.value);
                                            input.value = '';
                                        }}
                                        className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white border border-white/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Play size={10} />
                                        Force Generate Next
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Chapter Review Area */}
                <div className="xl:col-span-8">
                    {!selectedCampaign ? (
                        <div className="h-full flex items-center justify-center p-20 border border-white/5 border-dashed rounded text-center">
                            <div>
                                <LayoutDashboard size={48} className="mx-auto text-gray-800 mb-6" />
                                <h3 className="text-sm font-black text-gray-600 uppercase tracking-[0.3em]">Neural Feed Awaiting Selection</h3>
                                <p className="text-[10px] text-gray-700 mt-2 font-black uppercase tracking-widest">Select a campaign to initiate data uplink</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-red-600/10 border border-red-600/20 rounded">
                                        <Activity size={18} className="text-red-600 animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white uppercase tracking-widest">{selectedCampaign.name} HISTORY</h2>
                                        <span className="text-[9px] text-red-600 font-black uppercase tracking-[0.2em]">{chapters.length} DATA BLOCKS SECURED</span>
                                    </div>
                                </div>
                                <button onClick={() => fetchChapters(selectedCampaign._id)} className="p-2 text-gray-500 hover:text-white transition-colors">
                                    <RotateCcw size={14} className={loadingChapters ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            {loadingChapters ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => <div key={i} className="h-60 bg-white/5 animate-pulse border border-white/5" />)}
                                </div>
                            ) : chapters.length === 0 ? (
                                <div className="py-20 text-center border border-white/5 rounded bg-black/20">
                                    <AlertCircle size={32} className="mx-auto text-gray-800 mb-4" />
                                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">No chapters generated for this archive yet</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {chapters.map((ch, idx) => (
                                        <div key={ch._id} className={`p-6 bg-[#08080c] border transition-all ${ch.status === 'draft' ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-white/5'}`}>
                                            <div className="flex flex-col lg:flex-row gap-8">
                                                {/* Left: Content Review */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-sm italic">CH.{ch.chapterNumber}</span>
                                                            <h3 className="text-sm font-black text-white uppercase tracking-wider">{ch.title}</h3>
                                                        </div>
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${ch.status === 'draft' ? 'text-amber-500 border-amber-500/50 bg-amber-500/5' :
                                                            ch.status === 'sent' ? 'text-green-500 border-green-500/50 bg-green-500/5' :
                                                                'text-red-500 border-red-500/50 bg-red-500/5'
                                                            }`}>
                                                            {ch.status}
                                                        </span>
                                                    </div>

                                                    <div className="p-4 bg-black/40 border border-white/5 rounded text-[11px] text-gray-400 leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                        {ch.content}
                                                    </div>

                                                    {ch.status === 'draft' && (
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                            <button
                                                                onClick={() => handleRegenerateContent(ch._id)}
                                                                className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                                                            >
                                                                <RotateCcw size={10} />
                                                                <span>Rewrite Story</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleRegenerateImage(ch._id)}
                                                                className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                                                            >
                                                                <ImageIcon size={10} />
                                                                <span>Redraw Image</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handlePublish(ch._id)}
                                                                className="flex items-center justify-center gap-2 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 text-[9px] font-black uppercase tracking-widest transition-all col-span-2"
                                                            >
                                                                <Send size={10} />
                                                                <span>Approve & Deploy To Discord</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Visual Preview */}
                                                <div className="lg:w-64 space-y-2">
                                                    <div className="aspect-square bg-white/5 border border-white/5 rounded overflow-hidden relative group">
                                                        {ch.imageUrl ? (
                                                            <img
                                                                src={ch.imageUrl.startsWith('http') ? ch.imageUrl : `http://localhost:3000${ch.imageUrl}`}
                                                                alt="Chapter Illustration"
                                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                                                                <ImageIcon size={32} strokeWidth={1} className="mb-2" />
                                                                <span className="text-[8px] font-black uppercase tracking-widest">No Visualization</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                                                            <p className="text-[8px] text-gray-400 font-bold italic line-clamp-2">" {ch.imagePrompt} "</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Creation Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-4xl bg-[#08080c] border border-white/10 p-8 relative my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
                        {/* Modal Accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[60px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/10 blur-[60px] pointer-events-none" />

                        <div className="relative z-10">
                            <h2 className="text-xl font-black italic tracking-widest text-white uppercase mb-6 border-b border-white/5 pb-4">
                                {editingCampaign ? 'Update Campaign Parameter' : 'Initialize New Narrative Protocol'}
                                <span className="block text-[10px] text-red-600 mt-1 not-italic">Authentication Clear: Security Level 10</span>
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Basic Info Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                        <div className="w-1 h-4 bg-red-600"></div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Basic Configuration</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Campaign Designation</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white focus:border-red-600 outline-none transition-all font-mono"
                                                placeholder="e.g., THE VIBE CITY CHRONICLES"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Core Theme</label>
                                            <input
                                                type="text"
                                                value={formData.theme}
                                                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white focus:border-red-600 outline-none transition-all font-mono"
                                                placeholder="e.g., GTAV Character Life"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Art Processor Style</label>
                                            <select
                                                value={formData.style}
                                                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white focus:border-red-600 outline-none transition-all font-mono"
                                            >
                                                <option value="GTA V Style">GTAV STYLE (HIGH CONTRAST)</option>
                                                <option value="Comics">WESTERN COMIC BOOK</option>
                                                <option value="Manga">MANGA (MODERN)</option>
                                                <option value="Cinematic">CINEMATIC REALISM</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Temporal Clock (Cron)</label>
                                            <input
                                                type="text"
                                                value={formData.cron}
                                                onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white focus:border-red-600 outline-none transition-all font-mono"
                                                placeholder="0 9 * * 1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Story Context Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                        <div className="w-1 h-4 bg-amber-600"></div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Narrative Configuration</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Story Context / Plot Summary</label>
                                        <textarea
                                            value={formData.storyContext}
                                            onChange={(e) => setFormData({ ...formData, storyContext: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white focus:border-amber-600 outline-none transition-all font-mono h-24 resize-none"
                                            placeholder="Describe the overall plot, character arcs, and guidelines for the AI..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Next Chapter Instruction (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.nextChapterPrompt}
                                            onChange={(e) => setFormData({ ...formData, nextChapterPrompt: e.target.value })}
                                            className="w-full bg-white/5 border border-amber-600/30 rounded-sm px-4 py-2.5 text-xs text-white focus:border-amber-600 outline-none transition-all font-mono"
                                            placeholder="Specific prompt for the next generated chapter..."
                                        />
                                    </div>
                                </div>

                                {/* API Configuration Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                        <div className="w-1 h-4 bg-blue-500"></div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">API Configuration</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Custom Gemini API Key (Optional)</label>
                                        <input
                                            type="password"
                                            value={formData.apiKey}
                                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                            className="w-full bg-white/5 border border-blue-500/30 rounded-sm px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition-all font-mono"
                                            placeholder="AIzaSy... (Leave empty to use bot's key)"
                                        />
                                        <p className="text-[8px] text-gray-600 mt-1">Override bot's API key for this campaign. Useful for billing control.</p>
                                    </div>
                                </div>

                                {/* Targeting Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                        <div className="w-1 h-4 bg-green-600"></div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deployment Targeting</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Assigned AI Agent</label>
                                            <select
                                                value={formData.botId}
                                                onChange={(e) => setFormData({ ...formData, botId: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white focus:border-green-600 outline-none transition-all font-mono"
                                                required
                                            >
                                                <option value="">Select Agent...</option>
                                                {bots.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Channel Grid</label>
                                            <select
                                                value={formData.channelId}
                                                onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white focus:border-green-600 outline-none transition-all font-mono"
                                                required
                                            >
                                                <option value="">Select Channel...</option>
                                                {channels.map(ch => <option key={ch.channelId} value={ch.channelId}>{ch.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 p-4 bg-white/5 rounded border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.config.reviewRequired}
                                            onChange={(e) => setFormData({ ...formData, config: { ...formData.config, reviewRequired: e.target.checked } })}
                                            className="w-4 h-4 rounded border-white/10 bg-black text-red-600 focus:ring-red-600 accent-red-600"
                                        />
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manual Neural Review Required</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/10 bg-black text-red-600 focus:ring-red-600 accent-red-600"
                                        />
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Node Active</label>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-white/5">
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                                    >
                                        {editingCampaign ? 'Update Uplink' : 'Initialize Deployment'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                                    >
                                        Abort
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Campaigns;
