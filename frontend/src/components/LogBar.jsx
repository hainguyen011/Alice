import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2, Server, Bot, Activity, Search, Filter, Plus, RotateCw } from 'lucide-react';
import { clsx } from 'clsx';
import { botsApi } from '../services/api';

const LogBar = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedSource, setSelectedSource] = useState('system');
    const [logs, setLogs] = useState([]);
    const [sources, setSources] = useState([
        { id: 'system', name: 'Alice System', type: 'system', status: 'online' }
    ]);
    const [isLoadingBots, setIsLoadingBots] = useState(false);
    const scrollRef = useRef(null);

    const fetchBots = async () => {
        setIsLoadingBots(true);
        try {
            const response = await botsApi.getAll();
            const botSources = response.data.map(bot => ({
                id: bot._id,
                name: bot.name,
                type: 'bot',
                status: bot.isActive ? 'online' : 'offline'
            }));
            setSources(prev => [prev[0], ...botSources]);
        } catch (error) {
            console.error("Failed to fetch bots for terminal:", error);
        } finally {
            setIsLoadingBots(false);
        }
    };

    // Fetch bots and setup SSE
    useEffect(() => {
        fetchBots();

        // SSE Setup
        const token = localStorage.getItem('accessToken');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const eventSource = new EventSource(`${apiUrl}/logs/stream?token=${token}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'buffer') {
                setLogs(data.logs.map(l => ({ ...l, botId: l.source })));
            } else if (data.type === 'log') {
                const newLog = { ...data.log, botId: data.log.source };
                setLogs(prev => [...prev.slice(-99), newLog]);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE Error:", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, selectedSource]);

    const filteredLogs = logs.filter(log => log.botId === selectedSource);

    return (
        <div
            className={clsx(
                "fixed bottom-0 right-0 left-20 bg-surface/95 border-t border-border transition-all duration-300 z-40 flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.5)]",
                isExpanded ? "h-80" : "h-9"
            )}
        >
            {/* Header / Toggle */}
            <div
                className={clsx(
                    "flex items-center justify-between px-6 cursor-pointer hover:bg-white/[0.02] transition-all border-b border-border/50 bg-background/80",
                    isExpanded ? "h-14" : "h-9"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Left: Title & Subtitle */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                        <h2 className={clsx(
                            "font-black tracking-tight text-white uppercase italic leading-tight transition-all",
                            isExpanded ? "text-lg" : "text-[11px]"
                        )}>
                            Alice <span className="text-primary">Terminal</span>
                        </h2>
                        {isExpanded && (
                            <p className="text-[8px] text-muted font-bold tracking-[0.2em] uppercase opacity-40">
                                Neural Network Real-time Operation Logs
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(0,255,209,0.5)]" />
                        <span className="text-[9px] text-success font-bold uppercase tracking-tighter">Live Stream</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); setLogs([]); }}
                            className="p-1.5 text-muted hover:text-red-400 hover:bg-white/5 rounded-md transition-all group"
                            title="Clear Logs"
                        >
                            <Trash2 size={12} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        {isExpanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronUp size={14} className="text-muted" />}
                    </div>
                </div>
            </div>

            {/* Source Tabs - Only visible when expanded */}


            {/* Split Content */}
            <div className={clsx("flex-1 flex overflow-hidden", !isExpanded && "hidden")}>

                {/* LEFT COLUMN: Logs Area */}
                <div className="flex-1 min-w-0 flex flex-col bg-black/20 relative">
                    {/* Log Toolbar */}
                    <div className="h-8 flex items-center justify-between px-4 border-b border-white/5 bg-white/2 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <Search size={10} className="text-muted" />
                            <input
                                type="text"
                                placeholder="Filter logs..."
                                className="bg-transparent border-none text-[10px] text-white focus:outline-none w-32 placeholder:text-muted/50"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-muted">{filteredLogs.length} events</span>
                        </div>
                    </div>

                    {/* Log Stream */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    >
                        {filteredLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted/30 gap-2">
                                <Activity size={24} />
                                <span>No active logs for this source</span>
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div key={log.id} className="flex gap-3 group hover:bg-white/5 p-0.5 rounded px-2 -mx-2 transition-colors">
                                    <span className="text-muted/50 shrink-0 font-light text-[10px] w-14">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                    <span className={clsx(
                                        "font-bold shrink-0 w-16 text-[10px] uppercase tracking-wider text-center rounded px-1 py-0.5 h-fit",
                                        log.level === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                log.level === 'ai' ? 'bg-blue-500/20 text-info border border-blue-500/30' :
                                                    log.level === 'system' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                        'bg-green-500/20 text-success border border-green-500/30'
                                    )}>
                                        {log.level || 'info'}
                                    </span>
                                    <span className="text-white/80 group-hover:text-white transition-colors break-words leading-tight">
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                        {/* Fake cursor at bottom */}
                        <div className="flex gap-2 animate-pulse opacity-50 pl-2">
                            <span className="text-primary">_</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Source Tree */}
                <div className="w-64 bg-surface border-l border-border flex flex-col shrink-0">
                    <div className="h-8 flex items-center justify-between px-3 border-b border-white/5 bg-white/2">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Active Process</span>
                        <div className="flex gap-1">
                            <button
                                onClick={fetchBots}
                                className={clsx("p-1 hover:bg-white/5 rounded transition-colors text-muted hover:text-white", isLoadingBots && "animate-spin")}
                                title="Refresh Sources"
                            >
                                <RotateCw size={10} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const botId = prompt("Enter Agent ID to observe:");
                                    if (botId) {
                                        setSources(prev => [
                                            ...prev,
                                            { id: botId, name: `Agent ${botId.slice(-4)}`, type: 'bot', status: 'online' }
                                        ]);
                                        setSelectedSource(botId);
                                    }
                                }}
                                className="p-1 hover:bg-white/5 rounded transition-colors text-muted hover:text-white"
                                title="Add Source"
                            >
                                <Plus size={10} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {sources.map(source => (
                            <button
                                key={source.id}
                                onClick={() => setSelectedSource(source.id)}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group border border-transparent",
                                    selectedSource === source.id
                                        ? "bg-primary/10 border-primary/20 text-white"
                                        : "hover:bg-white/5 text-muted hover:text-white"
                                )}
                            >
                                <div className={clsx(
                                    "w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors",
                                    selectedSource === source.id ? "bg-primary/20 text-primary" : "bg-white/5 text-muted group-hover:text-white"
                                )}>
                                    {source.type === 'system' ? <Server size={12} /> : <Bot size={12} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-medium truncate">{source.name}</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className={clsx(
                                            "w-1.5 h-1.5 rounded-full",
                                            source.status === 'online' ? "bg-success shadow-[0_0_5px_rgba(0,255,209,0.3)]" :
                                                source.status === 'idle' ? "bg-yellow-500" : "bg-red-500"
                                        )} />
                                        <span className="text-[9px] opacity-60 capitalize">{source.status}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogBar;
