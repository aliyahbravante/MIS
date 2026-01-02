import React, { useEffect } from 'react';
import './requirements.css';
import { useNavigate, useLocation } from 'react-router-dom';

const Requirements = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location; // Data passed from FamilyBackground, EnrollmentData, and PersonalInfoForm

  // Log the received data on mount
  useEffect(() => {
    if (state) {
      console.log("Data received from FamilyBackground, EnrollmentData, and PersonalInfoForm:");
      console.log(state); // Log all received data for verification
    } else {
      console.log("No data received.");
    }
  }, [state]);

  const handlePrevious = () => {
    navigate('/family-background');
  };

  const handleNext = (event) => {
    event.preventDefault();

    const requirementsList = [
      'PSA Birth Certificate - 4pcs (photocopy)',
      'Junior Certificates - 1pcs (photocopy)',
      'F-138/Card (3 photocopy & Orig)',
      'Passport size picture - 3pcs (white background w/ collar)',
      '1×1 Picture - 2pcs (white background w/ collar)',
      'Good Moral Character',
      'F-137/SF-10',
    ];

    const requirementsData = {
      ...state, // Pass all existing data from previous steps
      requirements: requirementsList, // Add requirements to the state
    };

    navigate('/final-step', { state: requirementsData });
  };

  return (
    <div className="requirements-form">
      <h2>Requirements</h2>
      <p className="notice">
        Notice: Complete the required documents. The administrator will provide dates, and you can choose your submission date on the next page.
      </p>
      <form onSubmit={handleNext}>
        <div className="requirements-list">
          <ul>
            <li>PSA Birth Certificate - 4pcs (photocopy)</li>
            <li>Junior Certificates - 1pcs (photocopy)</li>
            <li>F-138/Card (3 photocopy & Orig)</li>
            <li>Passport size picture - 3pcs (white background w/ collar)</li>
            <li>1×1 Picture - 2pcs (white background w/ collar)</li>
            <li>Good Moral Character</li>
            <li>F-137/SF-10</li>
          </ul>
        </div>
        <div className="button-container">
          <button type="button" className="previous-button-r" onClick={handlePrevious}>
            Previous
          </button>
          <button type="submit" className="next-button-r">Next</button>
        </div>
      </form>
    </div>
  );
};

export default Requirements;
