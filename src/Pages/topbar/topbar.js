import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './topbar.css';

const Topbar = ({ toggleSidebar, isSidebarOpen }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const user = JSON.parse(sessionStorage.getItem('user'));

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/'); // Redirect to login page
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Mobile hamburger menu */}
        <div className="header-mobile-toggle">
          <button className="hamburger-button" onClick={toggleSidebar}>
            <span className={`hamburger-icon ${isSidebarOpen ? 'active' : ''}`}></span>
          </button>
        </div>

        {/* Logo for mobile */}
        <div className="header-logo-mobile">
          <div className="logo">
            <img src={`${process.env.PUBLIC_URL}/gulogo.svg`} alt="GUtech Logo" className="gulogo" />
          </div>
        </div>

        {/* Right navigation */}
        <nav className="header-nav">
          <a href="#" className="header-nav-item">Help</a>
          <a href="#" className="header-nav-item">Support</a>
          <a href="#" className="header-nav-item notification-icon">
            <span>🔔</span>
            <span className="notification-badge">3</span>
          </a>
          
          {/* User profile */}
          <div className="user-profile">
            <div className="user-avatar" onClick={toggleProfileMenu}>
              <span>JD</span>
            </div>
            
            {/* Profile dropdown menu */}
            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <span className="profile-name">{user?.name}</span>
                  <span className="profile-email">{user?.email}</span>
                </div>
                <div className="profile-menu">
                  <a href="#" className="profile-menu-item">My Profile</a>
                  <a href="#" className="profile-menu-item">Account Settings</a>
                  <a href="#" className="profile-menu-item">Preferences</a>
                  <div className="profile-divider"></div>
                  <a href="#" className="profile-menu-item logout" onClick={handleLogout}>
                    Logout
                  </a>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Topbar;
