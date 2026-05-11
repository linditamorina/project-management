import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

// ==========================================
// 1. AUTHENTICATION COMPONENT (LOGIN/REGISTER)
// ==========================================
function AuthPage({ setAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const endpoint = isLogin ? "login" : "register";
      const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, formData);
      
      if (isLogin) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setAuth(true);
      } else {
        setIsLogin(true);
        setFormData({ username: "", email: "", password: "" });
        alert("Registration successful! You can now log in.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred!");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glass-box">
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p>{isLogin ? "Access your project dashboard." : "Join our platform today."}</p>
        
        {error && <div style={{ color: "#ef4444", marginBottom: "15px", fontSize: "14px" }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input 
              type="text" className="auth-input" placeholder="Username" required
              value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          )}
          <input 
            type="email" className="auth-input" placeholder="Email" required
            value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" className="auth-input" placeholder="Password" required
            value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <button type="submit" className="auth-btn">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="auth-switch" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span>{isLogin ? "Register" : "Login"}</span>
        </div>
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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  // Përditësuar për t'u përputhur me MongoDB: projectName dhe projectStatus
  const [formData, setFormData] = useState({
    projectName: "",
    projectStatus: "active",
    client_id: "",
    milestones: [],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  // Funksion ndihmës për të marrë headers me token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const fetchProjects = () => {
    axios.get("http://localhost:5000/api/projects", getAuthHeaders())
      .then((res) => setProjects(res.data))
      .catch((err) => {
        console.error("Fetch error:", err);
        if (err.response && err.response.status === 401) handleLogout();
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(false);
  };

  const getStatusIcon = (status) => {
    const s = status || "active";
    switch (s) {
      case "active": return "🟢";
      case "on_hold": return "🟠";
      case "completed": return "🔵";
      default: return "⚪";
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
      milestones: p.milestones || [] 
    });
    setShowModal(true);
  };

  const openDeleteModal = (id) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/projects/${selectedId}`, getAuthHeaders());
      setShowDeleteModal(false);
      fetchProjects();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error occurred while deleting the project.");
    }
  };

  const handleMilestoneChange = (index, field, value) => {
    const updatedMilestones = formData.milestones.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    );
    setFormData({ ...formData, milestones: updatedMilestones });
  };

  const handleAddMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        { name: "", deadline: new Date().toISOString().split("T")[0], completed: false },
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
        'Authorization': `Bearer ${localStorage.getItem("token")}`,
        'Content-Type': 'application/json'
      }
    };

    if (isEditing) {
      await axios.put(`http://localhost:5000/api/projects/${selectedId}`, formData, config);
    } else {
      // Dërgimi i të dhënave në Backend
      const res = await axios.post("http://localhost:5000/api/projects", formData, config);
      console.log("Project saved successfully!: ", res.data);
    }

    setShowModal(false);
    setIsEditing(false);
    // Resetimi i formës
    setFormData({ projectName: "", projectStatus: "active", client_id: "", milestones: [] });
    fetchProjects(); // Rifresko listën e cards
  } catch (err) {
    console.error("Error details:", err.response?.data);
    alert("Error 400: Please check the console for the missing field.");
  }
};

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({ projectName: "", projectStatus: "active", client_id: "", milestones: [] });
  };

  const calculateProgress = (milestones) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

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
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="compact-grid">
        {projects.map((p) => {
          // Përshtatje për të suportuar fushat e databazës
          const displayTitle = p.projectName || p.title || "Anonimous Project";
          const displayStatus = p.projectStatus || p.status || "active";

          return (
            <div key={p._id} className="compact-card">
              <div className="card-top">
                <h3 className="project-title">{p.projectName}</h3>
                <div className="card-actions">
                  <button className="action-btn edit" onClick={() => handleEditClick(p)} title="Edit">
                    ✏️
                  </button>
                  <button className="action-btn delete" onClick={() => openDeleteModal(p._id)} title="Delete">
                    🗑️
                  </button>
                </div>
              </div>

              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${calculateProgress(p.milestones)}%` }}></div>
              </div>

              <div className="status-row">
                <span className={`status-pill-sm ${p.projectStatus}`}>
                  {getStatusIcon(p.projectStatus)} {p.projectStatus.replace("_", " ")}
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
        })}
      </div>

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
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Client Name"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                />
              </div>

              <select
                className="m-select"
                value={formData.projectStatus}
                onChange={(e) => setFormData({ ...formData, projectStatus: e.target.value })}
              >
                <option value="active">🟢 Active</option>
                <option value="on_hold">🟠 On Hold</option>
                <option value="completed">🔵 Completed</option>
              </select>

              <div className="milestone-adder">
                <div className="m-header">
                  <span>Milestones</span>
                  <button type="button" onClick={handleAddMilestone}>+ Add</button>
                </div>
                {formData.milestones.map((m, idx) => (
                  <div key={idx} className="m-input-row">
                    <input
                      type="text"
                      placeholder="Milestone name"
                      value={m.name}
                      onChange={(e) => handleMilestoneChange(idx, "name", e.target.value)}
                    />
                    <input
                      type="checkbox"
                      checked={m.completed}
                      onChange={(e) => handleMilestoneChange(idx, "completed", e.target.checked)}
                    />
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="close-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="save-btn-sm">Save Changes</button>
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
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
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
          element={!isAuthenticated ? <AuthPage setAuth={setIsAuthenticated} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <Dashboard setAuth={setIsAuthenticated} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;