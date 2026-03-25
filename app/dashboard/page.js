'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import './dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    enrolled: 0, completed: 0, inProgress: 0, certificates: 0
  });
  const [courses, setCourses] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', category: '', progress: 0, url: '', deadline: '' });
  const [generatedSyllabus, setGeneratedSyllabus] = useState(null);

  // AI Planner state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) setUser(JSON.parse(userData));

    fetchDashboardData(token);
    fetchCourses(token);
  }, [router]);

  const fetchDashboardData = async (token) => {
    try {
      const res = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDashboardData(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCourses = async (token) => {
    try {
      const res = await fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCourses(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newCourse, progress: Number(newCourse.progress) })
      });
      if (res.ok) {
        setShowAddCourse(false);
        setNewCourse({ title: '', category: '', progress: 0, url: '', deadline: '' });
        fetchCourses(token);
        fetchDashboardData(token);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGeneratePath = () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    
    // Simulate AI Generation with a realistic payload
    setTimeout(() => {
      setIsGenerating(false);
      const syllabus = {
        topic: aiPrompt,
        modules: [
          { id: 1, title: `Introduction to ${aiPrompt}`, duration: '2 hours', lessons: 4 },
          { id: 2, title: 'Core Concepts & Fundamentals', duration: '5 hours', lessons: 8 },
          { id: 3, title: 'Advanced Implementation', duration: '8 hours', lessons: 12 },
          { id: 4, title: 'Project: Building a Real Application', duration: '12 hours', lessons: 6 }
        ],
        totalDuration: '27 hours'
      };
      setGeneratedSyllabus(syllabus);
    }, 2000);
  };

  const handleEnrollFromSyllabus = async () => {
    if (!generatedSyllabus) return;
    const token = localStorage.getItem('token');
    
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: generatedSyllabus.topic,
        category: 'AI Generated',
        progress: 0,
        status: 'ongoing',
        url: '',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
      })
    });

    if (res.ok) {
      setGeneratedSyllabus(null);
      setAiPrompt('');
      fetchCourses(token);
      fetchDashboardData(token);
      setActiveSection('courses');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/courses?id=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchCourses(token);
      fetchDashboardData(token);
    }
  };

  const handleUpdateProgress = async (id, currentProgress) => {
    const newProgress = prompt('Enter new progress percentage (0-100):', currentProgress);
    if (newProgress === null || isNaN(newProgress)) return;
    
    const token = localStorage.getItem('token');
    const res = await fetch('/api/courses', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        id, 
        progress: parseInt(newProgress),
        status: parseInt(newProgress) === 100 ? 'completed' : 'ongoing'
      })
    });
    if (res.ok) {
      fetchCourses(token);
      fetchDashboardData(token);
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const getThumbColor = (index) => {
    const classes = ['thumb-blue', 'thumb-green', 'thumb-purple', 'thumb-orange'];
    return classes[index % classes.length];
  };

  const getIcon = (category) => {
    const c = category.toLowerCase();
    if (c.includes('web') || c.includes('react')) return 'ri-html5-fill';
    if (c.includes('data') || c.includes('python')) return 'ri-bar-chart-2-fill';
    if (c.includes('design') || c.includes('ui')) return 'ri-palette-fill';
    return 'ri-book-read-fill';
  };

  return (
    <div className="dashboard-layout">
      {/* Educational Sidebar */}
      <aside className="edu-sidebar">
        <div className="sidebar-brand">
          <i className="ri-graduation-cap-fill"></i> EduTrack
        </div>

        <div className="nav-group">
          <div className="nav-label">Main Menu</div>
          <a className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
            <i className="ri-layout-grid-fill"></i> Dashboard
          </a>
          <a className={`nav-item ${activeSection === 'courses' ? 'active' : ''}`} onClick={() => setActiveSection('courses')}>
            <i className="ri-book-open-fill"></i> My Learning
          </a>
          <a className={`nav-item ${activeSection === 'ai-tutor' ? 'active' : ''}`} onClick={() => setActiveSection('ai-tutor')}>
            <i className="ri-robot-2-fill" style={{ color: activeSection==='ai-tutor'?'#fff':'var(--accent-purple)' }}></i> AI Study Plan
          </a>
        </div>

        <div className="nav-group">
          <div className="nav-label">Academic</div>
          <a className={`nav-item ${activeSection === 'certificates' ? 'active' : ''}`} onClick={() => setActiveSection('certificates')}>
            <i className="ri-award-fill"></i> Certificates
          </a>
        </div>

        <div className="sidebar-footer">
          <a className="nav-item" onClick={logout}>
            <i className="ri-logout-circle-r-line"></i> Log Out
          </a>
        </div>
      </aside>

      {/* Main Container */}
      <main className="edu-main">
        {/* Header */}
        <header className="edu-header">
          <div className="search-bar">
            <i className="ri-search-2-line" style={{ color: 'var(--text-muted)' }}></i>
            <input type="text" placeholder="Search courses, mentors, or assignments..." />
          </div>

          <div className="header-actions">
            <button className="icon-btn">
              <i className="ri-notification-3-line"></i>
              <span className="badge">2</span>
            </button>
            <div className="user-profile-btn" onClick={() => setShowDropdown(!showDropdown)} style={{ position: 'relative' }}>
              <div className="user-details">
                <span className="user-name">{user?.name || 'Student'}</span>
                <span className="user-role">Computer Science</span>
              </div>
              <Image src="/assets/user.png" width={40} height={40} className="avatar-img" alt="Student Avatar" />
              <i className="ri-arrow-down-s-line" style={{ color: 'var(--text-muted)' }}></i>
              
              {showDropdown && (
                <div style={{ position: 'absolute', right: 0, top: '50px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem', width: '220px', boxShadow: 'var(--shadow-md)', zIndex: 100 }}>
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name || 'Student Name'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email || 'student@university.edu'}</div>
                  </div>
                  <a style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', color: '#EF4444', borderRadius: '8px' }} onClick={logout} onMouseOver={(e) => e.currentTarget.style.background='#FEE2E2'} onMouseOut={(e) => e.currentTarget.style.background='white'}>
                    <i className="ri-logout-box-r-line"></i> Sign Out
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="edu-view">
          
          {/* SECTION: DASHBOARD OVERVIEW */}
          <section className={`edu-section ${activeSection === 'dashboard' ? 'active' : ''}`}>
            
            <div className="welcome-banner">
              <div className="welcome-text">
                <h1>Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋</h1>
                <p>You've learned for <strong>{(courses.length * 3.5).toFixed(1)} hours</strong> this week. Keep up the great work and stay on top of your assignments.</p>
              </div>
              <div className="welcome-illustration">
                <i className="ri-fire-fill" style={{ fontSize: '2.5rem', color: '#FDE68A' }}></i>
                <div>
                  <h3>{courses.length > 0 ? courses.length * 2 + 3 : 0} Day Streak</h3>
                  <p>{courses.length > 0 ? 'You are on a roll!' : 'Start your streak today!'}</p>
                </div>
              </div>
            </div>

            <div className="student-grid">
              <div className="grid-left">
                <h3 className="panel-title">Continue Learning</h3>
                
                {courses.length > 0 ? (
                  <div className="resume-course-card">
                    <div className="resume-thumb">
                      <i className={getIcon(courses[0].category)}></i>
                    </div>
                    
                    <div className="resume-info">
                      <div className="resume-meta">
                        <span className="resume-category-tag">{courses[0].category}</span>
                        <span className="resume-status-indicator">
                          <span className="pulse-dot"></span> Active Now
                        </span>
                      </div>
                      
                      <h2 className="resume-title">{courses[0].title}</h2>
                      
                      <div className="resume-lesson-info">
                        <i className="ri-book-open-line"></i>
                        <span>Chapter 4: Advanced Concepts & Implementations</span>
                      </div>
                      
                      <div className="resume-progress-section">
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${courses[0].progress}%` }}></div>
                        </div>
                        <span className="progress-percentage">{courses[0].progress}% Complete</span>
                      </div>
                    </div>

                    <div className="resume-action">
                      <button 
                        className="btn-resume-primary"
                        onClick={() => courses[0].url && window.open(courses[0].url, '_blank')}
                      >
                        Resume <i className="ri-arrow-right-line"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="resume-course-card empty-dashboard-card">
                    <div className="empty-content">
                      <div className="empty-icon-circle">
                        <i className="ri-book-3-line"></i>
                      </div>
                      <div className="empty-text">
                        <h4>No Active Courses</h4>
                        <p>Enroll in a course to track your progress and resume learning here.</p>
                      </div>
                      <button className="btn-edu-secondary" onClick={() => setActiveSection('ai-tutor')}>
                        Explore AI Planner
                      </button>
                    </div>
                  </div>
                )}

                <h3 className="panel-title" style={{ marginTop: '2.5rem' }}>Your Statistics</h3>
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-icon icon-blue"><i className="ri-book-read-fill"></i></div>
                    <div className="stat-info">
                      <h4>{courses.length}</h4>
                      <p>Enrolled Courses</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon icon-green"><i className="ri-checkbox-circle-fill"></i></div>
                    <div className="stat-info">
                      <h4>{courses.filter(c => c.status === 'completed').length}</h4>
                      <p>Completed modules</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon icon-orange"><i className="ri-medal-fill"></i></div>
                    <div className="stat-info">
                      <h4>{dashboardData.certificates || 2}</h4>
                      <p>Certificates Earned</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* SECTION: MY LEARNING (COURSES) */}
          <section className={`edu-section ${activeSection === 'courses' ? 'active' : ''}`}>
            <div className="page-header">
              <div>
                <h1 className="page-title">My Learning</h1>
                <p className="page-subtitle">Access all your enrolled courses and active curriculums.</p>
              </div>
              <button className="btn-edu-primary" onClick={() => setShowAddCourse(true)}>
                <i className="ri-add-line"></i> Enroll New Course
              </button>
            </div>

            {/* HEADLESS UI MODAL */}
            <Transition show={showAddCourse} as={Fragment}>
              <Dialog as="div" className="modal-system" onClose={() => setShowAddCourse(false)}>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="modal-overlay" aria-hidden="true" />
                </Transition.Child>

                <div className="modal-container">
                  <div className="modal-content-wrapper">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-out duration-300"
                      enterFrom="opacity-0 scale-95 translateY(30px)"
                      enterTo="opacity-100 scale-100 translateY(0)"
                      leave="ease-in duration-200"
                      leaveFrom="opacity-100 scale-100 translateY(0)"
                      leaveTo="opacity-0 scale-95 translateY(30px)"
                    >
                      <Dialog.Panel className="edu-modal">
                        <div className="modal-header">
                          <Dialog.Title as="h2">Enroll New Course</Dialog.Title>
                          <button className="close-btn" onClick={() => setShowAddCourse(false)}>
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                        
                        <form onSubmit={handleAddCourse}>
                          <div className="form-row">
                            <div>
                              <label className="input-label">Course Title</label>
                              <input className="edu-input" type="text" required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} placeholder="e.g. Introduction to Next.js" />
                            </div>
                            <div>
                              <label className="input-label">Category</label>
                              <input className="edu-input" type="text" value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} placeholder="e.g. Computer Science" />
                            </div>
                          </div>
                          <div className="form-row">
                            <div>
                              <label className="input-label">Course URL</label>
                              <input className="edu-input" type="url" value={newCourse.url} onChange={e => setNewCourse({...newCourse, url: e.target.value})} placeholder="https://..." />
                            </div>
                           </div>
                           <div className="form-row">
                            <div>
                               <label className="input-label">Initial Progress (%)</label>
                               <input className="edu-input" type="number" min="0" max="100" value={newCourse.progress} onChange={e => setNewCourse({...newCourse, progress: e.target.value})} />
                             </div>
                             <div>
                               <label className="input-label">Target Deadline</label>
                               <input className="edu-input" type="date" required value={newCourse.deadline} onChange={e => setNewCourse({...newCourse, deadline: e.target.value})} />
                             </div>
                           </div>
                          <div className="form-row">
                            <div style={{ gridColumn: 'span 2' }}>
                              <label className="input-label">Status</label>
                              <select className="edu-input" value={newCourse.status} onChange={e => setNewCourse({...newCourse, status: e.target.value})}>
                                <option value="ongoing">Currently Studying</option>
                                <option value="completed">Semester Completed</option>
                              </select>
                            </div>
                          </div>
                          <div className="modal-footer flex gap-3">
                            <button type="button" className="btn-secondary flex-1" onClick={() => setShowAddCourse(false)}>Cancel</button>
                            <button type="submit" className="btn-edu-primary flex-1">Add to My Learning</button>
                          </div>
                        </form>
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </div>
              </Dialog>
            </Transition>

            {activeSection === 'courses' && (
              <div className="course-grid">
                {courses.map((course, index) => (
                  <div key={course._id} className="course-card">
                    <div className={`course-thumb ${getThumbColor(index)}`}>
                      <i className={getIcon(course.category)}></i>
                    </div>
                    <div className="course-card-body" onClick={() => course.url && window.open(course.url, '_blank')} style={{ cursor: course.url ? 'pointer' : 'default' }}>
                      <div className="course-category">{course.category}</div>
                      <h3 className="course-card-title">{course.title}</h3>
                      
                      <div className="course-footer">
                        <div className="progress-header">
                          <span>Overall Progress</span>
                          <span className="percent-text">{course.progress}%</span>
                        </div>
                        <div className="progress-track-l" style={{ height: '6px' }}>
                          <div className="progress-fill-l" style={{ width: `${course.progress}%`, background: course.status === 'completed' ? 'var(--secondary)' : 'var(--primary)' }}></div>
                        </div>
                        <div className={`status-badge ${course.status === 'completed' ? 'completed' : ''}`}>
                          {course.status === 'completed' ? <><i className="ri-check-line"></i> Completed</> : 'In Progress'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION: CERTIFICATES */}
          <section className={`edu-section ${activeSection === 'certificates' ? 'active' : ''}`}>
            {activeSection === 'certificates' && (
              <div className="certificates-view animate-in fade-in">
                {courses.filter(c => c.status === 'completed').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.filter(c => c.status === 'completed').map(course => (
                      <div key={course._id} className="bg-white p-6 rounded-3xl border-2 border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4">
                          <i className="ri-verified-badge-fill text-emerald-500 text-3xl"></i>
                        </div>
                        <div className="mb-6">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                            <i className="ri-award-line text-2xl"></i>
                          </div>
                          <h4 className="font-bold text-lg text-slate-900 mb-1">{course.title}</h4>
                          <p className="text-sm text-slate-500">Completed on {new Date(course.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                          <i className="ri-download-cloud-2-line"></i> Download PDF
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="ri-award-line text-4xl text-slate-300"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Certificates Yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Complete your currently enrolled courses to earn verified academic certificates.</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECTION: AI STUDY PLANNER */}
          <section className={`edu-section ${activeSection === 'ai-tutor' ? 'active' : ''}`}>
             <div className="page-header">
              <div>
                <h1 className="page-title">Personal AI Tutor</h1>
                <p className="page-subtitle">Generate custom study plans tailored to your learning goals.</p>
              </div>
            </div>

            <div className="ai-planner-card">
              <div className="ai-icon-large">
                <i className="ri-robot-2-fill"></i>
              </div>
              <h2 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>What do you want to learn today?</h2>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                Tell me your academic goals or subjects you're struggling with, and I'll generate a comprehensive week-by-week study syllabus for you.
              </p>
              
              <div className="ai-input-wrapper">
                <input 
                  type="text" 
                  placeholder="e.g. I want to build a full-stack React application..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isGenerating}
                />
                <div className="flex gap-3">
                  <button className="btn-purple" onClick={handleGeneratePath} disabled={isGenerating}>
                    {isGenerating ? <><i className="ri-loader-4-line spin"></i> Analyzing...</> : <><i className="ri-magic-line"></i> Draft Plan</>}
                  </button>
                </div>
              </div>

              {generatedSyllabus && (
                <div className="generated-syllabus">
                  <div className="syllabus-header-card">
                    <div>
                      <h3 className="syllabus-title line-clamp-2">{generatedSyllabus.topic}</h3>
                      <div className="syllabus-meta">
                        <span><i className="ri-time-line"></i> <strong>{generatedSyllabus.totalDuration}</strong> hours</span>
                        <span><i className="ri-book-open-line"></i> <strong>{generatedSyllabus.modules.length}</strong> Modules</span>
                        <span><i className="ri-award-line"></i> <strong>Verified</strong> Syllabus</span>
                      </div>
                    </div>
                    <div>
                      <button className="btn-enroll-ai" onClick={handleEnrollFromSyllabus}>
                      <i className="ri-add-circle-line"></i> Enroll in Workspace
                    </button>
                    </div>
                  </div>
                  
                  <div className="syllabus-grid">
                    {generatedSyllabus.modules.map(module => (
                      <div key={module.id} className="syllabus-module-item">
                        <div className="module-number">{module.id}</div>
                        <div className="module-details">
                          <h5>{module.title}</h5>
                          <p>{module.lessons} lessons • {module.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <style jsx>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    </div>
  );
}
