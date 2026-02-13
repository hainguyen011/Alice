import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Cpu, Lock, ArrowRight, AlertCircle, Loader2, Target, Zap, Activity } from 'lucide-react';


const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const from = location.state?.from?.pathname || '/home';
            navigate(from, { replace: true });
        }
    }, [user, navigate, location]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        try {
            await login(username, password);
            // Redirection logic is handled by useEffect above when user state updates
        } catch (err) {

            setError(err.response?.data?.error || 'Truy cập bị từ chối: Sai thông tin hoặc lỗi máy chủ');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020205] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Base Background Scanline & Noise */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
            </div>
            <div className="absolute inset-0 bg-scanlines opacity-10 z-50 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[1000px] relative mt-[-20px]"
            >
                {/* Main Container with Liquid Neon Border */}
                <div className="relative p-[1px] overflow-hidden rounded-lg bg-white/5 group">
                    {/* Liquid Neon Light Border */}
                    <div className="absolute inset-x-0 inset-y-0 w-[300%] h-[300%] top-[-100%] left-[-100%] animate-spin-slow pointer-events-none"
                        style={{ background: 'conic-gradient(from 0deg, transparent 0%, transparent 45%, #ff0000 50%, #8b0000 55%, transparent 60%, transparent 100%)' }}
                    />

                    {/* Inner Glassmorphism Content */}
                    <div className="relative bg-[#08080c]/95 rounded-lg flex flex-col lg:flex-row overflow-hidden backdrop-blur-xl">

                        {/* LEFT SIDE: HERO VISUAL (AI + GTA V) */}
                        <div className="w-full lg:w-1/2 relative min-h-[300px] lg:min-h-[550px] overflow-hidden flex flex-col justify-between p-10">
                            {/* Hero Background Image */}
                            <div className="absolute inset-0 z-0">
                                <img
                                    src="C:\Users\Admin\.gemini\antigravity\brain\28a97910-45e4-4b44-8dbc-441c03b3f3db\gta_ai_hero_image_1771008879376.png"
                                    alt="GTA AI Background"
                                    className="w-full h-full object-cover scale-110 opacity-60 mix-blend-screen"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#08080c] via-transparent to-[#08080c]/50" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] to-transparent opacity-80" />
                            </div>

                            {/* HUD Brackets - Hero Side */}
                            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-red-500/30" />
                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-red-500/30" />

                            <div className="relative z-10">
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center gap-3 mb-8"
                                >
                                    <div className="p-2 bg-red-600/20 border border-red-500/40 text-red-500">
                                        <Target size={20} className="animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/80">Core.Identity.V3</span>
                                </motion.div>

                                <h1 className="text-6xl font-black tracking-tighter leading-none mb-4 italic">
                                    <span className="block text-white glow-text">ALICE</span>
                                    <span className="block text-transparent stroke-text">ADMIN</span>
                                </h1>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[280px] opacity-70 border-l-2 border-red-600 pl-4 py-1">
                                    Hệ thống điều khiển hành vi & trí tuệ nhân tạo cao cấp cho thế giới ngầm
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Activity size={10} className="text-red-500" />
                                        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Neural Link: ACTIVE</span>
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">LS-NETWORK-GRID-72</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest">AUTHORIZED USE ONLY</div>
                                    <div className="text-[8px] font-bold text-gray-700">COORD: 34.0522° N, 118.2437° W</div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE: AUTH FORM */}
                        <div className="w-full lg:w-1/2 p-10 lg:p-16 relative flex flex-col justify-center bg-[#0d0d15]/50 border-l border-white/5">
                            {/* HUD Brackets - Form Side */}
                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/10" />
                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/10" />

                            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                                <div className="space-y-2">
                                    <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                        <Zap size={18} className="text-red-500" /> SYSTEM LOGIN
                                    </h2>
                                    <div className="h-[2px] bg-gradient-to-r from-red-600 to-transparent w-24" />
                                </div>

                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="bg-red-950/30 border border-red-500/50 p-4 rounded text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                                        >
                                            <AlertCircle size={14} /> {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Username ID</label>
                                            <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">[DEC-202X]</span>
                                        </div>
                                        <div className="relative group overflow-hidden rounded-md border border-white/5 bg-[#12121e]">
                                            <div className="absolute inset-y-0 left-0 w-1 bg-red-600 transform -translate-x-full group-focus-within:translate-x-0 transition-transform" />
                                            <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" size={16} />
                                            <input
                                                type="text"
                                                className="w-full bg-transparent py-5 pl-12 pr-4 text-xs font-bold text-white placeholder:text-gray-800 outline-none transition-all uppercase tracking-widest"
                                                placeholder="IDENTITY-NODE"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Access Key</label>
                                            <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">[ENCRYPTED]</span>
                                        </div>
                                        <div className="relative group overflow-hidden rounded-md border border-white/5 bg-[#12121e]">
                                            <div className="absolute inset-y-0 left-0 w-1 bg-red-600 transform -translate-x-full group-focus-within:translate-x-0 transition-transform" />
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" size={16} />
                                            <input
                                                type="password"
                                                className="w-full bg-transparent py-5 pl-12 pr-4 text-xs font-bold text-white placeholder:text-gray-800 outline-none transition-all tracking-[1em]"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoggingIn}
                                    className="w-full h-16 bg-[#ff0000] hover:bg-[#8b0000] text-white rounded font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all relative overflow-hidden group/btn shadow-[0_0_30px_rgba(255,0,0,0.1)] active:scale-[0.98] disabled:opacity-50"
                                >
                                    <div className="absolute inset-0 w-0 bg-white/10 group-hover/btn:w-full transition-all duration-300" />
                                    {isLoggingIn ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            ESTABLISH CONNECTION <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Tech Decals - Form Side */}
                            <div className="mt-12 flex items-center gap-6 opacity-20">
                                <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">ALICE OS KERNEL V4.0.2</div>
                                <div className="flex-1 h-[1px] bg-gradient-to-r from-white/20 to-transparent" />
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-3 bg-red-600" />)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Corner Decorative Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100] border-[40px] border-[#ff0000]/[0.02]" />
            <div className="fixed top-1/2 right-4 -translate-y-1/2 flex flex-col gap-4 opacity-10 pointer-events-none">
                {[...Array(10)].map((_, i) => <div key={i} className="w-1 h-4 bg-white" />)}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                .bg-scanlines {
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
                    background-size: 100% 2px, 3px 100%;
                }
                .stroke-text {
                    -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.2);
                }
                .glow-text {
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 0, 0, 0.3);
                }
            `}} />
        </div>
    );
};

export default Login;
