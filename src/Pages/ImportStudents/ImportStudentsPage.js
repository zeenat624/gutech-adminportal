import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import './ImportStudentsPage.css';

const ImportStudentsPage = () => {
    const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Check if user is authenticated
        const token = sessionStorage.getItem('token');
        if (!token) {
            toast.error('Please login to access this page');
            navigate('/login');
            return;
        }
    }, [navigate]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setSuccess('');
            
            // Read the Excel file and create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = event.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Validate required fields
                    const requiredFields = ['rollNumber', 'name', 'email', 'department', 'program'];
                    const validData = jsonData.filter(row => 
                        requiredFields.every(field => row[field] !== undefined && row[field] !== '')
                    );

                    if (validData.length === 0) {
                        setError('No valid data found in the Excel file. Please check the required fields.');
                        setPreview([]);
                        return;
                    }

                    setPreview(validData.slice(0, 5)); // Show first 5 records as preview
                } catch (err) {
                    setError('Invalid Excel file format');
                    setPreview([]);
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                rollNumber: "2024001",
                name: "John Doe",
                email: "john.doe@example.com",
                department: "Computer Science",
                program: "BSc",
                currentSemester: 1,
                CGPA: 3.5
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, 'student_template.xlsx');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        const token = sessionStorage.getItem('token');
        if (!token) {
            setError('Authentication required. Please login again.');
            navigate('/login');
            return;
        }

        setLoading(true);
        setProgress(0);
        setError('');
        setSuccess('');

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = event.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const students = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Validate the data
                    const requiredFields = ['rollNumber', 'name', 'email', 'department', 'program'];
                    const invalidStudents = students.filter(student => 
                        !requiredFields.every(field => student[field] !== undefined && student[field] !== '')
                    );

                    if (invalidStudents.length > 0) {
                        setError(`Invalid data found in ${invalidStudents.length} records. Please check the template format.`);
                        setLoading(false);
                        return;
                    }

                    // Prepare the data for bulk creation
                    const studentData = students.map(student => ({
                        user: {
                            name: student.name,
                            email: student.email,
                            role: 'student'
                        },
                        student: {
                            rollNumber: student.rollNumber,
                            department: student.department,
                            program: student.program,
                            currentSemester: student.currentSemester || 1,
                            CGPA: student.CGPA || 0
                        }
                    }));

                    // Make a single API call for bulk creation
                    const response = await axios.post(
                        `${apiUrl}/api/students/bulk`,
                        { students: studentData },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    setSuccess(`Successfully imported ${response.data.created} students`);
                    setFile(null);
                    setPreview([]);
                    setProgress(100);
                } catch (err) {
                    if (err.response?.status === 401) {
                        setError('Session expired. Please login again.');
                        navigate('/login');
                    } else {
                        setError(err.response?.data?.message || 'Error processing the file');
                    }
                }
            };

            reader.readAsArrayBuffer(file);
        } catch (err) {
            setError('Error reading the file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="import-students-container">
            <h2>Import Students</h2>
            <p className="import-description">
                Import multiple students at once using an Excel file. Download the template below to see the required format.
            </p>

            <div className="import-section">
                <div className="file-upload">
                    <div className="upload-area">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            disabled={loading}
                            id="file-upload-input"
                        />
                        <label htmlFor="file-upload-input" className="file-label">
                            {file ? file.name : 'Choose Excel file'}
                        </label>
                    </div>
                    <button
                        className="download-template"
                        onClick={handleDownloadTemplate}
                        disabled={loading}
                    >
                        Download Template
                    </button>
                </div>

                {loading && (
                    <div className="progress-bar">
                        <div className="progress" style={{ width: `${progress}%` }}></div>
                        <span>{progress}%</span>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {preview.length > 0 && (
                    <div className="preview-section">
                        <h3>Preview (First 5 records)</h3>
                        <div className="preview-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Roll Number</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Department</th>
                                        <th>Program</th>
                                        <th>Semester</th>
                                        <th>CGPA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((student, index) => (
                                        <tr key={index}>
                                            <td>{student.rollNumber}</td>
                                            <td>{student.name}</td>
                                            <td>{student.email}</td>
                                            <td>{student.department}</td>
                                            <td>{student.program}</td>
                                            <td>{student.currentSemester || 'N/A'}</td>
                                            <td>{student.CGPA || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <button
                    className="upload-button"
                    onClick={handleUpload}
                    disabled={!file || loading}
                >
                    {loading ? 'Importing...' : 'Import Students'}
                </button>
            </div>
        </div>
    );
};

export default ImportStudentsPage; 