import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '.viewenrolledstudents.css';

const ProfileEnrolledStudents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { student_id } = location.state || {}; // Get the passed student_id

  const [applicantData, setApplicantData] = useState(null);
  const [loading, setLoading] = useState(true);

 
  

  useEffect(() => {
    if (!student_id) {
      alert("No student data available");
      navigate("/enrolled-students");
      return;
    }

    // Fetch applicant details from the backend
    fetch(`http://localhost:8000/applicant_details.php?student_id=${student_id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setApplicantData(data.data);

    
       

          // Set applicant image if available
          if (data.data.personalinfo?.picture) {
            setImage(`data:image/jpeg;base64,${data.data.personalinfo.picture}`);
          }
        } else {
          alert(data.message);
        }
      })
      .catch((error) => console.error("Error fetching applicant details:", error))
      .finally(() => setLoading(false));
  }, [student_id, navigate]);

 
  
  if (loading) {
    return <p>Loading...</p>;
  }

  if (!applicantData) {
    return <p>No applicant data found.</p>;
  }

  return (
    <form className="viewapplicants-container">
      <div className="header-vp">
        <button type="button" className="breadcrumb-button" onClick={() => navigate('/enrolled-students')}>
          Enrolled Students List /
        </button>  
        <span className="applicant-name-vp">
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
              <img src="./src/assets/photo.png" alt="Placeholder" className="img-display-before-vp" />
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
            <div className="form-group-vp">
              <label>Age</label>
              <input type="number" value={applicantData.personalinfo?.age || 'N/A'} readOnly />
            </div>
          </div>

          {/* Birthday and other personal details */}
          <div className="form-row-vp">
            <div className="form-group-vp">
              <label>Birthday</label>
              <input type="date" value={applicantData.personalinfo?.birthday || ''} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Birthplace</label>
              <input type="text" value={applicantData.personalinfo?.birthday_place || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Civil Status</label>
              <input type="text" value={applicantData.personalinfo?.civil_status || 'N/A'} readOnly />
            </div>
          </div>

          {/* Additional Details (Religion, Citizenship, Sex, etc.) */}
          <div className="form-row-vp">
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
    <label>Learner Reference Number</label>
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
    <input type="number" value={applicantData.mother?.mother_age || ''} readOnly />
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

    </form>
  );
};

export default ProfileEnrolledStudents;
