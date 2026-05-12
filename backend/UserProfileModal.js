import React from 'react';
import './UserProfileModal.css';

/**
 * UserProfileModal Component
 * Displays name and email of the authenticated user.
 */
const UserProfileModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Profile</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="info-field">
            <label>Name</label>
            <p>{user?.name || 'Guest User'}</p>
          </div>
          <div className="info-field">
            <label>Email Address</label>
            <p>{user?.email || 'No email available'}</p>
          </div>
          {/* You can extend this with fields like Role or Membership Date */}
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;