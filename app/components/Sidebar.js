import React from 'react';
import './design-system.css';

const Sidebar = ({ activeSection, setActiveSection, logout, toggleTheme, theme }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-layout-grid-fill' },
    { id: 'courses', label: 'My Learning', icon: 'ri-book-open-fill' },
    { id: 'ai-tutor', label: 'AI Study Plan', icon: 'ri-robot-2-fill' },
    { id: 'certificates', label: 'Certificates', icon: 'ri-award-fill' },
  ];

  return (
    <aside className="glass-panel" style={{ 
      width: '280px', 
      height: 'calc(100vh - 40px)', 
      margin: '20px', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '24px',
      position: 'fixed',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div className="display-title gradient-text" style={{ 
          fontSize: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="ri-graduation-cap-fill" style={{ color: 'white', fontSize: '1.2rem' }}></i>
          </div>
          SkillTrack
        </div>
        
        <button 
          onClick={toggleTheme}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)'
          }}
        >
          <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'}></i>
        </button>
      </div>

      <nav style={{ flex: 1 }}>
        <p style={{ 
          fontSize: '0.75rem', 
          textTransform: 'uppercase', 
          color: 'var(--text-dim)', 
          letterSpacing: '0.1em',
          marginBottom: '16px',
          fontWeight: 600
        }}>Main Menu</p>
        
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeSection === item.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeSection === item.id ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              marginBottom: '8px',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-main)',
              fontWeight: activeSection === item.id ? 600 : 400
            }}
            onMouseOver={(e) => {
              if (activeSection !== item.id) e.currentTarget.style.color = 'var(--text-main)';
            }}
            onMouseOut={(e) => {
              if (activeSection !== item.id) e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <i className={item.icon} style={{ fontSize: '1.2rem' }}></i>
            {item.label}
            {activeSection === item.id && (
              <div style={{ 
                marginLeft: 'auto', 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: 'var(--primary)',
                boxShadow: '0 0 8px var(--primary)'
              }}></div>
            )}
          </button>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'transparent',
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-main)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <i className="ri-logout-circle-r-line" style={{ fontSize: '1.2rem' }}></i>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
