import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CoursePage.css";
import { toast } from "react-hot-toast";
import { departments, programs, getCurrentAcademicYear } from '../../config/academicConfig';
import TeacherAssignmentPage from '../TeacherAssignment/TeacherAssignmentPage';
import { FiSearch, FiFilter, FiDownload, FiInfo, FiX, FiEdit2, FiTrash2, FiPlus, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import LoadingSpinner from '../../Components/LoadingSpinner';
import NoResultsFound from '../../Components/NoResultsFound';

const CoursePage = () => {
  const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
  
  const [course, setCourse] = useState({
    code: "",
    name: "",
    description: "",
    creditHours: "",
    semester: "1",
    isActive: true
  });

  const [courseOffering, setCourseOffering] = useState({
    courseId: "",
    department: "",
    program: "",
    semester: "1",
    semesterType: "Fall",
    year: new Date().getFullYear()
  });

  const [courses, setCourses] = useState([]);
  const [courseOfferings, setCourseOfferings] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'offerings', 'assignments', 'manage'
  const [groupByOptions, setGroupByOptions] = useState({
    department: true,
    program: false,
    semester: false
  });
  const [showCreateHelp, setShowCreateHelp] = useState(true);
  const [showOfferingsHelp, setShowOfferingsHelp] = useState(true);
  const [showManageHelp, setShowManageHelp] = useState(true);
  const [showAssignmentsHelp, setShowAssignmentsHelp] = useState(true);
  
  // New state for manage courses tab
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchCourseOfferings();
  }, []);

  // Filter courses when search term, semester filter, or status filter changes
  useEffect(() => {
    if (activeTab === 'manage') {
      let filtered = [...courses];
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(course => 
          course.code.toLowerCase().includes(term) || 
          course.name.toLowerCase().includes(term) ||
          course.description.toLowerCase().includes(term)
        );
      }
      
      // Apply semester filter
      if (filterSemester) {
        filtered = filtered.filter(course => 
          course.semester.toString() === filterSemester
        );
      }
      
      // Apply status filter
      if (filterStatus !== "") {
        const isActive = filterStatus === "active";
        filtered = filtered.filter(course => 
          course.isActive === isActive
        );
      }
      
      setFilteredCourses(filtered);
    }
  }, [searchTerm, filterSemester, filterStatus, courses, activeTab]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/courses`);
      setCourses(response.data);
    } catch (error) {
      setMessage({ text: "Error fetching courses", type: "error" });
    }
  };

  const fetchCourseOfferings = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/course-offerings`);
      setCourseOfferings(response.data);
    } catch (error) {
      setMessage({ text: "Error fetching course offerings", type: "error" });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourse((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOfferingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseOffering(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourse({
      code: course.code,
      name: course.name,
      description: course.description,
      creditHours: course.creditHours,
      semester: course.semester.toString(),
      isActive: course.isActive
    });
    setActiveTab('create');
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        setLoading(true);
        await axios.delete(`${apiUrl}/api/courses/${courseId}`);
        setMessage({ text: "Course deleted successfully!", type: "success" });
        fetchCourses();
      } catch (error) {
        setMessage({ text: "Failed to delete course.", type: "error" });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (courseId, currentStatus) => {
    try {
      setLoading(true);
      await axios.patch(`${apiUrl}/api/courses/${courseId}/toggle-status`, {
        isActive: !currentStatus
      });
      
      // Update local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course._id === courseId 
            ? { ...course, isActive: !currentStatus } 
            : course
        )
      );
      
      toast.success(`Course ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error("Failed to update course status");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!course.code || !course.name || !course.description || !course.creditHours) {
      setMessage({ text: "Please fill out all fields!", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      if (editingCourse) {
        // Update existing course
        await axios.put(
          `${apiUrl}/api/courses/${editingCourse._id}`,
          course,
          {
            headers: {
              "Content-Type": "application/json",
            }
          }
        );
        setMessage({ text: "Course updated successfully!", type: "success" });
      } else {
        // Create new course
        await axios.post(
        `${apiUrl}/api/courses`,
        course,
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      setMessage({ text: "Course created successfully!", type: "success" });
      }

      setCourse({ code: "", name: "", description: "", creditHours: "", semester: "1", isActive: true });
      setEditingCourse(null);
      fetchCourses(); // Refresh the courses list
    } catch (error) {
      setMessage({ text: editingCourse ? "Failed to update course." : "Failed to create course.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOfferingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/api/course-offerings`, courseOffering);
      setCourseOfferings([...courseOfferings, response.data]);
      setCourseOffering({
        courseId: "",
        department: "",
        program: "",
        semester: "1",
        semesterType: "Fall",
        year: new Date().getFullYear()
      });
      toast.success('Course offering created successfully');
    } catch (error) {
      console.error('Error creating course offering:', error);
      toast.error(error.response?.data?.message || 'Error creating course offering');
    }
  };

  const handleGroupByChange = (option) => {
    setGroupByOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Group course offerings by selected criteria
  const groupOfferings = () => {
    // If no grouping options are selected, return a single group
    if (!Object.values(groupByOptions).some(value => value)) {
      return { "All Offerings": courseOfferings };
    }

    const grouped = {};
    
    courseOfferings.forEach(offering => {
      // Create a composite key based on selected grouping options
      const keyParts = [];
      
      if (groupByOptions.department) {
        keyParts.push(offering.department || 'Unassigned Department');
      }
      
      if (groupByOptions.program) {
        keyParts.push(offering.program || 'Unassigned Program');
      }
      
      if (groupByOptions.semester) {
        keyParts.push(`Semester ${offering.semester}`);
      }
      
      const key = keyParts.join(' - ');
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      
      grouped[key].push(offering);
    });
    
    return grouped;
  };

  // Render a table for a specific group of offerings
  const renderOfferingsTable = (groupName, offerings) => {
    return (
      <div className="offerings-group" key={groupName}>
        <h4 className="group-title">{groupName}</h4>
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Department</th>
              <th>Program</th>
              <th>Semester</th>
              <th>Academic Year</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {offerings.map(offering => (
              <tr key={offering._id}>
                <td>{offering.courseId?.code} - {offering.courseId?.name}</td>
                <td>{offering.department}</td>
                <td>{offering.program}</td>
                <td>{offering.semester}</td>
                <td>{offering.semesterType} {offering.year}</td>
                <td>{offering.isActive ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterSemester("");
    setFilterStatus("");
  };

  return (
    <div className="course-container">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('create');
            setEditingCourse(null);
          }}
        >
          Create Course
        </button>
        <button 
          className={`tab ${activeTab === 'manage' ? 'active' : ''}`} 
          onClick={() => setActiveTab('manage')}
        >
          Manage Courses
        </button>
        <button 
          className={`tab ${activeTab === 'offerings' ? 'active' : ''}`}
          onClick={() => setActiveTab('offerings')}
        >
          Course Offerings
        </button>
        <button 
          className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          Teacher Assignments
        </button>
      </div>

      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}

      {activeTab === 'create' && (
        <>
          {showCreateHelp && (
            <div className="course-important-note">
              <p>Create Course: Add new courses to the system. After creating, register it as a course offering, then assign to students, then teachers.</p>
              <button className="course-close-note-btn" onClick={() => setShowCreateHelp(false)}>×</button>
            </div>
          )}
          <div className="course-form">
            <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
            <form onSubmit={handleSubmit}>
          <div>
            <label>Course Code:</label>
            <input
              type="text"
              name="code"
              value={course.code}
              onChange={handleChange}
              placeholder="PF101"
              required
            />
          </div>
          <div>
            <label>Course Name:</label>
            <input
              type="text"
              name="name"
              value={course.name}
              onChange={handleChange}
              placeholder="Programming Fundamentals"
              required
            />
          </div>
          <div>
            <label>Description:</label>
            <textarea
              name="description"
              value={course.description}
              onChange={handleChange}
              placeholder="Introductory course covering programming concepts, problem-solving, and algorithms."
              required
            />
          </div>
          <div>
            <label>Credit Hours:</label>
            <input
              type="number"
              name="creditHours"
              value={course.creditHours}
              onChange={handleChange}
              placeholder="3"
              required
            />
          </div>
          <div>
            <label>Semester:</label>
            <select name="semester" value={course.semester} onChange={handleChange} required>
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Semester {i + 1}
                </option>
              ))}
            </select>
          </div>
              <div className="checkbox-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={course.isActive}
                    onChange={handleChange}
                  />
                  Active
                </label>
              </div>
              <div className="form-actions">
                {editingCourse && (
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setEditingCourse(null);
                      setCourse({ code: "", name: "", description: "", creditHours: "", semester: "1", isActive: true });
                    }}
                  >
                    Cancel
                  </button>
                )}
          <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingCourse ? "Update Course" : "Create Course"}
          </button>
              </div>
        </form>
          </div>
        </>
      )}

      {activeTab === 'manage' && (
        <>
          {showManageHelp && (
            <div className="course-important-note">
              <p>Manage Courses: View, edit, or delete existing courses. Use filters to find specific courses.</p>
              <button className="course-close-note-btn" onClick={() => setShowManageHelp(false)}>×</button>
            </div>
          )}
          
          <div className="manage-courses-section">
            <div className="filters-container">
              <div className="search-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search courses by code, name, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-container">
                <label>Filter by Semester:</label>
                <select 
                  value={filterSemester} 
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Semesters</option>
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Semester {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-container">
                <label>Filter by Status:</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                <FiX /> Clear Filters
              </button>
            </div>
            
            <div className="courses-table-container">
              {loading ? (
                <LoadingSpinner message="Loading courses..." />
              ) : filteredCourses.length === 0 ? (
                <NoResultsFound 
                  title="No Courses Found"
                  message="No courses match your search criteria. Try adjusting your filters or search terms."
                  icon="search"
                  actionButton={true}
                  actionButtonText="Clear Filters"
                  onActionButtonClick={clearFilters}
                />
              ) : (
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Credit Hours</th>
                      <th>Semester</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course) => (
                      <tr key={course._id}>
                        <td>{course.code}</td>
                        <td>{course.name}</td>
                        <td className="description-cell">{course.description}</td>
                        <td>{course.creditHours}</td>
                        <td>Semester {course.semester}</td>
                        <td>
                          <span className={`status-badge ${course.isActive ? 'active' : 'inactive'}`}>
                            {course.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="action-buttons">
                          <button 
                            className="toggle-btn"
                            onClick={() => handleToggleStatus(course._id, course.isActive)}
                            title={course.isActive ? "Deactivate Course" : "Activate Course"}
                          >
                            {course.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                          </button>
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditCourse(course)}
                            title="Edit Course"
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteCourse(course._id)}
                            title="Delete Course"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'offerings' && (
        <>
          {showOfferingsHelp && (
            <div className="course-important-note">
              <p>Course Offerings: Schedule courses for specific semesters. Select department and program to create offerings.</p>
              <button className="course-close-note-btn" onClick={() => setShowOfferingsHelp(false)}>×</button>
            </div>
          )}
        <div className="offerings-section">
          <form className="offering-form" onSubmit={handleOfferingSubmit}>
            <div>
              <label>Course:</label>
              <select
                name="courseId"
                value={courseOffering.courseId}
                onChange={handleOfferingChange}
                required
              >
                <option value="">Select a Course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Department:</label>
              <select
                name="department"
                value={courseOffering.department}
                onChange={handleOfferingChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Program:</label>
              <select
                name="program"
                value={courseOffering.program}
                onChange={handleOfferingChange}
                required
              >
                <option value="">Select Program</option>
                {programs.map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Semester:</label>
              <select
                name="semester"
                value={courseOffering.semester}
                onChange={handleOfferingChange}
                required
              >
                {[...Array(8)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Semester Type:</label>
              <select
                name="semesterType"
                value={courseOffering.semesterType}
                onChange={handleOfferingChange}
                required
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
              </select>
            </div>
            <div>
              <label>Year:</label>
              <input
                type="number"
                name="year"
                value={courseOffering.year}
                onChange={handleOfferingChange}
                min={new Date().getFullYear() - 1}
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
            <button className="submit-btn" type="submit">Create Course Offering</button>
          </form>

          <div className="offerings-list">
            <div className="offerings-header">
              <h3>Current Course Offerings</h3>
              <div className="group-by-controls">
                <label>Group by:</label>
                <div className="group-by-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={groupByOptions.department}
                      onChange={() => handleGroupByChange('department')}
                    />
                    Department
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={groupByOptions.program}
                      onChange={() => handleGroupByChange('program')}
                    />
                    Program
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={groupByOptions.semester}
                      onChange={() => handleGroupByChange('semester')}
                    />
                    Semester
                  </label>
                </div>
              </div>
            </div>
            
              <div className="content-section">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading course offerings...</p>
                  </div>
                ) : courseOfferings.length === 0 ? (
                  <NoResultsFound 
                    title="No Course Offerings Found"
                    message="No course offerings match your current filter criteria. Try adjusting your filters or selecting different options."
                    icon="filter"
                    actionButton={true}
                    actionButtonText="Clear All Filters"
                    onActionButtonClick={clearFilters}
                  />
                ) : (
                  <div className="offerings-container">
                    {Object.entries(groupOfferings()).map(([groupName, offerings]) => 
                renderOfferingsTable(groupName, offerings)
                    )}
                  </div>
            )}
          </div>
        </div>
          </div>
        </>
      )}

      {activeTab === 'assignments' && (
          <TeacherAssignmentPage />
      )}
    </div>
  );
};

export default CoursePage;
