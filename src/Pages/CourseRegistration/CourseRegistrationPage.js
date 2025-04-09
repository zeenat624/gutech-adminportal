import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { departments, programs, semesters, getCurrentAcademicYear } from '../../config/academicConfig';
import './CourseRegistrationPage.css';

const CourseRegistrationPage = () => {
    const apiUrl = process.env.REACT_APP_BACKEND_URL;
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [progress, setProgress] = useState(0);
    const [sectionTeacherMap, setSectionTeacherMap] = useState({});
    const [extractedSections, setExtractedSections] = useState([]);

    useEffect(() => {
        if (selectedDepartment && selectedSemester && selectedProgram) {
            fetchCourses();
        }
    }, [selectedDepartment, selectedSemester, selectedProgram]);

    useEffect(() => {
        if (selectedDepartment) {
            fetchTeachers();
        } else {
            setTeachers([]);
        }
    }, [selectedDepartment]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const response = await axios.get(
                `${apiUrl}/api/courses/department/${selectedDepartment}/program/${selectedProgram}/semester/${selectedSemester}`,
                { headers: { 'x-auth-token': token } }
            );
            setCourses(response.data);
        } catch (error) {
            setError('Error fetching courses: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const response = await axios.get(
                `${apiUrl}/api/teachers`,
                { headers: { 'x-auth-token': token } }
            );
            console.log('Teachers data received:', response.data);
            if (response.data && response.data.length > 0) {
                console.log('First teacher object structure:', response.data[0]);
                console.log('Available properties:', Object.keys(response.data[0]));
            }
            setTeachers(response.data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            setTeachers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            readExcelFile(file);
        }
    };

    const readExcelFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                
                // Validate required fields
                const requiredFields = ['rollNumber', 'name', 'email', 'section'];
                const validData = json.filter(row => 
                    requiredFields.every(field => row[field] !== undefined && row[field] !== '')
                );

                if (validData.length === 0) {
                    setError('No valid data found in the Excel file. Please check the required fields.');
                    return;
                }

                // Extract unique sections from the data
                const sections = [...new Set(validData.map(row => row.section))];
                setExtractedSections(sections);

                // Initialize section-teacher mapping
                const initialSectionTeacherMap = {};
                sections.forEach(section => {
                    initialSectionTeacherMap[section] = '';
                });
                setSectionTeacherMap(initialSectionTeacherMap);

                setPreview(validData);
                setError(null);
            } catch (error) {
                setError('Error reading Excel file: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleTeacherAssignment = (section, teacherId) => {
        setSectionTeacherMap(prev => ({
            ...prev,
            [section]: teacherId
        }));
    };

    const handleDownloadTemplate = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            // Create template data
            const template = [
                {
                    rollNumber: '2024001',
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    section: 'A'
                }
            ];

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(template);
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Students');
            
            // Generate file and trigger download using a different method
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            
            // Create a link element and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = 'student_registration_template.xlsx';
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            console.log('Template download initiated');
        } catch (error) {
            console.error('Error generating template:', error);
            setError('Failed to generate template file. Please try again.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!selectedCourse || !file || preview.length === 0) {
            setError('Please select a course and upload a valid Excel file with student data');
            return;
        }

        // Check if all sections have teachers assigned
        const unassignedSections = extractedSections.filter(section => !sectionTeacherMap[section]);
        if (unassignedSections.length > 0) {
            setError(`Please assign teachers to all sections: ${unassignedSections.join(', ')}`);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            setProgress(0);

            const token = sessionStorage.getItem('token');
            console.log('Starting course registration process for course:', selectedCourse._id);
            
            // First, create or update sections with teacher assignments
            console.log('Creating/updating sections:', extractedSections);
            const sectionCreationPromises = extractedSections.map(async (section) => {
                try {
                    // Try to get existing section
                    let existingSection = null;
                    try {
                        console.log(`Checking if section ${section} exists for course ${selectedCourse._id}`);
                        const existingSectionResponse = await axios.get(
                            `${apiUrl}/api/section/course/${selectedCourse._id}/section/${section}`,
                            { headers: { 'x-auth-token': token } }
                        );
                        existingSection = existingSectionResponse.data;
                        console.log(`Found existing section:`, existingSection);
                    } catch (error) {
                        // If 404, section doesn't exist, which is fine
                        if (error.response && error.response.status !== 404) {
                            console.error(`Error checking for section ${section}:`, error);
                            throw error;
                        }
                    }
                    
                    if (existingSection) {
                        // Update existing section with teacher
                        console.log(`Updating section ${section} with teacher ${sectionTeacherMap[section]}`);
                        return axios.put(
                            `${apiUrl}/api/section/${existingSection._id}`,
                            {
                                teacherId: sectionTeacherMap[section]
                            },
                            { headers: { 'x-auth-token': token } }
                        );
                    } else {
                        // Create new section
                        console.log(`Creating new section ${section} with teacher ${sectionTeacherMap[section]}`);
                        return axios.post(
                            `${apiUrl}/api/section/course/${selectedCourse._id}/section/${section}`,
                            {
                                teacherId: sectionTeacherMap[section]
                            },
                            { headers: { 'x-auth-token': token } }
                        );
                    }
                } catch (error) {
                    console.error(`Error creating/updating section ${section}:`, error);
                    throw error;
                }
            });

            console.log('Waiting for all sections to be created/updated');
            await Promise.all(sectionCreationPromises);
            
            // Process students in batches
            const batchSize = 10;
            const batches = [];
            for (let i = 0; i < preview.length; i += batchSize) {
                batches.push(preview.slice(i, i + batchSize));
            }
            
            let registeredCount = 0;
            let failedRegistrations = [];
            
            console.log(`Processing ${preview.length} students in ${batches.length} batches`);
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`Processing batch ${i + 1}/${batches.length}`);
                
                // Register students in the current batch
                await Promise.all(batch.map(async (student) => {
                    try {
                        // Get the section ID for the student's section
                        let sectionResponse;
                        try {
                            console.log(`Getting section ${student.section} for student ${student.rollNumber}`);
                            sectionResponse = await axios.get(
                                `${apiUrl}/api/section/course/${selectedCourse._id}/section/${student.section}`,
                                { headers: { 'x-auth-token': token } }
                            );
                        } catch (error) {
                            // If section doesn't exist, create it
                            if (error.response && error.response.status === 404) {
                                console.log(`Section ${student.section} not found, creating it`);
                                const createSectionResponse = await axios.post(
                                    `${apiUrl}/api/section/course/${selectedCourse._id}/section/${student.section}`,
                                    {
                                        teacherId: sectionTeacherMap[student.section]
                                    },
                                    { headers: { 'x-auth-token': token } }
                                );
                                sectionResponse = { data: createSectionResponse.data };
                            } else {
                                console.error(`Error getting section ${student.section}:`, error);
                                failedRegistrations.push({
                                    student: student.rollNumber,
                                    error: 'Failed to get/create section'
                                });
                                return;
                            }
                        }
                        
                        if (!sectionResponse.data) {
                            console.error(`Section ${student.section} not found for student ${student.rollNumber}`);
                            failedRegistrations.push({
                                student: student.rollNumber,
                                error: 'Section not found'
                            });
                            return;
                        }

                        console.log(`Registering student ${student.rollNumber} for section ${sectionResponse.data._id}`);
                        await axios.post(
                            `${apiUrl}/api/course-registration/register`,
                            {
                                studentId: student.rollNumber,
                                courseId: selectedCourse._id,
                                sectionId: sectionResponse.data._id,
                                semester: parseInt(selectedSemester),
                                academicYear: getCurrentAcademicYear()
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-auth-token': token
                                }
                            }
                        );
                        
                        registeredCount++;
                    } catch (error) {
                        console.error(`Error registering student ${student.rollNumber}:`, error);
                        failedRegistrations.push({
                            student: student.rollNumber,
                            error: error.response?.data?.message || 'Registration failed'
                        });
                    }
                }));
                
                // Update progress
                const percentCompleted = Math.round(((i + 1) / batches.length) * 100);
                setProgress(percentCompleted);
            }

            console.log('Registration complete:', {
                total: preview.length,
                successful: registeredCount,
                failed: failedRegistrations.length,
                failedDetails: failedRegistrations
            });

            setSuccess(`Successfully registered ${registeredCount} out of ${preview.length} students for ${selectedCourse.name}`);
            if (failedRegistrations.length > 0) {
                setError(`Failed to register ${failedRegistrations.length} students. Check console for details.`);
            }
            
            setFile(null);
            setPreview([]);
            setSelectedCourse(null);
            setExtractedSections([]);
            setSectionTeacherMap({});
        } catch (error) {
            console.error('Registration error:', error);
            setError(error.response?.data?.message || 'Error registering students');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="course-registration-container">
            <h2>Course Registration</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="filters">
                <div className="form-group">
                    <label>Department</label>
                    <select 
                        value={selectedDepartment} 
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Program</label>
                    <select 
                        value={selectedProgram} 
                        onChange={(e) => setSelectedProgram(e.target.value)}
                    >
                        <option value="">Select Program</option>
                        {programs.map(prog => (
                            <option key={prog} value={prog}>{prog}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Semester</label>
                    <select 
                        value={selectedSemester} 
                        onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                        <option value="">Select Semester</option>
                        {semesters.map(sem => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && (
                <div className="loading">Loading courses...</div>
            )}

            {courses.length > 0 && (
                <div className="courses-section">
                    <h3>Available Courses</h3>
                    <div className="courses-grid">
                        {courses.map(course => (
                            <div 
                                key={course._id} 
                                className={`course-card ${selectedCourse?._id === course._id ? 'selected' : ''}`}
                                onClick={() => setSelectedCourse(course)}
                            >
                                <h4>{course.name}</h4>
                                <p>Code: {course.code}</p>
                                <p>Credit Hours: {course.creditHours}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedCourse && (
                <div className="registration-section">
                    <h3>Register Students for {selectedCourse.name}</h3>
                    
                    <div className="file-upload-section">
                        <div className="file-upload">
                            <div className="file-input-container">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                    id="file-upload-input"
                                />
                                <label htmlFor="file-upload-input" className="file-upload-label">
                                    Choose File
                                </label>
                            </div>
                            <button 
                                onClick={handleDownloadTemplate}
                                className="download-template"
                                disabled={loading}
                                type="button"
                            >
                                Download Template
                            </button>
                        </div>
                        <p className="template-info">
                            The Excel file should include: Roll Number, Name, Email, and Section.
                            Sections will be created automatically based on the data in the Excel file.
                        </p>
                    </div>

                    {extractedSections.length > 0 && (
                        <div className="sections-info">
                            <h4>Assign Teachers to Sections</h4>
                            <div className="sections-list">
                                {extractedSections.map(section => (
                                    <div key={section} className="section-item">
                                        <span>Section {section}</span>
                                        <select 
                                            value={sectionTeacherMap[section] || ''} 
                                            onChange={(e) => handleTeacherAssignment(section, e.target.value)}
                                            className="teacher-select"
                                        >
                                            <option value="">Select Teacher</option>
                                            {Array.isArray(teachers) && teachers.length > 0 ? (
                                                teachers.map(teacher => (
                                                    <option key={teacher._id} value={teacher._id}>
                                                        {teacher.userId && teacher.userId.name ? teacher.userId.name : 'Unknown Teacher'}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>No teachers available</option>
                                            )}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="progress-bar">
                            <div 
                                className="progress" 
                                style={{ width: `${progress}%` }}
                            ></div>
                            <span>{progress}%</span>
                        </div>
                    )}

                    {preview.length > 0 && (
                        <div className="preview-section">
                            <h3>Preview ({preview.length} students)</h3>
                            <div className="preview-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Roll Number</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Section</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, index) => (
                                            <tr key={index}>
                                                <td>{row.rollNumber}</td>
                                                <td>{row.name}</td>
                                                <td>{row.email}</td>
                                                <td>{row.section}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleRegister}
                        disabled={!file || loading || preview.length === 0 || extractedSections.length === 0}
                        className="register-button"
                        type="button"
                    >
                        {loading ? 'Registering...' : 'Register Students'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CourseRegistrationPage; 