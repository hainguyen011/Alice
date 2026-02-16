import React, { useState, useEffect } from 'react';
import {
    BookOpenText,
    Plus,
    Send,
    Calendar,
    ScrollText,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    Eye,
    Clock,
    CheckCircle2,
    AlertCircle,
    Copy,
    ChevronRight,
    Layout,
    Type,
    Palette,
    Bot,
    Sparkles,
    ImagePlus,
    Link,
    Server,
    User as UserIcon,
    History,
    Smile,
    Image as ImageIcon,
    LayoutGrid,
    Bot as BotIcon,
    Hash
} from 'lucide-react';
import { guildsApi, botsApi, channelsApi, postsApi, schedulesApi, scriptsApi } from '../services/api';
import CustomSelect from '../components/CustomSelect';
import { clsx } from 'clsx';

const Posts = () => {
    const [activeTab, setActiveTab] = useState('library'); // library, schedules, scripts
    const [posts, setPosts] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [scripts, setScripts] = useState([]);
    const [bots, setBots] = useState([]);
    const [guilds, setGuilds] = useState([]);
    const [channels, setChannels] = useState([]); // All synced channels from DB
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showPostModal, setShowPostModal] = useState(false);
    const [editingId, setEditingId] = useState(null); // null for create, id for edit
    const [isSaving, setIsSaving] = useState(false);
    const [postData, setPostData] = useState({
        title: '',
        content: '',
        type: 'embed', // Default to embed for better features
        config: {
            color: '#ff0000',
            imageUrl: '',
            images: [],
            thumbnailUrl: '',
            titleUrl: '',
            author: { name: '', icon_url: '', url: '' },
            footer: { text: '', icon_url: '' },
            showTimestamp: false
        }
    });

    // AI Generation State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Schedule Modal States
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        postId: '',
        botId: '',
        guildId: '',
        channelId: '',
        scheduledAt: ''
    });

    useEffect(() => {
        fetchData();
        loadInitialData();
    }, [activeTab]);

    const loadInitialData = async () => {
        try {
            const [botsRes, channelsRes, guildsRes] = await Promise.all([
                botsApi.getAll(),
                channelsApi.getAll(),
                guildsApi.getAll()
            ]);
            setBots(botsRes.data);
            setChannels(channelsRes.data);
            setGuilds(guildsRes.data);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const handleSavePost = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            console.log('--- Submitting Post Data ---');
            console.log('Editing ID:', editingId);
            console.log('Data structure being sent:', JSON.stringify(postData, null, 2));

            if (editingId) {
                await postsApi.update(editingId, postData);
            } else {
                await postsApi.create(postData);
            }
            setShowPostModal(false);
            setEditingId(null);
            setPostData({
                title: '',
                content: '',
                type: 'embed',
                config: {
                    color: '#ff0000',
                    imageUrl: '',
                    images: [],
                    thumbnailUrl: '',
                    titleUrl: '',
                    author: { name: '', icon_url: '', url: '' },
                    footer: { text: '', icon_url: '' },
                    showTimestamp: false
                }
            });
            fetchData();
        } catch (error) {
            console.error('Error saving post:', error);
            alert('❌ Lỗi: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditPost = (post) => {
        setEditingId(post._id);
        const config = post.config || {};
        setPostData({
            title: post.title || '',
            content: post.content || '',
            type: post.type || 'embed',
            config: {
                color: config.color || '#ff0000',
                imageUrl: config.imageUrl || '',
                images: config.images || [],
                thumbnailUrl: config.thumbnailUrl || '',
                titleUrl: config.titleUrl || '',
                author: {
                    name: config.author?.name || '',
                    icon_url: config.author?.icon_url || '',
                    url: config.author?.url || ''
                },
                footer: {
                    text: config.footer?.text || '',
                    icon_url: config.footer?.icon_url || ''
                },
                showTimestamp: config.showTimestamp || false
            }
        });
        setShowPostModal(true);
    };

    const handleGeneratePost = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const res = await postsApi.generate({ prompt: aiPrompt });
            const { title, content, suggestedColor } = res.data;
            setPostData({
                ...postData,
                title: title || postData.title,
                content: content || postData.content,
                config: {
                    ...postData.config,
                    color: suggestedColor || postData.config.color
                }
            });
            setAiPrompt('');
        } catch (error) {
            alert('❌ AI Generation Error: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await schedulesApi.create(scheduleData);
            setShowScheduleModal(false);
            setScheduleData({ postId: '', botId: '', channelId: '', scheduledAt: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating schedule:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const openScheduleModal = (postId = '') => {
        setScheduleData({ ...scheduleData, postId });
        setShowScheduleModal(true);
    };

    // Script Modal States
    const [showScriptModal, setShowScriptModal] = useState(false);
    const [scriptData, setScriptData] = useState({
        name: '',
        description: '',
        botId: '',
        steps: [{ postId: '', delayMinutes: 0, guildId: '', channelId: '' }]
    });

    const handleAddStep = () => {
        setScriptData({
            ...scriptData,
            steps: [...scriptData.steps, { postId: '', delayMinutes: 0, guildId: '', channelId: '' }]
        });
    };

    const handleRemoveStep = (index) => {
        const newSteps = [...scriptData.steps];
        newSteps.splice(index, 1);
        setScriptData({ ...scriptData, steps: newSteps });
    };

    const handleCreateScript = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await scriptsApi.create(scriptData);
            setShowScriptModal(false);
            setScriptData({ name: '', description: '', botId: '', steps: [{ postId: '', delayMinutes: 0, channelId: '' }] });
            fetchData();
        } catch (error) {
            console.error('Error creating script:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRunScript = async (scriptId) => {
        const channelId = prompt('Nhập Default Channel ID để chạy kịch bản này:');
        if (!channelId) return;
        try {
            await scriptsApi.run(scriptId, { channelId });
            alert('✅ Kịch bản đã được kích hoạt! Các bài đăng đã được lập lịch.');
            setActiveTab('schedules');
        } catch (error) {
            alert('❌ Lỗi: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeletePost = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
        try {
            await postsApi.delete(id);
            fetchData();
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn hủy lịch đăng này?')) return;
        try {
            await schedulesApi.delete(id);
            fetchData();
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.error || error.message));
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'library') {
                const res = await postsApi.getAll();
                setPosts(res.data);
            } else if (activeTab === 'schedules') {
                const res = await schedulesApi.getAll();
                setSchedules(res.data);
            } else if (activeTab === 'scripts') {
                const res = await scriptsApi.getAll();
                setScripts(res.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'library', label: 'Thư viện bài viết', icon: BookOpenText },
        { id: 'schedules', label: 'Lịch trình đăng', icon: Calendar },
        { id: 'scripts', label: 'Kịch bản (Scripts)', icon: ScrollText },
    ];

    return (
        <div className="flex flex-col gap-6 h-full animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                        Post <span className="text-primary">Management</span>
                    </h2>
                    <p className="text-[10px] text-muted font-bold tracking-[0.2em] uppercase opacity-40">
                        Neural Network Content Distribution Center
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all text-[11px] font-bold uppercase tracking-widest">
                        <Filter size={14} />
                        Bộ lọc
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab === 'library') {
                                setEditingId(null);
                                setPostData({
                                    title: '',
                                    content: '',
                                    type: 'embed',
                                    config: {
                                        color: '#ff0000',
                                        imageUrl: '',
                                        images: [],
                                        thumbnailUrl: '',
                                        titleUrl: '',
                                        author: { name: '', icon_url: '', url: '' },
                                        footer: { text: '', icon_url: '' },
                                        showTimestamp: false
                                    }
                                });
                                setShowPostModal(true);
                            }
                            else if (activeTab === 'schedules') setShowScheduleModal(true);
                            else setShowScriptModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-all text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        <Plus size={14} />
                        {activeTab === 'library' ? 'Tạo bài viết' : activeTab === 'schedules' ? 'Lập lịch đăng' : 'Tạo kịch bản'}
                    </button>
                </div>
            </div>

            {/* Post Creation Modal */}
            {showPostModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#08080c] border border-white/10 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
                        {/* Modal Scanline */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-black tracking-widest text-white uppercase italic">
                                {editingId ? 'Chỉnh sửa' : 'Soạn thảo'}{' '}
                                <span className="text-primary">Content Node</span>
                            </h3>
                            <button onClick={() => setShowPostModal(false)} className="text-muted hover:text-white transition-all">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Editor Side */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <form id="post-form" className="flex flex-col gap-6" onSubmit={handleSavePost}>
                                    {/* AI Smart Generate Section */}
                                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={16} className="text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI Magic Write</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={aiPrompt}
                                                onChange={e => setAiPrompt(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleGeneratePost()}
                                                className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 transition-all"
                                                placeholder="Nhập ý tưởng bài viết (VD: Thông báo bảo trì lúc 2h sáng)..."
                                            />
                                            <button
                                                type="button"
                                                disabled={isGenerating || !aiPrompt.trim()}
                                                onClick={handleGeneratePost}
                                                className="px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-primary/80 transition-all flex items-center gap-2"
                                            >
                                                {isGenerating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={12} />}
                                                Generate
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Tiêu đề bài viết</label>
                                            <input
                                                required
                                                type="text"
                                                value={postData.title}
                                                onChange={e => setPostData({ ...postData, title: e.target.value })}
                                                className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-primary/50 outline-none transition-all"
                                                placeholder="Tiêu đề..."
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Loại bài viết</label>
                                            <CustomSelect
                                                value={postData.type}
                                                onChange={val => setPostData({ ...postData, type: val })}
                                                options={[
                                                    { id: 'embed', name: 'Standard Embed', description: 'Discord Embed chuẩn với đầy đủ tính năng trang trí.' },
                                                    { id: 'text', name: 'Plain Text', description: 'Chỉ chứa văn bản thuần túy, không định dạng.' }
                                                ]}
                                                icon={LayoutGrid}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Nội dung bài viết</label>
                                        <textarea
                                            required
                                            rows={6}
                                            value={postData.content}
                                            onChange={e => setPostData({ ...postData, content: e.target.value })}
                                            className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-primary/50 outline-none transition-all resize-none"
                                            placeholder="Nội dung chi tiết..."
                                        />
                                    </div>

                                    {postData.type === 'embed' && (
                                        <div className="flex flex-col gap-5 py-4 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                                            <div className="flex items-center gap-2">
                                                <Palette size={14} className="text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Embed Advanced Settings</span>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                                {/* Author Section */}
                                                <div className="lg:col-span-7 p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-4">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                                        <UserIcon size={12} /> Author Information
                                                    </span>
                                                    <div className="flex flex-col gap-3">
                                                        <input
                                                            type="text"
                                                            value={postData.config.author?.name || ''}
                                                            onChange={e => setPostData({ ...postData, config: { ...postData.config, author: { ...postData.config.author, name: e.target.value } } })}
                                                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[11px] outline-none hover:border-white/20 focus:border-primary/50 transition-all"
                                                            placeholder="Tên tác giả..."
                                                        />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                value={postData.config.author?.icon_url || ''}
                                                                onChange={e => setPostData({ ...postData, config: { ...postData.config, author: { ...postData.config.author, icon_url: e.target.value } } })}
                                                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[11px] outline-none hover:border-white/20 focus:border-primary/50 transition-all"
                                                                placeholder="URL Icon của tác giả..."
                                                            />
                                                            <input
                                                                type="text"
                                                                value={postData.config.author?.url || ''}
                                                                onChange={e => setPostData({ ...postData, config: { ...postData.config, author: { ...postData.config.author, url: e.target.value } } })}
                                                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[11px] outline-none hover:border-white/20 focus:border-primary/50 transition-all"
                                                                placeholder="Click URL cho tên tác giả..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Meta & Assets Section */}
                                                <div className="lg:col-span-5 p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-4">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                                        <Link size={12} /> URLs & Styling
                                                    </span>
                                                    <div className="flex flex-col gap-3">
                                                        <input
                                                            type="text"
                                                            value={postData.config.titleUrl || ''}
                                                            onChange={e => setPostData({ ...postData, config: { ...postData.config, titleUrl: e.target.value } })}
                                                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[11px] outline-none hover:border-white/20 focus:border-primary/50 transition-all"
                                                            placeholder="Link tiêu đề (Title URL)..."
                                                        />
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={postData.config.thumbnailUrl || ''}
                                                                    onChange={e => setPostData({ ...postData, config: { ...postData.config, thumbnailUrl: e.target.value } })}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[11px] outline-none hover:border-white/20 focus:border-primary/50 transition-all"
                                                                    placeholder="Thumbnail URL..."
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[10px] text-muted font-bold">Color:</span>
                                                                <input
                                                                    type="color"
                                                                    value={postData.config.color || '#ff0000'}
                                                                    onChange={e => setPostData({ ...postData, config: { ...postData.config, color: e.target.value } })}
                                                                    className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none p-0"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Multi Media Management */}
                                            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                                        <ImagePlus size={12} /> Media Assets (Images Matrix)
                                                    </span>
                                                    <span className="text-[8px] text-muted opacity-50 uppercase tracking-tighter">Hỗ trợ tối đa 10 ảnh - Tự động tạo lưới (Grid)</span>
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    {(postData.config.images || []).map((img, idx) => (
                                                        <div key={idx} className="relative group/img animate-in zoom-in-50 duration-200">
                                                            <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/10 overflow-hidden shadow-2xl">
                                                                <img src={img} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newImgs = [...postData.config.images];
                                                                    newImgs.splice(idx, 1);
                                                                    setPostData({ ...postData, config: { ...postData.config, images: newImgs } });
                                                                }}
                                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-all shadow-xl hover:bg-red-600 active:scale-90"
                                                            >
                                                                <Plus size={12} className="rotate-45" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const url = prompt('Nhập Image URL:');
                                                            if (url) {
                                                                setPostData({ ...postData, config: { ...postData.config, images: [...(postData.config.images || []), url] } });
                                                            }
                                                        }}
                                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted hover:text-primary group"
                                                    >
                                                        <Plus size={20} className="group-hover:scale-110 transition-transform" />
                                                        <span className="text-[8px] font-bold uppercase">Add Photo</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Footer Section */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-4">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                                        <History size={12} /> Footer Configuration
                                                    </span>
                                                    <div className="flex flex-col gap-3">
                                                        <input
                                                            type="text"
                                                            value={postData.config.footer?.text || ''}
                                                            onChange={e => setPostData({ ...postData, config: { ...postData.config, footer: { ...postData.config.footer, text: e.target.value } } })}
                                                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[11px] outline-none hover:border-white/20 focus:border-primary/50 transition-all"
                                                            placeholder="Nội dung chân trang (Footer text)..."
                                                        />
                                                        <input
                                                            type="text"
                                                            value={postData.config.footer?.icon_url || ''}
                                                            onChange={e => setPostData({ ...postData, config: { ...postData.config, footer: { ...postData.config.footer, icon_url: e.target.value } } })}
                                                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[11px] outline-none hover:border-white/20 focus:border-primary/50 transition-all"
                                                            placeholder="URL Icon chân trang..."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-4 justify-between">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-black uppercase text-white tracking-widest italic">Show Timestamp</span>
                                                            <span className="text-[8px] text-muted opacity-60">Hiển thị thời gian thực phía dưới cùng.</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPostData({ ...postData, config: { ...postData.config, showTimestamp: !postData.config.showTimestamp } })}
                                                            className={clsx(
                                                                "w-12 h-6 rounded-full transition-all relative p-1 shadow-inner",
                                                                postData.config.showTimestamp ? "bg-primary shadow-[0_0_10px_rgba(255,0,0,0.3)]" : "bg-white/10"
                                                            )}
                                                        >
                                                            <div className={clsx(
                                                                "w-4 h-4 bg-white rounded-full transition-all shadow-md",
                                                                postData.config.showTimestamp ? "translate-x-6" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>

                                                    <div className="pt-4 border-t border-white/5 mt-auto">
                                                        <div className="flex items-center gap-2 text-[8px] text-primary/60 font-medium uppercase tracking-tighter">
                                                            <Bot size={10} />
                                                            Auto-suggested by Alice Intelligence Platform
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Preview Side - Modern Linear HUD Aesthetic */}
                            <div className="hidden xl:flex flex-col gap-6 w-[480px] shrink-0 border-l border-white/5 bg-gradient-to-b from-[#0a0b10] to-[#050508] overflow-y-auto custom-scrollbar relative">
                                {/* Technical Mesh Overlay */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

                                <div className="flex items-center justify-between sticky top-0 bg-transparent z-20  p-4" style={{ backgroundColor: '#08080c', borderBottom: '1px solid #1a1a1a' }}  >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#ff0000]" />
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/90">Preview Monitor</h4>
                                        </div>
                                        <span className="text-[8px] text-muted font-bold uppercase tracking-widest opacity-40">System Node: DX-900AI</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-1.5 bg-white/[0.02] border border-white/10 rounded-full backdrop-blur-md">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                                        </div>
                                        <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Live Sync</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6 relative z-10 transition-all duration-500 p-4">
                                    {/* Discord Message Mock - Modern Linear Card */}
                                    <div className="group relative">
                                        {/* Subtle Glow Background */}
                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 rounded-[22px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                        <div className="relative bg-gradient-to-br from-[#1a1c26] to-[#0d0e14] rounded-[20px] p-7 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] border border-white/10 flex flex-col gap-5 overflow-hidden transition-all duration-500 group-hover:translate-y-[-4px] group-hover:border-white/20">
                                            {/* Inner Technical Border */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                                            <div className="flex gap-5">
                                                <div className="relative shrink-0">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform">
                                                        <Bot size={26} className="text-primary z-10" />
                                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2.5 mb-2">
                                                        <span className="text-[16px] font-bold text-white hover:text-primary transition-colors cursor-pointer tracking-tight">Alice AI Bot</span>
                                                        <div className="bg-[#5865F2] px-2 py-0.5 rounded-[4px] shadow-lg shadow-[#5865F2]/20">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-tighter">BOT</span>
                                                        </div>
                                                        <span className="text-[11px] text-[#949ba4] font-semibold ml-1 opacity-80">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>

                                                    {postData.type === 'embed' ? (
                                                        <div className="border-l-[4px] rounded-[6px] bg-black/40 backdrop-blur-sm overflow-hidden flex flex-col mt-1 shadow-2xl transition-all duration-300 border-white/5" style={{ borderLeftColor: postData.config.color || '#ff0000' }}>
                                                            <div className="p-4 flex flex-col gap-3.5">
                                                                {/* Preview Author */}
                                                                {postData.config.author?.name && (
                                                                    <div className="flex items-center gap-2.5 mb-1 group/author cursor-pointer self-start">
                                                                        {postData.config.author.icon_url && <img src={postData.config.author.icon_url} className="w-5.5 h-5.5 rounded-full object-cover border border-white/10 shadow-sm" />}
                                                                        <span className="text-[13px] font-bold text-white group-hover/author:text-[#00a8fc] transition-colors">{postData.config.author.name}</span>
                                                                    </div>
                                                                )}

                                                                <div className="flex gap-5">
                                                                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                                                                        {postData.title && (
                                                                            <h4 className={clsx(
                                                                                "text-[17px] font-bold leading-tight tracking-tight break-words",
                                                                                postData.config.titleUrl ? "text-[#00a8fc] cursor-pointer hover:underline" : "text-white"
                                                                            )}>
                                                                                {postData.title}
                                                                            </h4>
                                                                        )}
                                                                        <p className="text-[14px] text-[#dbdee1] whitespace-pre-line leading-[1.5rem] font-medium pr-1 break-words overflow-wrap-anywhere">
                                                                            {postData.content || 'System idle. Waiting for content injection...'}
                                                                        </p>
                                                                    </div>
                                                                    {postData.config.thumbnailUrl && (
                                                                        <div className="shrink-0 ml-1">
                                                                            <img src={postData.config.thumbnailUrl} className="w-20 h-20 rounded-xl object-cover border border-white/10 shadow-2xl hover:scale-110 transition-transform duration-500" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {(postData.config.images && postData.config.images.length > 0) ? (
                                                                    <div className={clsx(
                                                                        "grid gap-1.5 mt-4 rounded-xl overflow-hidden border border-white/10 shadow-inner bg-black/40",
                                                                        postData.config.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                                                                    )}>
                                                                        {postData.config.images.slice(0, 4).map((url, i) => (
                                                                            <div key={i} className={clsx(
                                                                                "relative group/img overflow-hidden",
                                                                                postData.config.images.length === 3 && i === 0 ? "row-span-2 h-auto" : "h-[160px]"
                                                                            )}>
                                                                                <img src={url} className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110 cursor-zoom-in" />
                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : postData.config.imageUrl && (
                                                                    <div className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative group/hero">
                                                                        <img src={postData.config.imageUrl} className="w-full object-cover transition-transform duration-1000 group-hover/hero:scale-105" alt="preview" />
                                                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/hero:opacity-100 transition-opacity" />
                                                                    </div>
                                                                )}

                                                                {/* Footer & Meta */}
                                                                {(postData.config.footer?.text || postData.config.showTimestamp) && (
                                                                    <div className="flex items-center gap-2.5 mt-3 pt-2 border-t border-white/5">
                                                                        {postData.config.footer?.icon_url && <img src={postData.config.footer.icon_url} className="w-4.5 h-4.5 rounded-full object-cover shadow-sm" />}
                                                                        <span className="text-[11px] text-[#949ba4] font-bold flex items-center gap-2 uppercase tracking-tight">
                                                                            {postData.config.footer?.text}
                                                                            {postData.config.footer?.text && postData.config.showTimestamp && <div className="w-1 h-1 rounded-full bg-white/20" />}
                                                                            {postData.config.showTimestamp && <span className="text-[10px] opacity-70">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[15px] text-[#dbdee1] whitespace-pre-line leading-[1.6rem] mt-2 font-medium break-words">
                                                            {postData.content || 'Telemetry buffer empty...'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Premium Inspired Status Card: Logic Core */}
                                    <div className="mt-2 bg-gradient-to-br from-[#12141d] to-[#08090d] border border-white/10 rounded-[24px] p-7 shadow-2xl relative overflow-hidden group">
                                        {/* Background Scanline */}
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                                        <div className="absolute inset-x-0 h-20 -top-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-scan pointer-events-none" />

                                        <div className="flex flex-col gap-6 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded-md bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                                                            <Sparkles size={11} />
                                                        </div>
                                                        <h5 className="text-[13px] font-black text-white/90 tracking-tight">Pixel Matrix <span className="text-primary italic">Finalizer</span></h5>
                                                    </div>
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-50">Content Policy: Active</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <AlertCircle size={20} />
                                                </div>
                                            </div>

                                            {/* Status Grid Inspired by Neural Safety */}
                                            <div className="bg-black/40 rounded-2xl border border-white/5 p-5 flex items-center justify-between shadow-inner">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-60">Render Stability</span>
                                                    <span className="text-[28px] font-black text-white leading-none tracking-tighter">100<span className="text-primary text-sm ml-1">%</span></span>
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_#22c55e]" />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3.5">
                                                <div className="flex items-center justify-between group/row">
                                                    <span className="text-[11px] font-bold text-white/60 group-hover/row:text-white transition-colors">Discord UI Standard</span>
                                                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/5 px-2 py-0.5 rounded border border-green-500/20">Verified</span>
                                                </div>
                                                <div className="flex items-center justify-between group/row">
                                                    <span className="text-[11px] font-bold text-white/60 group-hover/row:text-white transition-colors">Mobile Aspect Ratio</span>
                                                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/5 px-2 py-0.5 rounded border border-green-500/20">Optimized</span>
                                                </div>
                                                <div className="flex items-center justify-between group/row">
                                                    <span className="text-[11px] font-bold text-white/60 group-hover/row:text-white transition-colors">Asset Compression</span>
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/20 animate-pulse">Processing</span>
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <div className="flex items-center gap-3 text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                                                    <div className="h-[2px] w-6 bg-primary shadow-[0_0_8px_#ff0000]" />
                                                    Active Telemetry Stream
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPostModal(false)}
                                className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-white transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                form="post-form"
                                disabled={isSaving}
                                className="px-8 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                            >
                                {isSaving ? 'Đang lưu...' : 'Lưu bài viết'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Creation Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#08080c] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-black tracking-widest text-white uppercase italic">
                                Lập lịch <span className="text-primary">Dispatch</span>
                            </h3>
                            <button onClick={() => setShowScheduleModal(false)} className="text-muted hover:text-white transition-all">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <form className="p-6 flex flex-col gap-5" onSubmit={handleCreateSchedule}>
                            <div className="flex flex-col gap-1.5">
                                <CustomSelect
                                    label="Chọn Bài viết"
                                    placeholder="Tìm bài viết từ thư viện..."
                                    value={scheduleData.postId}
                                    onChange={val => setScheduleData({ ...scheduleData, postId: val })}
                                    options={posts.map(p => ({
                                        id: p._id,
                                        name: p.title,
                                        description: p.content?.substring(0, 50) + '...'
                                    }))}
                                    icon={LayoutGrid}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <CustomSelect
                                        label="Chọn Bot"
                                        placeholder="Chọn Persona..."
                                        value={scheduleData.botId}
                                        onChange={val => setScheduleData({ ...scheduleData, botId: val, channelId: '' })}
                                        options={bots.map(b => ({
                                            id: b._id,
                                            name: b.name,
                                            subtext: b.username
                                        }))}
                                        icon={BotIcon}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <CustomSelect
                                        label="Chọn Server"
                                        placeholder="Chọn Guild..."
                                        value={scheduleData.guildId}
                                        onChange={val => setScheduleData({ ...scheduleData, guildId: val, channelId: '' })}
                                        options={guilds.map(g => ({
                                            id: g.guildId, // Use Discord Guild ID for filtering channels.guildId
                                            name: g.name,
                                            subtext: g.guildId
                                        }))}
                                        icon={Server} // Make sure Server icon is imported
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <CustomSelect
                                    label="Kênh Discord"
                                    placeholder={!scheduleData.botId ? "Vui lòng chọn Bot trước" : !scheduleData.guildId ? "Vui lòng chọn Server trước" : "Chọn kênh đích..."}
                                    value={scheduleData.channelId}
                                    onChange={val => setScheduleData({ ...scheduleData, channelId: val })}
                                    options={channels
                                        .filter(c =>
                                            (scheduleData.botId && (c.botId?._id || c.botId) === scheduleData.botId) &&
                                            (scheduleData.guildId && c.guildId === scheduleData.guildId)
                                        )
                                        .map(c => ({
                                            id: c.channelId,
                                            name: `#${c.name}`,
                                            subtext: c.channelId
                                        }))
                                    }
                                    icon={Hash}
                                />
                                {scheduleData.botId && scheduleData.guildId && channels.filter(c =>
                                    (c.botId?._id || c.botId) === scheduleData.botId &&
                                    c.guildId === scheduleData.guildId
                                ).length === 0 && (
                                        <p className="text-[8px] text-primary/60 italic ml-1">Bot này chưa được gán vào bất kỳ kênh nào trong server đã chọn.</p>
                                    )}
                            </div>

                            <div className="flex flex-col gap-1.5 group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Thời gian đăng (Schedule Time)</label>
                                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all group-focus-within:border-primary/40 group-focus-within:bg-primary/5">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Clock size={16} />
                                    </div>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={scheduleData.scheduledAt}
                                        onChange={e => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                                        className="w-full bg-transparent pl-12 pr-4 py-4 text-xs font-bold text-white outline-none placeholder:text-muted-foreground/20"
                                    />
                                    {/* HUD Accents for Date Picker */}
                                    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/20 group-focus-within:border-primary transition-colors" />
                                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/20 group-focus-within:border-primary transition-colors" />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowScheduleModal(false)}
                                    className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-white transition-all"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    disabled={isSaving}
                                    className="px-8 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                                >
                                    {isSaving ? 'Đang thực thi...' : 'Xác nhận Lịch đăng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Script Creation Modal */}
            {showScriptModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#08080c] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-black tracking-widest text-white uppercase italic">
                                Thiết kế <span className="text-primary">Script Chain</span>
                            </h3>
                            <button onClick={() => setShowScriptModal(false)} className="text-muted hover:text-white transition-all">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <form className="flex-1 overflow-y-auto p-6 flex flex-col gap-6" onSubmit={handleCreateScript}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Tên kịch bản</label>
                                    <input
                                        required
                                        type="text"
                                        value={scriptData.name}
                                        onChange={e => setScriptData({ ...scriptData, name: e.target.value })}
                                        className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-primary/50 outline-none transition-all"
                                        placeholder="VD: Welcome Chain..."
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <CustomSelect
                                        label="Phụ trách bởi Bot"
                                        placeholder="Chọn Bot..."
                                        value={scriptData.botId}
                                        onChange={val => setScriptData({ ...scriptData, botId: val })}
                                        options={bots.map(b => ({
                                            id: b._id,
                                            name: b.name,
                                            subtext: b.username
                                        }))}
                                        icon={BotIcon}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Các bước thực thi (Steps)</label>
                                    <button
                                        type="button"
                                        onClick={handleAddStep}
                                        className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                                    >
                                        <Plus size={12} /> Thêm bước mới
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {scriptData.steps.map((step, index) => (
                                        <div key={index} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-4 relative group">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStep(index)}
                                                className="absolute top-2 right-2 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <CustomSelect
                                                        label="Bài viết"
                                                        placeholder="Chọn bài..."
                                                        value={step.postId}
                                                        onChange={val => {
                                                            const newSteps = [...scriptData.steps];
                                                            newSteps[index].postId = val;
                                                            setScriptData({ ...scriptData, steps: newSteps });
                                                        }}
                                                        options={posts.map(p => ({
                                                            id: p._id,
                                                            name: p.title
                                                        }))}
                                                        icon={LayoutGrid}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1 group">
                                                    <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Trễ (Phút)</label>
                                                    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] transition-all group-focus-within:border-primary/40 group-focus-within:bg-primary/5">
                                                        <input
                                                            required
                                                            type="number"
                                                            min="0"
                                                            value={step.delayMinutes}
                                                            onChange={e => {
                                                                const newSteps = [...scriptData.steps];
                                                                newSteps[index].delayMinutes = parseInt(e.target.value);
                                                                setScriptData({ ...scriptData, steps: newSteps });
                                                            }}
                                                            className="w-full bg-transparent px-3 py-2 text-[11px] font-bold text-white outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <CustomSelect
                                                        label="Chọn Server"
                                                        placeholder="Chọn Guild..."
                                                        value={step.guildId} // Make sure step has guildId if needed
                                                        onChange={val => {
                                                            const newSteps = [...scriptData.steps];
                                                            newSteps[index].guildId = val;
                                                            newSteps[index].channelId = ''; // Reset channel on guild change
                                                            setScriptData({ ...scriptData, steps: newSteps });
                                                        }}
                                                        options={guilds.map(g => ({
                                                            id: g.guildId,
                                                            name: g.name
                                                        }))}
                                                        icon={Server}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <CustomSelect
                                                        label="Kênh Discord"
                                                        placeholder="Chọn kênh..."
                                                        value={step.channelId}
                                                        onChange={val => {
                                                            const newSteps = [...scriptData.steps];
                                                            newSteps[index].channelId = val;
                                                            setScriptData({ ...scriptData, steps: newSteps });
                                                        }}
                                                        options={scriptData.botId && step.guildId ? channels
                                                            .filter(c => (c.botId?._id || c.botId) === scriptData.botId && c.guildId === step.guildId)
                                                            .map(c => ({
                                                                id: c.channelId,
                                                                name: `#${c.name}`
                                                            })) : []
                                                        }
                                                        icon={Hash}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowScriptModal(false)}
                                    className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-white transition-all"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    disabled={isSaving}
                                    className="px-8 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                                >
                                    {isSaving ? 'Đang khởi tạo...' : 'Lưu Kịch bản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-col gap-4 bg-[#08080c]/60 border border-white/5 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden flex-1">
                {/* HUD Scanlines */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                {/* Compact Modern Sliding Switch Tabs */}
                <div className="flex items-center self-start bg-white/[0.02] border border-white/5 p-0.5 rounded-lg mb-4 relative min-w-[600px]">
                    {/* Sliding Background */}
                    <div
                        className="absolute h-[calc(100%-4px)] rounded-md bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(255,0,0,0.08)] transition-all duration-300 ease-out"
                        style={{
                            width: `calc(${100 / tabs.length}% - 2px)`,
                            left: `calc(${(tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length))}% + 2px)`,
                        }}
                    >
                        {/* Thin Glow Underline */}
                        <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-primary/50 shadow-[0_0_8px_#ff0000]" />
                    </div>

                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex-1 flex items-center justify-center gap-3 px-8 py-2 rounded-md transition-all text-[9.5px] font-black uppercase tracking-[0.2em] relative z-10 whitespace-nowrap",
                                activeTab === tab.id
                                    ? "text-primary"
                                    : "text-muted hover:text-white/60"
                            )}
                        >
                            <tab.icon size={12} className={clsx("transition-transform duration-300", activeTab === tab.id && "scale-110")} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content Placeholder */}
                <div className="flex-1 py-4">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Empty State */}
                            {((activeTab === 'library' && posts.length === 0) ||
                                (activeTab === 'schedules' && schedules.length === 0) ||
                                (activeTab === 'scripts' && scripts.length === 0)) && (
                                    <div className="col-span-full h-64 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 opacity-40">
                                        <div className="p-4 bg-white/5 rounded-full">
                                            <BookOpenText size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[12px] font-bold uppercase tracking-widest">Chưa có nội dung</p>
                                            <p className="text-[10px] lowercase italic mt-1 font-medium tracking-normal">Bắt đầu bằng cách tạo bài viết mới hoặc kịch bản lập lịch</p>
                                        </div>
                                    </div>
                                )}

                            {/* Library List */}
                            {activeTab === 'library' && posts.map(post => (
                                <div key={post._id} className="group bg-white/5 border border-white/5 hover:border-primary/30 rounded-xl p-4 transition-all hover:translate-y-[-2px] relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            {post.type === 'embed' ? <Layout size={16} /> : <Type size={16} />}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDeletePost(post._id)}
                                                className="text-muted hover:text-red-500 transition-colors p-1"
                                                title="Xóa bài viết"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="text-muted hover:text-white transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">{post.title}</h3>
                                    <p className="text-[11px] text-muted line-clamp-3 mb-4 leading-relaxed font-medium">
                                        {post.content}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="p-1.5 hover:text-primary transition-colors hover:bg-primary/10 rounded"
                                                title="Lên lịch đăng"
                                                onClick={() => openScheduleModal(post._id)}
                                            >
                                                <Calendar size={14} />
                                            </button>
                                            <button
                                                className="p-1.5 hover:text-primary transition-colors hover:bg-primary/10 rounded"
                                                title="Đăng ngay"
                                                onClick={async () => {
                                                    const channelId = prompt('Nhập Discord Channel ID để đăng bài này ngay lập tức:');
                                                    if (!channelId) return;

                                                    const botId = prompt('Nhập Bot ID (Để trống nếu dùng bot mặc định của kênh):');

                                                    try {
                                                        await postsApi.publishNow({ postId: post._id, botId, channelId });
                                                        alert('✅ Bài viết đang được gửi đi!');
                                                    } catch (error) {
                                                        alert('❌ Lỗi: ' + (error.response?.data?.error || error.message));
                                                    }
                                                }}
                                            >
                                                <Send size={14} />
                                            </button>
                                            <button
                                                className="p-1.5 hover:text-primary transition-colors hover:bg-primary/10 rounded"
                                                title="Chỉnh sửa"
                                                onClick={() => handleEditPost(post)}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Schedule List */}
                            {activeTab === 'schedules' && schedules.map(schedule => (
                                <div key={schedule._id} className="bg-white/5 border border-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full animate-pulse",
                                            schedule.status === 'pending' ? "bg-yellow-500" :
                                                schedule.status === 'sent' ? "bg-green-500" : "bg-red-500"
                                        )} />
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                                                {schedule.status}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteSchedule(schedule._id)}
                                                className="text-muted hover:text-red-500 transition-colors p-1"
                                                title="Hủy lịch"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-1">{schedule.postId?.title}</h3>
                                    <p className="text-[11px] text-muted mb-4 italic">Bot: {schedule.botId?.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest">
                                        <Calendar size={12} />
                                        {new Date(schedule.scheduledAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}

                            {/* Scripts List */}
                            {activeTab === 'scripts' && scripts.map(script => (
                                <div key={script._id} className="group bg-white/5 border border-white/5 hover:border-primary/30 rounded-xl p-4 transition-all hover:translate-y-[-2px] relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <ScrollText size={16} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleRunScript(script._id)}
                                                className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded transition-all"
                                            >
                                                Run Sequence
                                            </button>
                                            <button className="text-muted hover:text-white transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-2">{script.name}</h3>
                                    <div className="flex flex-col gap-2 mb-4">
                                        <div className="text-[10px] text-muted flex items-center gap-2">
                                            <CheckCircle2 size={12} className="text-primary" />
                                            {script.steps?.length} Giai đoạn (Steps)
                                        </div>
                                        <div className="text-[10px] text-muted flex items-center gap-2">
                                            <Bot size={12} className="text-primary" />
                                            Phụ trách: {bots.find(b => b._id === script.botId)?.name || 'Hệ thống'}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                            Cập nhật {new Date(script.updatedAt).toLocaleDateString()}
                                        </span>
                                        <button className="p-1.5 hover:text-primary transition-colors hover:bg-primary/10 rounded">
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Posts;
