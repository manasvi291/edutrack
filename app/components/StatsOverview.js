import React from 'react';
import './design-system.css';

const StatsOverview = ({ stats }) => {
  const statCards = [
    { label: 'Courses Enrolled', value: stats.enrolled, icon: 'ri-book-read-fill', color: '#6366f1' },
    { label: 'Modules Completed', value: stats.completed, icon: 'ri-checkbox-circle-fill', color: '#10b981' },
    { label: 'Total Experience (XP)', value: stats.totalXP || 0, icon: 'ri-flashlight-fill', color: '#f59e0b' },
    { label: 'Certificates Earned', value: stats.certificates, icon: 'ri-medal-fill', color: '#8b5cf6' },
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
      gap: '24px',
      marginBottom: '40px'
    }}>
      {statCards.map((stat, idx) => (
        <div key={idx} className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: `${stat.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className={stat.icon} style={{ color: stat.color, fontSize: '1.5rem' }}></i>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{stat.label}</p>
              <h3 className="display-title" style={{ fontSize: '1.75rem', color: 'var(--text-main)', margin: 0 }}>{stat.value}</h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
