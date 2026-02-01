import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { guildsApi, botsApi, channelsApi } from '../services/api';
import {
    Server,
    Plus,
    Search,
    RefreshCw,
    Trash2,
    CheckCircle2,
    ChevronRight,
    LayoutGrid,
    Bot as BotIcon,
    AlertCircle,
    Loader2,
    Settings,
    ShieldCheck,
    Hash,
    MoreVertical
} from 'lucide-react';
import { clsx } from 'clsx';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

const Servers = () => {
    const [guilds, setGuilds] = useState([]);
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // UI States
    const [activeGuild, setActiveGuild] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [discordChannels, setDiscordChannels] = useState([]);

    // Form States
    const [newGuildData, setNewGuildData] = useState({
        guildId: '',
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [gRes, bRes] = await Promise.all([
                guildsApi.getAll(),
                botsApi.getAll()
            ]);
            setGuilds(gRes.data);
            setBots(bRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGuild = async (e) => {
        e.preventDefault();
        try {
            setScanning(true);
            const { data } = await guildsApi.create({
                guildId: newGuildData.guildId.trim(),
                description: newGuildData.description
            });
            setGuilds(prev => [...prev, data]);
            setIsAdding(false);
            setNewGuildData({ guildId: '', description: '' });
            setActiveGuild(data);
            handleScanChannels(data);
        } catch (err) {
            alert(`Lỗi: ${err.response?.data?.error || err.message}`);
        } finally {
            setScanning(false);
        }
    };

    const handleScanChannels = async (guild) => {
        try {
            setScanning(true);
            const { data } = await guildsApi.getDiscordChannels(guild.guildId);

            // Get already saved channels for this guild
            const savedChannels = await channelsApi.getAll();
            const guildSavedChannels = savedChannels.data.filter(c => c.guildId === guild.guildId);

            const processed = data.channels.map(ch => {
                const saved = guildSavedChannels.find(s => s.channelId === ch.id);
                return {
                    channelId: ch.id,
                    name: ch.name,
                    botId: saved?.botId?._id || saved?.botId || '',
                    isSaved: !!saved,
                    _dbId: saved?._id
                };
            });

            setDiscordChannels(processed);
        } catch (err) {
            alert(`Lỗi quét kênh: ${err.response?.data?.error || err.message}`);
        } finally {
            setScanning(false);
        }
    };

    const handleToggleChannel = async (guild, ch) => {
        try {
            const channelsToSync = [{
                channelId: ch.channelId,
                name: ch.name,
                botId: ch.botId || null
            }];
            await guildsApi.syncChannels(guild.guildId, channelsToSync);
            handleScanChannels(guild);
        } catch (err) {
            alert(`Lỗi đồng bộ: ${err.message}`);
        }
    };

    const handleDeleteGuild = async (id) => {
        if (!confirm('Xóa Server này? (Các kênh đã gán bot vẫn sẽ được giữ lại trong DB)')) return;
        try {
            await guildsApi.delete(id);
            setGuilds(prev => prev.filter(g => g._id !== id));
            if (activeGuild?._id === id) {
                setActiveGuild(null);
                setDiscordChannels([]);
            }
        } catch (err) {
            alert(`Lỗi xóa: ${err.message}`);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="h-[calc(100vh-140px)] flex flex-col gap-6"
        >
            {/* Header Section */}
            <header className="flex justify-between items-center bg-surface-glass/30 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Server size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-white">Quản lý Server</h1>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Kết nối & Cấu hình Discord Guilds</p>
                    </div>
                </div>
                <button onClick={() => setIsAdding(true)} className="btn-primary group">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Thêm Server Mới</span>
                </button>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden" style={{ maxHeight: '71vh' }}>
                {/* Left Sidebar: Guild List */}
                <motion.div
                    variants={itemVariants}
                    className="w-80 glass-card flex flex-col overflow-hidden shadow-2xl bg-surface/40"
                >
                    <div className="p-4 border-b border-white/5">
                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm server..."
                                className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:border-primary/50 transition-all font-medium"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin p-3 space-y-2">
                        {loading ? (
                            <div className="py-20 text-center space-y-4 opacity-50">
                                <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                                <p className="text-[10px] uppercase font-black tracking-widest text-muted">Đang tải danh sách...</p>
                            </div>
                        ) : guilds.length === 0 ? (
                            <div className="py-20 text-center px-6">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-20">
                                    <AlertCircle size={24} />
                                </div>
                                <p className="text-xs text-muted font-medium leading-relaxed italic">Chưa có server nào được kết nối.</p>
                            </div>
                        ) : (
                            guilds.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map((guild) => (
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    key={guild._id}
                                    onClick={() => {
                                        setActiveGuild(guild);
                                        handleScanChannels(guild);
                                    }}
                                    className={clsx(
                                        "p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 relative group",
                                        activeGuild?._id === guild._id
                                            ? "bg-primary/10 border-primary/30 shadow-primary-soft"
                                            : "bg-white/[0.02] border-border hover:bg-white/[0.05] hover:border-white/10"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                        activeGuild?._id === guild._id ? "bg-primary text-white" : "bg-white/5 text-muted group-hover:bg-white/10 group-hover:text-white"
                                    )}>
                                        <Server size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-[12px] font-bold truncate text-white/90">{guild.name}</h4>
                                        <p className="text-[9px] text-muted truncate font-mono opacity-40">ID: {guild.guildId}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteGuild(guild._id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-red-500 transition-all hover:bg-red-500/10 rounded-lg"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        <ChevronRight size={14} className={clsx(
                                            "transition-all",
                                            activeGuild?._id === guild._id ? "text-primary translate-x-1" : "text-muted/20 opacity-0 group-hover:opacity-100"
                                        )} />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Right Area: Channel Grid */}
                <motion.div
                    variants={itemVariants}
                    className="flex-1 glass-card flex flex-col overflow-hidden shadow-2xl border border-white/5 bg-surface/30"
                >
                    {activeGuild ? (
                        <>
                            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface/50 z-20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                        <Server size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black tracking-tight text-white">{activeGuild.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[9px] text-muted font-bold font-mono px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                                                ID: {activeGuild.guildId}
                                            </span>
                                            <span className="text-[9px] text-success font-black uppercase tracking-tighter flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                                Connected
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleScanChannels(activeGuild)}
                                        className="btn-outline py-2 px-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group"
                                    >
                                        <RefreshCw size={14} className={clsx("transition-transform duration-700", scanning ? 'animate-spin' : 'group-hover:rotate-180')} />
                                        Quét Lại Kênh
                                    </button>
                                    <button className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center text-muted hover:text-white hover:bg-white/5 transition-all">
                                        <Settings size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                                {scanning ? (
                                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                                            <Server size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/50" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Đang đồng bộ Kênh</p>
                                            <p className="text-[10px] text-muted mt-2 font-medium opacity-60">Vui lòng đợi trong giây lát...</p>
                                        </div>
                                    </div>
                                ) : discordChannels.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-20">
                                        <Hash size={48} className="mb-6 opacity-20" />
                                        <p className="text-sm font-bold text-white/50">Không tìm thấy kênh văn bản nào.</p>
                                        <p className="text-[10px] mt-2 italic max-w-xs">Hãy đảm bảo Bot có quyền Xem Kênh trong server này.</p>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial="hidden"
                                        animate="visible"
                                        variants={{
                                            visible: { transition: { staggerChildren: 0.05 } }
                                        }}
                                        className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6"
                                    >
                                        {discordChannels.map((ch) => (
                                            <motion.div
                                                variants={itemVariants}
                                                key={ch.channelId}
                                                className={clsx(
                                                    "rounded-2xl border transition-all flex flex-col gap-4 group relative overflow-hidden",
                                                    ch.isSaved
                                                        ? "bg-success/[0.03] border-success/30"
                                                        : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
                                                )}
                                            >
                                                {ch.isSaved && (
                                                    <div className="absolute top-0 right-0 p-2">
                                                        <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center">
                                                            <CheckCircle2 size={12} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="p-5 pb-0 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Hash size={16} className={ch.isSaved ? 'text-success' : 'text-muted/50'} />
                                                        <h5 className="text-[13px] font-black tracking-tight">{ch.name}</h5>
                                                    </div>
                                                    <p className="text-[9px] font-mono text-muted/30">ID: {ch.channelId}</p>
                                                </div>

                                                <div className="px-5 pb-5 space-y-5">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.1em] text-muted/60 flex items-center gap-2">
                                                            <BotIcon size={12} /> Chỉ Định Bot (Persona)
                                                        </label>
                                                        <select
                                                            className="w-full bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-background/80"
                                                            value={ch.botId}
                                                            onChange={(e) => {
                                                                const newChannels = discordChannels.map(d =>
                                                                    d.channelId === ch.channelId ? { ...d, botId: e.target.value } : d
                                                                );
                                                                setDiscordChannels(newChannels);
                                                            }}
                                                        >
                                                            <option value="">Không gán Bot</option>
                                                            {bots.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                                        </select>
                                                    </div>

                                                    <button
                                                        onClick={() => handleToggleChannel(activeGuild, ch)}
                                                        className={clsx(
                                                            "w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border",
                                                            ch.isSaved
                                                                ? "bg-transparent text-success border-success/30 hover:bg-success/5"
                                                                : "bg-primary text-white border-primary/20"
                                                        )}
                                                    >
                                                        {ch.isSaved ? "Cập nhật cấu hình" : "Kích hoạt kênh"}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted p-12 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="w-24 h-24 rounded-[2.5rem] bg-white/[0.03] flex items-center justify-center mb-10 border border-white/5 shadow-2xl overflow-hidden relative group"
                            >
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <LayoutGrid size={40} className="relative z-10 opacity-20 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12" />
                            </motion.div>
                            <h3 className="text-base font-black tracking-[0.4em] uppercase opacity-20 text-center animate-pulse">Chọn một Server</h3>
                            <p className="text-[11px] font-bold opacity-30 mt-5 max-w-[280px] text-center leading-relaxed italic">
                                Hãy chọn một Discord Server từ danh sách bên trái để bắt đầu quản lý các kênh và phân quyền Bot AI của bạn.
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Add Guild Modal: AnimatePresence for smooth entry/exit */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAdding(false)}
                            className="absolute inset-0 bg-background/90"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-surface border border-white/10 w-full max-w-md rounded-3xl overflow-hidden relative z-10"
                        >
                            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-primary">Kết nối Server</h2>
                                    <p className="text-[10px] text-muted font-bold mt-1">Sử dụng ID để kết nối Guild của bạn</p>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-muted hover:text-white hover:bg-white/10 transition-all">
                                    <Trash2 size={16} className="rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={handleAddGuild} className="p-8 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Discord Guild ID</label>
                                    <div className="relative group">
                                        <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            className="w-full bg-background/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                            placeholder="1417747255804428341"
                                            value={newGuildData.guildId}
                                            onChange={e => setNewGuildData({ ...newGuildData, guildId: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted/40 font-medium italic ml-1">
                                        * Bot Alice phải là thành viên của Server này trước khi kết nối.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Hủy Bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={scanning}
                                        className="flex-[2] btn-primary py-4 text-xs tracking-widest"
                                    >
                                        {scanning ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Đang Kiểm Tra...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck size={18} />
                                                <span>Kết Nối & Quét</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Servers;
