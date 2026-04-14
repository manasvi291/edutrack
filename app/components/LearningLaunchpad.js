import React, { useState, useEffect } from 'react';
import './design-system.css';

const LearningLaunchpad = ({ course, onToggleSubModule, onClose }) => {
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);

  const activeModule = course.modules?.[activeModuleIdx];

  const generateQuiz = async () => {
    if (!activeModule) return;
    setQuizLoading(true);
    setQuizScore(null);
    setUserAnswers({});
    try {
      const res = await fetch('/api/ai-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle: activeModule.title,
          moduleDescription: activeModule.description
        })
      });
      const data = await res.json();
      if (data.quiz) setQuiz(data.quiz);
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = () => {
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) score++;
    });
    setQuizScore({ score, total: quiz.questions.length });
  };

  if (!course.modules || course.modules.length === 0) {
    return (
      <div className="glass-panel animate-in fade-in" style={{ 
        position: 'fixed', top: '20vh', left: '20vw', width: '60vw', padding: '60px', zIndex: 1000, textAlign: 'center' 
      }}>
        <h2 className="display-title" style={{ marginBottom: '24px' }}>Curriculum Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>This course doesn't have an AI-generated syllabus yet. Please use the AI Study Plan to generate a roadmap first.</p>
        <button className="btn-premium btn-premium-primary" onClick={onClose}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-in fade-in slide-in-from-bottom" style={{ 
      position: 'fixed', 
      top: '5vh', 
      left: '5vw', 
      width: '90vw', 
      height: '90vh', 
      zIndex: 1000, 
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Sidebar: Module Navigation */}
      <div style={{ width: '320px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <h2 className="display-title gradient-text" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Launchpad</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{course.title}</p>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {course.modules.map((mod, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveModuleIdx(idx); setQuiz(null); setQuizScore(null); }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: activeModuleIdx === idx ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: activeModuleIdx === idx ? 'var(--primary)' : 'var(--text-muted)',
                marginBottom: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: '2px solid', 
                borderColor: mod.completed ? '#10b981' : (activeModuleIdx === idx ? 'var(--primary)' : 'var(--text-dim)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: mod.completed ? '#10b981' : 'inherit',
                flexShrink: 0
              }}>
                {mod.completed ? <i className="ri-check-line"></i> : idx + 1}
              </div>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {mod.title}
              </span>
            </button>
          ))}
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
          <button className="btn-premium btn-premium-outline" onClick={onClose} style={{ width: '100%' }}>
            Exit Launchpad
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', width: '100%', flex: 1, overflowY: 'auto' }}>
          
          <div style={{ marginBottom: '40px' }}>
             <span style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
               Module {activeModuleIdx + 1}
             </span>
             <h1 className="display-title" style={{ fontSize: '2.5rem', marginTop: '8px', marginBottom: '16px' }}>{activeModule?.title}</h1>
             <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{activeModule?.description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }}>
            
            {/* Left: Lessons & Resources */}
            <div>
              <h3 className="display-title" style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Lessons</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
                {activeModule?.subModules?.map((sub, sIdx) => (
                  <label key={sIdx} className="glass-card" style={{ 
                    padding: '16px 20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: sub.completed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={sub.completed} 
                      onChange={() => onToggleSubModule(activeModuleIdx, sIdx)}
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        accentColor: 'var(--primary)',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ 
                      flex: 1, 
                      color: sub.completed ? 'var(--text-dim)' : 'var(--text-main)',
                      textDecoration: sub.completed ? 'line-through' : 'none',
                      fontSize: '1rem'
                    }}>{sub.title}</span>
                  </label>
                ))}
              </div>

              <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
                <i className="ri-youtube-line" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '16px', display: 'block' }}></i>
                <h4 className="display-title" style={{ marginBottom: '12px' }}>Master this module</h4>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>We've curated specific tutorials to help you master these concepts.</p>
                <button 
                  className="btn-premium btn-premium-primary"
                  onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(activeModule.searchKeywords)}`, '_blank')}
                >
                  Watch Recommended Tutorials
                </button>
              </div>
            </div>

            {/* Right: AI Tutor & Quizzes */}
            <div>
              <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: 0 }}>
                <h3 className="display-title" style={{ fontSize: '1.125rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ri-magic-line" style={{ color: 'var(--accent)' }}></i> AI Knowledge Check
                </h3>
                
                {!quiz ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
                      Ready to test your knowledge? Generate a custom AI quiz based on this module.
                    </p>
                    <button 
                      className="btn-premium btn-premium-outline" 
                      disabled={quizLoading} 
                      onClick={generateQuiz}
                      style={{ width: '100%' }}
                    >
                      {quizLoading ? 'Generating...' : 'Generate New Quiz'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {quiz.questions.map((q, qIdx) => (
                      <div key={qIdx}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>{qIdx + 1}. {q.question}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {q.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => !quizScore && setUserAnswers({...userAnswers, [qIdx]: oIdx})}
                              style={{
                                textAlign: 'left',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: userAnswers[qIdx] === oIdx ? 'var(--primary)' : 'var(--border)',
                                background: userAnswers[qIdx] === oIdx ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                cursor: quizScore ? 'default' : 'pointer'
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {!quizScore ? (
                      <button className="btn-premium btn-premium-primary" onClick={submitQuiz}>
                        Submit Quiz
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Your Score: {quizScore.score}/{quizScore.total}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          {quizScore.score === quizScore.total ? "Excellent! You've mastered this." : "Keep practicing to improve!"}
                        </p>
                        <button className="btn-premium btn-premium-outline" style={{ marginTop: '16px', width: '100%' }} onClick={() => setQuiz(null)}>
                          Try Another Quiz
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default LearningLaunchpad;
