import React, { useState } from 'react';
import {
    Brain,
    BarChart3,
    TrendingUp,
    Zap,
    Target,
    ShieldCheck,
    Cpu,
    Database,
    ArrowUpRight,
    Search,
    Clock,
    Flame,
    Split,
    RefreshCw,
    Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const Insights = () => {
    const [activeView, setActiveView] = useState('overview');

    // Mock Data for Analytics
    const stats = [
        { label: 'Total Tokens', value: '1.2M', growth: '+12%', icon: Cpu, color: 'text-primary' },
        { label: 'Avg Accuracy', value: '94.2%', growth: '+2.1%', icon: Target, color: 'text-success' },
        { label: 'RAG Efficiency', value: '88ms', growth: '-15%', icon: Zap, color: 'text-info' },
        { label: 'Daily Requests', value: '4,512', growth: '+34%', icon: TrendingUp, color: 'text-purple-400' },
    ];

    const heatMapData = [
        { name: 'Policy v1', score: 98, access: '842 hits' },
        { name: 'Product Q&A', score: 85, access: '1.2k hits' },
        { name: 'Technical Docs', score: 92, access: '630 hits' },
        { name: 'Draft Archive', score: 32, access: '12 hits' },
        { name: 'HR Guidelines', score: 78, access: '420 hits' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 font-jakarta">
                        <div className="p-2.5 rounded-2xl bg-info/20 text-info border border-info/5">
                            <Brain size={24} />
                        </div>
                        Neural Insights
                    </h2>
                    <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60">
                        Phân tích chuyên sâu & Giám sát AI
                    </p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {['overview', 'rag', 'ab-testing'].map((view) => (
                        <button
                            key={view}
                            onClick={() => setActiveView(view)}
                            className={clsx(
                                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                activeView === view ? "bg-info text-white shadow-lg" : "text-muted hover:text-white"
                            )}
                        >
                            {view.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Overlays */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card p-6 border border-white/5 group hover:border-info/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-xl bg-white/5 text-muted group-hover:bg-info/10 group-hover:text-info transition-colors">
                                <stat.icon size={20} />
                            </div>
                            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5",
                                stat.growth.startsWith('+') ? 'text-success' : 'text-primary'
                            )}>
                                {stat.growth}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className="text-2xl font-black text-white">{stat.value}</h4>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* RAG Heatmap Item */}
                <div className="xl:col-span-2 glass-card p-6 border border-white/5 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Flame size={18} className="text-primary" /> RAG Knowledge Heatmap
                            </h3>
                            <p className="text-xs text-muted">Phân tích mức độ sử dụng & độ chính xác của các nguồn tri thức</p>
                        </div>
                        <button className="p-2 text-muted hover:text-white transition-colors">
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {heatMapData.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("w-2 h-2 rounded-full",
                                            item.score > 80 ? 'bg-success' : item.score > 50 ? 'bg-info' : 'bg-primary'
                                        )} />
                                        <span className="text-xs font-bold text-white/90">{item.name}</span>
                                        <span className="text-[9px] text-muted font-medium bg-white/5 px-2 py-0.5 rounded uppercase tracking-tighter">
                                            {item.access}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-muted">{item.score}% Confidence</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.score}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={clsx("h-full rounded-full",
                                            item.score > 80 ? 'bg-success' : item.score > 50 ? 'bg-info' : 'bg-primary'
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Cold Storage</p>
                            <p className="text-xl font-black text-white">40%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Hot Assets</p>
                            <p className="text-xl font-black text-success">12</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Stale Docs</p>
                            <p className="text-xl font-black text-primary">3</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Avg Score</p>
                            <p className="text-xl font-black text-info">88%</p>
                        </div>
                    </div>
                </div>

                {/* Prompt A/B Test Mini Lab */}
                <div className="xl:col-span-1 glass-card flex flex-col overflow-hidden border border-white/5 relative p-6 h-full">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="p-1 px-2 rounded bg-primary/20 text-primary text-[8px] font-bold uppercase tracking-widest border border-primary/20">
                            Live Experiment
                        </div>
                    </div>
                    <div className="p-8 pb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-1">
                            <Split size={18} className="text-purple-400" /> Prompt A/B Lab
                        </h3>
                        <p className="text-xs text-muted">So sánh hiệu suất giữa các Persona</p>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 relative">
                                <div className="text-[8px] font-black uppercase text-info mb-2 flex justify-between">
                                    <span>Version A (Alice v2)</span>
                                    <span>WINNING</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                                    <div className="h-full bg-info w-[68%]" />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-muted">Conversion:</span>
                                    <span className="text-white">68.4%</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 opacity-50">
                                <div className="text-[8px] font-black uppercase text-muted mb-2">Version B (Professional)</div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                                    <div className="h-full bg-muted w-[31%]" />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-muted">Conversion:</span>
                                    <span className="text-white">31.6%</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center gap-3">
                                <Target size={16} className="text-muted" />
                                <span className="text-[11px] font-medium text-white/70">Mục tiêu: Độ hài lòng (Rating)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-muted" />
                                <span className="text-[11px] font-medium text-white/70">Thời gian: 14 ngày còn lại</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Neural Safety Guard */}
                <div className="xl:col-span-1 glass-card flex flex-col border border-white/5 bg-gradient-to-br from-primary/5 to-transparent p-6 h-full">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-1">
                            <ShieldCheck size={18} className="text-success" /> Neural Safety
                        </h3>
                        <p className="text-xs text-muted">Giám sát an toàn & Bộ lọc nội dung</p>

                        <div className="mt-8 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Blocked Prompts</p>
                                    <p className="text-2xl font-black text-primary">0</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                                    <ShieldCheck size={24} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-muted uppercase tracking-widest px-1">Active Guardrails</p>
                                {[
                                    { name: 'Hate Speech Filter', status: 'Active' },
                                    { name: 'PII Protection', status: 'Active' },
                                    { name: 'Competitor Mention', status: 'Monitoring' },
                                ].map((g, i) => (
                                    <div key={i} className="flex items-center justify-between text-[10px] font-bold px-1">
                                        <span className="text-white/60">{g.name}</span>
                                        <span className={clsx(g.status === 'Active' ? 'text-success' : 'text-info')}>
                                            {g.status}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-tighter italic animate-pulse">
                                    <Activity size={10} /> Live Monitoring Active
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Token Analytics & Cost Breakdown */}
            <div className="glass-card p-6 border border-white/5 bg-[radial-gradient(circle_at_top_right,rgba(0,209,255,0.05)_0%,transparent_50%)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <BarChart3 size={20} className="text-info" /> Token Analytics
                        </h3>
                        <p className="text-[10px] text-muted mb-0">Theo dõi chi phí vận hành API Gemini</p>
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
                        <span className="text-[10px] font-bold text-muted uppercase">Estimated Monthly Cost:</span>
                        <span className="text-lg font-black text-white">$4.12</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted px-1">
                            <span>Token Consumption</span>
                            <span>82% of quota</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                            <div className="h-full bg-gradient-to-r from-info to-primary rounded-full" style={{ width: '82%' }} />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono opacity-50">
                            <span>0</span>
                            <span>1.5M Tokens</span>
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Prompt Tokens', val: '840k' },
                            { label: 'Completion Tokens', val: '360k' },
                            { label: 'Avg / Request', val: '450' },
                            { label: 'Saved (Cache)', val: '120k' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1">{item.label}</p>
                                <p className="text-lg font-black text-white/90">{item.val}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Insights;
