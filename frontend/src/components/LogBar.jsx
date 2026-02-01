import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';

const LogBar = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [logs, setLogs] = useState([
        { id: 1, type: 'system', message: 'Alice System initialized.', timestamp: new Date().toISOString() },
        { id: 2, type: 'system', message: 'Connected to Vector Database.', timestamp: new Date(Date.now() - 5000).toISOString() },
        { id: 3, type: 'ai', message: 'Gemini Engine optimized and ready.', timestamp: new Date(Date.now() - 10000).toISOString() },
    ]);
    const scrollRef = useRef(null);

    // Simulate incoming logs
    useEffect(() => {
        const interval = setInterval(() => {
            const randomLogs = [
                "Processing RAG query...",
                "Bot status updated: ONLINE",
                "New conversation sync triggered.",
                "Memory context updated for Bot ID: 001",
                "API Heartbeat: OK",
            ];
            const newLog = {
                id: Date.now(),
                type: Math.random() > 0.8 ? 'warning' : 'system',
                message: randomLogs[Math.floor(Math.random() * randomLogs.length)],
                timestamp: new Date().toISOString()
            };
            setLogs(prev => [...prev.slice(-49), newLog]);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div
            className={clsx(
                "fixed bottom-0 right-0 left-20 bg-surface/90 border-t border-border transition-all duration-300 z-40 flex flex-col",
                isExpanded ? "h-64" : "h-10"
            )}
        >
            {/* Header / Toggle */}
            <div
                className="h-10 flex items-center justify-between px-6 cursor-pointer hover:bg-white/5 transition-colors border-b border-border/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <Terminal size={14} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">System Logs</span>
                    <div className="flex items-center gap-2 ml-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        <span className="text-[9px] text-muted font-medium">Live Monitoring</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); setLogs([]); }}
                        className="p-1 text-muted hover:text-white transition-colors"
                        title="Clear Logs"
                    >
                        <Trash2 size={12} />
                    </button>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
            </div>

            {/* Content */}
            <div
                ref={scrollRef}
                className={clsx(
                    "flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1 scrollbar-thin",
                    !isExpanded && "hidden"
                )}
            >
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-4 group">
                        <span className="text-muted shrink-0 opacity-50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={clsx(
                            "font-bold shrink-0",
                            log.type === 'ai' ? 'text-info' :
                                log.type === 'warning' ? 'text-yellow-500' :
                                    'text-success'
                        )}>
                            [{log.type.toUpperCase()}]
                        </span>
                        <span className="text-white/80 group-hover:text-white transition-colors">{log.message}</span>
                    </div>
                ))}
                <div className="flex gap-4 animate-pulse opacity-50">
                    <span className="text-muted shrink-0">[{new Date().toLocaleTimeString()}]</span>
                    <span className="text-white">_</span>
                </div>
            </div>
        </div>
    );
};

export default LogBar;
