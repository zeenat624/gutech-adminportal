import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CoursePage.css";
import { toast } from "react-hot-toast";
import { departments, programs, getCurrentAcademicYear } from '../../config/academicConfig';
import TeacherAssignmentPage from '../TeacherAssignment/TeacherAssignmentPage';

const CoursePage = () => {
  const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
  
  const [course, setCourse] = useState({
    code: "",
    name: "",
    description: "",
    creditHours: "",
    semester: "1",
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
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'offerings', or 'assignments'
  const [groupByOptions, setGroupByOptions] = useState({
    department: true,
    program: false,
    semester: false
  });

  useEffect(() => {
    fetchCourses();
    fetchCourseOfferings();
  }, []);

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
    const { name, value } = e.target;
    setCourse((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleOfferingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseOffering(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      const response = await axios.post(
        `${apiUrl}/api/courses`,
        course,
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      setCourse({ code: "", name: "", description: "", creditHours: "", semester: "1" });
      setMessage({ text: "Course created successfully!", type: "success" });
      fetchCourses(); // Refresh the courses list
    } catch (error) {
      setMessage({ text: "Failed to create course.", type: "error" });
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

  return (
    <div className="course-container">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Course
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

      {activeTab === 'create' ? (
        <form className="course-form" onSubmit={handleSubmit}>
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
          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Course"}
          </button>
        </form>
      ) : activeTab === 'offerings' ? (
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
            
            {courseOfferings.length === 0 ? (
              <p className="no-offerings">No course offerings available.</p>
            ) : (
              Object.entries(groupOfferings()).map(([groupName, offerings]) => 
                renderOfferingsTable(groupName, offerings)
              )
            )}
          </div>
        </div>
      ) : (
        <TeacherAssignmentPage />
      )}
    </div>
  );
};

export default CoursePage;
