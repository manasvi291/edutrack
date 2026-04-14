import React, { useState } from 'react';
import './design-system.css';

const CourseCard = ({ course, onCourseClick, onDeleteCourse, onUpdateProgress, onGenerateSyllabus, index }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getIcon = (category) => {
    const c = category.toLowerCase();
    if (c.includes('web') || c.includes('react')) return 'ri-html5-fill';
    if (c.includes('data') || c.includes('python')) return 'ri-bar-chart-2-fill';
    if (c.includes('design') || c.includes('ui')) return 'ri-palette-fill';
    return 'ri-book-read-fill';
  };

  const getThemeColor = (idx) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return colors[idx % colors.length];
  };

  const themeColor = getThemeColor(index);

  return (
    <div className="glass-card" style={{ 
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Accent Header */}
      <div style={{ 
        height: '6px', 
        width: '100%', 
        background: `linear-gradient(90deg, ${themeColor}, ${themeColor}dd)` 
      }}></div>
      
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: `${themeColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeColor
          }}>
            <i className={getIcon(course.category)} style={{ fontSize: '1.25rem' }}></i>
          </div>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              <i className="ri-more-2-fill" style={{ fontSize: '1.2rem' }}></i>
            </button>
            
            {showMenu && (
              <div className="glass-panel" style={{ 
                position: 'absolute', 
                right: 0, 
                top: '30px', 
                zIndex: 10, 
                width: '180px', 
                padding: '8px',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <button 
                  onClick={() => { onUpdateProgress(course); setShowMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="ri-pencil-line"></i> Update Progress
                </button>
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
                <button 
                  onClick={() => { onDeleteCourse(course._id); setShowMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="ri-delete-bin-line"></i> Delete Course
                </button>
              </div>
            )}
          </div>
        </div>

        <p style={{ color: themeColor, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          {course.category}
        </p>
        <h3 className="display-title" style={{ fontSize: '1.25rem', marginBottom: '20px', lineHeight: '1.4' }}>
          {course.title}
        </h3>

        <div style={{ marginBottom: '24px' }} onClick={() => onCourseClick(course)}>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
             <span style={{ color: 'var(--text-muted)' }}>Progress</span>
             <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{course.progress}%</span>
           </div>
           <div className="progress-container">
             <div className="progress-fill" style={{ width: `${course.progress}%`, background: `linear-gradient(90deg, ${themeColor}, ${themeColor}aa)` }}></div>
           </div>
        </div>

        <button 
          className="btn-premium btn-premium-primary"
          onClick={() => (!course.modules || course.modules.length === 0) ? (onGenerateSyllabus && onGenerateSyllabus(course)) : onCourseClick(course)}
          style={{ width: '100%', fontSize: '0.875rem' }}
        >
          {(!course.modules || course.modules.length === 0) ? (
            <><i className="ri-magic-line" style={{ marginRight: '8px' }}></i> Generate AI Roadmap</>
          ) : (
            <>
              {course.progress === 100 ? 'View Certificate' : 'Continue Learning'}
              <i className="ri-arrow-right-line" style={{ marginLeft: '8px' }}></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const CourseGrid = ({ courses, onCourseClick, onDeleteCourse, onUpdateProgress, onGenerateSyllabus }) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
      gap: '32px' 
    }}>
      {courses.map((course, idx) => (
        <CourseCard 
          key={course._id} 
          course={course} 
          index={idx}
          onCourseClick={onCourseClick}
          onDeleteCourse={onDeleteCourse}
          onUpdateProgress={onUpdateProgress}
          onGenerateSyllabus={onGenerateSyllabus}
        />
      ))}
    </div>
  );
};

export default CourseGrid;
