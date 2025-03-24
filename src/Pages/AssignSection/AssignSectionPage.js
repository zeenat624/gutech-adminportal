import React, { useState, useEffect } from "react";
import "./AssignSectionPage.css"; // Import external CSS

const AssignSectionPage = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    courseId: "",
    teacherId: "",
    section: "",
  });
  const [message, setMessage] = useState("");

  // Fetch Courses & Teachers from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await fetch("http://localhost:5000/api/courses");
        const teacherRes = await fetch("http://localhost:5000/api/teachers");

        if (!courseRes.ok || !teacherRes.ok) throw new Error("Failed to fetch data");

        const courseData = await courseRes.json();
        const teacherData = await teacherRes.json();

        setCourses(courseData);
        setTeachers(teacherData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/section/addSection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Section assigned successfully!");
      } else {
        setMessage("Failed to assign section.");
        console.error("Error:", data);
      }
    } catch (error) {
      setMessage("An error occurred.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Assign Course & Section to Teacher</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="input-group">
          <label>Course:</label>
          <select name="courseId" value={formData.courseId} onChange={handleChange} required className="input">
            <option value="">Select a Course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Teacher:</label>
          <select name="teacherId" value={formData.teacherId} onChange={handleChange} required className="input">
            <option value="">Select a Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Section:</label>
          <input type="text" name="section" value={formData.section} onChange={handleChange} placeholder="A" required className="input" />
        </div>

        <button type="submit" className="button">
          Assign Section
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default AssignSectionPage;
