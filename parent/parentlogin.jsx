import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaArrowLeft, FaFilePdf } from 'react-icons/fa';
import './parentlogin.css';

import cnaLogo from '../assets/cnalogo.png';
const ParentLogin = () => {
  const navigate = useNavigate();
  const [parentUserId, setParentUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  // API base URL
  const API_BASE_URL = "https://ncamisshs.com/backend";
  
  // PDF Manual Path - Uses PHP endpoint for flexible PDF serving
  // To change the PDF file location, edit: backend/get_parent_manual.php
  const PARENT_MANUAL_PDF_PATH = `${API_BASE_URL}/get_parent_manual.php`;

  const handleLogin = async () => {
    // Validate input
    if (!parentUserId || !password) {
      setErrorMessage("Please fill in both fields.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/parentlogin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parent_user_id: parentUserId, parent_password: password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the student_id in localStorage (or state if preferred)
        localStorage.setItem('student_id', data.student_id);

        // Pass student_id as a state in the navigate function
        navigate('/parent-dashboard', { state: { student_id: data.student_id } });
      } else {
        setErrorMessage(data.message); // Show error message if login fails
      }
    } catch (error) {
      console.error("Login failed", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };
   const handleBackToFrontpage = () => {
    navigate('/');
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
    link.href = PARENT_MANUAL_PDF_PATH;
    link.download = 'Parent_Manual.pdf'; // Suggested filename
    link.target = '_blank'; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    closePdfModal();
  };


  return (
    <div className="parent-container">
      <div className="background-image-parent">
        <button className="back-button-upper-left" onClick={handleBackToFrontpage}>
                  <FaArrowLeft className="back-icon-upper" />
                  Back
                </button>
        <div className="login-box-parent">
          <img src={cnaLogo} alt="Logo" className="logo-img-al-parent" />
          <h2 className="system-title-parent">Northills College of Asia</h2>

          <div className="login-form-parent">
            <hr className="separator-parent" />
            <h2 className="sign-in-title-parent">PARENT PORTAL</h2>

            <input 
              type="text" 
              placeholder="User Number" 
              className="input-field-parent" 
              value={parentUserId}
              onChange={(e) => setParentUserId(e.target.value)}
            />

            <div className="password-container-parent">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="password-input-parent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="view-icon-button-parent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <button className="login-button-parent" onClick={handleLogin}>LOGIN</button>
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

      {/* PDF Download Modal */}
      {showPdfModal && (
        <div className="pdf-modal-overlay" onClick={closePdfModal}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-icon">
              <FaFilePdf />
            </div>
            <h2 className="pdf-modal-title">Download Parent Manual</h2>
            <p className="pdf-modal-message">
              Would you like to download the Parent Manual PDF?
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

export default ParentLogin;
