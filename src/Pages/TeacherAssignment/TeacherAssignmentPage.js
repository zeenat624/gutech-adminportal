import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { departments, programs, semesters } from '../../config/academicConfig';
import { FiInfo, FiX } from 'react-icons/fi';
import './TeacherAssignmentPage.css';

const TeacherAssignmentPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [showHelp, setShowHelp] = useState(true);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Add axios interceptor for handling connection errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.code === 'ECONNRESET' || error.code === 'ECONNABORTED') {
          setError('Connection to server was lost. Please try again.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Clear success message when filters change
  useEffect(() => {
    setSuccess(null);
  }, [selectedDepartment, selectedProgram, selectedSemester, selectedCourse]);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    let timer;
    if (success) {
      timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);

  useEffect(() => {
    if (selectedDepartment && selectedProgram && selectedSemester) {
      fetchCourses();
      fetchTeachers();
    }
  }, [selectedDepartment, selectedProgram, selectedSemester]);

  useEffect(() => {
    if (selectedCourse) {
      fetchSections();
    }
  }, [selectedCourse]);

  // Add this useEffect to clear error messages when section changes
  useEffect(() => {
    if (selectedSection) {
      setError(null); // Clear any existing error messages when section changes
      fetchStudents();
    } else {
      setStudents([]); // Clear students when no section is selected
    }
  }, [selectedSection]);

  // Helper function to retry API calls
  const retryApiCall = async (apiCall, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        return await apiCall();
      } catch (err) {
        retries++;
        if (retries === maxRetries) {
          throw err;
        }
        // Wait for 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const encodedDepartment = encodeURIComponent(selectedDepartment);
      const encodedProgram = encodeURIComponent(selectedProgram);
      const encodedSemester = encodeURIComponent(selectedSemester);
      
      const token = sessionStorage.getItem('token');
      const response = await retryApiCall(() => 
        axios.get(`${apiUrl}/api/courses/department/${encodedDepartment}/program/${encodedProgram}/semester/${encodedSemester}`, {
          headers: { 'x-auth-token': token }
        })
      );
      setCourses(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await retryApiCall(() => 
        axios.get(`${apiUrl}/api/teachers`, {
          headers: { 'x-auth-token': token }
        })
      );
      // Filter teachers by department on the frontend
      const filteredTeachers = response.data.filter(teacher => 
        teacher.department === selectedDepartment
      );
      setTeachers(filteredTeachers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch teachers. Please try again.');
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await retryApiCall(() => 
        axios.get(`${apiUrl}/api/section/course/${selectedCourse}`, {
          headers: { 'x-auth-token': token }
        })
      );
      setSections(response.data);
    } catch (err) {
      console.error('Error fetching sections:', err);
      setError(err.response?.data?.message || 'Failed to fetch sections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!selectedSection) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/api/course-registration/getStudents/${selectedSection}`, {
        headers: { 'x-auth-token': token }
      });
      setStudents(response.data);
      
      if (response.data && response.data.length > 0) {
        setError(null);
      } else {
        setError('No students are currently enrolled in this section');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setStudents([]);
        setError('No students are currently enrolled in this section');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch students');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourse || !selectedTeacher) {
      setError('Please select both course and teacher');
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      await retryApiCall(() => 
        axios.post(`${apiUrl}/api/section`, {
          courseId: selectedCourse,
          teacherId: selectedTeacher,
          section: `Section ${sections.length + 1}`
        }, {
          headers: { 'x-auth-token': token }
        })
      );
      setSuccess('Teacher assigned successfully');
      fetchSections();
      setSelectedTeacher('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign teacher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTeacher) {
      setError('Please select a teacher');
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      await retryApiCall(() => 
        axios.put(`${apiUrl}/api/section/${editingSection.id}`, {
          teacherId: selectedTeacher,
          section: editingSection.section
        }, {
          headers: { 'x-auth-token': token }
        })
      );
      setSuccess('Teacher assignment updated successfully');
      fetchSections();
      setSelectedTeacher('');
      setEditingSection(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (sectionId) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      await retryApiCall(() => 
        axios.delete(`${apiUrl}/api/section/${sectionId}`, {
          headers: { 'x-auth-token': token }
        })
      );
      setSuccess('Section removed successfully');
      fetchSections();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove section. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedDepartment('');
    setSelectedProgram('');
    setSelectedSemester('');
    setSelectedCourse('');
    setSelectedTeacher('');
    setCourses([]);
    setTeachers([]);
    setSections([]);
    setEditingSection(null);
    setSuccess(null); // Clear success message when filters are cleared
  };

  const startEditing = (section) => {
    setEditingSection(section);
    setSelectedTeacher(section.teacher?.id || '');
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setSelectedTeacher('');
  };

  const getSelectedCourseName = () => {
    if (sections.length > 0) {
      const course = sections[0].course;
      return `${course.code} - ${course.name}`;
    }
    const course = courses.find(c => c._id === selectedCourse);
    return course ? `${course.code} - ${course.name}` : 'Selected Course';
  };

  return (
    <div className="teacher-assignment-container">
    

      {showHelp && (
        <div className="help-container">
          <div className="help-header">
            <FiInfo className="help-icon" />
            <h2>Teacher Assignment</h2>
            <button className="close-help-btn" onClick={() => setShowHelp(false)}>
              <FiX />
            </button>
          </div>
          <div className="help-content">
            <ol>
              <li>
                <strong>Course Registration:</strong> Ensure all courses are properly registered in the course offering system before assigning teachers.
              </li>
              <li>
                <strong>Student Enrollment:</strong> First, enroll students to course sections through the student registration process, then assign teachers from this page.
              </li>
              <li>
                <strong>Assignment Process:</strong> Select the department, program, semester, course, and section, then choose a teacher to complete the assignment.
              </li>
            </ol>
          </div>
        </div>
      )}

      {error && (
        <div className={`message ${error.includes('No students') ? 'info-message' : 'error-message'}`}>
          {error}
          <button 
            className="dismiss-button"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="success-message">
          <span>{success}</span>
          <button className="dismiss-success-btn" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              disabled={!selectedDepartment}
            >
              <option value="">Select Program</option>
              {programs.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              disabled={!selectedProgram}
            >
              <option value="">Select Semester</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={!selectedSemester}
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="clear-filters-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {selectedCourse && (
        <div className="assignment-section">
          <div className="assignment-header">
            <h2>{getSelectedCourseName()}</h2>
            <div className="assignment-controls">
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className={editingSection ? "editing-select" : ""}
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.userId?.name || 'Unknown'} ({teacher.employeeId})
                  </option>
                ))}
              </select>
              {editingSection ? (
                <div className="edit-controls">
                  <button
                    className="update-btn"
                    onClick={handleUpdate}
                    disabled={!selectedTeacher || loading}
                  >
                    Update
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={cancelEditing}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="assign-btn"
                  onClick={handleAssign}
                  disabled={!selectedTeacher || loading}
                >
                  Assign
                </button>
              )}
            </div>
          </div>

          <div className="assignments-table-section">
            <h3>Current Sections</h3>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading sections...</p>
              </div>
            ) : sections && sections.length > 0 ? (
              <div className="table-container">
                <table className="assignments-table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Teacher Name</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((section) => (
                      <tr 
                        key={section.id} 
                        className={`${editingSection && editingSection.id === section.id ? "editing-row" : ""} ${selectedSection === section.id ? "selected-row" : ""}`}
                        onClick={() => setSelectedSection(section.id)}
                      >
                        <td>{section.section}</td>
                        <td>{section.teacher?.name || 'Unassigned'}</td>
                        <td>{section.teacher?.employeeId || 'N/A'}</td>
                        <td>{section.teacher?.department || 'Unknown'}</td>
                        <td className="action-buttons">
                          <button
                            className="edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(section);
                            }}
                            disabled={editingSection !== null}
                          >
                            Edit
                          </button>
                          <button
                            className="remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(section.id);
                            }}
                            disabled={editingSection !== null}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-container">
                <p>No sections found for this course</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentPage; 