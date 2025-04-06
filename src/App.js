import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TranscriptView from './Pages/ViewTranscript';
import Examschedule from './Components/ExamSchedule/Examschedule';
import './Components/ExamSchedule/Examschedule.css';
import Signup from './Pages/LoginSignUp/Signup';
import MainLayout from './Pages/MainLayout/MainLayout';

import Fees1 from "./Pages/Group1-Fees/Fees1";
import StudentFeeHistory from "./Pages/Group1-Fees/StudentFeeHistory";
import FeeVoucher from "./Pages/Group1-Fees/FeeVoucher";
import AdminJobsPage from "./Pages/JobsAndBootcamps/JobsAndBootcamps";
import "./App.css";

import AdminEventCalendar from "./Pages/Event Calendar/Event Calendar";
import Announcement from "./Pages/Announcements/Announcement";
import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import ClassSchedule from "./Pages/Class Schedule/Class Schedule.jsx";
import ImportStudentsPage from "./Pages/ImportStudents/ImportStudentsPage";
import StudentDirectoryPage from "./Pages/StudentDirectory/StudentDirectoryPage";

import Attendance from './Pages/Attendance/Attendance';
import CoursePage from "./Pages/Course/CoursePage.js";
import AssignSectionPage from "./Pages/AssignSection/AssignSectionPage.js";
import CourseRegistrationPage from './Pages/CourseRegistration/CourseRegistrationPage';

function App() {
  return (
    <Router>
      <div className="App">
            <Routes>

              <Route path="/" element={<Signup />} />
              
              <Route path="/*" element={<MainLayout />}>
              <Route path='dashboard' element={<Dashboard />} />
                <Route path="calendar" element={<AdminEventCalendar />} />
                <Route path="Announcement" element={<Announcement />} />
                <Route path="Class Schedule" element={<ClassSchedule />} />
                <Route path="Fees1" element={<Fees1 />} />
                <Route path="student-fee-history/:name" element={<StudentFeeHistory />} />
                <Route path="JobsAndBootcamps" element={<AdminJobsPage />} />
                <Route path="FeeVoucher" element={<FeeVoucher />} />
                <Route path="Transcript" element={<TranscriptView />} />
                <Route path="Examschedule" element={<Examschedule />} />
                <Route path="Attendance" element={<Attendance />} />
                <Route path="Course" element={<CoursePage />} />
                <Route path="course-registration" element={<CourseRegistrationPage />} />
                <Route path="import-students" element={<ImportStudentsPage />} />
                <Route path="student-directory" element={<StudentDirectoryPage />} />

              </Route>
            </Routes>
          </div>
      
    </Router>
  );
}

export default App;
