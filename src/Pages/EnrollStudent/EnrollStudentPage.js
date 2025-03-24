import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./EnrollStudentPage.css"; // Import separate CSS

const EnrollStudentPage = () => {
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({
    studentId: "",
    sectionId: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // For navigation

  // Fetch students and sections from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await axios.get("http://localhost:5000/api/students");
        const sectionRes = await axios.get("http://localhost:5000/api/sections");

        setStudents(studentRes.data);
        setSections(sectionRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/enrollment/enroll", formData);

      if (response.status === 200) {
        setMessage("Student successfully enrolled!");
        setFormData({ studentId: "", sectionId: "" }); // Reset form

        // Navigate to dashboard after successful enrollment
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (error) {
      setMessage("Failed to enroll student.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="enrollment-container">
      <h1>Assign Course to Student</h1>
      <form onSubmit={handleSubmit} className="enrollment-form">
        <div className="form-group">
          <label>Student:</label>
          <select name="studentId" value={formData.studentId} onChange={handleChange} required>
            <option value="">Select a Student</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Section:</label>
          <select name="sectionId" value={formData.sectionId} onChange={handleChange} required>
            <option value="">Select a Section</option>
            {sections.map((section) => (
              <option key={section._id} value={section._id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="enroll-button">Assign Course</button>
      </form>

      {message && <p className="enrollment-message">{message}</p>}
    </div>
  );
};

export default EnrollStudentPage;
