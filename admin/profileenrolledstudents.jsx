import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './profileenrolledstudents.css';
import photo from '../assets/photo.png';
// Make sure we're using the full component

const ProfileEnrolledStudents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { student_id } = location.state || {}; // Get the passed student_id
  const [image, setImage] = useState(null); // Image state
  const [applicantData, setApplicantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Location state:", location.state);
    console.log("Student ID received:", student_id);

    if (!student_id) {
      console.error("No student_id found in location state");
      navigate("/enrolled-students");
      return;
    }

    // Always use the production domain for API requests
    const apiUrl = `http://ncamisshs.com/backend/applicant_details.php?student_id=${student_id}`;

    console.log("Fetching from:", apiUrl);

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Data received:", data);
        if (data.success) {
          setApplicantData(data.data);

          // Set applicant image if available
          if (data.data.personalinfo?.picture) {
            setImage(`data:image/jpeg;base64,${data.data.personalinfo.picture}`);
          }
        } else {
          setError(data.message || "Failed to fetch student data");
        }
      })
      .catch((error) => {
        console.error("Error fetching applicant details:", error);
        setError(error.message);
      })
      .finally(() => setLoading(false));
  }, [student_id, navigate, location.state]);

  const handleBackClick = () => {
    navigate('/enrolled-students');
  };

  if (loading) {
    return <div className="loading-container">Loading student details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading student data</h3>
        <p>{error}</p>
        <button onClick={handleBackClick}>Back to Enrolled Students</button>
      </div>
    );
  }

  if (!applicantData) {
    return (
      <div className="error-container">
        <h3>No data available</h3>
        <p>Student information could not be found.</p>
        <button onClick={handleBackClick}>Back to Enrolled Students</button>
      </div>
    );
  }
  return (
    <form className="profile-enrolled-students-container">
      <div className="header-pes">
        <button type="button" className="breadcrumb-pes-button" onClick={() => navigate('/enrolled-students')}>
          Enrolled Students List /
        </button>  
        <p 
  className="applicant-name-pes">
  {applicantData.personalinfo?.first_name} {applicantData.personalinfo?.last_name}
</p>

  </div>
      <h2 className="application-title-pes">STUDENTS DETAILS </h2>

      <div className="image-and-form-container-pes">
        <div className="image-upload-container-pes">
          <div className="box-decoration-pes">
          {image ? (
              <img src={image} alt="Applicant" className="img-display-after-pes" />
            ) : (
              <img src={photo} alt="Placeholder" className="img-display-before-pes" />
            )}

          </div>
        </div>

        <div className="form-fields-container-pes">
          <div className="form-row-pes">
            <div className="form-group-pes">
              <label>First Name</label>
              <input type="text" value={applicantData.personalinfo?.first_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-pes">
              <label>Last Name</label>
              <input type="text" value={applicantData.personalinfo?.last_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-pes">
              <label>Middle Name</label>
              <input type="text" value={applicantData.personalinfo?.middle_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-pes">
              <label>Suffix</label>
              <input type="text" value={applicantData.personalinfo?.extension_name || 'N/A'} readOnly />
            </div>
          </div>

          {/* Birthday and other personal details */}
          <div className="form-row-pes">
          <div className="form-group-pes">
              <label>Age</label>
              <input type="number" value={applicantData.personalinfo?.age || 'N/A'} readOnly />
            </div>
            <div className="form-group-pes">
              <label>Birthday</label>
              <input type="date" value={applicantData.personalinfo?.birthday || ''} readOnly />
            </div>
            <div className="form-group-pes">
              <label>Birthplace</label>
              <input type="text" value={applicantData.personalinfo?.birthday_place || 'N/A'} readOnly />
            </div>
          </div>

          {/* Additional Details (Religion, Citizenship, Sex, etc.) */}
          <div className="form-row-pes">
          <div className="form-group-pes">
              <label>Civil Status</label>
              <input type="text" value={applicantData.personalinfo?.civil_status || 'N/A'} readOnly />
            </div>
            <div className="form-group-pes">
              <label>Religion</label>
              <input type="text" value={applicantData.personalinfo?.religion || 'N/A'} readOnly />
            </div>
            <div className="form-group-pes">
              <label>Citizenship</label>
              <input type="text" value={applicantData.personalinfo?.citizenship || 'N/A'} readOnly />
            </div>
            <div className="form-group-pes">
              <label>Sex</label>
              <input type="text" value={applicantData.personalinfo?.sex || 'N/A'} readOnly />
            </div>
          </div>

          <div className="form-row-pes">
            <div className="form-group-pes">
              <label>Contact Number</label>
              <input type="text" value={applicantData.personalinfo?.contact_number || 'N/A'} readOnly />
            </div>
            <div className="form-group-pes">
              <label>Email</label>
              <input type="email" value={applicantData.personalinfo?.email || 'N/A'} readOnly />
            </div>
          </div>
        </div>
      </div>

    {/* Present Address */}
<h4>Present Address</h4>
<div className="form-row-pes">
  <div className="form-group-pes">
    <label>House No./Street/Purok</label>
    <input type="text" value={applicantData.present_address?.house_no || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Barangay</label>
    <input type="text" value={applicantData.present_address?.barangay || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Municipality</label>
    <input type="text" value={applicantData.present_address?.municipality || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Province</label>
    <input type="text" value={applicantData.present_address?.province || ''} readOnly />
  </div>
</div>
{/* Permanent Address */}
<h4>Permanent Address</h4>
<div className="form-row-pes">
  <div className="form-group-pes">
    <label>House No./Street/Purok</label>
    <input type="text" value={applicantData.permanent_address?.house_no || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Barangay</label>
    <input type="text" value={applicantData.permanent_address?.barangay || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Municipality</label>
    <input type="text" value={applicantData.permanent_address?.municipality || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Province</label>
    <input type="text" value={applicantData.permanent_address?.province || ''} readOnly />
  </div>
</div>

<hr className="separator" />
<h4>Enrollment Data</h4>
<div className="form-row-pes">
  <div className="form-group-pes">
    <label>Learner Reference Number</label>
    <input type="text" value={applicantData.enrollmentdata?.LRN || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Grade Level</label>
    <input type="text" value={applicantData.enrollmentdata?.grade_level || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>School Year</label>
    <input type="text" value={applicantData.enrollmentdata?.school_year || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Curriculum</label>
    <input type="text" value={applicantData.enrollmentdata?.curriculum || ''} readOnly />
  </div>
  <div className="form-row-pes">
  <div className="form-group-pes">
    <label>Track/Strand</label>
    <input type="text" value={applicantData.enrollmentdata?.strand_track || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Campus</label>
    <input type="text" value={applicantData.enrollmentdata?.campus || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Sport/s</label>
    <input type="text" value={applicantData.enrollmentdata?.sports || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Favorite Subject/s</label>
    <input type="text" value={applicantData.enrollmentdata?.fav_subjects || ''} readOnly />
  </div>
</div>
</div>


<hr className="separator" />
<h4>Father</h4>
<div className="form-row-pes">
  <div className="form-group-pes">
    <label>Father First Name</label>
    <input type="text" value={applicantData.father?.father_fname || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Father Last Name</label>
    <input type="text" value={applicantData.father?.father_lname || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Father Middle Name</label>
    <input type="text" value={applicantData.father?.father_midname || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Father Age</label>
    <input type="number" value={applicantData.father?.father_age || ''} readOnly />
  </div>
</div>
<div className="form-row-pes">
  <div className="form-group-pes">
    <label>Occupation</label>
    <input type="text" value={applicantData.father?.father_occupation || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Phone Number</label>
    <input type="text" value={applicantData.father?.father_phoneNum || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Educational Attainment</label>
    <input type="text" value={applicantData.father?.father_educAttainment || ''} readOnly />
  </div>
</div>

{/* Mother */}
<hr className="separator" />
<h4>Mother</h4>
<div className="form-row-pes">
  <div className="form-group-pes">
    <label>Mother First Name</label>
    <input type="text" value={applicantData.mother?.mother_fname || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Mother Last Name</label>
    <input type="text" value={applicantData.mother?.mother_lname || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Mother Middle Name</label>
    <input type="text" value={applicantData.mother?.mother_midname || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Mother Age</label>
    <input type="number" value={applicantData.mother?.mother_age || ''} readOnly />
  </div>
</div>
<div className="form-row-pes">
  <div className="form-group-pes">
    <label>Occupation</label>
    <input type="text" value={applicantData.mother?.mother_occupation || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Phone Number</label>
    <input type="text" value={applicantData.mother?.mother_phoneNum || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Educational Attainment</label>
    <input type="text" value={applicantData.mother?.mother_educAttainment || ''} readOnly />
  </div>
</div>

{/* Guardian */}
<hr className="separator" />
<h4>Guardian</h4>
<div className="form-row-pes">
  <div className="form-group-pes">
    <label>Guardian First Name</label>
    <input type="text" value={applicantData.guardian?.guardian_fname || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Guardian Last Name</label>
    <input type="text" value={applicantData.guardian?.guardian_lname || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Guardian Middle Name</label>
    <input type="text" value={applicantData.guardian?.guardian_midname || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Guardian Age</label>
    <input type="number" value={applicantData.guardian?.guardian_age || ''} readOnly />
  </div>
</div>
<div className="form-row-pes">
  <div className="form-group-pes">
    <label>Occupation</label>
    <input type="text" value={applicantData.guardian?.guardian_occupation || ''} readOnly />
  </div>
  <div className="form-group-pes">
    <label>Phone Number</label>
    <input type="text" value={applicantData.guardian?.guardian_phoneNum || ''} readOnly />
  </div>
  <div className="form-group-pes">
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
    <div className="form-row-pes">
      <div className="form-group-pes">
        <label>First Name</label>
        <input type="text" value={applicantData.sibling.sibling_fname || ''} readOnly />
      </div>
      <div className="form-group-pes">
        <label>Last Name</label>
        <input type="text" value={applicantData.sibling.sibling_lname || ''} readOnly />
      </div>
      <div className="form-group-pes">
        <label>Middle Name</label>
        <input type="text" value={applicantData.sibling.sibling_midname || ''} readOnly />
      </div>
      <div className="form-group-pes">
        <label>Age</label>
        <input type="number" value={applicantData.sibling.sibling_age || ''} readOnly />
      </div>
    </div>

    <div className="form-row-pes">
      <div className="form-group-pes">
        <label>Occupation</label>
        <input type="text" value={applicantData.sibling.sibling_occupation || ''} readOnly />
      </div>
      <div className="form-group-pes">
        <label>Phone Number</label>
        <input type="text" value={applicantData.sibling.sibling_phoneNum || ''} readOnly />
      </div>
      <div className="form-group-pes">
        <label>Educational Attainment</label>
        <input type="text" value={applicantData.sibling.sibling_educAttainment || ''} readOnly />
      </div>
    </div>
  </div>
) : (
  <p>No siblings data available.</p>
  
)}

    </form>
  );
};

export default ProfileEnrolledStudents;
