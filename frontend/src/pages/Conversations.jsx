import React, { useState, useEffect, useRef } from 'react';
import { conversationsApi, botsApi } from '../services/api';
import {
    MessageSquare,
    Send,
    RefreshCw,
    Search,
    User,
    Bot as BotIcon,
    Terminal,
    Clock,
    ChevronRight,
    Shield,
    Trash2,
    Maximize2,
    Plus,
    Loader2,
    AlertCircle,
    Database,
    ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';

const Conversations = () => {
    const [conversations, setConversations] = useState([]);
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);
    const [activeView, setActiveView] = useState('archive'); // 'archive' | 'playground'

    // Playground States
    const [playgroundBotId, setPlaygroundBotId] = useState('');
    const [playgroundInput, setPlaygroundInput] = useState('');
    const [playgroundMessages, setPlaygroundMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [activeRagContext, setActiveRagContext] = useState(null);

    const scrollRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [playgroundMessages, selectedSession, isSending]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cRes, bRes] = await Promise.all([
                conversationsApi.getAll(),
                botsApi.getAll()
            ]);
            setConversations(cRes.data);
            setBots(bRes.data);
            if (bRes.data.length > 0 && !playgroundBotId) {
                setPlaygroundBotId(bRes.data[0]._id);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setLoading(true);
            await conversationsApi.sync();
            fetchData();
        } catch (err) {
            console.error('Sync error:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!playgroundInput.trim() || !playgroundBotId) return;

        const userMsg = { role: 'user', content: playgroundInput, timestamp: new Date().toISOString() };
        setPlaygroundMessages(prev => [...prev, userMsg]);
        setPlaygroundInput('');
        setIsSending(true);
        setActiveRagContext(null);

        try {
            const chatContext = playgroundMessages
                .slice(-5)
                .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
                .join('\n');

            const { data } = await conversationsApi.chat({
                botId: playgroundBotId,
                message: userMsg.content,
                chatContext
            });

            const aiMsg = {
                role: 'ai',
                content: data.text,
                context: data.context,
                timestamp: new Date().toISOString()
            };
            setPlaygroundMessages(prev => [...prev, aiMsg]);
            setActiveRagContext(data.context);
        } catch (err) {
            console.error('Chat error:', err);
            const errorMsg = {
                role: 'system',
                content: `Error: ${err.response?.data?.error || err.message}`,
                timestamp: new Date().toISOString()
            };
            setPlaygroundMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsSending(false);
        }
    };

    // Grouping logic for the sidebar
    const sessions = Array.from(new Set(conversations.map(c => c.userId))).map(userId => {
        const userMsgs = conversations.filter(c => c.userId === userId);
        return {
            userId,
            username: userMsgs[0]?.username || 'Anonymous',
            lastMessage: userMsgs[0]?.content || userMsgs[0]?.response,
            timestamp: userMsgs[0]?.timestamp,
            messages: userMsgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const FilteredSessionsList = sessions.filter(session =>
        session.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.userId.includes(searchQuery)
    );

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-700 overflow-hidden">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-4 shrink-0 px-1">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    <button
                        onClick={() => setActiveView('archive')}
                        className={clsx(
                            "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            activeView === 'archive' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-white"
                        )}
                    >
                        <MessageSquare size={13} /> History Archive
                    </button>
                    <button
                        onClick={() => setActiveView('playground')}
                        className={clsx(
                            "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            activeView === 'playground' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-white"
                        )}
                    >
                        <Terminal size={13} /> Alice Playground
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleSync} className="bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 group transition-all">
                        <RefreshCw size={13} className={clsx("group-hover:text-primary transition-colors", loading && 'animate-spin')} /> Discord Sync
                    </button>
                    <button onClick={fetchData} className="bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                        Refresh
                    </button>
                </div>
            </div>

            {activeView === 'archive' ? (
                /* History Master-Detail View */
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Sidebar: Conversation List */}
                    <div className="w-80 glass-card flex flex-col overflow-hidden shadow-2xl border border-white/5" style={{ maxHeight: '75vh' }}>
                        <div className="p-4 border-b border-white/5 bg-surface/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search users or IDs..."
                                    className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-primary transition-all placeholder:text-muted/50"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin transition-all">
                            {loading && FilteredSessionsList.length === 0 ? (
                                <div className="p-12 text-center text-muted animate-pulse font-bold text-[10px] uppercase tracking-widest">Scanning Archive...</div>
                            ) : FilteredSessionsList.length === 0 ? (
                                <div className="p-12 text-center text-muted text-xs italic opacity-50">No sessions match your search.</div>
                            ) : (
                                FilteredSessionsList.map((session) => (
                                    <div
                                        key={session.userId}
                                        onClick={() => setSelectedSession(session)}
                                        className={clsx(
                                            "p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.03] flex items-start gap-3 group relative",
                                            selectedSession?.userId === session.userId ? "bg-primary/[0.07]" : ""
                                        )}
                                    >
                                        {selectedSession?.userId === session.userId && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                        )}
                                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all group-hover:scale-105 border border-white/5 relative">
                                            <User size={16} className="text-muted group-hover:text-primary transition-colors" />
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-primary/40 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="min-w-0 flex-1 py-0.5">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-[11.5px] font-black tracking-tight truncate pr-2 text-white/90 group-hover:text-white transition-colors">{session.username}</h4>
                                                <span className="text-[8px] text-muted/50 shrink-0 font-black uppercase tracking-tighter">{new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <p className="text-[10px] text-muted/60 truncate font-medium leading-tight group-hover:text-muted transition-colors italic">
                                                {session.lastMessage}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Content: Conversation Details */}
                    <div className="flex-1 glass-card flex flex-col overflow-hidden relative shadow-2xl border border-white/5 bg-surface/30" style={{ maxHeight: '75vh' }}>
                        {selectedSession ? (
                            <>
                                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-xl z-20 shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                                                <User size={20} />
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary rounded-full border-2 border-surface flex items-center justify-center">
                                                <div className="w-1 h-1 bg-primary rounded-full" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black tracking-tight text-white">{selectedSession.username}</h3>
                                            <p className="text-[9px] text-muted font-black opacity-30 tracking-[0.1em] uppercase">MEMBER ID • {selectedSession.userId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all" title="View Source">
                                            <ExternalLink size={14} />
                                        </button>
                                        <button className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Delete Session">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/[0.02] via-transparent to-transparent">
                                    {selectedSession.messages.map((msg, i) => (
                                        <div key={i} className="flex flex-col gap-2 group animate-in fade-in slide-in-from-bottom-1 duration-300">
                                            {/* User Message */}
                                            <div className="flex flex-col items-start max-w-[85%] self-start">
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{msg.username}</span>
                                                    <span className="text-[8px] text-muted/30 font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="bg-white/[0.03] p-3.5 px-4.5 rounded-2xl rounded-tl-none text-[13px] font-medium leading-[1.6] text-white/80 border border-white/5 shadow-sm hover:border-white/10 transition-colors backdrop-blur-[2px]">
                                                    {msg.message || msg.content}
                                                </div>
                                            </div>

                                            {/* AI Response Breakdown (Optional if logic separates them) */}
                                            {(msg.response || msg.role === 'ai') && (
                                                <div className="flex flex-col items-end max-w-[85%] self-end animate-in fade-in slide-in-from-right-2 duration-500">
                                                    <div className="flex items-center gap-2 mb-1 px-1 flex-row-reverse">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-success/50">Alice Response</span>
                                                        <span className="text-[8px] text-muted/30 font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="bg-primary/5 p-4 px-5 rounded-2xl rounded-tr-none text-[13.5px] font-medium leading-[1.7] text-white/90 border border-primary/20 shadow-lg border-r-2 border-r-primary relative overflow-hidden group/ai">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                                                        <div className="relative z-10">
                                                            {msg.response || msg.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted p-12">
                                <div className="w-16 h-16 rounded-3xl bg-white/[0.02] flex items-center justify-center mb-8 border border-white/5 shadow-inner">
                                    <MessageSquare size={32} className="opacity-10" />
                                </div>
                                <h3 className="text-sm font-black tracking-[0.3em] uppercase opacity-20 text-center">Select conversation</h3>
                                <p className="text-[10px] font-bold opacity-30 mt-3 max-w-[200px] text-center leading-relaxed italic">
                                    Duyệt tìm kỷ niệm trong kho lưu trữ dữ liệu
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Alice Playground (Live API) - Compact Thread Style */
                <div className="flex-1 flex gap-6 overflow-hidden h-full" style={{ maxHeight: '75vh' }}>
                    <div className="flex-1 glass-card flex flex-col overflow-hidden shadow-2xl border border-white/5 bg-surface/30">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-xl z-20 shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/5">
                                    <Terminal size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white/90">Playground Terminal</h3>
                                    <p className="text-[8px] text-muted font-bold opacity-50 uppercase tracking-tighter">Live API Testing Environment</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-muted uppercase tracking-widest opacity-60">Bot:</span>
                                <select
                                    className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none cursor-pointer hover:border-primary transition-all shadow-md appearance-none pr-8 relative"
                                    value={playgroundBotId}
                                    onChange={e => setPlaygroundBotId(e.target.value)}
                                >
                                    {bots.map(bot => (
                                        <option key={bot._id} value={bot._id}>{bot.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Live Messages Area - Threaded Compact Style */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                            {playgroundMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/5">
                                        <BotIcon size={24} className="text-primary" />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Initialize Chat</h4>
                                    <p className="text-[10px] text-muted max-w-[240px] leading-relaxed font-bold italic">
                                        Bắt đầu phiên chat thử nghiệm với Bot
                                    </p>
                                </div>
                            ) : (
                                playgroundMessages.map((msg, i) => (
                                    <div key={i} className={clsx(
                                        "flex flex-col gap-1.5 max-w-[85%] animate-in fade-in slide-in-from-bottom-1 duration-400",
                                        msg.role === 'user' ? "self-end items-end" : "self-start items-start"
                                    )}>
                                        <div className={clsx(
                                            "p-3.5 px-5 rounded-2xl text-[13px] font-medium leading-[1.6] shadow-xl border backdrop-blur-[2px]",
                                            msg.role === 'user'
                                                ? "bg-primary text-white rounded-tr-none border-primary/20 shadow-primary/10"
                                                : msg.role === 'system'
                                                    ? "bg-red-500/10 text-red-500 border-red-500/10 italic text-[11px] py-2"
                                                    : "bg-surface-glass text-white/90 rounded-tl-none border-white/10 border-l-2 border-l-primary/60"
                                        )}>
                                            {msg.role === 'system' && <AlertCircle size={12} className="inline mr-2" />}
                                            {msg.content}
                                        </div>
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-[8px] text-muted font-bold opacity-30 font-mono">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.role === 'ai' && msg.context?.length > 0 && (
                                                <button
                                                    onClick={() => setActiveRagContext(msg.context)}
                                                    className="flex items-center gap-1 text-[8px] font-black text-success/60 uppercase hover:text-success hover:underline transition-colors"
                                                >
                                                    <Database size={8} /> Inspect
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isSending && (
                                <div className="flex gap-2.5 items-center text-primary italic text-[10px] font-bold tracking-widest px-1">
                                    <Loader2 size={12} className="animate-spin" /> BOT PROCESSING...
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-white/5 bg-black/20 backdrop-blur-md">
                            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto w-full">
                                <div className="relative flex-1 group">
                                    <div className="absolute inset-0 bg-primary/5 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <input
                                        type="text"
                                        placeholder="Message Alice..."
                                        className="w-full bg-background border border-white/10 rounded-xl px-5 py-3 text-xs outline-none focus:border-primary/50 transition-all shadow-lg placeholder:text-muted/40"
                                        value={playgroundInput}
                                        onChange={e => setPlaygroundInput(e.target.value)}
                                        disabled={isSending}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSending || !playgroundInput.trim()}
                                    className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Panel: Settings & RAG Inspector - Compact */}
                    <div className="w-72 flex flex-col gap-6">
                        <div className="glass-card p-5 space-y-5 shadow-xl border border-white/5">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <Shield size={10} /> Playground Engine
                            </h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-50">Context Mode</label>
                                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/30 rounded-lg">
                                        <button className="bg-primary text-white text-[8px] font-black py-1.5 rounded-md uppercase">Smart</button>
                                        <button className="bg-transparent text-muted/50 text-[8px] font-black py-1.5 rounded-md hover:text-white uppercase">Raw</button>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-white/5">
                                    <div className="flex justify-between text-[8px] font-bold text-muted/40 mb-2 uppercase italic"><span>Monitoring:</span> <span>STABLE</span></div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[9px] font-mono text-white/40 italic">
                                            <span>Lat:</span> <span className="text-white/60">1.2s</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-mono text-white/40 italic">
                                            <span>V:</span> <span className="text-white/60">Gemini 2.5</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card flex-1 p-5 flex flex-col gap-4 shadow-xl border border-white/5 overflow-hidden">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-success flex items-center gap-2">
                                <Database size={10} /> RAG Inspector
                            </h4>

                            <div className="flex-1 overflow-y-auto scrollbar-none hover:scrollbar-thin space-y-3">
                                {!activeRagContext ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 p-4">
                                        <Database size={24} className="mb-3" />
                                        <p className="text-[8px] font-bold uppercase tracking-[0.1em]">Idle State</p>
                                    </div>
                                ) : (
                                    activeRagContext.map((c, i) => (
                                        <div key={i} className="p-3 bg-white/[0.03] rounded-xl border border-white/5 space-y-1.5 hover:bg-white/[0.05] transition-colors group animate-in slide-in-from-right-2 duration-300">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[7px] bg-success/20 text-success px-1 py-0.5 rounded font-black border border-success/10">S: {c.score.toFixed(3)}</span>
                                                <span className="text-[8px] text-muted/60 font-bold truncate max-w-[80px]">{c.payload.title}</span>
                                            </div>
                                            <p className="text-[10px] text-muted italic line-clamp-3 group-hover:line-clamp-none transition-all leading-relaxed">
                                                "{c.payload.content}"
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Conversations;
