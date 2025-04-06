/**
 * Academic Configuration
 * 
 * This file contains centralized configuration for academic-related data
 * such as departments, programs, and semesters.
 */

// List of departments
export const departments = [
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Cyber Security'
];

// List of programs
export const programs = [
    'BSc',
    'MSc',
    'Master of Engineering',
    'PhD'
];

// List of semesters
export const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

// Academic year format
export const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
}; 