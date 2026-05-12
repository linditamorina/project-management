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
    username: user?.username || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync form data only when the modal opens to prevent resetting inputs while typing
  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: user?.username || user?.name || '',
        password: '',
        confirmPassword: ''
      });
      setIsEditing(false);
      setError('');
      setSuccess('');
    }
  }, [isOpen]); // Only reset when the modal is first opened to allow editing

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!formData.username.trim()) {
      return setError("Username cannot be empty!");
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match!");
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Prepare data - sending username, name, and email for backend identification
      const updateData = { 
        email: user.email,
        username: formData.username, 
        name: formData.username 
      };
      
      if (formData.password) updateData.password = formData.password;

      const res = await axios.put('http://localhost:5000/api/auth/update', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sync updated data back to the app state
      const updatedUser = {
        ...user,
        username: res.data.user?.username || res.data.user?.name || formData.username,
        email: res.data.user?.email || user.email,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      onUpdate(updatedUser);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => {
        setIsEditing(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error("Full Error Response:", err.response);
      setError(err.response?.data?.message || "Server Error: Update failed. Please ensure the backend supports PUT /api/auth/update.");
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

export default UserProfileModal;