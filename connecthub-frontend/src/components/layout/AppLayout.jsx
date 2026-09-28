import React, { useState, useEffect } from 'react';
import NavigationSidebar from './NavigationSidebar';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';

function AppLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('nexus_sidebar_collapsed') === 'true';
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / ⌘K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleToggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('nexus_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="neu-layout">
      {/* Dynamic Left Sidebar */}
      <NavigationSidebar isCollapsed={isCollapsed} onToggle={handleToggleSidebar} />

      {/* Right Main Stage */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Executive Top Bar */}
        <TopBar
          onToggleSidebar={handleToggleSidebar}
          isCollapsed={isCollapsed}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Page Specific Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px 32px' }}>
          {children}
        </main>
      </div>

      {/* Global Command Palette & Workspace Quick-Search Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}

export default AppLayout;