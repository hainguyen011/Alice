import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    ChevronRight,
    Target,
    Terminal,
    Trophy
} from 'lucide-react';
import { clsx } from 'clsx';

const Home = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const stats = [
        { label: 'Bots Đang Chạy', value: '12', icon: Bot, color: 'from-red-600 to-red-900', secondary: 'FF-NODE-A1' },
        { label: 'Tin Nhắn / 24h', value: '2.4K', icon: MessageSquare, color: 'from-red-600 to-red-900', secondary: 'MS-BUFF-X2' },
        { label: 'Máy Chủ Kết Nối', value: '08', icon: Server, color: 'from-red-600 to-red-900', secondary: 'SRV-GRID-L5' }
    ];

    const quickActions = [
        {
            label: 'Khởi Chạy Hội Thoại',
            description: 'Kết nối trực tiếp tới lõi AI',
            icon: MessageSquare,
            gradient: 'from-red-600/20 to-transparent',
            action: 'conversations'
        },
        {
            label: 'Quản Lý Đặc Vụ',
            description: 'Cấu hình và triển khai Bot',
            icon: Bot,
            gradient: 'from-red-600/20 to-transparent',
            action: 'bots'
        },
        {
            label: 'Cơ Sở Dữ Liệu',
            description: 'Huấn luyện AI chuyên sâu',
            icon: Brain,
            gradient: 'from-red-600/20 to-transparent',
            action: 'knowledge'
        }
    ];

    return (
        <div className="space-y-10 pb-20 relative">
            {/* HERO SECTION: CORE COMMAND */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative min-h-[400px] rounded-2xl border border-white/5 bg-[#08080c] overflow-hidden group shadow-2xl"
            >
                {/* HUD Elements Overlay */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
                    <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-red-600/30" />
                    <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-red-600/30" />
                    <div className="absolute top-1/2 right-10 -translate-y-1/2 flex flex-col gap-6 opacity-20">
                        {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-8 bg-white" />)}
                    </div>
                </div>

                {/* Animated Grid & Scanlines */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute inset-0 bg-scanlines" />
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,0,0,0.15) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row h-full">
                    <div className="flex-1 p-12 lg:p-16 space-y-8 flex flex-col justify-center">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-3"
                        >
                            <div className="px-3 py-1 bg-red-600/10 border border-red-600/30 rounded text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">
                                ALICE.CORE.INFRASTRUCTURE
                            </div>
                            <div className="h-[1px] w-20 bg-red-600/20" />
                        </motion.div>

                        <div className="space-y-4">
                            <h1 className="text-7xl font-black italic tracking-tighter leading-none">
                                <span className="block text-white glow-text-white">COMMAND</span>
                                <span className="block text-transparent stroke-text-red">CENTER</span>
                            </h1>
                            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-sm max-w-xl leading-relaxed border-l-4 border-red-600 pl-6 py-2 bg-gradient-to-r from-red-600/5 to-transparent">
                                Quản lý trí tuệ nhân tạo thế hệ mới. Toàn quyền kiểm soát hệ thống đặc vụ và cơ sở dữ liệu tri thức LS.
                            </p>
                        </div>

                        <div className="flex items-center gap-6 pt-4">
                            <button className="h-14 px-10 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-[0.3em] rounded flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(255,0,0,0.2)] active:scale-95">
                                <Terminal size={18} /> INITIALIZE BOOT
                            </button>
                            <button className="h-14 px-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-[0.3em] rounded flex items-center gap-3 transition-all active:scale-95">
                                <Activity size={18} /> NETWORK STATUS
                            </button>
                        </div>
                    </div>

                    <div className="w-full lg:w-[450px] bg-black/40 border-l border-white/5 p-12 flex flex-col justify-between backdrop-blur-md">
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">System Real-Time</div>
                                <div className="text-5xl font-black font-mono text-white glow-text-white tracking-widest">
                                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                                </div>
                                <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                                    {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-10 border-t border-white/5">
                                {[
                                    { label: 'Uptime', val: '99.98%', icon: Zap },
                                    { label: 'Auth', val: 'Secure', icon: Shield },
                                    { label: 'Grid', val: 'Active', icon: Globe },
                                    { label: 'Latency', val: '14ms', icon: Cpu }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                                            <item.icon size={12} className="text-red-600" /> {item.label}
                                        </div>
                                        <div className="text-xs font-black text-white">{item.val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-10 flex items-center justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
                            <span>COORD: 34.05° N</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-1 h-3 bg-red-600/30" />)}
                            </div>
                            <span>LS-DASH-X0</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* KEY METRICS: LIQUID NEON CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.5 }}
                        className="relative p-[1px] overflow-hidden rounded-xl group"
                    >
                        {/* Static Liquid Border effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent group-hover:from-red-600 transition-all duration-700" />

                        <div className="relative bg-[#0d0d15] p-8 rounded-xl h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-red-600/10 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                                    <stat.icon size={28} />
                                </div>
                                <div className="text-[10px] font-black font-mono text-white/20 tracking-widest">{stat.secondary}</div>
                            </div>
                            <div className="mt-8 space-y-1">
                                <div className="text-5xl font-black text-white tracking-tighter">{stat.value}</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">{stat.label}</div>
                            </div>
                            {/* HUD Brackets - Card */}
                            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/5" />
                            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/5" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* QUICK PROTOCOLS */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-[2px] w-12 bg-red-600" />
                    <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white italic">Protocol Initialization</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {quickActions.map((action, i) => (
                        <button
                            key={i}
                            className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#08080c] p-10 text-left hover:border-red-600/30 transition-all active:scale-[0.98]"
                        >
                            <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700", action.gradient)} />

                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="p-4 bg-white/5 rounded-xl text-white group-hover:bg-red-600 group-hover:shadow-[0_0_20px_rgba(255,0,0,0.3)] transition-all">
                                        <action.icon size={32} />
                                    </div>
                                    <ChevronRight size={24} className="text-white/10 group-hover:text-red-600 group-hover:translate-x-2 transition-all" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">{action.label}</h4>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">{action.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-scanlines {
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
                    background-size: 100% 2px, 3px 100%;
                }
                .stroke-text-red {
                    -webkit-text-stroke: 1.5px rgba(255, 0, 0, 0.4);
                }
                .glow-text-white {
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                }
            `}} />
        </div>
    );
};

export default Home;

