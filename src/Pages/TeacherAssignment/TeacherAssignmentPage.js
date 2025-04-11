import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { departments, programs, semesters } from '../../config/academicConfig';
import { FiInfo, FiX, FiCheck, FiArrowRight } from 'react-icons/fi';
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
  const [currentStep, setCurrentStep] = useState(1);

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

  const handleNextStep = () => {
    if (currentStep === 1 && selectedDepartment && selectedProgram && selectedSemester) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedCourse) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Select Department</span>
        </div>
        <div className={`step-connector ${currentStep >= 2 ? 'active' : ''}`} />
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Select Course</span>
        </div>
        <div className={`step-connector ${currentStep >= 3 ? 'active' : ''}`} />
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Assign Teacher</span>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>Select Department Information</h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className={selectedDepartment ? 'selected' : ''}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  disabled={!selectedDepartment}
                  className={selectedProgram ? 'selected' : ''}
                >
                  <option value="">Select Program</option>
                  {programs.map((prog) => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  disabled={!selectedProgram}
                  className={selectedSemester ? 'selected' : ''}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="step-actions">
              <button
                className="next-btn"
                onClick={handleNextStep}
                disabled={!selectedDepartment || !selectedProgram || !selectedSemester}
              >
                Next <FiArrowRight />
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            <h3>Select Course</h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className={selectedCourse ? 'selected' : ''}
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
            <div className="step-actions">
              <button className="prev-btn" onClick={handlePrevStep}>
                Back
              </button>
              <button
                className="next-btn"
                onClick={handleNextStep}
                disabled={!selectedCourse}
              >
                Next <FiArrowRight />
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            <h3>Assign Teacher</h3>
            <div className="assignment-section">
              <div className="course-info">
                <h4>Selected Course</h4>
                <p>{getSelectedCourseName()}</p>
              </div>
              <div className="teacher-selection">
                <label>Select Teacher</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className={selectedTeacher ? 'selected' : ''}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="section-info">
                <h4>Current Sections</h4>
                {sections.length > 0 ? (
                  <div className="sections-list">
                    {sections.map((section) => (
                      <div key={section._id} className="section-item">
                        <span>{section.name}</span>
                        <span>{section.teacher?.name || 'Unassigned'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-sections">No sections available for this course</p>
                )}
              </div>
              <div className="step-actions">
                <button className="prev-btn" onClick={handlePrevStep}>
                  Back
                </button>
                <button
                  className="assign-btn"
                  onClick={handleAssign}
                  disabled={!selectedTeacher || loading}
                >
                  {loading ? 'Assigning...' : 'Assign Teacher'}
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="teacher-assignment-container">
      {showHelp && (
        <div className="help-section">
          <div className="help-content">
            <FiInfo className="help-icon" />
            <div className="help-text">
              <h4>Teacher Assignment Guide</h4>
              <p>Follow these steps to assign teachers to course sections:</p>
              <ol>
                <li>Select the department, program, and semester</li>
                <li>Choose the course you want to assign</li>
                <li>Select a teacher and assign them to the course</li>
              </ol>
            </div>
            <button className="close-help-btn" onClick={() => setShowHelp(false)}>
              <FiX />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button className="dismiss-btn" onClick={() => setError(null)}>
            <FiX />
          </button>
        </div>
      )}

      {success && (
        <div className="success-message">
          <FiCheck className="success-icon" />
          {success}
          <button className="dismiss-btn" onClick={() => setSuccess(null)}>
            <FiX />
          </button>
        </div>
      )}

      {renderStepIndicator()}
      {renderStepContent()}
    </div>
  );
};

export default TeacherAssignmentPage; 