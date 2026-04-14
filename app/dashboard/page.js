"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, Transition } from "@headlessui/react";

// New Design System & Components
import "../components/design-system.css";
import Sidebar from "../components/Sidebar";
import StatsOverview from "../components/StatsOverview";
import CourseGrid from "../components/CourseGrid";
import CertificateView from "../components/CertificateView";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [dashboardData, setDashboardData] = useState({
    enrolled: 0,
    completed: 0,
    inProgress: 0,
    certificates: 0,
  });
  const [courses, setCourses] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    category: "",
    progress: 0,
    url: "",
    deadline: "",
  });
  const [generatedSyllabus, setGeneratedSyllabus] = useState(null);
  const [updateProgressCourse, setUpdateProgressCourse] = useState(null);
  const [newProgressValue, setNewProgressValue] = useState(0);

  // AI Planner state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const storedTheme = localStorage.getItem("theme") || "dark";

    if (!token) {
      router.push("/login");
      return;
    }

    setTheme(storedTheme);
    document.body.setAttribute("data-theme", storedTheme);

    if (userData) setUser(JSON.parse(userData));

    fetchDashboardData(token);
    fetchCourses(token);
  }, [router]);

  const fetchDashboardData = async (token) => {
    try {
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const res = await fetch("/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newCourse,
          progress: Number(newCourse.progress),
        }),
      });
      if (res.ok) {
        setShowAddCourse(false);
        setNewCourse({
          title: "",
          category: "",
          progress: 0,
          url: "",
          deadline: "",
        });
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
      const res = await fetch("/api/ai-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (res.ok && data.syllabus) {
        setGeneratedSyllabus(data.syllabus);
      } else {
        alert(data.error || "Failed to generate syllabus.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnrollFromSyllabus = async () => {
    if (!generatedSyllabus) return;
    const token = localStorage.getItem("token");
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: generatedSyllabus.topic,
        category: "AI Generated",
        progress: 0,
        status: "ongoing",
        url: "",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        modules: generatedSyllabus.modules.map((m) => ({
          ...m,
          completed: false,
          subModules: m.subModules.map((sm) => ({ ...sm, completed: false })),
        })),
      }),
    });

    if (res.ok) {
      setGeneratedSyllabus(null);
      setAiPrompt("");
      fetchCourses(token);
      fetchDashboardData(token);
      setActiveSection("courses");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/courses?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      fetchCourses(token);
      fetchDashboardData(token);
    }
  };

  const onCourseClick = (course) => {
    router.push(`/launchpad/${course._id}`);
  };

  const submitUpdateProgress = async (e) => {
    e.preventDefault();
    if (!updateProgressCourse) return;

    const token = localStorage.getItem("token");
    const newProgress = parseInt(newProgressValue);

    const res = await fetch("/api/courses", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: updateProgressCourse._id,
        progress: newProgress,
        status: newProgress === 100 ? "completed" : "ongoing",
      }),
    });

    if (res.ok) {
      setUpdateProgressCourse(null);
      const token = localStorage.getItem("token");
      fetchCourses(token);
      fetchDashboardData(token);
    }
  };

  const handleGenerateSyllabusForCourse = async (course) => {
    const token = localStorage.getItem("token");
    setIsGenerating(true);
    try {
      const res = await fetch("/api/courses/generate-syllabus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: course._id }),
      });
      if (res.ok) {
        fetchCourses(token);
        fetchDashboardData(token);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCertificate = async (courseId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/certificates?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate_${courseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-main)",
        minHeight: "100vh",
        color: "var(--text-main)",
        fontFamily: "var(--font-main)",
        transition: "all 0.3s ease",
      }}
    >
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        logout={logout}
        toggleTheme={toggleTheme}
        theme={theme}
      />

      <main style={{ marginLeft: "320px", padding: "40px 60px" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "60px",
          }}
        >
          <div>
            <h1
              className="display-title gradient-text"
              style={{ fontSize: "2.5rem", marginBottom: "8px" }}
            >
              Welcome back, {dashboardData.userName?.split(" ")[0] || user?.name?.split(" ")[0] || "Explorer"}!
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
              You've earned <strong>{dashboardData.totalXP || 0} XP</strong> in total. Keep the momentum
              going!
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div
              className="glass-panel"
              style={{
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                borderRadius: " var(--radius-md)",
              }}
            >
              <i
                className="ri-fire-fill"
                style={{ color: "#f59e0b", fontSize: "1.25rem" }}
              ></i>
              <span style={{ fontWeight: 700 }}>{dashboardData.streak || 0} Day Streak</span>
            </div>
            <Image
              src="/assets/user.png"
              width={48}
              height={48}
              style={{
                borderRadius: "12px",
                border: "2px solid var(--border)",
              }}
              alt="User"
            />
          </div>
        </header>

        {/* Dynamic Section Rendering */}
        {activeSection === "dashboard" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <StatsOverview stats={dashboardData} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 340px",
                gap: "40px",
              }}
            >
              <div>
                <h2
                  className="display-title"
                  style={{
                    fontSize: "1.5rem",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <i
                    className="ri-play-circle-line"
                    style={{ color: "var(--primary)" }}
                  ></i>{" "}
                  Resume Learning
                </h2>
                {courses.length > 0 ? (
                  <CourseGrid
                    courses={[
                      courses.find((c) => c.status === "ongoing") || courses[0],
                    ]}
                    onCourseClick={onCourseClick}
                    onDeleteCourse={handleDeleteCourse}
                    onUpdateProgress={(c) => {
                      setUpdateProgressCourse(c);
                      setNewProgressValue(c.progress);
                    }}
                    onGenerateSyllabus={handleGenerateSyllabusForCourse}
                  />
                ) : (
                  <div
                    className="glass-panel"
                    style={{ padding: "60px", textAlign: "center" }}
                  >
                    <p
                      style={{
                        color: "var(--text-muted)",
                        marginBottom: "24px",
                      }}
                    >
                      No active courses. Ready to start something new?
                    </p>
                    <button
                      className="btn-premium btn-premium-primary"
                      onClick={() => setActiveSection("ai-tutor")}
                    >
                      Generate Your First Plan
                    </button>
                  </div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: "32px" }}>
                <h3
                  className="display-title"
                  style={{ fontSize: "1.1rem", marginBottom: "24px" }}
                >
                  Weekly Activity
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "12px",
                    height: "140px",
                    paddingBottom: "20px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {dashboardData.weeklyActivity ? dashboardData.weeklyActivity.map((dayData, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${Math.min(100, (dayData.xp / 100) * 100)}%`,
                        background:
                          dayData.xp > 0 ? "var(--primary)" : "rgba(128,128,128,0.1)",
                        borderRadius: "4px",
                        minHeight: '4px'
                      }}
                    ></div>
                  )) : [40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        background:
                          i === 3 ? "var(--primary)" : "rgba(128,128,128,0.1)",
                        borderRadius: "4px",
                      }}
                    ></div>
                  ))}
                </div>
                <div style={{ marginTop: "24px" }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Learning Velocity
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                      24m/day
                    </span>
                    <span
                      style={{
                        color: "#10b981",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      +15%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "courses" && (
          <div className="animate-in fade-in slide-in-from-right duration-500">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "40px",
              }}
            >
              <div>
                <h2 className="display-title" style={{ fontSize: "2rem" }}>
                  My Learning Journey
                </h2>
                <p style={{ color: "var(--text-muted)" }}>
                  Manage and continue your enrolled specializations.
                </p>
              </div>
              <div>
                <button
                  className="btn-premium btn-premium-primary"
                  onClick={() => setShowAddCourse(true)}
                >
                  <i className="ri-add-line"></i> Enroll New Course
                </button>
              </div>
            </div>
            <CourseGrid
              courses={courses}
              onCourseClick={onCourseClick}
              onDeleteCourse={handleDeleteCourse}
              onUpdateProgress={(c) => {
                setUpdateProgressCourse(c);
                setNewProgressValue(c.progress);
              }}
              onGenerateSyllabus={handleGenerateSyllabusForCourse}
            />
          </div>
        )}

        {activeSection === "ai-tutor" && (
          <div
            className="animate-in fade-in slide-in-from-bottom duration-500"
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              textAlign: "center",
              padding: "60px 0",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "rgba(99, 102, 241, 0.1)",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 32px",
              }}
            >
              <i
                className="ri-robot-2-fill"
                style={{ fontSize: "2.5rem", color: "var(--primary)" }}
              ></i>
            </div>
            <h2
              className="display-title"
              style={{ fontSize: "2.5rem", marginBottom: "16px" }}
            >
              What do you want to master today?
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1.1rem",
                marginBottom: "48px",
              }}
            >
              Our AI will craft a personalized step-by-step roadmap tailored to
              your specific goals.
            </p>

            <div
              className="glass-panel"
              style={{ padding: "8px", display: "flex", gap: "8px" }}
            >
              <input
                type="text"
                placeholder="e.g. Master React and Next.js in 4 weeks..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  padding: "16px 24px",
                  color: "var(--text-main)",
                  fontSize: "1.1rem",
                  outline: "none",
                }}
              />
              <div>
                <button
                  className="btn-premium btn-premium-primary"
                  disabled={isGenerating}
                  onClick={handleGeneratePath}
                  style={{ paddingX: "0 32px" }}
                >
                  {isGenerating ? "Analyzing..." : "Generate Roadmap"}
                </button>
              </div>
            </div>

            {generatedSyllabus && (
              <div
                className="glass-panel animate-in zoom-in"
                style={{
                  marginTop: "48px",
                  padding: "40px",
                  textAlign: "left",
                }}
              >
                <h3
                  className="display-title"
                  style={{ fontSize: "1.5rem", marginBottom: "24px" }}
                >
                  Proposed: {generatedSyllabus.topic}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    marginBottom: "32px",
                  }}
                >
                  {generatedSyllabus.modules.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: "16px" }}>
                      <div style={{ color: "var(--primary)", fontWeight: 800 }}>
                        {i + 1}.
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, marginBottom: "4px" }}>
                          {m.title}
                        </h4>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {m.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-premium btn-premium-primary"
                  onClick={handleEnrollFromSyllabus}
                  style={{ width: "100%" }}
                >
                  Enroll and Start Learning
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === "certificates" && (
          <CertificateView
            courses={courses}
            onDownload={handleDownloadCertificate}
          />
        )}

        {/* MODALS */}

        {/* Update Progress Manual Modal */}
        <Transition show={!!updateProgressCourse} as={Fragment}>
          <Dialog
            as="div"
            className="modal-system"
            onClose={() => setUpdateProgressCourse(null)}
            style={{ position: "fixed", zIndex: 1001 }}
          >
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(4px)",
              }}
            />
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <Dialog.Panel
                className="glass-panel"
                style={{ width: "100%", maxWidth: "400px", padding: "32px" }}
              >
                <h3
                  className="display-title"
                  style={{ fontSize: "1.25rem", marginBottom: "24px" }}
                >
                  Update Progress
                </h3>
                <form onSubmit={submitUpdateProgress}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newProgressValue}
                    onChange={(e) =>
                      setNewProgressValue(Number(e.target.value))
                    }
                    style={{
                      width: "100%",
                      marginBottom: "24px",
                      accentColor: "var(--primary)",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 800,
                      textAlign: "center",
                      marginBottom: "32px",
                    }}
                  >
                    {newProgressValue}%
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="button"
                      className="btn-premium btn-premium-outline"
                      style={{ flex: 1 }}
                      onClick={() => setUpdateProgressCourse(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-premium btn-premium-primary"
                      style={{ flex: 1 }}
                    >
                      Save
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        {/* Add Course Manual Modal */}
        <Transition show={showAddCourse} as={Fragment}>
          <Dialog
            as="div"
            className="modal-system"
            onClose={() => setShowAddCourse(false)}
            style={{ position: "fixed", zIndex: 1001 }}
          >
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(4px)",
              }}
            />
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <Dialog.Panel
                className="glass-panel"
                style={{ width: "100%", maxWidth: "500px", padding: "32px" }}
              >
                <h3
                  className="display-title"
                  style={{ fontSize: "1.25rem", marginBottom: "24px" }}
                >
                  Enroll Manually
                </h3>
                <form
                  onSubmit={handleAddCourse}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <input
                    className="glass-panel"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      padding: "12px 16px",
                      color: "inherit",
                      borderRadius: "8px",
                    }}
                    placeholder="Course Title"
                    required
                    value={newCourse.title}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, title: e.target.value })
                    }
                  />
                  <input
                    className="glass-panel"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      padding: "12px 16px",
                      color: "inherit",
                      borderRadius: "8px",
                    }}
                    placeholder="Category"
                    value={newCourse.category}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, category: e.target.value })
                    }
                  />
                  <input
                    className="glass-panel"
                    type="date"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      padding: "12px 16px",
                      color: "inherit",
                      borderRadius: "8px",
                    }}
                    required
                    value={newCourse.deadline}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, deadline: e.target.value })
                    }
                  />
                  <div
                    style={{ display: "flex", gap: "12px", marginTop: "12px" }}
                  >
                    <button
                      type="button"
                      className="btn-premium btn-premium-outline"
                      style={{ flex: 1 }}
                      onClick={() => setShowAddCourse(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-premium btn-premium-primary"
                      style={{ flex: 1 }}
                    >
                      Enroll
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>
      </main>
    </div>
  );
}
