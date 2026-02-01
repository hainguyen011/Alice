import React from 'react';
import { motion } from 'framer-motion';
import { Home as HomeIcon, LayoutDashboard, Database, MessageSquare, Bot, Terminal, Settings, Server, Zap, Brain, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { id: 'home', icon: HomeIcon, label: 'VibeCity Home' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'knowledge', icon: Database, label: 'Tri Thức (RAG)' },
    { id: 'conversations', icon: MessageSquare, label: 'Cuộc Hội Thoại' },
    { id: 'bots', icon: Bot, label: 'Quản lý Bot' },
    { id: 'servers', icon: Server, label: 'Quản lý Server' },
    { id: 'automations', icon: Zap, label: 'Tự động hóa (Nexus)' },
    { id: 'insights', icon: Brain, label: 'Phân tích (Neural)' },
    { id: 'memory', icon: Layers, label: 'Bộ nhớ (Memory)' },
];

export default function Sidebar({ activeTab, setActiveTab }) {
    return (
        <aside className="w-20 h-screen bg-surface/70 border-r border-border flex flex-col items-center py-8 z-50">
            {/* Brand Logo */}
            <div className="mb-12 cursor-default">
                <div className="text-2xl font-black italic tracking-tighter select-none">
                    <span className="text-white">A</span>
                    <span className="text-primary">DM</span>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col gap-4">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={item.label}
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative",
                            activeTab === item.id
                                ? "sidebar-item-active"
                                : "text-muted hover:text-white hover:bg-white/5"
                        )}
                    >
                        <item.icon size={24} />
                        {/* removed activeTabGlow */}
                    </button>
                ))}
            </nav>

            {/* Footer Settings */}
            <div className="mt-auto border-t border-border pt-6 w-full flex justify-center">
                <button
                    title="Settings"
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-muted hover:text-white hover:bg-white/5 transition-all"
                >
                    <Settings size={24} />
                </button>
            </div>
        </aside>
    );
}
