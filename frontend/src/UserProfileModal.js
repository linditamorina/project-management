import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfileModal.css';

/**
 * UserProfileModal Component
 * Integrated to work with the App.js localStorage logic.
 */
const UserProfileModal = ({ isOpen, onClose, user, onLogout, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync form data whenever the modal opens to ensure latest user data is used
  useEffect(() => {
    if (isOpen && !isEditing) {
      setFormData({
        username: String(user?.username || user?.name || ''),
        password: '',
        confirmPassword: ''
      });
      setError('');
      setSuccess('');
    }
  }, [isOpen, isEditing, user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!formData.username || !formData.username.trim()) {
      return setError("Username cannot be empty!");
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match!");
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Prepare data - sending username and email for backend identification
      const updateData = { 
        userId: user?._id || user?.id, // Send the database ID
        email: user?.email,           // Fallback identifier
        username: formData.username, 
        name: formData.username 
      };
      
      if (formData.password) updateData.password = formData.password;

      const res = await axios.put('http://localhost:5000/api/auth/update', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedUser = {
        ...user,
        ...res.data.user, // Prioritize data returned from server
        username: res.data.user?.username || formData.username,
        email: res.data.user?.email || user?.email,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      onUpdate(updatedUser);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => {
        setIsEditing(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      console.error("Full Error Response:", err.response);
      const serverMessage = err.response?.data?.message;
      const statusText = err.response?.status === 404 ? "Route not found (404). Check backend server.js" : "Update failed.";
      setError(serverMessage || statusText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>My Profile</h3>
          <button className="modal-close-x" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}
          
          {!isEditing ? (
            <>
              <div className="info-field">
                <label>Username</label>
                <p>{user?.username || 'Guest User'}</p>
              </div>
              <div className="info-field">
                <label>Email Address</label>
                <p>{user?.email || 'No email available'}</p>
              </div>
              <div className="info-field">
                <label>Account Status</label>
                <p>🟢 Active</p>
              </div>
            </>
          ) : (
            <>
              <div className="edit-field">
                <label>New Username</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                />
              </div>
              <div className="edit-field">
                <label>Change Password</label>
                <input 
                  type="password" 
                  placeholder="New password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <input 
                  type="password" 
                  placeholder="Confirm new password"
                  style={{ marginTop: '8px' }}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {!isEditing ? (
            <>
              <button className="btn-secondary" onClick={() => setIsEditing(true)}>Edit Profile</button>
              <button className="btn-danger" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Exporting explicitly to prevent "undefined" import issues
export default UserProfileModal;