import React, { useState, useEffect } from 'react';
import { channelsApi, botsApi, conversationsApi } from '../services/api';
import {
    Hash,
    Plus,
    Trash2,
    Bot,
    Settings,
    ToggleLeft,
    ToggleRight,
    RefreshCw,
    Search,
    AlertCircle,
    Loader2,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import CustomSelect from '../components/CustomSelect';

const Channels = () => {
    const [channels, setChannels] = useState([]);
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState(null); // Track which channel is syncing
    const [searchQuery, setSearchQuery] = useState('');

    // Form States
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        _id: '',
        channelId: '',
        name: '',
        botId: '',
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cRes, bRes] = await Promise.all([
                channelsApi.getAll(),
                botsApi.getAll()
            ]);
            setChannels(cRes.data);
            setBots(bRes.data);
            if (bRes.data.length > 0) {
                setFormData(prev => ({ ...prev, botId: bRes.data[0]._id }));
            }
        } catch (err) {
            console.error('Error fetching channels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await channelsApi.create(formData);
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Error creating channel:', err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await channelsApi.update(formData._id, formData);
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Error updating channel:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            _id: '',
            channelId: '',
            name: '',
            botId: bots.length > 0 ? bots[0]._id : '',
            description: ''
        });
        setIsAdding(false);
        setIsEditing(false);
    };

    const startEdit = (channel) => {
        setFormData({
            _id: channel._id,
            channelId: channel.channelId,
            name: channel.name,
            botId: channel.botId?._id || '',
            description: channel.description || ''
        });
        setIsEditing(true);
    };

    const handleToggleStatus = async (channel) => {
        try {
            await channelsApi.update(channel._id, { isActive: !channel.isActive });
            fetchData();
        } catch (err) {
            console.error('Error toggling channel status:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa cấu hình kênh này?')) return;
        try {
            await channelsApi.delete(id);
            fetchData();
        } catch (err) {
            console.error('Error deleting channel:', err);
        }
    };

    const handleSyncChannel = async (channel) => {
        if (!channel.botId?._id) {
            alert('Kênh này chưa được gán bot để đồng bộ!');
            return;
        }
        try {
            setSyncingId(channel._id);
            const { data } = await conversationsApi.sync({
                botId: channel.botId._id,
                channelId: channel.channelId
            });
            alert(`Đã đồng bộ thành công ${data.count} tin nhắn từ Discord!`);
        } catch (err) {
            console.error('Sync error:', err);
            alert(`Lỗi đồng bộ: ${err.response?.data?.error || err.message}`);
        } finally {
            setSyncingId(null);
        }
    };

    const filteredChannels = channels.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.channelId.includes(searchQuery)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/20 text-primary border border-primary/5">
                            <Hash size={24} />
                        </div>
                        Channel Management
                    </h2>
                    <p className="text-muted text-[11px] font-bold uppercase tracking-[0.2em] mt-2 opacity-60">Gắn bot vào các kênh Discord cụ thể</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm kênh..."
                            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-xs outline-none focus:border-primary transition-all w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsAdding(true); }}
                        className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 group"
                    >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Channel
                    </button>
                </div>
            </div>

            {/* Quick Stats / Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-5 border border-white/5 shadow-2xl">
                    <div className="p-4 rounded-2xl bg-success/10 text-success border border-success/5">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black">{channels.filter(c => c.isActive).length}</h4>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Channels</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-5 border border-white/5 shadow-2xl">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/5">
                        <Bot size={28} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black">{bots.length}</h4>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Available Bots</p>
                    </div>
                </div>
                <div className="glass-card p-6 border border-white/5 bg-primary/5 shadow-2xl relative overflow-hidden group">
                    <AlertCircle size={64} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">PRO TIP</p>
                    <p className="text-[11px] font-medium leading-relaxed italic text-white/70">
                        "Gán bot cụ thể cho mỗi kênh giúp phân tách nhiệm vụ và tạo trải nghiệm chuyên nghiệp hơn cho cư dân."
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="glass-card p-8 border border-white/5 shadow-2xl relative min-h-[400px]">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/50 z-10">
                        <Loader2 size={32} className="animate-spin text-primary" />
                    </div>
                ) : null}

                {filteredChannels.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                        <Hash size={64} className="mb-6" />
                        <h4 className="text-lg font-black uppercase tracking-[0.3em]">No Channels Registered</h4>
                        <p className="text-xs font-bold mt-4 italic">Bắt đầu gán bot cho các kênh Discord của bạn</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[2px] text-muted">
                                    <th className="px-6 py-4">Channel Name</th>
                                    <th className="px-6 py-4">Discord ID</th>
                                    <th className="px-6 py-4">Assigned Bot</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredChannels.map((channel) => (
                                    <tr key={channel._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="font-black text-xs text-white/90">{channel.name}</div>
                                            <div className="text-[9px] text-muted font-medium italic mt-0.5">{channel.description || 'No description provided'}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <code className="text-[10px] bg-black/40 px-2 py-1 rounded-md text-info font-mono font-bold">{channel.channelId}</code>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                                                    <Bot size={16} />
                                                </div>
                                                <span className="text-[11px] font-bold text-white/80">{channel.botId?.name || <span className="text-red-500 opacity-50">UNASSIGNED</span>}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => handleToggleStatus(channel)}
                                                className={clsx(
                                                    "transition-all active:scale-95",
                                                    channel.isActive ? "text-success" : "text-muted opacity-30"
                                                )}
                                            >
                                                {channel.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                            </button>
                                        </td>
                                        <td className=" px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleSyncChannel(channel)}
                                                    disabled={syncingId === channel._id}
                                                    className={clsx(
                                                        "p-2 rounded-lg transition-all",
                                                        syncingId === channel._id ? "text-primary animate-spin" : "text-muted hover:text-primary hover:bg-primary/10"
                                                    )}
                                                    title="Sync History from Discord"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                                <button
                                                    onClick={() => startEdit(channel)}
                                                    className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                                >
                                                    <Settings size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(channel._id)}
                                                    className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Form Modal Overlay (Add & Edit) */}
            {(isAdding || isEditing) && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="glass-card w-full max-w-md p-8 border border-white/5 shadow-2xl relative">
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full" />

                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black tracking-tight uppercase">
                                {isEditing ? 'Edit Channel' : 'New Channel Config'}
                            </h3>
                            <button onClick={resetForm} className="text-muted hover:text-white transition-colors">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Channel ID (Discord)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 104239845723948..."
                                    className="w-full bg-background border border-border rounded-xl px-5 py-3 text-xs outline-none focus:border-primary transition-all font-mono"
                                    required
                                    value={formData.channelId}
                                    onChange={e => setFormData({ ...formData, channelId: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Friendly Name</label>
                                <input
                                    type="text"
                                    placeholder="Tên kênh để dễ quản lý..."
                                    className="w-full bg-background border border-border rounded-xl px-5 py-3 text-xs outline-none focus:border-primary transition-all"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {(isAdding || isEditing) && (
                                <CustomSelect
                                    label="Assign Persona (Bot)"
                                    options={[
                                        { id: '', name: 'Select a Bot (Optional)' },
                                        ...bots.map(bot => ({ id: bot._id, name: bot.name, description: bot.discordName }))
                                    ]}
                                    value={formData.botId}
                                    onChange={(val) => setFormData({ ...formData, botId: val })}
                                    icon={Bot}
                                />
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Description (Optional)</label>
                                <textarea
                                    placeholder="Ghi chú về mục đích của kênh này..."
                                    className="w-full bg-background border border-border rounded-xl px-5 py-3 text-xs outline-none focus:border-primary transition-all min-h-[80px] resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full btn-primary py-4 text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3"
                            >
                                {isEditing ? <Settings size={18} /> : <Plus size={18} />}
                                {isEditing ? 'Save Changes' : 'Register Channel'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Channels;
