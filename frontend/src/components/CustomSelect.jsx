import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';
import { clsx } from 'clsx';

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
            // Only close if the scroll is NOT inside the dropdown
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            updateCoords();
            // Using capture phase to detect scrolls in parent containers (like modals)
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    return (
        <div className={clsx("space-y-2 relative", className)} ref={containerRef}>
            {label && (
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                    {label}
                </label>
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "input-field w-full py-3 px-5 flex items-center justify-between cursor-pointer transition-all",
                    isOpen ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-white/20"
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon size={16} className="text-primary/50" />}
                    <span className={clsx("text-sm font-bold", !selectedOption && "text-muted")}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={clsx("text-muted transition-transform duration-300", isOpen && "rotate-180 text-primary")}
                />
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-[#121214] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl"
                    style={{
                        top: coords.top + 8,
                        left: coords.left,
                        width: coords.width
                    }}
                >
                    {options.length > 5 && (
                        <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                            <div className="relative">
                                <Search size={14} className="absolute inset-y-0 left-3 my-auto text-muted" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search options..."
                                    className="w-full bg-black/40 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-primary/50 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className={clsx(
                                        "px-5 py-4 cursor-pointer transition-all flex items-center justify-between group",
                                        value === option.id ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-white/[0.03] border-l-2 border-transparent"
                                    )}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className={clsx(
                                                "text-xs font-black tracking-tight",
                                                value === option.id ? "text-primary" : "text-white/80"
                                            )}>
                                                {option.name}
                                            </span>
                                            <span className="text-[9px] font-mono text-muted/50 uppercase tracking-tighter">
                                                {option.id}
                                            </span>
                                        </div>
                                        {option.description && (
                                            <p className="text-[10px] text-muted/60 leading-tight line-clamp-2 max-w-[90%]">
                                                {option.description}
                                            </p>
                                        )}
                                    </div>
                                    {value === option.id && <Check size={14} className="text-primary" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-muted text-xs italic">
                                No options found...
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CustomSelect;
