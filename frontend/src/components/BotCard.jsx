import React, { useState } from 'react';
import {
    Bot,
    Edit,
    Power,
    RefreshCw,
    Cpu,
    Activity,
    Shield,
    Zap,
    Database,
    Globe,
    Server,
    MessageSquare,
    Clock,
    Layers,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const BotCard = ({ bot, onEdit, onToggle, onSync }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Simulated/Calculated Metrics
    const intelligenceScore = bot.ragMode === 'hybrid' ? 95 : (bot.ragMode === 'isolated' ? 82 : 75);
    const speedLabel = bot.modelName.includes('flash') ? 'Ultra' : 'Fast';
    const activeChannels = bot.activeChannels || 0;
    const createdAtDate = new Date(bot.createdAt || Date.now());
    const uptimeDays = Math.floor((Date.now() - createdAtDate) / (1000 * 60 * 60 * 24)) || 1;

    const handleSync = async (e) => {
        e.stopPropagation();
        setIsSyncing(true);
        try {
            await onSync(bot);
        } catch (err) {
            console.error('Sync error:', err);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="electric-border-container group h-fit">
            {/* Electric Border Background */}
            <div className={clsx(
                bot.isActive ? "electric-border-success" : "bg-white/5 absolute inset-0 transition-all group-hover:bg-white/10"
            )} />

            {/* Content Card */}
            <div className="electric-border-content p-5 flex flex-col bg-surface-glass border border-white/5 transition-all group-hover:border-white/10 overflow-hidden relative backdrop-blur-sm">

                {/* Immersive Blurred Avatar Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[15px]">
                    {bot.avatarUrl ? (
                        <img
                            src={bot.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover scale-110 blur-xl saturate-150 opacity-[0.08]"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-surface to-success/10 blur-3xl opacity-30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/90 to-surface" />
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col space-y-5">

                    {/* Header: Identity & Pulse Status */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className={clsx(
                                    "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md transition-all duration-500",
                                    bot.isActive ? "border-success/30 shadow-[0_0_20px_rgba(0,255,209,0.15)]" : "grayscale opacity-80"
                                )}>
                                    {bot.avatarUrl ? (
                                        <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Bot size={24} className={bot.isActive ? "text-success" : "text-muted"} />
                                    )}
                                </div>
                                {bot.isActive && (
                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-background rounded-full flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,209,0.6)]" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-black text-base tracking-tight leading-tight">{bot.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-muted font-black uppercase tracking-widest">{bot.discordName || "NOT_SYNCED"}</span>
                                    <button
                                        onClick={handleSync}
                                        disabled={isSyncing}
                                        className={clsx(
                                            "text-muted hover:text-primary transition-all p-0.5",
                                            isSyncing && "animate-spin text-primary"
                                        )}
                                    >
                                        <RefreshCw size={8} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className={clsx(
                                "px-2 py-0.5 rounded-md text-[8px] font-black tracking-[0.2em] border uppercase transition-all",
                                bot.isActive
                                    ? "bg-success/10 text-success border-success/30 shadow-[0_0_10px_rgba(0,255,209,0.1)]"
                                    : "bg-white/5 text-muted border-white/10"
                            )}>
                                {bot.isActive ? "Live" : "Idle"}
                            </div>
                        </div>
                    </div>

                    {/* Technical Spec Grid (Always Visible) */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5 flex items-center gap-2.5 group/spec hover:bg-white/[0.04] transition-colors">
                            <Cpu size={14} className="text-primary/70 group-hover/spec:text-primary transition-colors" />
                            <div className="min-w-0">
                                <p className="text-[8px] uppercase tracking-tighter text-muted font-bold">Engine</p>
                                <p className="text-[10px] font-black text-white/90 truncate capitalize">{bot.modelName.split('-').slice(0, 3).join(' ')}</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5 flex items-center gap-2.5 group/spec hover:bg-white/[0.04] transition-colors">
                            <Layers size={14} className="text-info/70 group-hover/spec:text-info transition-colors" />
                            <div className="min-w-0">
                                <p className="text-[8px] uppercase tracking-tighter text-muted font-bold">Context</p>
                                <p className="text-[10px] font-black text-white/90 truncate capitalize">{bot.ragMode} RAG</p>
                            </div>
                        </div>
                    </div>

                    {/* Expandable Section */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="overflow-hidden space-y-5"
                            >
                                {/* Capability Snap Badges */}
                                <div className="flex flex-wrap gap-1.5 border-t border-white/5 pt-4">
                                    {[
                                        { icon: Database, bg: 'bg-blue-500/10', text: 'Vector-Core', color: 'text-blue-400' },
                                        { icon: Globe, bg: 'bg-indigo-500/10', text: 'Multi-Lingual', color: 'text-indigo-400' },
                                        { icon: Activity, bg: 'bg-emerald-500/10', text: 'Real-time', color: 'text-emerald-400' }
                                    ].map((badge, idx) => (
                                        <div key={idx} className={clsx("flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/5", badge.bg)}>
                                            <badge.icon size={8} className={badge.color} />
                                            <span className={clsx("text-[8px] font-black uppercase tracking-wider", badge.color)}>{badge.text}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Performance Metrics Bar */}
                                <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center overflow-hidden relative group/metrics">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover/metrics:translate-x-full transition-transform duration-1000" />

                                    <div className="text-center flex-1">
                                        <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">Reach</p>
                                        <div className="flex items-center justify-center gap-1">
                                            <Server size={10} className="text-primary/50" />
                                            <span className="text-xs font-black text-white">{activeChannels}</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-6 bg-white/5" />
                                    <div className="text-center flex-1">
                                        <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">Cycle</p>
                                        <div className="flex items-center justify-center gap-1">
                                            <Clock size={10} className="text-success/50" />
                                            <span className="text-xs font-black text-white">{uptimeDays}d</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-6 bg-white/5" />
                                    <div className="text-center flex-1">
                                        <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">Intel</p>
                                        <div className="flex items-center justify-center gap-1">
                                            <Zap size={10} className="text-yellow-500/50" />
                                            <span className="text-xs font-black text-white">{intelligenceScore}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* System Personality Preview */}
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-primary" /> Core protocol
                                    </p>
                                    <p className="text-[11px] text-muted/80 leading-relaxed italic font-medium bg-white/[0.01] border border-white/[0.03] p-3 rounded-lg border-l-2 border-l-primary/40">
                                        "{bot.systemInstruction || "Default Alice protocol active. Systems nominal..."}"
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Fancy Expansion Trigger Bar - Integrated at the bottom */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="group/expand relative w-full py-1.5 flex flex-col items-center gap-1 transition-all duration-300 rounded-lg hover:bg-white/[0.02]"
                    >
                        <div className="flex items-center gap-3 relative z-10 w-full justify-center">
                            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-[7px] font-black text-muted group-hover/expand:text-primary transition-colors tracking-[0.2em] uppercase">
                                    {isExpanded ? "Seal Core" : "Access Intelligence"}
                                </span>
                                <motion.div
                                    animate={{
                                        y: isExpanded ? -1 : 1,
                                        rotate: isExpanded ? 180 : 0
                                    }}
                                    transition={{
                                        y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                                        rotate: { type: "spring", stiffness: 300, damping: 20 }
                                    }}
                                    className="text-primary/40 group-hover/expand:text-primary transition-colors"
                                >
                                    <ChevronDown size={10} />
                                </motion.div>
                            </div>
                            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/10" />
                        </div>
                    </button>

                    {/* Actions: Always Visible */}
                    <div className="flex gap-2.5 pt-1 border-t border-white/5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(bot);
                            }}
                            className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 group/btn"
                        >
                            <Edit size={12} className="text-muted group-hover/btn:text-white transition-colors" />
                            <span>Config</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle(bot);
                            }}
                            className={clsx(
                                "w-14 h-11 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 border",
                                bot.isActive
                                    ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                    : "bg-success/10 border-success/20 text-success hover:bg-success/20 shadow-[0_0_15px_rgba(0,255,209,0.1)]"
                            )}
                        >
                            <Power size={18} className={clsx(bot.isActive ? "animate-pulse" : "")} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BotCard;
