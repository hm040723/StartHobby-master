import React from 'react';
import { useAuth } from '../context/AuthContext'; 
import { CgProfile } from 'react-icons/cg'; 
import '../styles/Profile.css'; 

function Profile() {
  const { user } = useAuth(); // Get the user from your AuthContext

  // If the user is not logged in, you can show a message or redirect them.
  if (!user) {
    return (
      <div className="profile-container">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className='title'>My Profile</div>
      <div className='profile-details'>
        <div className="profile-picture-container">
                {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="profile-picture" />
                ) : (
                <CgProfile size={100} /> // Display a default icon if no photo
                )}
        </div>

        <div className="user-info">
            <div className="detail-item">
                <strong className="detail-label">Name:</strong>
                <span>{user.displayName || 'Not provided'}</span>
            </div>
            <div className="detail-item">
                <strong className="detail-label">Email:</strong>
                <span>{user.email || 'Not provided'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;