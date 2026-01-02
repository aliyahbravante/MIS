import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './viewapplicants.css';

const ViewApplicants = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const student_id = location.state?.student_id || sessionStorage.getItem('student_id');

  // Store student_id in console and sessionStorage for debugging and persistence
  useEffect(() => {
    console.log("Current student_id:", student_id);
    if (student_id) {
      sessionStorage.setItem('student_id', student_id);
      console.log("Student ID stored in sessionStorage:", student_id);
    }
  }, [student_id]);

  const [applicantData, setApplicantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null); // Image state
  const [showModal, setShowModal] = useState(false); // Show/Hide confirmation modal
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal
  const [action, setAction] = useState(""); // Action: approve or reject
  const [time, setTime] = useState("");
  const [remark, setRemark] = useState("");
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [requirementsStatus, setRequirementsStatus] = useState({});
  const [originalRequirementsStatus, setOriginalRequirementsStatus] = useState({}); // Track original status
  const [section, setSection] = useState(""); // Ensure section state is initialized
  const [sections, setSections] = useState([]); // Sections for the dropdown
  const [sectionsWithSlots, setSectionsWithSlots] = useState([]); // Sections with slot information
  const [selectedSection, setSelectedSection] = useState(""); // Selected section
  const [originalRemark, setOriginalRemark] = useState(""); // Track original remark
  
  // API URLs
  const AUDIT_LOG_URL = 'http://ncamisshs.com/backend/audit_log.php';
  
  // Array of display labels for the requirements
  const requirements = [
    'Birth Certificate',
    'Certificate of Good Moral Character',
    'High School Diploma',
    'Transcript of Records',
    'ID Picture',
  ];

  // Mapping from display labels to shortened keys
  const requirementKeys = {
    'Birth Certificate': 'birth_certificate',
    'Certificate of Good Moral Character': 'good_moral',
    'High School Diploma': 'highschool_diploma',
    'Transcript of Records': 'TOR',
    'ID Picture': 'id_picture',
  };

  // Function to log audit
  const logAudit = async (action, details) => {
    try {
      const response = await fetch(AUDIT_LOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: 'Admin', // You can make this dynamic based on logged-in user
          action: action,
          details: details
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to log audit:', result.message);
      }
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  // Function to update strand slots
  const updateStrandSlots = async (strandName, grade, section) => {
    try {
      const response = await fetch('http://ncamisshs.com/backend/update_strand_slots.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strand: strandName,
          grade: grade,
          section: section,
          action: 'decrease' // Decrease slots by 1
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to update strand slots:', result.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error updating strand slots:', error);
      return false;
    }
  };

  useEffect(() => {
    // Make sure student_id is available before fetching
    if (!student_id) {
      setLoading(false);
      return;
    }

    // Using ncamisshs.com API format
    fetch(`http://ncamisshs.com/backend/applicant_details.php?student_id=${student_id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Check status: All applicants in the list start as PENDING
          // If status is APPROVE, it means we just approved them (or direct URL access)
          // If status is GRADUATED, it means they're already graduated
          const applicantStatus = data.data.finalstep?.status;
          if (applicantStatus && applicantStatus.toUpperCase() === 'APPROVE') {
            // Applicant was just approved - this is expected after approval
            // Silently navigate to applicants list (success message already shown in handleUpdate)
            console.log("✅ Applicant is approved - navigating to applicants list");
            navigate("/applicants");
            return;
          } else if (applicantStatus && applicantStatus.toUpperCase() === 'GRADUATED') {
            // Applicant is already graduated - shouldn't be in applicants list
            console.warn("⚠️ Applicant is already graduated - redirecting");
            alert("This applicant has already been graduated and cannot be modified.");
            navigate("/applicants");
            return;
          }

          // If status is NULL or PENDING, allow access (this is expected for applicants list)
          setApplicantData(data.data);

          // Set image if available
          if (data.data.personalinfo?.picture) {
            setImage(`data:image/jpeg;base64,${data.data.personalinfo.picture}`);
          }

          // Initialize requirements status
          const initialStatus = {};
          for (const [label, key] of Object.entries(requirementKeys)) {
            initialStatus[label] = data.data.finalstep?.[key] || "NOT_SUBMITTED";
          }
          setRequirementsStatus(initialStatus);
          setOriginalRequirementsStatus({ ...initialStatus }); // Store original status

          const currentRemark = data.data.finalstep?.status || "PENDING";
          setRemark(currentRemark);
          setOriginalRemark(currentRemark); // Store original remark
          
          setSection(data.data.enrollmentdata?.section || ""); // Initialize section from data

          // Fetch sections based on student's strand and grade
          fetch(`http://ncamisshs.com/backend/fetch_strandSection.php?student_id=${student_id}`)
            .then((response) => response.json())
            .then((sectionData) => {
              if (sectionData.success) {
                setSections(sectionData.sections); // Update sections dropdown for backward compatibility
                setSelectedSection(data.data.enrollmentdata?.section || ""); // Pre-fill selected section if available
                
                // Use the new sections_with_slots data
                if (sectionData.sections_with_slots) {
                  setSectionsWithSlots(sectionData.sections_with_slots);
                } else {
                  // Fallback to regular sections if slot data is not available
                  const fallbackSections = sectionData.sections.map(section => ({
                    section: section,
                    display: section,
                    slots: null,
                    available: true
                  }));
                  setSectionsWithSlots(fallbackSections);
                }
              } else {
                console.error("Error fetching sections:", sectionData.message);
              }
            })
            .catch((error) => console.error("Error fetching sections:", error));
        } else {
          alert(data.message);
        }
      })
      .catch((error) => console.error("Error fetching applicant details:", error))
      .finally(() => setLoading(false));
  }, [student_id, navigate]);

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  const handleStatusChange = (requirement, status) => {
    setRequirementsStatus((prev) => ({
      ...prev,
      [requirement]: status,
    }));
  };

  const isAllRequirementsSubmitted = () =>
    Object.values(requirementsStatus).every((status) => status === "SUBMITTED");

  const handleApprovalChange = (e) => {
    const selectedRemark = e.target.value;
  
    if (selectedRemark === "APPROVE") {
      if (!isAllRequirementsSubmitted()) {
        alert("All requirements must be submitted to approve.");
        setRemark("PENDING");
      } else if (!selectedSection.trim()) {
        alert("Section must be provided before approval.");
        setRemark("PENDING");
      } else {
        setRemark("APPROVE");
      }
    } else {
      // Allow "PENDING" updates and other remarks.
      setRemark(selectedRemark);
    }
  };

  const handleUpdate = async () => {
  const updatedRequirements = {};
  for (const [label, key] of Object.entries(requirementKeys)) {
    updatedRequirements[key] = requirementsStatus[label];
  }

  // Generate audit log details based on what was updated
  const studentName = `${applicantData.personalinfo?.first_name || ''} ${applicantData.personalinfo?.last_name || ''}`.trim();
  
  // Check if approval status changed from non-APPROVE to APPROVE
  const wasApproved = originalRemark !== "APPROVE" && remark === "APPROVE";
  
  // Debug logging
  console.log("=== UPDATE DEBUG INFO ===");
  console.log("Original remark:", originalRemark);
  console.log("New remark:", remark);
  console.log("Was approved (originalRemark !== 'APPROVE' && remark === 'APPROVE'):", wasApproved);
  console.log("Student name:", studentName);
  console.log("Selected section:", selectedSection);

  try {
    console.log("🚀 Sending update request to backend...");
    
    const response = await fetch("http://ncamisshs.com/backend/requirements.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id,
        requirements: updatedRequirements,
        remark,
        section: selectedSection.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ API Error Response:", errorData);
      alert(errorData.message || `Error: ${response.statusText} (Status: ${response.status})`);
      return;
    }

    const data = await response.json();
    console.log("📡 Backend response:", data);

    if (data.success || data.message === "Requirements successfully updated.") {
      console.log("✅ Update successful");
      
      // Only log approval if status was actually changed to APPROVE
      // Slots are now automatically updated in the backend transaction
      if (wasApproved) {
        console.log("🎉 APPROVING STUDENT - Slots automatically decreased by backend");
        
        // Check if backend successfully updated slots
        if (data.slots_updated === false) {
          console.warn("⚠️ Backend did not update slots - may have failed or no slots available");
          // Don't block navigation, but log the warning
        } else if (data.slots_updated === true) {
          console.log("✅ Slots automatically decreased by backend");
        }
        
        // Log approval with section
        await logAudit('UPDATE', `Approved Applicant in Section ${selectedSection}: ${studentName}`);
        
        // Show success message and navigate immediately
        console.log("✅ Applicant successfully approved!");
        alert("Applicant has been successfully approved!");
        
        // Navigate to applicants list immediately
        // Note: When page loads again, status will be APPROVE, and useEffect will detect it
        // and navigate away silently (no error message)
        console.log("🏠 Student approved, navigating to applicants list...");
        navigate("/applicants");
      } else {
        console.log("📝 UPDATING REQUIREMENTS ONLY - Will stay on page");
        
        // Check for requirements changes
        const changedRequirements = [];
        for (const [label, status] of Object.entries(requirementsStatus)) {
          if (originalRequirementsStatus[label] !== status && status === "SUBMITTED") {
            changedRequirements.push(label);
          }
        }
        
        console.log("Changed requirements:", changedRequirements);
        
        // Log requirements changes if any
        if (changedRequirements.length > 0) {
          const requirementsText = changedRequirements.join(', ');
          await logAudit('UPDATE', `Submitted (${requirementsText}): ${studentName}`);
        }
        
        // Refresh the current page data instead of navigating away
        console.log("🔄 Requirements updated but not approved, refreshing current page...");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      
      // Update original requirements status and remark for future comparisons
      setOriginalRequirementsStatus({ ...requirementsStatus });
      setOriginalRemark(remark);
      
    } else {
      console.error("❌ Backend returned error:", data.message);
      alert(data.message || "An error occurred while updating.");
    }
  } catch (error) {
    console.error("🚨 Error in update:", error);
    alert("A network or server error occurred. Please try again.");
  } finally {
    setShowModal(false);
  }
};
  
  // Success Modal close handler (keeping for potential future use)
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/applicants"); // Navigate to applicants list after closing modal
  };
  
  const openModal = () => setShowModal(true); // Open confirmation modal
  const closeModal = () => setShowModal(false); // Close confirmation modal

  if (loading) {
    return <div>Loading applicant data...</div>;
  }
  
  if (!student_id) {
    console.error("No student_id found in location.state or sessionStorage");
    return (
      <div>
        <p>No student selected. Please return to the applicants list.</p>
        <button onClick={() => navigate('/applicants')}>Back to Applicants</button>
      </div>
    );
  }
  
  if (!applicantData) {
    console.error("No applicant data found for student_id:", student_id);
    return (
      <div>
        <p>No applicant data found. Please try again later.</p>
        <button onClick={() => navigate('/applicants')}>Back to Applicants</button>
      </div>
    );
  }

  return (
    <form className="viewapplicants-container">
      <input type="hidden" name="student_id" value={student_id || ''} />

      <div className="header-vp">
        <button type="button" className="breadcrumb-button" onClick={() => navigate('/applicants')}>
          Applicants List /
        </button>  
        <span className="applicant-name">
          {applicantData.personalinfo?.first_name} {applicantData.personalinfo?.last_name}
        </span>
      </div>
      <h2 className="application-title-vp">VIEW APPLICANT DETAILS </h2>

      <div className="image-and-form-container-vp">
        <div className="image-upload-container-vp">
          <div className="box-decoration-vp">
          {image ? (
              <img src={image} alt="Applicant" className="img-display-after-vp" />
            ) : (
              <img src="/assets/photo.png" alt="Placeholder" className="img-display-before-vp" />
            )}
          </div>
        </div>

        <div className="form-fields-container-vp">
          <div className="form-row-vp">
            <div className="form-group-vp">
              <label>First Name</label>
              <input type="text" value={applicantData.personalinfo?.first_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Last Name</label>
              <input type="text" value={applicantData.personalinfo?.last_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Middle Name</label>
              <input type="text" value={applicantData.personalinfo?.middle_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Suffix</label>
              <input type="text" value={applicantData.personalinfo?.extension_name || 'N/A'} readOnly />
            </div>
          </div>

          {/* Birthday and other personal details */}
          <div className="form-row-vp">
          <div className="form-group-vp">
              <label>Age</label>
              <input type="number" value={applicantData.personalinfo?.age || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Birthday</label>
              <input type="date" value={applicantData.personalinfo?.birthday || ''} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Birthplace</label>
              <input type="text" value={applicantData.personalinfo?.birthday_place || 'N/A'} readOnly />
            </div>
          </div>

          {/* Additional Details (Religion, Citizenship, Sex, etc.) */}
          <div className="form-row-vp">
            <div className="form-group-vp">
              <label>Civil Status</label>
              <input type="text" value={applicantData.personalinfo?.civil_status || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Religion</label>
              <input type="text" value={applicantData.personalinfo?.religion || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Citizenship</label>
              <input type="text" value={applicantData.personalinfo?.citizenship || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Sex</label>
              <input type="text" value={applicantData.personalinfo?.sex || 'N/A'} readOnly />
            </div>
          </div>

          <div className="form-row-vp">
            <div className="form-group-vp">
              <label>Contact Number</label>
              <input type="text" value={applicantData.personalinfo?.contact_number || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Email</label>
              <input type="email" value={applicantData.personalinfo?.email || 'N/A'} readOnly />
            </div>
          </div>
        </div>
      </div>

      {/* Present Address */}
      <h4>Present Address</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>House No./Street/Purok</label>
          <input type="text" value={applicantData.present_address?.house_no || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Barangay</label>
          <input type="text" value={applicantData.present_address?.barangay || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Municipality</label>
          <input type="text" value={applicantData.present_address?.municipality || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Province</label>
          <input type="text" value={applicantData.present_address?.province || ''} readOnly />
        </div>
      </div>
      
      {/* Permanent Address */}
      <h4>Permanent Address</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>House No./Street/Purok</label>
          <input type="text" value={applicantData.permanent_address?.house_no || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Barangay</label>
          <input type="text" value={applicantData.permanent_address?.barangay || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Municipality</label>
          <input type="text" value={applicantData.permanent_address?.municipality || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Province</label>
          <input type="text" value={applicantData.permanent_address?.province || ''} readOnly />
        </div>
      </div>

      <hr className="separator" />
      <h4>Enrollment Data</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>LRN</label>
          <input type="text" value={applicantData.enrollmentdata?.LRN || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Grade Level</label>
          <input type="text" value={applicantData.enrollmentdata?.grade_level || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>School Year</label>
          <input type="text" value={applicantData.enrollmentdata?.school_year || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Curriculum</label>
          <input type="text" value={applicantData.enrollmentdata?.curriculum || ''} readOnly />
        </div>
        <div className="form-row-vp">
          <div className="form-group-vp">
            <label>Track/Strand</label>
            <input type="text" value={applicantData.enrollmentdata?.strand_track || ''} readOnly />
          </div>
          <div className="form-group-vp">
            <label>Campus</label>
            <input type="text" value={applicantData.enrollmentdata?.campus || ''} readOnly />
          </div>
          <div className="form-group-vp">
            <label>Sport/s</label>
            <input type="text" value={applicantData.enrollmentdata?.sports || ''} readOnly />
          </div>
          <div className="form-group-vp">
            <label>Favorite Subject/s</label>
            <input type="text" value={applicantData.enrollmentdata?.fav_subjects || ''} readOnly />
          </div>
        </div>
      </div>

      <hr className="separator" />
      <h4>Father</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Father First Name</label>
          <input type="text" value={applicantData.father?.father_fname || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Father Last Name</label>
          <input type="text" value={applicantData.father?.father_lname || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Father Middle Name</label>
          <input type="text" value={applicantData.father?.father_midname || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Father Age</label>
          <input type="number" value={applicantData.father?.father_age || ''} readOnly />
        </div>
      </div>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Occupation</label>
          <input type="text" value={applicantData.father?.father_occupation || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Phone Number</label>
          <input type="text" value={applicantData.father?.father_phoneNum || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Educational Attainment</label>
          <input type="text" value={applicantData.father?.father_educAttainment || ''} readOnly />
        </div>
      </div>

      {/* Mother */}
      <hr className="separator" />
      <h4>Mother</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Mother First Name</label>
          <input type="text" value={applicantData.mother?.mother_fname || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Mother Last Name</label>
          <input type="text" value={applicantData.mother?.mother_lname || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Mother Middle Name</label>
          <input type="text" value={applicantData.mother?.mother_midname || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Mother Age</label>
          <input type="text" value={applicantData.mother?.mother_age || ''} readOnly />
        </div>
      </div>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Occupation</label>
          <input type="text" value={applicantData.mother?.mother_occupation || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Phone Number</label>
          <input type="text" value={applicantData.mother?.mother_phoneNum || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Educational Attainment</label>
          <input type="text" value={applicantData.mother?.mother_educAttainment || ''} readOnly />
        </div>
      </div>

      {/* Guardian */}
      <hr className="separator" />
      <h4>Guardian</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Guardian First Name</label>
          <input type="text" value={applicantData.guardian?.guardian_fname || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Guardian Last Name</label>
          <input type="text" value={applicantData.guardian?.guardian_lname || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Guardian Middle Name</label>
          <input type="text" value={applicantData.guardian?.guardian_midname || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Guardian Age</label>
          <input type="number" value={applicantData.guardian?.guardian_age || ''} readOnly />
        </div>
      </div>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Occupation</label>
          <input type="text" value={applicantData.guardian?.guardian_occupation || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Phone Number</label>
          <input type="text" value={applicantData.guardian?.guardian_phoneNum || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Educational Attainment</label>
          <input type="text" value={applicantData.guardian?.guardian_educAttainment || ''} readOnly />
        </div>
      </div>

      {/* Siblings Section */}
      <hr className="separator" />
      <h4>Siblings (Eldest to Youngest)</h4>

      {applicantData.sibling ? (
        <div className="sibling-section">
          <h5>Sibling</h5>
          <div className="form-row-vp">
            <div className="form-group-vp">
              <label>First Name</label>
              <input type="text" value={applicantData.sibling.sibling_fname || ''} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Last Name</label>
              <input type="text" value={applicantData.sibling.sibling_lname || ''} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Middle Name</label>
              <input type="text" value={applicantData.sibling.sibling_midname || ''} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Age</label>
              <input type="number" value={applicantData.sibling.sibling_age || ''} readOnly />
            </div>
          </div>

          <div className="form-row-vp">
            <div className="form-group-vp">
              <label>Occupation</label>
              <input type="text" value={applicantData.sibling.sibling_occupation || ''} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Phone Number</label>
              <input type="text" value={applicantData.sibling.sibling_phoneNum || ''} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Educational Attainment</label>
              <input type="text" value={applicantData.sibling.sibling_educAttainment || ''} readOnly />
            </div>
          </div>
        </div>
      ) : (
        <p>No siblings data available.</p>
      )}
      
      <hr className="separator" />
      <h4>Date & Time</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Date</label>
          <input type="text" value={applicantData.finalstep.submission_date || ''} readOnly />
        </div>
        <div className="form-group-vp">
          <label>Time</label>
          <input type="text" value={applicantData.finalstep.submission_time || ''} readOnly />
        </div>
      </div>

      {/* Requirements */}
      <hr className="separator" />
      <h4>Requirements</h4>
      <div className="requirements-section">
        {Object.keys(requirementKeys).map((requirement) => (
          <div key={requirement} className="requirement-row">
            <label className="requirement-label">{requirement}</label>
            <select
              className="requirement-status-dropdown"
              value={requirementsStatus[requirement]}
              onChange={(e) => handleStatusChange(requirement, e.target.value)}
            >
              <option value="SUBMITTED">Submitted</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
          </div>
        ))}
      </div>

      {/* Section Input */}
      <hr className="separator" />
      {/* Section Dropdown */}
      <div className="form-group">
        <label>Section</label>
        <select value={selectedSection} onChange={handleSectionChange}>
          <option value="">Select a section</option>
          {sectionsWithSlots.map((section, index) => (
            <option key={index} value={section.section}>
              {section.display}
            </option>
          ))}
        </select>
      </div>
    
      {/* Remark Section */}
      <hr className="separator" />
      <h4>Remark</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Remark Status</label>
          <select
            name="remark"
            value={remark}
            onChange={handleApprovalChange}
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVE" disabled={!isAllRequirementsSubmitted()}>
              APPROVE
            </option>
          </select>
        </div>
      </div>

      <div className="button-container-vapp">
        <button
          type="button"
          className="update-button-vp"
          onClick={openModal}
        >
          Update
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay-fss">
          <div className="modal-content-fss">
            <h3>Confirm Update</h3>
            <p>Are you sure you want to update the requirements?</p>
            <div className="modal-actions-fss">
              <button onClick={handleUpdate} className="confirm-button-fss">Confirm</button>
              <button onClick={closeModal} className="cancel-button-fss">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay-fss">
          <div className="modal-content-fss">
            <h3>Update Successful</h3>
            <p>The applicant's details have been successfully updated.</p>
            <button onClick={closeSuccessModal}>Okay</button>
          </div>
        </div>
      )}
    </form>
  );
};

export default ViewApplicants;