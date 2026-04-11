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
  const [selectedCourseForTracking, setSelectedCourseForTracking] = useState(null);
  const [updateProgressCourse, setUpdateProgressCourse] = useState(null);
  const [newProgressValue, setNewProgressValue] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [downloadingCertificateId, setDownloadingCertificateId] = useState(null);

  // AI Planner state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

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
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) setDashboardData(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCourses = async (token) => {
    try {
      const res = await fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        logout();
        return;
      }
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
      if (res.status === 401) {
        logout();
        return;
      }
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

  const handleGeneratePath = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    
    try {
      const res = await fetch('/api/ai-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      
      const data = await res.json();
      
      if (res.ok && data.syllabus) {
        setGeneratedSyllabus(data.syllabus);
      } else {
        alert(data.error || 'Failed to generate syllabus. Please checking your API key or try again.');
      }
    } catch (error) {
      console.error('Error generating path:', error);
      alert('An unexpected error occurred while generating the study plan.');
    } finally {
      setIsGenerating(false);
    }
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
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
        modules: generatedSyllabus.modules.map(m => ({ ...m, completed: false }))
      })
    });

    if (res.status === 401) {
      logout();
      return;
    }

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
    if (res.status === 401) {
      logout();
      return;
    }
    if (res.ok) {
      fetchCourses(token);
      fetchDashboardData(token);
    }
  };

  const handleCourseClick = (course) => {
    if (course.modules && course.modules.length > 0) {
      setSelectedCourseForTracking(course);
    } else if (course.url) {
      window.open(course.url, '_blank');
    }
  };

  const handleToggleModule = async (course, moduleId) => {
    // Optimistic UI update
    const updatedModules = course.modules.map(mod => 
      mod.id === moduleId ? { ...mod, completed: !mod.completed } : mod
    );
    
    // Calculate new progress
    const completedCount = updatedModules.filter(m => m.completed).length;
    const newProgress = Math.round((completedCount / updatedModules.length) * 100);
    const newStatus = newProgress === 100 ? 'completed' : 'ongoing';

    const updatedCourse = { ...course, modules: updatedModules, progress: newProgress, status: newStatus };
    
    setSelectedCourseForTracking(updatedCourse);
    setCourses(courses.map(c => c._id === course._id ? updatedCourse : c));

    const token = localStorage.getItem('token');
    try {
      await fetch('/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          id: course._id, 
          modules: updatedModules,
          progress: newProgress,
          status: newStatus
        })
      });
      fetchDashboardData(token);
    } catch (err) {
      console.error(err);
    }
  };

  const submitUpdateProgress = async (e) => {
    e.preventDefault();
    if (!updateProgressCourse) return;
    
    const token = localStorage.getItem('token');
    const newProgress = parseInt(newProgressValue);
    
    const res = await fetch('/api/courses', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        id: updateProgressCourse._id, 
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : 'ongoing'
      })
    });
    
    if (res.status === 401) {
      logout();
      return;
    }
    
    if (res.ok) {
      setUpdateProgressCourse(null);
      fetchCourses(token);
      fetchDashboardData(token);
    }
  };

  const handleDownloadCertificate = async (courseId) => {
    setDownloadingCertificateId(courseId);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/certificates?courseId=${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to generate certificate');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${courseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Error generating certificate. Please try again.');
    } finally {
      setDownloadingCertificateId(null);
    }
  };



  const getNextUpModule = (course) => {
    if (!course || !course.modules || course.modules.length === 0) return null;
    return course.modules.find(m => !m.completed) || course.modules[course.modules.length - 1];
  };

  const getUpcomingDeadlines = () => {
    return courses
      .filter(c => c.deadline && c.status !== 'completed')
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3);
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
                  (() => {
                    const activeCourse = courses.find(c => c.status === 'ongoing') || courses[0];
                    const nextModule = getNextUpModule(activeCourse);
                    return (
                      <div className="resume-course-card shadow-premium" onClick={() => handleCourseClick(activeCourse)} style={{ cursor: 'pointer' }}>
                        <div className="resume-thumb">
                          <i className={getIcon(activeCourse.category)}></i>
                        </div>
                        
                        <div className="resume-info">
                          <div className="resume-meta">
                            <span className="resume-category-tag">{activeCourse.category}</span>
                            <span className="resume-status-indicator">
                              <span className="pulse-dot"></span> Current Goal
                            </span>
                          </div>
                          
                          <h2 className="resume-title">{activeCourse.title}</h2>
                          
                          {nextModule && (
                            <div className="resume-lesson-info highlight-next">
                              <i className="ri-play-circle-line"></i>
                              <span>Next Up: {nextModule.title}</span>
                            </div>
                          )}
                          
                          <div className="resume-progress-section">
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{ width: `${activeCourse.progress}%` }}></div>
                            </div>
                            <span className="progress-percentage">{activeCourse.progress}% Complete</span>
                          </div>
                        </div>

                        <div className="resume-action">
                          <button className="btn-resume-primary">
                            Resume <i className="ri-arrow-right-line"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })()
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
                      <h4>{courses.reduce((acc, c) => acc + (c.modules?.filter(m => m.completed).length || 0), 0)}</h4>
                      <p>Completed modules</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon icon-orange"><i className="ri-medal-fill"></i></div>
                    <div className="stat-info">
                      <h4>{courses.filter(c => c.status === 'completed').length}</h4>
                      <p>Certificates Earned</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid-right">
                <div className="upcoming-deadlines side-panel">
                  <h3 className="panel-title">Upcoming Deadlines</h3>
                  <div className="deadline-list">
                    {getUpcomingDeadlines().length > 0 ? getUpcomingDeadlines().map((course) => {
                      const d = new Date(course.deadline);
                      return (
                        <div key={course._id} className="deadline-item">
                          <div className="deadline-date">
                            <span className="month">{d.toLocaleString('default', { month: 'short' })}</span>
                            <span className="day">{d.getDate()}</span>
                          </div>
                          <div className="deadline-details">
                            <h4>{course.title}</h4>
                            <p>{Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24))} days left</p>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="text-sm text-slate-400 italic">No approaching deadlines.</p>
                    )}
                  </div>
                </div>

                <div className="side-panel">
                  <h3 className="panel-title">Quick Actions</h3>
                  <div className="flex flex-col gap-3">
                    <button className="btn-edu-secondary w-full text-left flex items-center gap-3" onClick={() => setActiveSection('ai-tutor')}>
                      <i className="ri-magic-line text-purple-500"></i> New AI Plan
                    </button>
                    <button className="btn-edu-secondary w-full text-left flex items-center gap-3" onClick={() => setActiveSection('courses')}>
                      <i className="ri-folders-line text-blue-500"></i> Browse Courses
                    </button>
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

            {/* TRACKING MODAL */}
            <Transition show={!!selectedCourseForTracking} as={Fragment}>
              <Dialog as="div" className="modal-system" onClose={() => setSelectedCourseForTracking(null)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <div className="modal-overlay" aria-hidden="true" />
                </Transition.Child>

                <div className="modal-container">
                  <div className="modal-content-wrapper">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translateY(30px)" enterTo="opacity-100 scale-100 translateY(0)" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translateY(0)" leaveTo="opacity-0 scale-95 translateY(30px)">
                      <Dialog.Panel className="edu-modal tracking-modal-panel">
                        {selectedCourseForTracking && (
                          <>
                            <div className="modal-header">
                              <div>
                                <Dialog.Title as="h2">{selectedCourseForTracking.title}</Dialog.Title>
                                <p className="text-sm text-slate-500 mt-1">{selectedCourseForTracking.progress}% Completed</p>
                              </div>
                              <button className="close-btn" onClick={() => setSelectedCourseForTracking(null)}>
                                <i className="ri-close-line"></i>
                              </button>
                            </div>
                            
                            <div className="tracking-progress-bar-container">
                              <div className="tracking-progress-fill" style={{ width: `${selectedCourseForTracking.progress}%` }}></div>
                            </div>
                            
                            <div className="module-list-container active-launchpad">
                              {selectedCourseForTracking.modules.map(module => (
                                <div key={module.id} className={`module-resource-card ${module.completed ? 'completed' : ''}`}>
                                  <div className="module-card-main">
                                    <label className="module-check-wrapper">
                                      <input 
                                        type="checkbox" 
                                        checked={module.completed} 
                                        onChange={() => handleToggleModule(selectedCourseForTracking, module.id)}
                                        className="tracking-checkbox"
                                      />
                                      <div className="custom-checkbox">
                                        <i className="ri-check-line"></i>
                                      </div>
                                    </label>
                                    <div className="module-content">
                                      <div className="module-flex-header">
                                        <h4>{module.title}</h4>
                                        <span className="module-duration-tag">{module.duration}</span>
                                      </div>
                                      <p className="module-desc">{module.description || 'Focus on mastering the core principles of this unit.'}</p>
                                      
                                      <div className="module-actions-row">
                                        {module.searchKeywords && (
                                          <button 
                                            className="btn-launch-resource"
                                            onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(module.searchKeywords)}`, '_blank')}
                                          >
                                            <i className="ri-youtube-line"></i> Watch Tutorials
                                          </button>
                                        )}
                                        <span className="lesson-count">{module.lessons} Lessons</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                              <button type="button" className="btn-edu-primary w-full" onClick={() => setSelectedCourseForTracking(null)}>
                                Close Tracker
                              </button>
                            </div>
                          </>
                        )}
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </div>
              </Dialog>
            </Transition>

            {/* MANUAL UPDATE PROGRESS MODAL */}
            <Transition show={!!updateProgressCourse} as={Fragment}>
              <Dialog as="div" className="modal-system" onClose={() => setUpdateProgressCourse(null)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <div className="modal-overlay" aria-hidden="true" />
                </Transition.Child>

                <div className="modal-container">
                  <div className="modal-content-wrapper">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translateY(30px)" enterTo="opacity-100 scale-100 translateY(0)" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translateY(0)" leaveTo="opacity-0 scale-95 translateY(30px)">
                      <Dialog.Panel className="edu-modal">
                        <div className="modal-header">
                          <Dialog.Title as="h2">Update Progress</Dialog.Title>
                          <button className="close-btn" onClick={() => setUpdateProgressCourse(null)}>
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                        
                        <form onSubmit={submitUpdateProgress}>
                          <div className="form-row" style={{ display: 'block', marginBottom: '2rem' }}>
                            <label className="input-label mb-4">Set your current progress (0-100%)</label>
                            <input 
                              type="range" 
                              min="0" max="100" 
                              value={newProgressValue} 
                              onChange={e => setNewProgressValue(Number(e.target.value))}
                              style={{ width: '100%', marginBottom: '1rem', cursor: 'pointer' }}
                            />
                            <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>
                              {newProgressValue}%
                            </div>
                          </div>
                          
                          <div className="modal-footer flex gap-3">
                            <button type="button" className="btn-secondary flex-1" onClick={() => setUpdateProgressCourse(null)}>Cancel</button>
                            <button type="submit" className="btn-edu-primary flex-1">Save Progress</button>
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
                    <div className="course-card-body" onClick={() => handleCourseClick(course)} style={{ cursor: (course.modules?.length > 0 || course.url) ? 'pointer' : 'default', position: 'relative' }}>
                      
                      {/* ACTION MENU */}
                      <div className="course-actions-menu" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === course._id ? null : course._id); }}>
                        <i className="ri-more-2-fill"></i>
                        {openMenuId === course._id && (
                          <div className="course-dropdown-menu animate-in fade-in zoom-in">
                            <button onClick={(e) => { e.stopPropagation(); setUpdateProgressCourse(course); setNewProgressValue(course.progress); setOpenMenuId(null); }}>
                              <i className="ri-pencil-fill"></i> Update Progress
                            </button>
                            <div className="dropdown-divider"></div>
                            <button className="delete-action" onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course._id); setOpenMenuId(null); }}>
                              <i className="ri-delete-bin-fill"></i> Delete Course
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="course-category mt-2">{course.category}</div>
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
                  <div className="certificates-grid">
                    {courses.filter(c => c.status === 'completed').map(course => (
                      <div key={course._id} className="certificate-card group">
                        <div className="cert-verified-badge">
                          <i className="ri-verified-badge-fill"></i>
                        </div>
                        <div className="cert-card-content">
                          <div className="cert-icon-container">
                            <i className="ri-award-line"></i>
                          </div>
                          <h4 className="cert-course-title">{course.title}</h4>
                          <p className="cert-course-date">Completed on {new Date(course.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <button 
                          className="btn-cert-download" 
                          onClick={() => handleDownloadCertificate(course._id)}
                          disabled={downloadingCertificateId === course._id}
                        >
                          {downloadingCertificateId === course._id ? (
                            <><i className="ri-loader-4-line spinner"></i> Generating PDF...</>
                          ) : (
                            <><i className="ri-download-cloud-2-line"></i> Download PDF</>
                          )}
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
