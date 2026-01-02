import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaArrowLeft, FaExclamationCircle, FaTimesCircle, FaFilePdf } from 'react-icons/fa';
import './studentlogin.css';

import cnaLogo from '../assets/cnalogo.png';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalData, setStatusModalData] = useState({
    title: '',
    message: '',
    type: 'error' // 'error' or 'warning'
  });
  const [showPdfModal, setShowPdfModal] = useState(false);

  // API base URL - updated to use the new domain with https
  const API_BASE_URL = "https://ncamisshs.com/backend";
  
  // PDF Manual Path - Uses PHP endpoint for flexible PDF serving
  // To change the PDF file location, edit: backend/get_student_manual.php
  const STUDENT_MANUAL_PDF_PATH = `${API_BASE_URL}/get_student_manual.php`;

  const handleLogin = async () => {
    // Validate inputs
    if (!userId || !password) {
      setErrorMessage("Please fill in both fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${API_BASE_URL}/studentlogin.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Navigate to the next interface with the student_id
        navigate('/student-dashboard', { state: { student_id: result.student_id } });
      } else {
        // Check if it's a status-related error (dropped/transferred/pending/graduated)
        const message = result.message || "Login failed. Please check your credentials.";
        
        if (message.includes("dropped") || message.includes("transferred") || message.includes("pending") || message.includes("graduated")) {
          // Show modal for status-related errors
          let modalType = 'error';
          let modalTitle = 'Access Denied';
          
          if (message.includes("dropped")) {
            modalTitle = 'Account Dropped';
          } else if (message.includes("transferred")) {
            modalTitle = 'Account Transferred';
          } else if (message.includes("graduated")) {
            modalTitle = 'Already Graduated';
          } else if (message.includes("pending")) {
            modalType = 'warning';
            modalTitle = 'Enrollment Pending';
          }
          
          setStatusModalData({
            title: modalTitle,
            message: message,
            type: modalType
          });
          setShowStatusModal(true);
        } else {
          // Show regular error message for invalid credentials
          setErrorMessage(message);
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleBackToFrontpage = () => {
    navigate('/');
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusModalData({
      title: '',
      message: '',
      type: 'error'
    });
  };

  const handlePdfLinkClick = (e) => {
    e.preventDefault();
    setShowPdfModal(true);
  };

  const closePdfModal = () => {
    setShowPdfModal(false);
  };

  const handleDownloadPdf = () => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = STUDENT_MANUAL_PDF_PATH;
    link.download = 'Student_Manual.pdf'; // Suggested filename
    link.target = '_blank'; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    closePdfModal();
  };

  return (
    <div className="admin-container">
      <div className="background-image-student">
        <button className="back-button-upper-left" onClick={handleBackToFrontpage}>
          <FaArrowLeft className="back-icon-upper" />
          Back
        </button>
        <div className="login-box-student">
          <img src={cnaLogo} alt="Logo" className="logo-img-al-student" />
          <h2 className="system-title-student">Northills College of Asia</h2>

          <div className="login-form">
            <hr className="separator-student" />
            <h2 className="sign-in-title-student">STUDENT PORTAL</h2>
            
            <input
              type="text"
              placeholder="User Number"
              className="input-field-student"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <div className="password-container-student"> 
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="password-input-student"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <button
                type="button"
                className="view-icon-button-student"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash/>}
              </button>
            </div>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <button 
              className="login-button-student" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
            <div className="how-to-use-container">
              <span className="how-to-use-text">How to use? </span>
              <a 
                href="#" 
                className="how-to-use-link" 
                onClick={handlePdfLinkClick}
              >
                Link
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="status-modal-overlay" onClick={closeStatusModal}>
          <div className="status-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`status-modal-icon ${statusModalData.type}`}>
              {statusModalData.type === 'error' ? <FaTimesCircle /> : <FaExclamationCircle />}
            </div>
            <h2 className="status-modal-title">{statusModalData.title}</h2>
            <p className="status-modal-message">{statusModalData.message}</p>
            <button className="status-modal-button" onClick={closeStatusModal}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* PDF Download Modal */}
      {showPdfModal && (
        <div className="pdf-modal-overlay" onClick={closePdfModal}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-icon">
              <FaFilePdf />
            </div>
            <h2 className="pdf-modal-title">Download Student Manual</h2>
            <p className="pdf-modal-message">
              Would you like to download the Student Manual PDF?
            </p>
            <div className="pdf-modal-buttons">
              <button className="pdf-modal-button pdf-modal-button-cancel" onClick={closePdfModal}>
                Cancel
              </button>
              <button className="pdf-modal-button pdf-modal-button-download" onClick={handleDownloadPdf}>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLogin;