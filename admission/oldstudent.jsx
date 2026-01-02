import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';
import "./oldstudent.css";
import cnaLogo from "../assets/cnalogo.png";

const OldStudent = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    gradeLevel: "Grade 12", // Always Grade 12
    section: "",
    strand: "",
  });

  const [availableSections, setAvailableSections] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const API_BASE = "http://ncamisshs.com/backend";

  // Debounce function to avoid too many API calls
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Function to fetch student data by name using existing PHP
  const fetchStudentByName = async (name) => {
    if (!name.trim() || name.split(' ').length < 2) {
      // Reset form if name is incomplete
      setFormData(prev => ({
        ...prev,
        email: "",
        contactNumber: "",
        strand: "",
        section: ""
      }));
      setAvailableSections([]);
      setStudentData(null);
      setFetchError("");
      return;
    }

    setIsLoading(true);
    setFetchError("");

    try {
      const response = await fetch(`${API_BASE}/fetch_student_by_name.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await response.json();

      if (data.success) {
        const student = data.student_data;
        setStudentData(student);
        setAvailableSections(data.available_sections || []);
        
        // Auto-fill form data
        setFormData(prev => ({
          ...prev,
          email: student.email || "",
          contactNumber: student.contact_number || "",
          strand: student.strand_track || "",
          section: "" // Reset section to let user choose
        }));
        
        setFetchError("");
      } else {
        // Check if it's a balance-related error
        if (data.has_balance) {
          const balanceMsg = data.formatted_balance 
            ? `You have an unpaid balance of ${data.formatted_balance} from Grade 11. Please pay your balance first before enrolling.`
            : (data.message || "You have an unpaid balance. Please pay first before enrolling.");
          setFetchError(balanceMsg);
        } else {
          setFetchError(data.message || "Student not found");
        }
        setFormData(prev => ({
          ...prev,
          email: "",
          contactNumber: "",
          strand: "",
          section: ""
        }));
        setAvailableSections([]);
        setStudentData(null);
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      setFetchError("Error connecting to server. Please try again.");
      setFormData(prev => ({
        ...prev,
        email: "",
        contactNumber: "",
        strand: "",
        section: ""
      }));
      setAvailableSections([]);
      setStudentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced version of fetchStudentByName
  const debouncedFetchStudent = debounce(fetchStudentByName, 1000);

  // Handle name input change
  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      name: value
    }));

    // Trigger fetch when name changes
    debouncedFetchStudent(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      alert("Please enter the student's name.");
      return;
    }

    if (!formData.email.trim()) {
      alert("Please ensure email is filled.");
      return;
    }

    if (!formData.contactNumber.trim()) {
      alert("Please ensure contact number is filled.");
      return;
    }

    if (!formData.section) {
      alert("Please select a section.");
      return;
    }

    if (!formData.strand) {
      alert("Please ensure strand is filled.");
      return;
    }

    if (!studentData) {
      alert("Please enter a valid student name first.");
      return;
    }

    setSubmitting(true);

    try {
      // Use the existing submit_enrollment.php
      const enrollmentData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        contactNumber: formData.contactNumber.trim(),
        gradeLevel: "Grade 12",
        section: formData.section,
        strand: formData.strand
      };

      const response = await fetch(`${API_BASE}/submit_enrollment.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData)
      });

      const result = await response.json();

      if (result.success) {
        alert(`Enrollment successful! ${result.message}`);
        navigate("/submittedenrollment", { 
          state: {
            ...enrollmentData,
            student_id: result.student_id,
            remaining_slots: result.remaining_slots,
            success: true,
            message: result.message
          }
        });
      } else {
        // Check if it's a balance-related error
        if (result.has_balance) {
          const balanceAmount = result.formatted_balance || `₱${parseFloat(result.balance || 0).toFixed(2)}`;
          alert(`Enrollment Failed!\n\nYou have an unpaid balance of ${balanceAmount} from Grade 11.\n\nPlease pay your balance first or contact the administrator before enrolling in Grade 12.`);
        } else {
          alert(`Enrollment failed: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      alert("Error submitting enrollment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToAdmissionPortal = () => {
    navigate('/admission-portal');
  };

  return (
    <div className="admin-container">
      <div className="enrollment-background-image">
        <button className="back-button-upper-left" onClick={handleBackToAdmissionPortal}>
          <FaArrowLeft className="back-icon-upper" />
          Back
        </button>
        
        <div className="enrollment-box-os">
            <img src={cnaLogo} alt="School Logo" className="portal-logo" />
          
          <h2 className="enrollment-system-title">ONLINE PRE-ADMISSION SYSTEM</h2>
          <h2 className="welcome-title-os">Welcome back! Please confirm your details:</h2>
          
          <div className="enrollment-form">
            <hr className="separator-os" />
            <h2 className="form-title-os">G12 ENROLLMENT FORM</h2>
            
            {/* Name & Grade Level */}
            <div className="form-row-os">
              <div className="form-group-os">
                <label className="field-label-os">
                  Student Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="input-field-os"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Enter complete name (First Last)"
                  required
                />
                {isLoading && (
                  <small style={{color: 'blue'}}>Searching for student...</small>
                )}
                {fetchError && (
                  <small style={{color: 'red'}}>{fetchError}</small>
                )}
                {studentData && (
                  <small style={{color: 'green'}}>
                    Found: {studentData.first_name} {studentData.last_name} ({studentData.current_grade} → {studentData.target_grade})
                  </small>
                )}
              </div>
              <div className="form-group-os">
                <label className="field-label-os">
                  Grade Level
                </label>
                <input
                  type="text"
                  name="gradeLevel"
                  className="input-field-os"
                  value="Grade 12"
                  readOnly
                  style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                />
              </div>
            </div>

            {/* Email & Strand */}
            <div className="form-row-os">
              <div className="form-group-os">
                <label className="field-label-os">
                  Email <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="input-field-os"
                  value={formData.email}
                  onChange={handleInputChange}
                  readOnly={!!studentData}
                  style={studentData ? {backgroundColor: '#f5f5f5'} : {}}
                  placeholder={studentData ? "Auto-filled from database" : "Email will auto-fill"}
                  required
                />
              </div>
              <div className="form-group-os">
                <label className="field-label-os">
                  Strand <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="strand"
                  className="input-field-os"
                  value={formData.strand}
                  readOnly={!!studentData}
                  style={studentData ? {backgroundColor: '#f5f5f5'} : {}}
                  placeholder={studentData ? "Auto-filled from database" : "Strand will auto-fill"}
                />
              </div>
            </div>

            {/* Contact Number & Section */}
            <div className="form-row-os">
              <div className="form-group-os">
                <label className="field-label-os">
                  Contact Number <span className="required-star">*</span>
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  className="input-field-os"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder={studentData ? "Update if needed" : "e.g., 09123456789"}
                  required
                />
              </div>
              <div className="form-group-os">
                <label className="field-label-os">
                  Available Sections (Grade 12) <span className="required-star">*</span>
                </label>
                <select
                  name="section"
                  className="input-field-os"
                  value={formData.section}
                  onChange={handleInputChange}
                  required
                  disabled={!studentData || availableSections.length === 0}
                >
                  <option value="">
                    {studentData ? "Select Section" : "Enter student name first"}
                  </option>
                  {availableSections.map((sectionData, index) => (
                    <option 
                      key={index} 
                      value={sectionData.section}
                      disabled={!sectionData.available}
                    >
                      {sectionData.display}
                    </option>
                  ))}
                </select>
                {studentData && availableSections.length === 0 && (
                  <small style={{color: 'red'}}>No available sections for {formData.strand} strand</small>
                )}
                {studentData && availableSections.length > 0 && (
                  <small style={{color: 'blue'}}>Showing Grade 12 sections for {formData.strand} strand</small>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="button" 
              className="enrollment-button-os" 
              onClick={handleSubmit}
              disabled={submitting || !studentData || !formData.section}
              style={{
                opacity: (submitting || !studentData || !formData.section) ? 0.6 : 1,
                cursor: (submitting || !studentData || !formData.section) ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? "SUBMITTING..." : "SUBMIT ENROLLMENT"}
            </button>
            
            {(!studentData || !formData.section) && (
              <small style={{color: '#666', display: 'block', textAlign: 'center', marginTop: '10px'}}>
                {!studentData ? "Please enter a valid student name to enable enrollment" : "Please select a section to continue"}
              </small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OldStudent;