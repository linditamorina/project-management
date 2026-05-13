import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import "./App.css";
import UserProfileModal from "./UserProfileModal";

// ==========================================
// 1. AUTHENTICATION COMPONENT (LOGIN/REGISTER)
// ==========================================
function AuthPage({ setAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const endpoint = isLogin ? "login" : "register";
      const res = await axios.post(
        `http://localhost:5000/api/auth/${endpoint}`,
        formData,
      );

      if (isLogin) {
        localStorage.setItem("token", res.data.token);
        // Ensure we always have a username and email for the profile UI
        const userData = {
          _id: res.data.user?._id || res.data.user?.id, // Capture DB ID
          ...(res.data.user || {}),
          username:
            res.data.user?.username ||
            res.data.user?.name ||
            formData.username ||
            formData.email.split("@")[0],
          email: res.data.user?.email || formData.email,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        setAuth(true);
      } else {
        setIsLogin(true);
        setFormData({ username: "", email: "", password: "" });
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred!");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glass-box">
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p>
          {isLogin
            ? "Access your project dashboard."
            : "Join our platform today."}
        </p>

        {error && (
          <div
            style={{ color: "#ef4444", marginBottom: "15px", fontSize: "14px" }}
          >
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              className="auth-input"
              placeholder="Username"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          )}
          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
          <button type="submit" className="auth-btn">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="auth-switch" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span>{isLogin ? "Register" : "Login"}</span>
        </div>

        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="auth-success-modal">
              <div className="success-icon-circle">✔</div>
              <h3>Registration Successful!</h3>
              <p>
                Your account has been created. You can now log in to access your
                dashboard.
              </p>
              <button
                className="auth-btn"
                onClick={() => setShowSuccessModal(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. DASHBOARD COMPONENT (PROJECT MANAGEMENT)
// ==========================================
function Dashboard({ setAuth }) {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'on_hold', 'completed'
  const [selectedId, setSelectedId] = useState(null);

  // Përditësuar për t'u përputhur me MongoDB: projectName dhe projectStatus
  const [formData, setFormData] = useState({
    projectName: "",
    projectStatus: "active",
    client_id: "",
    milestones: [],
  });

  // Debugging check: if this logs "undefined", the file path or export is wrong
  useEffect(() => {
    console.log(
      "UserProfileModal Component Status:",
      UserProfileModal ? "Loaded" : "Undefined",
    );
  }, []);

  // Get the logged-in user data
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}"),
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get("http://localhost:5000/api/projects", { headers })
      .then((res) => setProjects(res.data))
      .catch((err) => {
        console.error("Fetch error:", err);
        if (err.response && err.response.status === 401) handleLogout();
      });
  };

  // Helper for other calls
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(false);
  };

  const getStatusIcon = (status) => {
    const s = status || "active";
    switch (s) {
      case "active":
        return "🟢";
      case "on_hold":
        return "🟠";
      case "completed":
        return "🔵";
      default:
        return "⚪";
    }
  };

  const handleEditClick = (p) => {
    setIsEditing(true);
    setSelectedId(p._id);
    // Sigurohemi që të dhënat mbushen saktë (duke përfshirë rastet kur db e vjetër ka 'title')
    setFormData({
      projectName: p.projectName || p.title || "",
      projectStatus: p.projectStatus || p.status || "active",
      client_id: p.client_id || "",
      milestones: p.milestones || [],
    });
    setShowModal(true);
  };

  const openDeleteModal = (id) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/projects/${selectedId}`,
        getAuthHeaders(),
      );
      setShowDeleteModal(false);
      fetchProjects();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error occurred while deleting the project.");
    }
  };

  const handleMilestoneChange = (index, field, value) => {
    const updatedMilestones = formData.milestones.map((m, i) =>
      i === index ? { ...m, [field]: value } : m,
    );
    setFormData({ ...formData, milestones: updatedMilestones });
  };

  const handleAddMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          name: "",
          deadline: new Date().toISOString().split("T")[0],
          completed: false,
        },
      ],
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Kontroll i fundit para dërgimit
    if (!formData.projectName || !formData.client_id) {
      alert("Please fill in the project name and client!");
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      };

      if (isEditing) {
        await axios.put(
          `http://localhost:5000/api/projects/${selectedId}`,
          formData,
          config,
        );
      } else {
        // Dërgimi i të dhënave në Backend
        const res = await axios.post(
          "http://localhost:5000/api/projects",
          formData,
          config,
        );
        console.log("Project saved successfully!: ", res.data);
      }

      setShowModal(false);
      setIsEditing(false);
      // Resetimi i formës
      setFormData({
        projectName: "",
        projectStatus: "active",
        client_id: "",
        milestones: [],
      });
      fetchProjects(); // Rifresko listën e cards
    } catch (err) {
      console.error("Error details:", err.response?.data);
      alert("Error 400: Please check the console for the missing field.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({
      projectName: "",
      projectStatus: "active",
      client_id: "",
      milestones: [],
    });
  };

  const calculateProgress = (milestones) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  // REAL-TIME FILTERING LOGIC
  const filteredProjects = projects.filter((p) => {
    const name = (p.projectName || p.title || "").toLowerCase();
    const status = p.projectStatus || p.status || "active";
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="dashboard">
      <header className="compact-header">
        <h1>
          Project<span className="vision-text">Vision</span>
        </h1>
        <div className="header-actions">
          <button className="add-btn-sm" onClick={() => setShowModal(true)}>
            + New Project
          </button>
          <button
            className="profile-btn-sm"
            onClick={() => setShowProfileModal(true)}
            title={user.username || "My Profile"}
          >
            {user.username ? user.username.charAt(0).toUpperCase() : "U"}
          </button>
        </div>
      </header>

      {projects.length > 0 && (
        <div className="dashboard-controls">
          <div className="search-bar-container">
            <span className="search-icon-inside">🔍</span>
            <input
              type="text"
              placeholder="Search projects by name..."
              className="dashboard-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-pill-container">
            <select
              className="dashboard-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚀</div>
          <h2>Welcome, {user.username || "Visionary"}!</h2>
          <p>
            Your dashboard is looking a bit quiet. Start bringing your ideas to
            life by creating your first project.
          </p>
          <button className="add-btn-main" onClick={() => setShowModal(true)}>
            Get Started
          </button>
        </div>
      ) : (
        <div className="compact-grid">
          {filteredProjects.length === 0 ? (
            <div className="no-results">
              <p>No projects match your search or filter.</p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              return (
                <div key={p._id} className="compact-card">
                  <div className="card-top">
                    <h3 className="project-title">{p.projectName}</h3>
                    <div className="card-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditClick(p)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => openDeleteModal(p._id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="progress-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${calculateProgress(p.milestones)}%` }}
                    ></div>
                  </div>

                  <div className="status-row">
                    <span className={`status-pill-sm ${p.projectStatus}`}>
                      {getStatusIcon(p.projectStatus)}{" "}
                      {p.projectStatus.replace("_", " ")}
                    </span>
                    <p className="client-sm">
                      Client: <span>{p.client_id || "N/A"}</span>
                    </p>
                  </div>

                  {p.milestones && p.milestones.length > 0 && (
                    <div className="mini-milestones">
                      {p.milestones.map((m, i) => (
                        <div key={i} className="m-dot">
                          <span className="dot"></span>
                          <span className="m-name">{m.name}</span>
                          {m.completed ? "✅" : "⏳"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* PROJECT FORM MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-sm">
            <h3>{isEditing ? "Edit Project" : "Create New Project"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Project Title"
                  value={formData.projectName}
                  onChange={(e) =>
                    setFormData({ ...formData, projectName: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Client Name"
                  value={formData.client_id}
                  onChange={(e) =>
                    setFormData({ ...formData, client_id: e.target.value })
                  }
                  required
                />
              </div>

              <select
                className="m-select"
                value={formData.projectStatus}
                onChange={(e) =>
                  setFormData({ ...formData, projectStatus: e.target.value })
                }
              >
                <option value="active">🟢 Active</option>
                <option value="on_hold">🟠 On Hold</option>
                <option value="completed">🔵 Completed</option>
              </select>

              <div className="milestone-adder">
                <div className="m-header">
                  <span>Milestones</span>
                  <button type="button" onClick={handleAddMilestone}>
                    + Add
                  </button>
                </div>
                {formData.milestones.map((m, idx) => (
                  <div key={idx} className="m-input-row">
                    <input
                      type="text"
                      placeholder="Milestone name"
                      value={m.name}
                      onChange={(e) =>
                        handleMilestoneChange(idx, "name", e.target.value)
                      }
                    />
                    <input
                      type="checkbox"
                      checked={m.completed}
                      onChange={(e) =>
                        handleMilestoneChange(
                          idx,
                          "completed",
                          e.target.checked,
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content-delete">
            <div className="warning-icon">⚠️</div>
            <h3>Delete Project?</h3>
            <p>Are you sure? This action cannot be undone.</p>
            <div className="modal-footer">
              <button
                className="delete-modal-cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onLogout={handleLogout}
        onUpdate={(updatedUser) => setUser(updatedUser)} // KJO ESHTE E RENDESISHME
      />
    </div>
  );
}

// ==========================================
// 3. MAIN APP COMPONENT (ROUTING)
// ==========================================
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for an existing token on page refresh
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <AuthPage setAuth={setIsAuthenticated} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Dashboard setAuth={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
