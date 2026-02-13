import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LogBar from '../components/LogBar';
import { useAuth } from '../context/AuthContext';
import { LogOut, Wifi, ShieldCheck, Cpu } from 'lucide-react';

const MainLayout = () => {
    const { logout } = useAuth();
    const location = useLocation();

    const pageName = location.pathname === '/' ? 'CORE' :
        location.pathname.substring(1).toUpperCase();

    return (
        <div className="flex h-screen bg-[#020205] text-white selection:bg-red-500/30 font-sans overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
            </div>

            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Cyber Top Bar */}
                <header className="h-16 border-b border-white/5 bg-[#08080c]/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-40 relative overflow-hidden">
                    {/* Header Scanlines */}
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col">
                            <h1 className="text-sm font-black tracking-[0.3em] text-white uppercase italic group cursor-default">
                                {pageName} <span className="text-red-600">NODE</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">System Link: Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
                                <Wifi size={10} className="text-red-500" />
                                <span className="text-[9px] font-black tracking-widest text-gray-400">SYNC: 14MS</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
                                <ShieldCheck size={10} className="text-red-500" />
                                <span className="text-[9px] font-black tracking-widest text-gray-400">SECURE: AES-256</span>
                            </div>
                        </div>

                        <div className="h-4 border-l border-white/10" />

                        <button
                            onClick={logout}
                            className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                            title="Xác nhận thoát hệ thống"
                        >
                            <span className="hidden sm:inline">Terminate Session</span>
                            <div className="p-2 bg-red-500/10 rounded group-hover:bg-red-600 transition-all border border-red-500/20 group-hover:border-red-500">
                                <LogOut className="w-3.5 h-3.5 group-hover:text-white" />
                            </div>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-10 scrollbar-thin scrollbar-thumb-red-600/20 scrollbar-track-transparent">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </div>

                {/* Persistent Bottom Log Bar */}
                <LogBar />
            </main>
        </div>
    );
};

export default MainLayout;

