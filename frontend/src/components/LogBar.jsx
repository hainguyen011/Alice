import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2, Server, Bot, Activity, Search, Filter } from 'lucide-react';
import { clsx } from 'clsx';

const LogBar = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedSource, setSelectedSource] = useState('system');
    const [logs, setLogs] = useState([
        { id: 1, botId: 'system', type: 'system', message: 'Alice System initialized.', timestamp: new Date().toISOString() },
        { id: 2, botId: 'system', type: 'system', message: 'Connected to Vector Database.', timestamp: new Date(Date.now() - 5000).toISOString() },
        { id: 3, botId: 'system', type: 'ai', message: 'Gemini Engine optimized and ready.', timestamp: new Date(Date.now() - 10000).toISOString() },
        { id: 4, botId: 'bot-001', type: 'info', message: 'Bot 001 connected to Discord gateway.', timestamp: new Date().toISOString() },
    ]);
    const scrollRef = useRef(null);

    // Mock Sources
    const sources = [
        { id: 'system', name: 'Alice System', type: 'system', status: 'online' },
        { id: 'bot-001', name: 'Customer Support Bot', type: 'bot', status: 'online' },
        { id: 'bot-002', name: 'Trading Assistant', type: 'bot', status: 'idle' },
        { id: 'bot-003', name: 'Moderation Bot', type: 'bot', status: 'offline' },
    ];

    // Simulate incoming logs
    useEffect(() => {
        const interval = setInterval(() => {
            const randomSource = sources[Math.floor(Math.random() * sources.length)];
            const randomLogs = [
                "Processing RAG query...",
                "Bot status updated.",
                "New conversation sync triggered.",
                "Memory context updated.",
                "API Heartbeat: OK",
                "User interaction detected.",
                "Executing automated workflow...",
                "Error: Connection timeout (simulated)",
            ];
            const newLog = {
                id: Date.now(),
                botId: randomSource.id,
                type: Math.random() > 0.9 ? 'error' : Math.random() > 0.7 ? 'warning' : 'info',
                message: randomLogs[Math.floor(Math.random() * randomLogs.length)],
                timestamp: new Date().toISOString()
            };
            setLogs(prev => [...prev.slice(-99), newLog]); // Keep last 100 logs
        }, 3000);
        return () => clearInterval(interval);
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
                className="h-9 flex items-center justify-between px-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-border/50 bg-background/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/40 border border-white/5">
                        <Terminal size={12} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">System Terminal</span>
                    </div>

                    <div className="h-4 w-[1px] bg-border mx-1" />

                    <div className="flex items-center gap-2">
                        {sources.find(s => s.id === selectedSource)?.type === 'system' ? (
                            <Server size={12} className="text-info" />
                        ) : (
                            <Bot size={12} className="text-accent" />
                        )}
                        <span className="text-[11px] text-white/90 font-medium">
                            {sources.find(s => s.id === selectedSource)?.name || 'Unknown Source'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(0,255,209,0.5)]" />
                        <span className="text-[9px] text-muted font-medium">Live Stream</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); setLogs([]); }}
                        className="p-1.5 text-muted hover:text-red-400 hover:bg-white/5 rounded-md transition-all"
                        title="Clear Logs"
                    >
                        <Trash2 size={12} />
                    </button>
                    {isExpanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronUp size={14} className="text-muted" />}
                </div>
            </div>

            {/* Split Content */}
            <div className={clsx("flex-1 flex overflow-hidden", !isExpanded && "hidden")}>

                {/* LEFT COLUMN: Logs Area */}
                <div className="flex-1 flex flex-col bg-black/20 relative">
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
                                        log.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                            log.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                log.type === 'ai' ? 'bg-blue-500/10 text-info border border-blue-500/20' :
                                                    'bg-green-500/10 text-success border border-green-500/20'
                                    )}>
                                        {log.type}
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
                <div className="w-56 bg-surface border-l border-border flex flex-col">
                    <div className="h-8 flex items-center px-3 border-b border-white/5 bg-white/2">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Active Process</span>
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
