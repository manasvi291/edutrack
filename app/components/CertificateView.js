import React from 'react';
import './design-system.css';

const CertificateCard = ({ course, onDownload }) => {
  const completionDate = new Date(course.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ 
        width: '64px', 
        height: '64px', 
        borderRadius: '16px', 
        background: 'rgba(16, 185, 129, 0.1)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '24px',
        color: '#10b981'
      }}>
        <i className="ri-award-fill" style={{ fontSize: '2.5rem' }}></i>
      </div>
      
      <h3 className="display-title" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{course.title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>Completed on {completionDate}</p>
      
      <div style={{ 
        width: '100%', 
        padding: '16px', 
        border: '1px dashed var(--border)', 
        borderRadius: '12px', 
        marginBottom: '24px',
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Verified by SkillTrack
      </div>
      
      <button 
        className="btn-premium btn-premium-primary" 
        style={{ width: '100%' }}
        onClick={() => onDownload(course._id)}
      >
        <i className="ri-download-cloud-2-line" style={{ marginRight: '8px' }}></i> Download PDF
      </button>
    </div>
  );
};

const CertificateView = ({ courses, onDownload }) => {
  const completedCourses = courses.filter(c => c.status === 'completed');

  return (
    <div className="animate-in fade-in slide-in-from-bottom duration-500">
      <div style={{ marginBottom: '40px' }}>
        <h2 className="display-title" style={{ fontSize: '2rem' }}>Your Achievements</h2>
        <p style={{ color: 'var(--text-muted)' }}>You've earned certificates for the following specializations.</p>
      </div>
      
      {completedCourses.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '32px' 
        }}>
          {completedCourses.map(course => (
            <CertificateCard key={course._id} course={course} onDownload={onDownload} />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '80px', textAlign: 'center' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: 'rgba(255,255,255,0.03)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 32px' 
          }}>
            <i className="ri-medal-line" style={{ fontSize: '3rem', color: 'var(--text-dim)' }}></i>
          </div>
          <h3 className="display-title" style={{ fontSize: '1.5rem', marginBottom: '16px' }}>No Certificates Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 32px' }}>
            Complete all modules of a course to earn your official certificate of completion.
          </p>
          <button className="btn-premium btn-premium-outline">
            Resume My Learning
          </button>
        </div>
      )}
    </div>
  );
};

export default CertificateView;
