import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home as HomeIcon, LayoutDashboard, BookOpenText, MessageSquare, Bot, Terminal, Settings, Server, Workflow, Brain, HardDrive, ChartBar, Database, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { path: '/home', icon: HomeIcon, label: 'CORE CENTER' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'OPERATIONS' },
    { path: '/knowledge', icon: Brain, label: 'NEURAL DATA' },
    { path: '/conversations', icon: MessageSquare, label: 'COMMS' },
    { path: '/bots', icon: Bot, label: 'AGENTS' },
    { path: '/servers', icon: Server, label: 'GRIDS' },
    { path: '/automations', icon: Workflow, label: 'PROTOCOLS' },
    { path: '/insights', icon: ChartBar, label: 'ANALYSIS' },
    { path: '/memory', icon: HardDrive, label: 'STORAGE' },
];

export default function Sidebar() {
    return (
        <aside className="w-20 h-screen bg-[#08080c] border-r border-white/5 flex flex-col items-center pt-6 pb-2 z-50 relative shrink-0 overflow-hidden">
            {/* HUD Background Vertical Line */}
            <div className="absolute left-[1px] top-0 bottom-0 w-[1px] bg-white/[0.02] pointer-events-none" />

            {/* Brand Logo - Compact */}
            <div className="mb-4 cursor-default group relative shrink-0">
                <div className="flex flex-col items-center transform scale-75">
                    <div className="w-8 h-8 flex items-center justify-center border border-white/10 rounded-sm relative overflow-hidden mb-1">
                        <span className="text-white font-black italic text-lg leading-none">A</span>
                        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-red-600 shadow-[0_0:10px_rgba(220,38,38,0.5)]" />
                    </div>
                </div>
                <div className="text-[5px] font-black text-white/20 uppercase tracking-[0.2em] text-center">CORE.v4</div>
            </div>

            {/* Nav Items - Scrollable Container with tight gap */}
            <nav className="flex-1 flex flex-col gap-2 w-full items-center min-h-0 overflow-y-auto scrollbar-none py-2 px-0">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={item.label}
                        className={({ isActive }) => cn(
                            "w-full flex items-center justify-center py-1 transition-all duration-300 group relative shrink-0",
                            isActive ? "text-red-600" : "text-gray-600 hover:text-white"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {/* Icon Container */}
                                <div className={cn(
                                    "w-10 h-10 rounded-sm flex items-center justify-center transition-all duration-300 border border-transparent",
                                    isActive && "bg-red-600/10 border-red-600/20 shadow-[0_0_10px_rgba(255,0,0,0.05)]"
                                )}>
                                    <item.icon size={18} className={cn(isActive && "animate-pulse")} />
                                </div>

                                {/* Active Indicator Line - Perfectly Aligned */}
                                <div className={cn(
                                    "absolute left-0 w-[2px] bg-red-600 transition-all duration-500 rounded-r-sm shadow-[0_0_15px_rgba(220,38,38,1)]",
                                    isActive ? "h-5 opacity-100" : "h-0 opacity-0"
                                )} />
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Section - Structured to prevent overlap */}
            <div className="mt-auto shrink-0 flex flex-col items-center w-full pt-4 relative">
                <div className="w-6 h-[1px] bg-white/5 mb-4" />

                <button
                    title="Settings"
                    className="w-10 h-10 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all mb-6"
                >
                    <Settings size={18} />
                </button>

                {/* Brand Vertical Text - Positioned safely */}
                <div className="h-20 w-full flex items-center justify-center relative overflow-hidden mb-2">
                    <span className="text-[7px] font-black text-white/[0.05] uppercase tracking-[0.4em] -rotate-90 whitespace-nowrap select-none">
                        ALICE.SYSTEM.OS
                    </span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </aside>
    );
}





