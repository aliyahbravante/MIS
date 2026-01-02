import React, { useEffect, useState } from "react";
import "./officiallyenrolled.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';
import cnaLogo from '../assets/cnalogo.png';

const OfficiallyEnrolled = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const studentId = location.state?.student_id || "N/A";

  const [studentInfo, setStudentInfo] = useState({
    last_name: "N/A",
    first_name: "N/A",
    status: "PENDING", // Default to PENDING
    strand_track: "",
    strand_description: "", // Adding the strand description
    user_id: "",
    password: "",
    parent_user_id: "",
    parent_password: "",
    isAlreadyEnrolled: false, // Track if student is already enrolled
  });

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await fetch("http://ncamisshs.com/backend/getStudentdetails.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ student_id: studentId }),
        });
  
        const result = await response.json();
  
        if (result.success) {
          if (result.status === "PENDING") {
            // Display the "Pending" message
            setStudentInfo((prev) => ({
              ...prev,
              status: "PENDING",
              first_name: result.first_name, // Set first_name for pending
              last_name: result.last_name, // Set last_name for pending
            }));
          } else if (result.status === "APPROVE") {
            // Display the "Approve" message and credentials
            setStudentInfo((prev) => ({
              ...prev,
              status: "APPROVE",
              first_name: result.first_name,
              last_name: result.last_name,
              strand_track: result.strand_track,
              strand_description: result.strand_description, // Adding strand description here
              user_id: result.user_id,
              password: result.password,
              parent_user_id: result.parent_user_id,
              parent_password: result.parent_password, // Add parent_password here
            }));
          }
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
      }
    };
  
    if (studentId !== "N/A") {
      fetchStudentDetails();
    }
  }, [studentId]);

  const saveStudentCredentials = async (user_id, password, parent_user_id, parent_password) => {
    try {
      const response = await fetch("http://ncamisshs.com/backend/saveCredentials.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
          password,
          parent_user_id,
          parent_password,
          student_id: location.state?.student_id || 1, // Ensure student_id is sent
        }),
      });
  
      const result = await response.json();
  
      if (result.success || result.message.includes("already exists")) {
        // Navigate regardless of whether it's new enrollment or already exists
        navigate("/student-login");
      } else {
        console.error("Error:", result.message);
        alert(result.message); // Handle other errors
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
      alert("An error occurred while processing your request.");
    }
  };

  const handleProceedClick = async () => {
    if (studentInfo.isAlreadyEnrolled) {
      // Student is already enrolled, just navigate without saving
     
      navigate("/student-login");
    } else {
      // Student is newly approved, save credentials then navigate
      await saveStudentCredentials(
        studentInfo.user_id,
        studentInfo.password,
        studentInfo.parent_user_id,
        studentInfo.parent_password
      );
    }
  };
  
  const handleBackToFrontpage = () => {
    navigate('/');
  };
  return (
    <div className="officially-enrolled-container">
      <button className="back-button-upper-left" onClick={handleBackToFrontpage}>
                        <FaArrowLeft className="back-icon-upper" />
                        Back
                      </button>
      <div className="banner">
        <img
          src={cnaLogo}
          alt="Northhills College Logo"
          className="college-logo"
        />
        <h1 className="welcome-message">WELCOME</h1>
        <h2 className="highlight">
          {studentInfo.status === "PENDING" ? (
            <>{studentInfo.first_name} {studentInfo.last_name}</>
          ) : (
            <>{studentInfo.last_name.toUpperCase()}, {studentInfo.first_name.toUpperCase()}</>
          )}
        </h2>
      </div>
      <div className="enrollment-details">
        {studentInfo.status === "APPROVE" ? (
          <>
            <p>
              Congratulations! You are now <strong>OFFICIALLY ENROLLED</strong> at
              Northills College of Asia in the <strong>{studentInfo.strand_track} ({studentInfo.strand_description})</strong> program.
            </p>
            <p>You can access your student portal using the credentials below:</p>
            <ul className="credentials-list">
              <li>
                <strong>User ID:</strong> {studentInfo.user_id}
              </li>
              <li>
                <strong>Password:</strong> {studentInfo.password}
              </li>
            </ul>
            <p>Additionally, here are the credentials for your parent portal account:</p>
            <ul className="credentials-list">
              <li>
                <strong>User ID:</strong> {studentInfo.parent_user_id}
              </li>
              <li>
                <strong>Password:</strong> {studentInfo.parent_password}
              </li>
            </ul>
            <button
              className="portal-button"
              onClick={handleProceedClick}
            >
              PROCEED TO STUDENT PORTAL
            </button>
          </>
        ) : (
          <>
            <p>
              Your application is currently <strong>PENDING</strong>. Please wait for further updates
              regarding the approval of your enrollment at Northills College of Asia.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OfficiallyEnrolled;