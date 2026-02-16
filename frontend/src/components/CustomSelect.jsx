import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, Target } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const CustomSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    label,
    icon: Icon,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleScroll = (event) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', updateCoords);
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    return (
        <div className={clsx("space-y-1.5 relative", className)} ref={containerRef}>
            {label && (
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    {label}
                </label>
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "group relative overflow-hidden bg-white/[0.03] border rounded-xl px-4 py-3 cursor-pointer transition-all duration-300 flex items-center justify-between",
                    isOpen
                        ? "border-primary/50 shadow-[0_0_20px_rgba(255,62,62,0.1)] bg-primary/5"
                        : "border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                )}
            >
                {/* HUD Corner Accents */}
                <div className={clsx(
                    "absolute top-0 left-0 w-1 h-1 border-t border-l transition-colors duration-300",
                    isOpen ? "border-primary" : "border-white/20"
                )} />
                <div className={clsx(
                    "absolute bottom-0 right-0 w-1 h-1 border-b border-r transition-colors duration-300",
                    isOpen ? "border-primary" : "border-white/20"
                )} />

                <div className="flex items-center gap-3 relative z-10">
                    <div className={clsx(
                        "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300",
                        isOpen ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground group-hover:text-white"
                    )}>
                        {Icon ? <Icon size={14} /> : <Target size={14} className="opacity-40" />}
                    </div>
                    <span className={clsx(
                        "text-xs font-bold transition-colors duration-300",
                        selectedOption ? "text-white/90" : "text-muted-foreground"
                    )}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                </div>

                <ChevronDown
                    size={14}
                    className={clsx(
                        "text-muted-foreground transition-all duration-500",
                        isOpen && "rotate-180 text-primary scale-110"
                    )}
                />
            </div>

            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        ref={dropdownRef}
                        className="fixed z-[9999] bg-[#0a0b10]/95 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl"
                        style={{
                            top: coords.top + 8,
                            left: coords.left,
                            width: coords.width
                        }}
                    >
                        {/* Scanline Effect Overlay */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                        {options.length > 5 && (
                            <div className="p-3 border-b border-white/5 bg-white/[0.02] relative z-20">
                                <div className="relative group">
                                    <Search size={12} className="absolute inset-y-0 left-3 my-auto text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Filter nodes..."
                                        className="w-full bg-black/60 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-[11px] outline-none focus:border-primary/50 transition-all font-bold placeholder:text-muted-foreground/30"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2 space-y-1 relative z-20">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        key={option.id}
                                        onClick={() => {
                                            onChange(option.id);
                                            setIsOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={clsx(
                                            "px-4 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group relative overflow-hidden",
                                            value === option.id
                                                ? "bg-primary/10 border border-primary/20"
                                                : "hover:bg-white/[0.04] border border-transparent"
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <span className={clsx(
                                                    "text-[11px] font-black tracking-tight transition-colors",
                                                    value === option.id ? "text-primary" : "text-white/70 group-hover:text-white"
                                                )}>
                                                    {option.name}
                                                </span>
                                                {option.subtext && (
                                                    <span className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-tighter">
                                                        {option.subtext}
                                                    </span>
                                                )}
                                            </div>
                                            {option.description && (
                                                <p className="text-[9px] text-muted-foreground/50 leading-tight line-clamp-1 max-w-[200px]">
                                                    {option.description}
                                                </p>
                                            )}
                                        </div>
                                        {value === option.id && (
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_10px_rgba(255,62,62,0.2)]">
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-10 text-center space-y-2 opacity-30">
                                    <Target size={24} className="mx-auto mb-2 animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No matching results</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default CustomSelect;
