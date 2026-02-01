import React, { useState, useEffect } from 'react';
import { knowledgeApi, botsApi, conversationsApi } from '../services/api';
import {
    Activity,
    Database,
    Bot as BotIcon,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Clock,
    ArrowUpRight,
    Plus,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';

const Dashboard = () => {
    const [stats, setStats] = useState({
        knowledgeCount: 0,
        botCount: 0,
        conversationCount: 0,
        activeBots: 0
    });
    const [recentEvents, setRecentEvents] = useState([
        { id: 1, type: 'knowledge', title: 'New Knowledge Added', desc: 'Manual entry: "Company Policy"', time: '2 mins ago' },
        { id: 2, type: 'bot', title: 'Bot Started', desc: 'Alice Assistant 01 is now online', time: '15 mins ago' },
        { id: 3, type: 'chat', title: 'Discord Sync', desc: 'Synchronized 42 new messages', time: '1 hour ago' },
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kRes, bRes, cRes] = await Promise.all([
                    knowledgeApi.getAll(),
                    botsApi.getAll(),
                    conversationsApi.getAll()
                ]);

                setStats({
                    knowledgeCount: kRes.data.length,
                    botCount: bRes.data.length,
                    activeBots: bRes.data.filter(b => b.isActive).length,
                    conversationCount: cRes.data.length
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Welcome & Quick Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight mb-1">System Overview</h2>
                    <p className="text-muted text-sm font-medium">Chào mừng trở lại, đây là tình trạng hiện tại của Alice AI.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-outline flex items-center gap-2 py-2 px-4 text-xs font-bold">
                        <Zap size={14} className="text-yellow-500" /> System Report
                    </button>
                    <button className="btn-primary flex items-center gap-2 py-2 px-4 text-xs font-bold">
                        <Plus size={14} /> Add Resource
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active Bots', value: stats.activeBots, total: stats.botCount, icon: BotIcon, color: 'text-success', bg: 'bg-success/10' },
                    { label: 'Knowledge Base', value: stats.knowledgeCount, suffix: 'Docs', icon: Database, color: 'text-info', bg: 'bg-info/10' },
                    { label: 'Conversations', value: stats.conversationCount, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'System Uptime', value: '99.9', suffix: '%', icon: Activity, color: 'text-success', bg: 'bg-success/10' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 group hover:border-primary/30 transition-all cursor-default relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                                <stat.icon size={20} className={stat.color} />
                            </div>
                            <ArrowUpRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{stat.value}</span>
                                {stat.suffix && <span className="text-xs font-bold text-muted">{stat.suffix}</span>}
                                {stat.total !== undefined && <span className="text-xs font-bold text-muted ml-1">/ {stat.total}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Section (Simulated) */}
                <div className="lg:col-span-2 glass-card flex flex-col p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-lg mb-1">AI Request Activity</h3>
                            <p className="text-xs text-muted font-medium">Lưu lượng yêu cầu AI trong 7 ngày qua</p>
                        </div>
                        <select className="bg-white/5 border border-border rounded-lg text-[10px] font-bold px-3 py-1 outline-none">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>

                    <div className="flex-1 flex items-end gap-3 h-48 mb-4">
                        {[45, 60, 30, 85, 40, 55, 75].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-primary/20 hover:bg-primary/50 transition-all rounded-t-lg relative group"
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border rounded px-2 py-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h * 12} req
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold text-muted uppercase">Day {i + 1}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-border/50 pt-6 flex items-center justify-between">
                        <div className="flex gap-8">
                            <div>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-tighter mb-1">Total Hits</p>
                                <p className="text-lg font-bold">4,128</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-tighter mb-1">Avg Latency</p>
                                <p className="text-lg font-bold text-info">1.2s</p>
                            </div>
                        </div>
                        <button className="text-primary text-[10px] font-bold uppercase hover:underline">View Detailed Analytics</button>
                    </div>
                </div>

                {/* Recent Events Section */}
                <div className="glass-card flex flex-col">
                    <div className="bg-white/2 px-6 py-4 border-b border-border font-bold text-sm">
                        Recent System Events
                    </div>
                    <div className="p-6 flex-1 space-y-6">
                        {recentEvents.map((event) => (
                            <div key={event.id} className="flex gap-4 relative">
                                <div className="shrink-0 mt-1">
                                    {event.type === 'knowledge' && <Database size={16} className="text-info" />}
                                    {event.type === 'bot' && <CheckCircle2 size={16} className="text-success" />}
                                    {event.type === 'chat' && <MessageSquare size={16} className="text-primary" />}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-white">{event.title}</h4>
                                    <p className="text-[11px] text-muted leading-snug">{event.desc}</p>
                                    <div className="flex items-center gap-1 text-[9px] text-muted/60 font-medium">
                                        <Clock size={10} /> {event.time}
                                    </div>
                                </div>
                                <div className="absolute left-2 top-6 bottom-[-24px] w-px bg-border group-last:hidden" />
                            </div>
                        ))}
                        <button className="w-full btn-outline py-2 text-[10px] font-bold uppercase mt-2">
                            View All Events
                        </button>
                    </div>
                </div>
            </div>

            {/* System Health Section */}
            <div className="glass-card p-8">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-primary" /> System Health Monitoring
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-muted uppercase">Memory Usage</span>
                            <span className="text-xs font-bold">1.2GB / 4GB</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-success w-[30%]" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-muted uppercase">CPU Load</span>
                            <span className="text-xs font-bold">12%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-info w-[12%]" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-muted uppercase">Storage (Qdrant)</span>
                            <span className="text-xs font-bold">2.4MB / 100MB</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[2.4%]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
