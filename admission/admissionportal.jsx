import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./admissionportal.css";
import { FaArrowLeft, FaFilePdf } from 'react-icons/fa';
import cnaLogo from "../assets/cnalogo.png";

const AdmissionPortal = () => {
  const navigate = useNavigate();
  const [showPdfModal, setShowPdfModal] = useState(false);

  // API base URL
  const API_BASE_URL = "https://ncamisshs.com/backend";
  
  // PDF Manual Path - Uses PHP endpoint for flexible PDF serving
  // To change the PDF file location, edit: backend/get_admission_manual.php
  const ADMISSION_MANUAL_PDF_PATH = `${API_BASE_URL}/get_admission_manual.php`;

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
    link.href = ADMISSION_MANUAL_PDF_PATH;
    link.download = 'Admission_Manual.pdf'; // Suggested filename
    link.target = '_blank'; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    closePdfModal();
  };

  return (
    <div className="portal-container">
      <button className="back-button-upper-left" onClick={handleBackToFrontpage}>
        <FaArrowLeft className="back-icon-upper" />
        Back
      </button>
      <div className="portal-box">
        <img src={cnaLogo} alt="School Logo" className="portal-logo" />
        <h2 className="portal-title">ADMISSION PORTAL</h2>
        <div className="portal-buttons">
          <Link to="/admission-login" className="portal-btn">
            NEW STUDENT
          </Link>
          <Link to="/old-student" className="portal-btn">
            OLD STUDENT
          </Link>
        </div>
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

      {/* PDF Download Modal */}
      {showPdfModal && (
        <div className="pdf-modal-overlay" onClick={closePdfModal}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-icon">
              <FaFilePdf />
            </div>
            <h2 className="pdf-modal-title">Download Admission Manual</h2>
            <p className="pdf-modal-message">
              Would you like to download the Admission Manual PDF?
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

export default AdmissionPortal;