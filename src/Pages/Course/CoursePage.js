import React, { useState } from "react";
import "./CoursePage.css";

const CoursePage = () => {
  const [course, setCourse] = useState({
    code: "",
    name: "",
    description: "",
    creditHours: "",
    semester: "1", // Default to 1st semester
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation before submission
    if (!course.code || !course.name || !course.description || !course.creditHours) {
      setMessage({ text: "Please fill out all fields!", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("http://localhost:5000/api/course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(course),
      });

      if (response.ok) {
        setCourse({ code: "", name: "", description: "", creditHours: "", semester: "1" });
        setMessage({ text: "Course created successfully!", type: "success" });
      } else {
        setMessage({ text: "Failed to create course.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An error occurred. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-container">
      <h1>Create a Course</h1>
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
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
    </div>
  );
};

export default CoursePage;
