import React, { useState } from 'react';
import {
    Layers,
    Trash2,
    Search,
    Clock,
    MessageSquare,
    Zap,
    Shield,
    Database,
    History,
    RefreshCw,
    XCircle,
    CheckCircle2,
    Eye,
    Code
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const Memory = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChannel, setSelectedChannel] = useState(null);

    // Mock Data for Memory Store
    const memoryClusters = [
        {
            channelId: '123456789',
            channelName: 'general-chat',
            serverName: 'Alice Dev Hub',
            lastActive: '1 phút trước',
            messageCount: 14,
            status: 'active',
            messages: [
                { role: 'user', text: 'Chào Alice, bạn có khỏe không?', time: '10:05' },
                { role: 'model', text: 'Tôi luôn sẵn sàng hỗ trợ bạn! Bạn cần tôi giúp gì hôm nay?', time: '10:05' },
                { role: 'user', text: 'Hãy giải thích về cơ chế RAG của bạn.', time: '10:06' }
            ]
        },
        {
            channelId: '987654321',
            channelName: 'tech-support',
            serverName: 'Company XYZ',
            lastActive: '12 phút trước',
            messageCount: 8,
            status: 'expiring',
            messages: [
                { role: 'user', text: 'Làm sao để đổi mật khẩu?', time: '09:50' },
                { role: 'model', text: 'Bạn có thể vào cài đặt và chọn phần bảo mật...', time: '09:51' }
            ]
        },
        {
            channelId: '112233445',
            channelName: 'private-admin',
            serverName: 'Alice Dev Hub',
            lastActive: '45 phút trước',
            messageCount: 20,
            status: 'inactive',
            messages: []
        }
    ];

    const filteredClusters = memoryClusters.filter(c =>
        c.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.serverName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 font-jakarta text-white">
                        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            <Layers size={20} />
                        </div>
                        Memory Lab
                    </h2>
                    <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60">
                        Hệ thống Quản lý & Gỡ lỗi Ngữ cảnh AI
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm Channel..."
                            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[11px] outline-none focus:border-purple-500/30 transition-all w-64 shadow-lg text-white placeholder:text-muted/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Channel Memory List */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1 shrink-0">
                        <h3 className="text-[10px] font-black uppercase text-muted tracking-widest">Active Clusters</h3>
                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-muted font-bold border border-white/5">{filteredClusters.length} Total</span>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-2 scrollbar-thin">
                        {filteredClusters.map((cluster) => (
                            <motion.div
                                layout
                                key={cluster.channelId}
                                onClick={() => setSelectedChannel(cluster)}
                                className={clsx(
                                    "glass-card p-4 border transition-all cursor-pointer group relative overflow-hidden",
                                    selectedChannel?.channelId === cluster.channelId
                                        ? "border-purple-500/40 bg-purple-500/10 shadow-[0_8px_20px_rgba(168,85,247,0.1)]"
                                        : "border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2.5 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className={clsx(
                                            "w-1.5 h-1.5 rounded-full",
                                            cluster.status === 'active' ? 'bg-success shadow-[0_0_8px_rgba(0,255,209,0.5)]' :
                                                cluster.status === 'expiring' ? 'bg-yellow-400' : 'bg-muted'
                                        )} />
                                        <span className="text-[11px] font-black text-white/90">#{cluster.channelName}</span>
                                    </div>
                                    <span className="text-[8px] font-mono text-muted/60 bg-black/20 px-1.5 py-0.5 rounded">{cluster.lastActive}</span>
                                </div>
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[10px] text-muted truncate max-w-[100px] font-medium opacity-60">{cluster.serverName}</span>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/10">
                                        {cluster.messageCount} msgs
                                    </div>
                                </div>

                                {selectedChannel?.channelId === cluster.channelId && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"
                                    />
                                )}
                            </motion.div>
                        ))}

                        {filteredClusters.length === 0 && (
                            <div className="py-10 text-center opacity-20 italic text-xs">
                                No clusters found
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-1 space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedChannel ? (
                            <motion.div
                                key={selectedChannel.channelId}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="glass-card flex flex-col min-h-[550px] border border-white/5 overflow-hidden shadow-2xl"
                            >
                                {/* Inspector Header */}
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.03] backdrop-blur-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/10 shadow-inner">
                                            <Eye size={22} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-lg text-white">Memory Inspector</h3>
                                                <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold border border-success/10 uppercase tracking-tighter">Live Sync</span>
                                            </div>
                                            <p className="text-[10px] text-muted uppercase font-black tracking-[0.2em] mt-0.5 opacity-40">Cluster ID: {selectedChannel.channelId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="bg-red-500/5 hover:bg-red-500/10 text-red-500 p-2.5 rounded-xl border border-red-500/10 transition-all active:scale-95 group"
                                            title="Clear Context"
                                        >
                                            <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                                        </button>
                                        <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-muted hover:text-white hover:bg-white/10 transition-all">
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Inspector Content */}
                                <div className="flex-1 p-6 space-y-8 overflow-y-auto max-h-[480px] scrollbar-thin bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.03)_0%,transparent_50%)]">
                                    {/* Debug Metadata Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'TTL Status', val: '28:42 Left', icon: Clock, color: 'text-info', bg: 'bg-info/10' },
                                            { label: 'Similarity', val: '0.94 High', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                                            { label: 'Data Lock', val: 'Secured', icon: Shield, color: 'text-success', bg: 'bg-success/10' }
                                        ].map((meta, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4 group hover:border-white/10 transition-colors">
                                                <div className={clsx("p-2 rounded-xl", meta.bg, meta.color)}>
                                                    <meta.icon size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest">{meta.label}</p>
                                                    <p className="text-xs font-black text-white mt-0.5">{meta.val}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Message Stack */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 px-1">
                                            <History size={14} className="text-muted" />
                                            <h4 className="text-[10px] font-black uppercase text-muted tracking-[0.2em]">Context Stack Trace</h4>
                                        </div>

                                        <div className="space-y-3">
                                            {selectedChannel.messages.length > 0 ? (
                                                selectedChannel.messages.map((msg, i) => (
                                                    <div key={i} className={clsx(
                                                        "p-4 rounded-2xl border flex gap-4 transition-all group",
                                                        msg.role === 'user'
                                                            ? "bg-white/[0.02] border-white/5 hover:border-white/10"
                                                            : "bg-purple-500/5 border-purple-500/10 hover:border-purple-500/20"
                                                    )}>
                                                        <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
                                                            <div className={clsx(
                                                                "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-lg",
                                                                msg.role === 'user' ? "bg-white/10 text-white" : "bg-purple-600 text-white"
                                                            )}>
                                                                {msg.role === 'user' ? 'U' : 'A'}
                                                            </div>
                                                            <div className="w-px h-full bg-white/5 group-last:hidden" />
                                                        </div>
                                                        <div className="flex-1 space-y-1.5 pb-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className={clsx(
                                                                    "text-[9px] font-black uppercase tracking-wider",
                                                                    msg.role === 'user' ? "text-muted" : "text-purple-400"
                                                                )}>
                                                                    {msg.role === 'user' ? 'Client' : 'Brain Node'}
                                                                </span>
                                                                <span className="text-[9px] font-mono text-muted/30">{msg.time}</span>
                                                            </div>
                                                            <p className="text-xs text-white/80 leading-relaxed font-medium">{msg.text}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                                                    <History size={40} className="mx-auto mb-4" />
                                                    <h5 className="text-xs font-black uppercase tracking-widest">Stack Empty</h5>
                                                    <p className="text-[10px] mt-2 italic">Waiting for incoming channel data...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Console Bar Footer */}
                                <div className="p-4 bg-black/80 border-t border-white/5 flex items-center justify-between backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-muted">
                                            <Code size={12} />
                                        </div>
                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">Payload Inspector</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="text-[9px] font-black uppercase text-muted hover:text-white transition-colors">Export Logs</button>
                                        <button className="text-[9px] font-black uppercase text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/10">Copy Context</button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="glass-card h-[550px] flex flex-col items-center justify-center border border-white/5 border-dashed bg-white/[0.01] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.05)_0%,transparent_70%)] group-hover:opacity-100 opacity-50 transition-opacity" />
                                <div className="relative z-10 flex flex-col items-center text-center px-12">
                                    <div className="w-20 h-20 rounded-3xl bg-white/3 flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                                        <Layers size={40} className="text-muted/30" />
                                    </div>
                                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-white/50 mb-3">Initialize Memory Cluster</h3>
                                    <p className="text-[11px] text-muted/40 max-w-sm leading-relaxed font-medium">
                                        Vui lòng chọn một channel từ danh sách bên trái để bắt đầu phân tích cấu trúc bộ nhớ và ngữ cảnh hội thoại thời gian thực.
                                    </p>
                                    <div className="mt-8 flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success/20 animate-ping" />
                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">System Ready</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Similarity Debugger Panel (Fixed Overlap) */}
                    <div className="glass-card p-6 border border-white/5 bg-[linear-gradient(110deg,rgba(168,85,247,0.05),transparent)] shadow-xl relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <Database size={16} className="text-purple-400" />
                            <h3 className="font-black text-[13px] uppercase tracking-widest text-white/90 mb-2">Similarity Debugger</h3>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 relative z-10">
                            <div className="flex-1 relative min-w-0">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/60" />
                                <input
                                    type="text"
                                    placeholder="Kiểm tra mức độ kích hoạt bộ nhớ... "
                                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[11px] outline-none focus:border-purple-500/50 transition-all font-medium text-white shadow-inner truncate placeholder:text-muted/40"
                                />
                            </div>
                            <button className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap shrink-0 border border-purple-400/20">
                                Run Debug
                            </button>
                        </div>
                        <p className="text-[9px] text-muted/40 mt-4 leading-relaxed font-medium">
                            NOTICE: Công cụ này mô phỏng cơ chế tìm kiếm Vector để đánh giá mức độ hội tụ thông tin.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Memory;
