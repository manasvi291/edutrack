'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import '../../components/design-system.css';

export default function LaunchpadPage() {
  const router = useRouter();
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [theme, setTheme] = useState('dark');

  const fetchCourse = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/courses?id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCourse(await res.json());
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.body.setAttribute('data-theme', storedTheme);
    fetchCourse();
  }, [fetchCourse]);

  const calculateCourseProgress = (updatedModules) => {
    const totalUnits = updatedModules.reduce((acc, m) => acc + Math.max(1, m.subModules?.length || 0), 0);
    const completedUnits = updatedModules.reduce((acc, m) => {
      if (m.subModules && m.subModules.length > 0) {
        return acc + m.subModules.filter(sm => sm.completed).length;
      }
      return acc + (m.completed ? 1 : 0);
    }, 0);
    
    const progress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
    const status = progress === 100 ? 'completed' : 'ongoing';
    return { progress, status };
  };

  const toggleSubModule = async (moduleIdx, subModuleIdx) => {
    const token = localStorage.getItem('token');
    const updatedModules = [...course.modules];
    const updatedSubModules = [...updatedModules[moduleIdx].subModules];
    
    updatedSubModules[subModuleIdx] = { 
      ...updatedSubModules[subModuleIdx], 
      completed: !updatedSubModules[subModuleIdx].completed 
    };
    
    updatedModules[moduleIdx] = { 
      ...updatedModules[moduleIdx], 
      subModules: updatedSubModules 
    };

    const allSubCompleted = updatedSubModules.every(sm => sm.completed);
    updatedModules[moduleIdx].completed = allSubCompleted;

    const { progress, status } = calculateCourseProgress(updatedModules);
    setCourse({ ...course, modules: updatedModules, progress, status });

    try {
      await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          id: course._id, 
          modules: updatedModules,
          progress,
          status
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const generateQuiz = async () => {
    const activeModule = course.modules?.[activeModuleIdx];
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

  const handleNextModuleWithMastery = async () => {
    const token = localStorage.getItem('token');
    const updatedModules = [...course.modules];
    const currentModSubModules = (updatedModules[activeModuleIdx].subModules || []).map(sm => ({ ...sm, completed: true }));
    
    updatedModules[activeModuleIdx] = { 
      ...updatedModules[activeModuleIdx], 
      subModules: currentModSubModules,
      completed: true 
    };

    const { progress, status } = calculateCourseProgress(updatedModules);
    setCourse({ ...course, modules: updatedModules, progress, status });
    const nextIdx = Math.min(course.modules.length - 1, activeModuleIdx + 1);
    setActiveModuleIdx(nextIdx);
    setQuiz(null);
    setQuizScore(null);

    try {
      await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          id: course._id, 
          modules: updatedModules,
          progress,
          status
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="gradient-text display-title" style={{ fontSize: '1.5rem' }}>Preparing Study Lab...</div>
      </div>
    );
  }

  const activeModule = course?.modules?.[activeModuleIdx];

  if (!activeModule) {
    return (
      <div className="glass-panel" style={{ margin: '100px auto', maxWidth: '600px', padding: '60px', textAlign: 'center' }}>
        <h2 className="display-title" style={{ marginBottom: '24px' }}>Curriculum Required</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>This course needs an AI roadmap. Please return to the dashboard and generate one for "{course.title}".</p>
        <button className="btn-premium btn-premium-primary" onClick={() => router.push('/dashboard')}>Return to Dashboard</button>
      </div>
    );
  }

  const openYoutubeSearch = () => {
    const query = `${activeModule.title} ${course.title} tutorial`;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', color: 'var(--text-main)', fontFamily: 'var(--font-main)', overflow: 'hidden' }}>
      
      {/* Dynamic Sidebar */}
      <div style={{ width: '280px', flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-glass)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, marginBottom: '20px', padding: 0 }}>
             <i className="ri-arrow-left-s-line" style={{ fontSize: '1.25rem' }}></i> Dashboard
          </button>
          <div style={{ marginBottom: '16px' }}>
            <h2 className="display-title" style={{ fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: '1.3' }}>{course.title}</h2>
          </div>
          <div className="progress-container" style={{ height: '4px', background: 'rgba(255,255,255,0.03)' }}>
            <div className="progress-fill" style={{ width: `${(course.progress || 0)}%` }}></div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px', fontWeight: 700 }}>{(course.progress || 0)}% COMPLETE</p>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {course.modules.map((mod, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveModuleIdx(idx); setQuiz(null); setQuizScore(null); }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeModuleIdx === idx ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                color: activeModuleIdx === idx ? 'var(--primary)' : 'var(--text-muted)',
                marginBottom: '4px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: (mod.completed && activeModuleIdx !== idx) ? 0.7 : 1
              }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                border: '1.5px solid', 
                borderColor: mod.completed ? '#10b981' : (activeModuleIdx === idx ? 'var(--primary)' : 'var(--border)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                color: mod.completed ? '#10b981' : 'inherit',
                flexShrink: 0,
                background: mod.completed ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
              }}>
                {mod.completed ? <i className="ri-check-line"></i> : idx + 1}
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Study Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', position: 'relative' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Module Header */}
          <div style={{ marginBottom: '40px' }} className="animate-in fade-in slide-in-from-top duration-500">
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Module {activeModuleIdx + 1} / {course.modules.length}
                </span>
             </div>
             <h1 className="display-title gradient-text" style={{ fontSize: '2.5rem', marginBottom: '16px', lineHeight: '1.2' }}>{activeModule.title}</h1>
             <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '800px' }}>{activeModule.description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '60px', alignItems: 'start' }}>
            
            {/* Left Column: Lessons & Quiz */}
            <div className="animate-in fade-in slide-in-from-left duration-700 delay-200">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <i className="ri-list-check" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}></i>
                <h3 className="display-title" style={{ fontSize: '1.25rem' }}>Lesson Checklist</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '48px' }}>
                {activeModule.subModules?.map((sub, sIdx) => (
                  <label key={sIdx} className="glass-card" style={{ 
                    padding: '16px 20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    cursor: sub.completed ? 'default' : 'pointer',
                    borderLeft: sub.completed ? '3px solid #10b981' : '3px solid transparent',
                    background: sub.completed ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-glass)',
                    pointerEvents: sub.completed ? 'none' : 'auto',
                    opacity: sub.completed ? 0.8 : 1
                  }}>
                    <div style={{ position: 'relative', width: '22px', height: '22px', flexShrink: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={sub.completed} 
                        onChange={() => toggleSubModule(activeModuleIdx, sIdx)}
                        disabled={sub.completed}
                        style={{ position: 'absolute', opacity: 0, cursor: 'pointer' }}
                      />
                      <div style={{ 
                        width: '22px', height: '22px', borderRadius: '6px', border: '2px solid', 
                        borderColor: sub.completed ? '#10b981' : 'var(--border)', 
                        background: sub.completed ? '#10b981' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem'
                      }}>
                        {sub.completed && <i className="ri-check-line"></i>}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', color: sub.completed ? 'var(--text-dim)' : 'var(--text-main)' }}>{sub.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sub.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Enhanced Quiz Section */}
              <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--border-glow)', background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.03) 0%, rgba(15, 23, 42, 0) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ri-brain-fill" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}></i>
                    </div>
                    <div>
                      <h3 className="display-title" style={{ fontSize: '1.25rem' }}>Assessment</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Validate your mastery of this module</p>
                    </div>
                  </div>
                </div>

                {!quiz ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <button 
                      className="btn-premium btn-premium-primary" 
                      onClick={generateQuiz}
                      disabled={quizLoading}
                      style={{ width: '100%', padding: '16px', gap: '12px' }}
                    >
                      {quizLoading ? <><i className="ri-loader-4-line animate-spin"></i> Generating...</> : <><i className="ri-flashlight-line"></i> Generate AI Quiz</>}
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '16px' }}>Available only after completing the module lessons.</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-500">
                    {!quizScore ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {quiz.questions.map((q, qIdx) => (
                          <div key={qIdx} className="glass-card" style={{ padding: '20px', border: 'none', background: 'rgba(255,255,255,0.02)' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>
                              <span style={{ color: 'var(--primary)', marginRight: '8px' }}>{qIdx + 1}.</span> {q.question}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                              {q.options.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => setUserAnswers({ ...userAnswers, [qIdx]: oIdx })}
                                  style={{
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '1.5px solid',
                                    borderColor: userAnswers[qIdx] === oIdx ? 'var(--primary)' : 'var(--border)',
                                    background: userAnswers[qIdx] === oIdx ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    color: userAnswers[qIdx] === oIdx ? 'var(--primary)' : 'var(--text-main)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontWeight: userAnswers[qIdx] === oIdx ? 600 : 400
                                  }}
                                >
                                  {opt}
                                  {userAnswers[qIdx] === oIdx && <i className="ri-checkbox-circle-fill"></i>}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button className="btn-premium btn-premium-primary" onClick={submitQuiz} style={{ width: '100%' }}>
                          Finalize Submission
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '8px solid var(--border)', borderTopColor: 'var(--primary)' }}></div>
                           <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{quizScore.score}/{quizScore.total}</div>
                        </div>
                        <h4 className="display-title gradient-text" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                          {quizScore.score === quizScore.total ? '🎉 Mastery Achieved!' : 'Good Effort!'}
                        </h4>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                          {quizScore.score === quizScore.total 
                            ? "You've absolutely nailed this module! You're ready to move forward to the next stage of your journey." 
                            : "You're almost there! A bit more practice on the lessons above will help you achieve a perfect score."}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button className="btn-premium btn-premium-outline" style={{ flex: 1 }} onClick={() => setQuiz(null)}>Try Again</button>
                          {quizScore.score === quizScore.total && (
                             <button className="btn-premium btn-premium-primary" style={{ flex: 1 }} onClick={handleNextModuleWithMastery}>Next Module</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Resources & Insights */}
            <div className="animate-in fade-in slide-in-from-right duration-700 delay-400">
              
              {/* Learning Resources Card */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '5rem', color: 'rgba(99, 102, 241, 0.05)', zIndex: 0 }}>
                  <i className="ri-youtube-line"></i>
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 className="display-title" style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ri-external-link-line" style={{ color: 'var(--primary)' }}></i> External Resources
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                    Dive deeper into <strong>{activeModule.title}</strong> with world-class tutorials and explainers.
                  </p>
                  <button 
                    onClick={openYoutubeSearch}
                    className="btn-premium btn-premium-primary" 
                    style={{ width: '100%', gap: '10px', fontSize: '0.8rem' }}
                  >
                    <i className="ri-youtube-fill" style={{ fontSize: '1.1rem' }}></i> Watch Tutorials on YouTube
                  </button>
                </div>
              </div>

              {/* AI Study Insight */}
              <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border-glow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <i className="ri-lightbulb-flash-line" style={{ color: '#f59e0b', fontSize: '1.25rem' }}></i>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Expert Insight</h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "Focus on mastering the concept of <strong>{activeModule.subModules?.[0]?.title || activeModule.title}</strong> first. It's the building block for everything else in this module."
                </p>
              </div>
              
              {/* Navigation Help */}
              <div style={{ marginTop: '32px', padding: '0 12px' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Quick shortcuts</h5>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <kbd style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Esc</kbd> Exit Study Lab
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <kbd style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>G</kbd> Generate new quiz
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
