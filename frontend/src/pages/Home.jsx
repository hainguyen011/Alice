import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    MessageSquare,
    Brain,
    Zap,
    TrendingUp,
    Users,
    Database,
    Activity,
    ArrowRight,
    Bot,
    Server,
    BookOpen,
    Play,
    Shield,
    Cpu,
    Globe,
    ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

const Home = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const stats = [
        { label: 'Active Bots', value: '12', icon: Bot, color: 'from-purple-500 to-pink-500', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]' },
        { label: 'Messages Today', value: '2.4K', icon: MessageSquare, color: 'from-cyan-500 to-blue-500', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.5)]' },
        { label: 'Servers', value: '8', icon: Server, color: 'from-orange-500 to-red-500', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.5)]' }
    ];

    const quickActions = [
        {
            label: 'Start Conversation',
            description: 'Chat with AI bots',
            icon: MessageSquare,
            color: 'from-purple-600 to-pink-600',
            iconBg: 'bg-purple-500/20',
            action: 'conversations'
        },
        {
            label: 'Manage Bots',
            description: 'Create & configure',
            icon: Bot,
            color: 'from-cyan-600 to-blue-600',
            iconBg: 'bg-cyan-500/20',
            action: 'bots'
        },
        {
            label: 'Knowledge Base',
            description: 'Upload & organize',
            icon: Brain,
            color: 'from-orange-600 to-red-600',
            iconBg: 'bg-orange-500/20',
            action: 'knowledge'
        }
    ];

    const systemStatus = [
        { label: 'API Status', status: 'Online', color: 'text-green-400', dot: 'bg-green-400' },
        { label: 'Database', status: 'Connected', color: 'text-cyan-400', dot: 'bg-cyan-400' },
        { label: 'AI Engine', status: 'Active', color: 'text-purple-400', dot: 'bg-purple-400' }
    ];

    return (
        <div className="min-h-full relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 space-y-8 pb-20">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/30 via-black/40 to-cyan-900/30 backdrop-blur-xl">
                    {/* Cyberpunk Grid Background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
                            backgroundSize: '50px 50px'
                        }} />
                    </div>

                    <div className="relative z-10 p-12">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            {/* Left Content */}
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 backdrop-blur-sm">
                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                                    <span className="text-xs font-black uppercase tracking-wider text-purple-300">System Online</span>
                                </div>

                                <div>
                                    <h1 className="text-6xl font-black tracking-tight mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                        VIBE CITY
                                    </h1>
                                    <h2 className="text-3xl font-bold text-white/90 mb-4">
                                        AI-Powered Discord Bot Platform
                                    </h2>
                                    <p className="text-lg text-white/60 max-w-2xl leading-relaxed">
                                        Experience the next generation of Discord automation. Deploy intelligent bots,
                                        manage conversations, and harness the power of AI across your servers.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-8 py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] active:scale-95">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        <div className="relative flex items-center gap-2">
                                            <Play size={20} fill="currentColor" />
                                            <span className="text-sm uppercase tracking-wider">Get Started</span>
                                        </div>
                                    </button>
                                    <button className="group bg-white/5 hover:bg-white/10 border border-white/20 text-white font-black px-8 py-4 rounded-xl transition-all backdrop-blur-sm active:scale-95">
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={20} />
                                            <span className="text-sm uppercase tracking-wider">Learn More</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Right Stats Panel */}
                            <div className="flex-shrink-0 space-y-4">
                                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 min-w-[280px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-black uppercase tracking-wider text-white/50">System Time</span>
                                        <Globe size={16} className="text-cyan-400" />
                                    </div>
                                    <div className="text-3xl font-black font-mono text-cyan-400 mb-1">
                                        {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                                    </div>
                                    <div className="text-xs text-white/40 font-medium">
                                        {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {systemStatus.map((item, i) => (
                                        <div key={i} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-center">
                                            <div className={clsx("w-2 h-2 rounded-full mx-auto mb-2 animate-pulse", item.dot)} />
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1">{item.label}</div>
                                            <div className={clsx("text-xs font-black", item.color)}>{item.status}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 hover:border-white/20 transition-all"
                        >
                            <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity", stat.color)} />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={clsx("p-3 rounded-xl bg-gradient-to-br", stat.color, stat.glow)}>
                                        <stat.icon size={24} className="text-white" />
                                    </div>
                                    <TrendingUp size={20} className="text-green-400" />
                                </div>
                                <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-white/50">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-wider text-white flex items-center gap-3">
                            <Zap size={24} className="text-yellow-400" />
                            Quick Actions
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 text-left hover:border-white/20 transition-all active:scale-[0.98]"
                            >
                                <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity", action.color)} />

                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className={clsx("p-3 rounded-xl", action.iconBg)}>
                                            <action.icon size={28} className="text-white" />
                                        </div>
                                        <ChevronRight size={24} className="text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white mb-1">{action.label}</h4>
                                        <p className="text-sm text-white/50 font-medium">{action.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* System Health */}
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-green-500/20">
                            <Shield size={24} className="text-green-400" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-wider text-white">System Performance</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'CPU Usage', value: '24%', max: 100, current: 24, color: 'from-cyan-500 to-blue-500' },
                            { label: 'Memory', value: '2.1GB / 8GB', max: 100, current: 26, color: 'from-purple-500 to-pink-500' },
                            { label: 'Network', value: '145 MB/s', max: 100, current: 58, color: 'from-orange-500 to-red-500' }
                        ].map((metric, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold uppercase tracking-wider text-white/70">{metric.label}</span>
                                    <span className="text-sm font-black text-white">{metric.value}</span>
                                </div>
                                <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={clsx("absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-1000", metric.color)}
                                        style={{ width: `${metric.current}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between text-xs text-white/30 font-medium">
                    <div className="flex items-center gap-2">
                        <Cpu size={14} />
                        <span>Powered by Alice AI Engine v2.0</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Uptime: 99.9%</span>
                        <span>•</span>
                        <span>Last Update: Just now</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
