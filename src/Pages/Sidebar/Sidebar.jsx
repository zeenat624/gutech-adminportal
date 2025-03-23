// Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './sidebar.css';

const Sidebar = ({ isOpen, activePage, onNavClick }) => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));
  
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'marks', label: 'Marks', icon: '📄' },
    { id: 'transcript', label: 'Transcript', icon: '📜' },
    { id: 'timetable', label: 'Timetable', icon: '📆' },
    { id: 'fees', label: 'Fees', icon: '💵' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];
  
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">P</div>
          <span className="logo-text">Portal</span>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navigationItems.map(item => (
          <a 
            key={item.id}
            href="#"
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${item.id}`);
              onNavClick(item.id); // Call the handler from parent
            }}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-text">{item.label}</span>
          </a>
        ))}
      </nav>
      
      {/* User Section */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-content">
          <div className="user-avatar-small">
            <span>GU</span>
          </div>
          <div className="user-info">
            <span className="user-name-small">{user?.name}</span>
            <a href="#" className="user-profile-link">View Profile</a>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;