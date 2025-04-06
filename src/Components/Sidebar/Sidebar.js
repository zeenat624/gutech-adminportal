import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaUser, FaBook, FaChalkboardTeacher, FaUserGraduate, FaCalendarAlt, FaCog } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
    const menuItems = [
        {
            title: 'Dashboard',
            path: '/',
            icon: <FaHome />
        },
        {
            title: 'Users',
            path: '/users',
            icon: <FaUser />
        },
        {
            title: 'Courses',
            path: '/courses',
            icon: <FaBook />
        },
        {
            title: 'Teachers',
            path: '/teachers',
            icon: <FaChalkboardTeacher />
        },
        {
            title: 'Students',
            path: '/students',
            icon: <FaUserGraduate />
        },
        {
            title: 'Course Registration',
            path: '/course-registration',
            icon: <FaBook />
        },
        {
            title: 'Assign Section',
            path: '/assign-section',
            icon: <FaCalendarAlt />
        },
        {
            title: 'Settings',
            path: '/settings',
            icon: <FaCog />
        }
    ];

    return (
        <div className="sidebar">
            <div className="logo">
                <h2>Admin Portal</h2>
            </div>
            <nav>
                <ul>
                    {menuItems.map((item, index) => (
                        <li key={index}>
                            <Link to={item.path}>
                                {item.icon}
                                <span>{item.title}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar; 