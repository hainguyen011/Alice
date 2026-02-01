import React, { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Knowledge from './pages/Knowledge.jsx';
import Conversations from './pages/Conversations.jsx';
import Bots from './pages/Bots.jsx';
import Servers from './pages/Servers.jsx';
import Automations from './pages/Automations.jsx';
import Insights from './pages/Insights.jsx';
import Memory from './pages/Memory.jsx';
import LogBar from './components/LogBar.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'dashboard':
        return <Dashboard />;
      case 'knowledge':
        return <Knowledge />;
      case 'conversations':
        return <Conversations />;
      case 'bots':
        return <Bots />;
      case 'servers':
        return <Servers />;
      case 'automations':
        return <Automations />;
      case 'insights':
        return <Insights />;
      case 'memory':
        return <Memory />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-white selection:bg-primary/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-surface/50 flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight capitalize">{activeTab}</h1>
            <div className="h-4 border-l border-border mx-2" />
            <span className="text-xs text-muted font-medium uppercase tracking-widest opacity-50">Alice Management</span>
          </div>
          <div className="flex items-center gap-3 bg-white/3 px-4 py-2 rounded-full border border-border">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-bold tracking-wide">Alice System</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 pb-10 scrollbar-thin">
          {renderContent()}
        </div>

        {/* Persistent Bottom Log Bar */}
        <LogBar />
      </main>
    </div>
  );
}
