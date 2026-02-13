import React, { useState } from 'react';
import {
    Zap,
    Plus,
    Trash2,
    Settings,
    Play,
    Bell,
    Webhook,
    Clock,
    MessageSquare,
    Activity,
    ChevronRight,
    ToggleLeft,
    ToggleRight,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const Automations = () => {
    const [rules, setRules] = useState([
        {
            id: '1',
            name: 'Alert: Lỗi hệ thống',
            trigger: { type: 'keyword', value: 'lỗi hệ thống', channel: 'All' },
            action: { type: 'webhook', destination: 'Slack Admin', detail: 'Tóm tắt & Cảnh báo' },
            isActive: true,
            lastRun: '2 phút trước',
            runs: 12
        },
        {
            id: '2',
            name: 'Auto-Knowledge Update',
            trigger: { type: 'schedule', value: 'Hàng ngày @ 00:00' },
            action: { type: 'function', detail: 'Quét URL Tài liệu' },
            isActive: false,
            lastRun: '1 ngày trước',
            runs: 45
        }
    ]);

    const [isAdding, setIsAdding] = useState(false);

    const triggerIcons = {
        keyword: <MessageSquare size={16} className="text-primary" />,
        schedule: <Clock size={16} className="text-info" />,
        event: <Activity size={16} className="text-success" />
    };

    const actionIcons = {
        webhook: <Webhook size={16} className="text-purple-400" />,
        notification: <Bell size={16} className="text-yellow-400" />,
        function: <Settings size={16} className="text-success" />
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-[5%]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-glass/30 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white leading-tight">
                            Nexus Automations
                        </h2>
                        <p className="text-[10px] text-muted-foreground font-medium">
                            Thiết lập kịch bản & tự động hóa
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn-primary px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 group"
                    >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                        Tạo Kịch Bản Mới
                    </button>
                </div>
            </div>

            {/* Platform Banner */}
            <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-transparent border border-white/5 relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Hệ Thống Phản Hồi Thông Minh</h3>
                    </div>
                    <p className="text-xs text-muted max-w-2xl leading-relaxed italic">
                        Alice sử dụng cơ chế "Trigger-Action" nâng cao để xử lý các sự kiện từ Discord. Bạn có thể thiết lập các luồng tự động
                        để lọc tin nhắn, gửi cảnh báo Webhook hoặc tự động đào tạo lại tri thức (RAG) định kỳ.
                    </p>
                </div>
                <Zap size={120} className="absolute -right-8 -bottom-8 opacity-5 text-primary group-hover:scale-110 transition-transform duration-700" />
            </div>

            {/* List of Rules */}
            <div className="grid grid-cols-1 gap-6">
                {rules.map((rule) => (
                    <motion.div
                        layout
                        key={rule.id}
                        className={clsx(
                            "glass-card p-6 border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative",
                            !rule.isActive && "opacity-60"
                        )}
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                            {/* Rule Name & Status */}
                            <div className="w-full lg:w-72">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={clsx(
                                        "w-2 h-2 rounded-full",
                                        rule.isActive ? "bg-success animate-pulse shadow-[0_0_10px_rgba(0,255,209,0.5)]" : "bg-muted"
                                    )} />
                                    <h4 className="text-sm font-black text-white/90 truncate">{rule.name}</h4>
                                </div>
                                <div className="flex gap-4 text-[10px] font-bold text-muted/60 uppercase">
                                    <span>Lần cuối: {rule.lastRun}</span>
                                    <span>•</span>
                                    <span>{rule.runs} lượt chạy</span>
                                </div>
                            </div>

                            {/* Trigger-Action Flow */}
                            <div className="flex-1 flex items-center gap-4 py-2 px-1">
                                {/* Trigger Card */}
                                <div className="flex-1 bg-black/30 rounded-2xl p-4 border border-white/5 relative group/item">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted/40 mb-3 flex items-center gap-1.5">
                                        <Play size={10} /> Trigger
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/5 text-white">
                                            {triggerIcons[rule.trigger.type]}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-white capitalize">{rule.trigger.type}</p>
                                            <p className="text-[10px] text-muted truncate max-w-[150px]">{rule.trigger.value}</p>
                                        </div>
                                    </div>
                                </div>

                                <ArrowRight size={20} className="text-muted/20 shrink-0" />

                                {/* Action Card */}
                                <div className="flex-1 bg-black/30 rounded-2xl p-4 border border-white/5 relative group/item">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted/40 mb-3 flex items-center gap-1.5">
                                        <Zap size={10} className="text-primary" /> Action
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/5 text-white">
                                            {actionIcons[rule.action.type]}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-white capitalize">{rule.action.type}</p>
                                            <p className="text-[10px] text-muted truncate max-w-[150px]">{rule.action.detail}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4 lg:pl-4 lg:border-l lg:border-white/5">
                                <button
                                    onClick={() => {
                                        const newRules = rules.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r);
                                        setRules(newRules);
                                    }}
                                    className={clsx(
                                        "transition-all active:scale-95",
                                        rule.isActive ? "text-success" : "text-muted opacity-30"
                                    )}
                                >
                                    {rule.isActive ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                                </button>

                                <button className="p-2.5 rounded-xl bg-white/5 text-muted hover:text-white hover:bg-white/10 transition-all">
                                    <Settings size={18} />
                                </button>

                                <button className="p-2.5 rounded-xl bg-red-500/5 text-muted/50 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {rules.length === 0 && (
                    <div className="py-20 text-center glass-card opacity-30">
                        <Zap size={48} className="mx-auto mb-4" />
                        <h4 className="text-sm font-black uppercase tracking-widest">Không có kịch bản nào</h4>
                        <p className="text-xs mt-2 italic">Nhấn nút tạo mới để bắt đầu tự động hóa hệ thống của bạn.</p>
                    </div>
                )}
            </div>

            {/* Empty State / Pro Tip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 bg-info/5 border-info/10">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertCircle size={20} className="text-info" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-info">Developer Tip: Webhooks</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                        Sử dụng Webhook để tích hợp Alice với Slack, Telegram hoặc n8n. Điều này giúp bạn xây dựng những luồng xử lý
                        phức tạp hơn như tự động tạo Ticket khi có phàn nàn từ khách hàng trên Discord.
                    </p>
                </div>
                <div className="glass-card p-6 bg-success/5 border-success/10">
                    <div className="flex items-center gap-3 mb-3">
                        <Zap size={20} className="text-success" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-success">Optimization: RAG Auto-Scan</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                        Thiết lập kịch bản "Schedule" để tự động quét nguồn tài liệu Google Docs hoặc Notion mỗi đêm.
                        Đảm bảo cơ sở tri thức của Bot luôn được cập nhật mà không cần can thiệp thủ công.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Automations;
