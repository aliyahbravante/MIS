import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import './facultydashboard.css';

const FacultyDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const facultyId = location.state?.faculty_id;

  console.log("Faculty ID:", facultyId); // Debugging

  const [facultyName, setFacultyName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [criticalError, setCriticalError] = useState(null); // Only for critical errors like no faculty_id

  useEffect(() => {
    // Redirect if no faculty_id is present
    if (!facultyId) {
      console.error("No faculty_id found in location state");
      navigate("/faculty-login");
      return;
    }

    // Fetch faculty details using facultyId
    const fetchFacultyDetails = async () => {
      try {
        const apiUrl = `http://ncamisshs.com/backend/getFaculty.php?faculty_id=${facultyId}`;
        console.log("Fetching faculty details from:", apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Faculty details response:", result);
        
        if (result.success && result.facultyName) {
          console.log("Faculty name found:", result.facultyName);
          setFacultyName(result.facultyName);
        } else {
          console.warn("Could not fetch faculty name:", result.message);
          console.log("Setting faculty name to default: 'Faculty'");
          setFacultyName('Faculty'); // Default fallback
        }
      } catch (error) {
        console.error("Error fetching faculty details:", error);
        console.log("Setting faculty name to default due to error: 'Faculty'");
        setFacultyName('Faculty'); // Default fallback, don't show error
      }
    };

    const fetchTotalSubjects = async () => {
      try {
        const apiUrl = `http://ncamisshs.com/backend/getTotalSubjects.php?faculty_id=${facultyId}`;
        console.log("Fetching total subjects from:", apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          console.warn(`Could not fetch subjects. Status: ${response.status}`);
          setTotalSubjects(0);
          return;
        }
        
        const result = await response.json();
        console.log("Total subjects response:", result);
        
        if (result.success && result.totalSubjects !== undefined) {
          console.log("Total subjects found:", result.totalSubjects);
          setTotalSubjects(result.totalSubjects);
        } else {
          console.warn("No subjects found or invalid response:", result.message);
          console.log("Setting total subjects to: 0");
          setTotalSubjects(0);
        }
      } catch (error) {
        console.error("Error fetching total subjects:", error);
        setTotalSubjects(0); // Default to 0, don't show error
      }
    };

    const fetchTotalEnrolledStudents = async () => {
      try {
        const apiUrl = `http://ncamisshs.com/backend/getStudents.php?faculty_id=${facultyId}`;
        console.log("Fetching enrolled students from:", apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          console.warn(`Could not fetch students. Status: ${response.status}`);
          setTotalEnrolledStudents(0);
          return;
        }
        
        const result = await response.json();
        console.log("Total enrolled students response:", result);
        
        if (result.success && result.totalEnrolledStudents !== undefined) {
          console.log("Total enrolled students found:", result.totalEnrolledStudents);
          setTotalEnrolledStudents(result.totalEnrolledStudents);
        } else {
          console.warn("No students found or invalid response:", result.message);
          console.log("Setting total enrolled students to: 0");
          setTotalEnrolledStudents(0);
        }
      } catch (error) {
        console.error("Error fetching total enrolled students:", error);
        setTotalEnrolledStudents(0); // Default to 0, don't show error
      }
    };

    // Fetch all data in parallel
    const fetchAllData = async () => {
      setLoading(true);
      setCriticalError(null);
      
      try {
        await Promise.all([
          fetchFacultyDetails(),
          fetchTotalSubjects(),
          fetchTotalEnrolledStudents()
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Only set critical error for truly critical issues
        // For now, we'll just log and continue with default values
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    
    // Set up timer for clock
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [facultyId, navigate]);

  if (loading) {
    return <div className="loading-container">Loading dashboard data...</div>;
  }

  // Only show error for critical errors (like authentication issues)
  if (criticalError) {
    return (
      <div className="error-container">
        <h3>Critical Error</h3>
        <p>{criticalError}</p>
        <button onClick={() => navigate('/faculty-login')}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="faculty-dashboard-container">
      <div className="faculty-dashboard-header">
        <h1>
          Welcome, {facultyName || 'Faculty'}!
        </h1>
        <h2>{currentTime}</h2>
      </div>

      {/* Stats Cards */}
      <div className="faculty-stats-container">
        <div className="faculty-stat-card">
          <FaBars size={30} className="stat-icon" />
          <div className="stat-content">
            <h4>Subjects</h4>
            <h2>{totalSubjects}</h2>
          </div>
        </div>
        <div className="faculty-stat-card">
          <FaBars size={30} className="stat-icon" />
          <div className="stat-content">
            <h4>Enrolled Students</h4>
            <h2>{totalEnrolledStudents}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;