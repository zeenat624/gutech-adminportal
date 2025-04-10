import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/global.css"; // Single global CSS file
import Signup from "./Pages/LoginSignUp/Signup";
import MainLayout from "./Pages/MainLayout/MainLayout";

import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import ClassSchedule from "./Pages/Class Schedule/Class Schedule.jsx";
import ImportStudentsPage from "./Pages/ImportStudents/ImportStudentsPage";
import StudentDirectoryPage from "./Pages/StudentDirectory/StudentDirectoryPage";

import Attendance from "./Pages/Attendance/Attendance";
import CoursePage from "./Pages/Course/CoursePage.js";
import AssignSectionPage from "./Pages/AssignSection/AssignSectionPage.js";
import CourseRegistrationPage from "./Pages/CourseRegistration/CourseRegistrationPage";
import StudentMarksPage from "./Pages/StudentMarks/StudentMarksPage";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Signup />} />

          <Route path="/*" element={<MainLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="Class Schedule" element={<ClassSchedule />} />
            <Route path="Attendance" element={<Attendance />} />
            <Route path="Course" element={<CoursePage />} />
            <Route path="course-registration" element={<CourseRegistrationPage />} />
            <Route path="import-students" element={<ImportStudentsPage />} />
            <Route path="student-directory" element={<StudentDirectoryPage />} />
            <Route path="marks" element={<StudentMarksPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
