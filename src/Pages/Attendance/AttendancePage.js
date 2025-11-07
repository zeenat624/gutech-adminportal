import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Download, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import "./AttendancePage.css";

const AttendancePage = () => {
  const apiUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [students, setStudents] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get auth token
  const getAuthToken = () => {
    return sessionStorage.getItem("adminToken") || sessionStorage.getItem("token");
  };

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${apiUrl}/api/courses`, {
        headers: {
          "x-auth-token": getAuthToken(),
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setCourses(response.data);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance for selected course
  const fetchCourseAttendance = async (courseId) => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch attendance records
      const attendanceResponse = await axios.get(`${apiUrl}/api/teachers/attendance?courseId=${courseId}`, {
        headers: {
          "x-auth-token": getAuthToken(),
        },
      });

      if (attendanceResponse.data && attendanceResponse.data.attendance) {
        const attendanceArray = attendanceResponse.data.attendance;
        const courseData = attendanceArray.find((item) => item.courseId === courseId || item.courseId?.toString() === courseId.toString());

        if (courseData && courseData.dates) {
          // Extract all unique dates
          const allDates = Object.keys(courseData.dates).sort();
          setDates(allDates);

          // Extract students from attendance records first (they have the most complete info)
          const studentsFromAttendance = new Map();
          allDates.forEach((dateStr) => {
            if (courseData.dates[dateStr] && courseData.dates[dateStr].students) {
              courseData.dates[dateStr].students.forEach((record) => {
                const studentId = record.studentId?.toString() || record.studentId;
                if (studentId && !studentsFromAttendance.has(studentId)) {
                  studentsFromAttendance.set(studentId, {
                    id: studentId,
                    rollNumber: record.rollNumber || "",
                    name: record.name || "Unknown",
                  });
                }
              });
            }
          });

          // Process attendance data
          const processedData = {};
          allDates.forEach((dateStr) => {
            if (courseData.dates[dateStr] && courseData.dates[dateStr].students) {
              courseData.dates[dateStr].students.forEach((record) => {
                const studentId = record.studentId?.toString() || record.studentId;
                if (!processedData[studentId]) {
                  processedData[studentId] = {
                    studentId: studentId,
                    rollNumber: record.rollNumber || "",
                    name: record.name || "Unknown",
                    attendance: {},
                  };
                }
                processedData[studentId].attendance[dateStr] = record.status;
              });
            }
          });

          setAttendanceData(processedData);

          // Always fetch students from course registrations to get complete student list with names
          const fetchedStudents = await fetchStudentsForCourse(courseId);

          // Use fetched students (they have proper names from the API)
          // If we have students from attendance, merge them to ensure we have all students
          if (studentsFromAttendance.size > 0) {
            const mergedStudents = new Map();

            // First add all fetched students
            fetchedStudents.forEach((student) => {
              const studentId = student.id?.toString() || student.id;
              mergedStudents.set(studentId, student);
            });

            // Then add any students from attendance that might not be in fetched list
            studentsFromAttendance.forEach((attStudent, studentId) => {
              if (!mergedStudents.has(studentId)) {
                mergedStudents.set(studentId, attStudent);
              }
            });

            setStudents(Array.from(mergedStudents.values()));
          } else {
            setStudents(fetchedStudents);
          }
        } else {
          setAttendanceData({});
          setDates([]);
        }
      } else {
        setAttendanceData({});
        setDates([]);
      }
    } catch (error) {
      handleApiError(error);
      setAttendanceData({});
      setDates([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students for a course directly from course registrations
  const fetchStudentsForCourse = async (courseId) => {
    try {
      // Use the new endpoint to get students directly by courseId
      const studentsResponse = await axios.get(`${apiUrl}/api/course-registration/getStudentsByCourse/${courseId}`, {
        headers: {
          "x-auth-token": getAuthToken(),
        },
      });

      if (studentsResponse.data && Array.isArray(studentsResponse.data)) {
        // Ensure all students have proper id, rollNumber, and name
        const formattedStudents = studentsResponse.data.map((student) => {
          // Handle different possible structures from API
          const studentId = student.id?.toString() || student._id?.toString() || student.id || student._id;
          const rollNumber = student.rollNumber || "";
          const name = student.name || student.userId?.name || "Unknown Student";

          return {
            id: studentId,
            rollNumber: rollNumber,
            name: name,
          };
        });
        return formattedStudents;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching students for course:", error);
      // Fallback: try getting from sections if direct endpoint fails
      try {
        const sectionsResponse = await axios.get(`${apiUrl}/api/sections/course/${courseId}`, {
          headers: {
            "x-auth-token": getAuthToken(),
          },
        });

        if (sectionsResponse.data && Array.isArray(sectionsResponse.data) && sectionsResponse.data.length > 0) {
          const allStudents = new Map();

          // Fetch students from each section
          for (const section of sectionsResponse.data) {
            try {
              const sectionId = section._id || section.id;
              if (!sectionId) continue;

              const sectionStudentsResponse = await axios.get(`${apiUrl}/api/course-registration/getStudents/${sectionId.toString()}`, {
                headers: {
                  "x-auth-token": getAuthToken(),
                },
              });

              if (sectionStudentsResponse.data && Array.isArray(sectionStudentsResponse.data)) {
                sectionStudentsResponse.data.forEach((reg) => {
                  const studentId = reg.id || reg.studentId?._id || reg.studentId?.id || reg.studentId;
                  const rollNumber = reg.rollNumber || reg.studentId?.rollNumber || "";
                  const name = reg.name || reg.studentId?.userId?.name || reg.studentId?.name || "Unknown Student";

                  if (studentId) {
                    const normalizedId = studentId.toString();
                    if (!allStudents.has(normalizedId)) {
                      allStudents.set(normalizedId, {
                        id: normalizedId,
                        rollNumber: rollNumber,
                        name: name,
                      });
                    }
                  }
                });
              }
            } catch (err) {
              console.error(`Error fetching students for section:`, err);
            }
          }

          return Array.from(allStudents.values());
        } else {
          return [];
        }
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
        return [];
      }
    }
  };

  // Error handler
  const handleApiError = (error) => {
    if (error.response) {
      const message = error.response.data?.message || "An error occurred";
      toast.error(message);
      setError(message);
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
      setError("Network error. Please check your connection.");
    } else {
      toast.error("An unexpected error occurred. Please try again.");
      setError("An unexpected error occurred. Please try again.");
    }
    console.error("API Error:", error);
  };

  // Handle course selection
  const handleCourseChange = (course) => {
    setSelectedCourse(course);
    setSearchQuery("");
    fetchCourseAttendance(course._id || course.id);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!selectedCourse || !attendanceData || Object.keys(attendanceData).length === 0) {
      toast.error("No attendance data to export");
      return;
    }

    try {
      // Prepare data for CSV
      const csvData = [];

      // Header row: Student Info + Dates
      const header = ["Roll Number", "Name", ...dates];
      csvData.push(header);

      // Data rows: Student info + attendance for each date
      Object.values(attendanceData).forEach((student) => {
        const row = [
          student.rollNumber || "",
          student.name || "",
          ...dates.map((date) => {
            const status = student.attendance[date] || "";
            // Convert status to readable format
            if (status === "present") return "P";
            if (status === "absent") return "A";
            if (status === "late") return "L";
            return "";
          }),
        ];
        csvData.push(row);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(csvData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Roll Number
        { wch: 30 }, // Name
        ...dates.map(() => ({ wch: 8 })), // Date columns
      ];
      ws["!cols"] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");

      // Generate filename
      const courseName = selectedCourse.name || "Course";
      const courseCode = selectedCourse.code || "";
      const filename = `Attendance_${courseCode}_${courseName}_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
      toast.success("Attendance exported successfully!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export attendance. Please try again.");
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(
    (student) => student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get attendance status for a student on a specific date
  const getAttendanceStatus = (studentId, date) => {
    if (!attendanceData || !attendanceData[studentId]) return "";
    return attendanceData[studentId].attendance[date] || "";
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Initialize
  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div className="header-content">
          <h1>Attendance Management</h1>
          <p>View attendance records course-wise</p>
        </div>
        {selectedCourse && attendanceData && Object.keys(attendanceData).length > 0 && (
          <button className="export-btn" onClick={exportToCSV}>
            <Download size={18} />
            Export to Excel
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
        </div>
      )}

      <div className="attendance-content">
        {/* Course Selection Sidebar */}
        <div className="course-sidebar">
          <h3>Select Course</h3>
          {loading && courses.length === 0 ? (
            <div className="loading-text">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="empty-text">No courses available</div>
          ) : (
            <div className="course-list">
              {courses.map((course) => (
                <div
                  key={course._id || course.id}
                  className={`course-item ${selectedCourse?._id === course._id || selectedCourse?.id === course.id ? "active" : ""}`}
                  onClick={() => handleCourseChange(course)}
                >
                  <div className="course-info">
                    <div className="course-name">{course.name}</div>
                    <div className="course-code">{course.code}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="attendance-main">
          {selectedCourse ? (
            <>
              <div className="course-header">
                <h2>{selectedCourse.name}</h2>
                <p className="course-code-text">{selectedCourse.code}</p>
              </div>

              {/* Search */}
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search students by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Attendance Table */}
              {loading ? (
                <div className="loading">Loading attendance data...</div>
              ) : dates.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={48} />
                  <p>No attendance records found for this course</p>
                </div>
              ) : (
                <div className="attendance-table-container">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th className="sticky-col">Roll Number</th>
                        <th className="sticky-col">Name</th>
                        {dates.map((date) => (
                          <th key={date} className="date-header">
                            {formatDate(date)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={dates.length + 2} className="no-results">
                            No students found
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => {
                          const studentId = student.id?.toString() || student.id;
                          const studentData = attendanceData[studentId];
                          return (
                            <tr key={studentId}>
                              <td className="sticky-col roll-number">{student.rollNumber || "N/A"}</td>
                              <td className="sticky-col student-name">{student.name || "Unknown Student"}</td>
                              {dates.map((date) => {
                                const status = studentData?.attendance[date] || "";
                                return (
                                  <td key={date} className={`attendance-cell ${status}`}>
                                    {status === "present" ? "P" : status === "absent" ? "A" : status === "late" ? "L" : ""}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Legend */}
              {dates.length > 0 && (
                <div className="attendance-legend">
                  <div className="legend-item">
                    <span className="legend-dot present"></span>
                    <span>Present (P)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot absent"></span>
                    <span>Absent (A)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot late"></span>
                    <span>Late (L)</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Calendar size={48} />
              <p>Please select a course to view attendance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
