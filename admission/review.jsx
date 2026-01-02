import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './review.css';

const Review = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  useEffect(() => {
    console.log("Received data in Review:", state);
  }, [state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const getImageBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    try {
      const imageBase64 = state?.image ? await getImageBase64(state.image) : null;

      const requestData = {
        ...state,
        image: imageBase64,
      };

      // Determine API URL based on environment
      const apiUrl = "http://ncamisshs.com/backend/review.php";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      if (result.success) {
        alert("Data saved successfully!");
        navigate("/admission-result");
      } else {
        alert(result.message || "Failed to save data.");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("An error occurred while saving data.");
    }
  };

  const handleDiscard = () => {
    navigate('/final-step');
  };

  return (
    <form className="review-form">
      <h2>Review Answer</h2>

      {/* Personal Information */}
      <h3>Personal Information</h3>
      <div className="image-and-form-container-r">
        {/* Display uploaded image */}
        <div className="image-upload-container-r">
          <div className="box-decoration-r">
            {state?.image ? (
              <img src={URL.createObjectURL(state.image)} alt="Uploaded" className="img-display-after-r" />
            ) : (
              <p>No image provided</p>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="form-fields-container">
          <div className="form-row-rv">
            <div className="form-group-rv">
              <label>First Name</label>
              <input type="text" name="firstName" defaultValue={state?.firstName} readOnly />
            </div>
            <div className="form-group-rv">
              <label>Last Name</label>
              <input type="text" name="lastName" defaultValue={state?.lastName} readOnly />
            </div>
            <div className="form-group-rv">
              <label>Middle Name</label>
              <input type="text" name="middleName" defaultValue={state?.middleName} readOnly />
            </div>
            <div className="form-group-rv">
              <label>Extension Name</label>
              <input type="text" name="extentionName" defaultValue={state?.extensionName || "N/A"} readOnly />
            </div>
            <div className="form-group-rv">
              <label>Age</label>
              <input type="number" name="age" defaultValue={state?.age} readOnly />
            </div>
          </div>

          <div className="form-row-rv">
            <div className="form-group-rv">
              <label>Birthday</label>
              <input type="date" name="birthday" defaultValue={state?.birthday} readOnly />
            </div>
            <div className="form-group-rv">
              <label>Birthplace</label>
              <input type="text" name="birthplace" defaultValue={state?.birthdayPlace} readOnly />
            </div>
            <div className="form-group-rv">
              <label>Civil Status</label>
              <input type="text" name="civilStatus" defaultValue={state?.civilStatus} readOnly />
            </div>
          </div>

          <div className="form-row-rv">
            <div className="form-group-rv">
              <label>Religion</label>
              <input type="text" name="religion" defaultValue={state?.religion} readOnly />
            </div>
            <div className="form-group-rv">
              <label>Citizenship</label>
              <input type="text" name="citizenship" defaultValue={state?.citizenship} readOnly />
            </div>
            <div className="form-group-rv">
              <label>Sex</label>
              <input type="text" name="sex" defaultValue={state?.sex} readOnly />
            </div>
          </div>

          <div className="form-row-rv">
            <div className="form-group-rv">
              <label>Contact Number</label>
              <input type="text" name="contactNumber" defaultValue={state?.contactNumber} readOnly />
            </div>
            <div className="form-group-rv">
              <label>Email</label>
              <input type="email" name="email" defaultValue={state?.email} readOnly />
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <hr className="separator" />
      <h3>Location</h3>
      <h4>Present Address</h4>
      <div className="form-row-rv">
        <div className="form-group-rv">
          <label>House No./Street/Purok</label>
          <input type="text" name="houseStreetPurok" defaultValue={state?.presentAddress?.houseStreetPurok} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Barangay</label>
          <input type="text" name="barangay" defaultValue={state?.presentAddress?.barangay} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Municipality</label>
          <input type="text" name="municipality" defaultValue={state?.presentAddress?.municipality} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Province</label>
          <input type="text" name="province" defaultValue={state?.presentAddress?.province} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Zip Code</label>
          <input type="text" name="zipCode" defaultValue={state?.presentAddress?.zipcode} readOnly />
        </div>
      </div>
      <h4>Permanent Address</h4>
      <div className="form-row-rv">
        <div className="form-group-rv">
          <label>House No./Street/Purok</label>
          <input type="text" name="houseStreetPurok" defaultValue={state?.permanentAddress?.houseStreetPurok} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Barangay</label>
          <input type="text" name="barangay" defaultValue={state?.permanentAddress?.barangay} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Municipality</label>
          <input type="text" name="municipality" defaultValue={state?.permanentAddress?.municipality} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Province</label>
          <input type="text" name="province" defaultValue={state?.permanentAddress?.province} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Zip Code</label>
          <input type="text" name="zipCode" defaultValue={state?.permanentAddress?.zipcode} readOnly />
        </div>
      </div>
      <hr className="separator" />
      {/* Enrollment Data */}
      <h3>Enrollment Data</h3>
      <div className="form-row-rv">
        <div className="form-group-rv">
          <label>Learner Reference Number</label>
          <input type="text" name="learnerReferenceNumber" defaultValue={state?.learnerReferenceNumber} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Grade Level</label>
          <input type="text" name="gradeLevel" defaultValue={state?.gradeLevel} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Curriculum</label>
          <input type="text" name="curriculum" defaultValue={state?.curriculum} readOnly />
        </div>
        <div className="form-group-rv">
          <label>School Year</label>
          <input type="text" name="schoolYear" defaultValue={state?.schoolYear} readOnly />
        </div>
      </div>
      <div className="form-row-rv">
        <div className="form-group-rv">
          <label>Track/Strand</label>
          <input type="text" name="trackStrand" defaultValue={state?.strandTrack} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Campus</label>
          <input type="text" name="campus" defaultValue={state?.campus} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Sport/s</label>
          <input type="text" name="sports" defaultValue={state?.sports} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Favorite Subject/s</label>
          <input type="text" name="favoriteSubjects" defaultValue={state?.favoriteSubjects} readOnly />
        </div>
      </div>

      {/* Educational Background */}
      <h4>Educational Background</h4>
      <div className="form-row-rv">
        <div className="form-group-rv">
          <label>Elementary</label>
          <input type="text" name="elementary" defaultValue={state?.elementary} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Year Graduated (Elementary)</label>
          <input type="number" name="elementaryYearGraduated" defaultValue={state?.yearGraduatedElem} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Awards/Achievements (Elementary)</label>
          <input type="text" name="elementaryAwards" defaultValue={state?.elementaryAwards} readOnly />
        </div>
        <div className="form-group-rv">
          <label>General Weighted Average (Elementary)</label>
          <input type="text" name="elementaryGwa" defaultValue={state?.elementaryGwa} readOnly />
        </div>
      </div>

      <div className="form-row-rv">
        <div className="form-group-rv">
          <label>Secondary</label>
          <input type="text" name="secondary" defaultValue={state?.secondary} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Year Graduated (Secondary)</label>
          <input type="number" name="secondaryYearGraduated" defaultValue={state?.yearGraduatedSec} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Awards/Achievements (Secondary)</label>
          <input type="text" name="secondaryAwards" defaultValue={state?.secondaryAwards} readOnly />
        </div>
        <div className="form-group-rv">
          <label>General Weighted Average (Secondary)</label>
          <input type="text" name="secondaryGwa" defaultValue={state?.secondaryGwa} readOnly />
        </div>
      </div>
      <hr className="separator" />
      <h3>Family Background Data</h3>
      {/* Father */}
      <h4>Father</h4>
      <div className="form-row-fb">
        <div className="form-group-fb-parents">
          <label>Father First Name</label>
          <input type="text" name="fatherFirstName" defaultValue={state?.familyDetails?.father?.firstName} readOnly />
        </div>
        <div className="form-group-fb-parents">
          <label>Father Last Name</label>
          <input type="text" name="fatherLastName" defaultValue={state?.familyDetails?.father?.lastName} readOnly />
        </div>
        <div className="form-group-fb">
          <label>Father Middle Name</label>
          <input type="text" name="fatherMiddleName" defaultValue={state?.familyDetails?.father?.middleName} readOnly />
        </div>
        <div className="form-group-fb-fb">
          <label>Age</label>
          <input type="number" name="fatherAge" defaultValue={state?.familyDetails?.father?.age} readOnly />
        </div>
      </div>
      <div className="form-row-fb">
        <div className="form-group-fb">
          <label>Occupation</label>
          <input type="text" name="fatherOccupation" defaultValue={state?.familyDetails?.father?.occupation} readOnly />
        </div>
        <div className="form-group-fb">
          <label>Phone Number</label>
          <input type="text" name="fatherPhoneNumber" defaultValue={state?.familyDetails?.father?.phoneNumber} readOnly />
        </div>
        <div className="form-group-fb">
          <label>Educational Attainment</label>
          <input type="text" name="fatherEducation" defaultValue={state?.familyDetails?.father?.educationAttainment} readOnly />
        </div>
      </div>

      {/* Mother */}
      <hr className="separator" />
      <h4>Mother</h4>
      <div className="form-row-fb">
        <div className="form-group-fb-parents">
          <label>Mother First Name</label>
          <input type="text" name="motherFirstName" defaultValue={state?.familyDetails?.mother?.firstName} readOnly />
        </div>
        <div className="form-group-fb-parents">
          <label>Mother Last Name</label>
          <input type="text" name="motherLastName" defaultValue={state?.familyDetails?.mother?.lastName} readOnly />
        </div>
        <div className="form-group-fb">
          <label>Mother Middle Name</label>
          <input type="text" name="motherMiddleName" defaultValue={state?.familyDetails?.mother?.middleName} readOnly />
        </div>
        <div className="form-group-fb-fb">
          <label>Age</label>
          <input type="number" name="motherAge" defaultValue={state?.familyDetails?.mother?.age} readOnly />
        </div>
      </div>
      <div className="form-row-fb">
        <div className="form-group-fb">
          <label>Occupation</label>
          <input type="text" name="motherOccupation" defaultValue={state?.familyDetails?.mother?.occupation} readOnly />
        </div>
        <div className="form-group-fb">
          <label>Phone Number</label>
          <input type="text" name="motherPhoneNumber" defaultValue={state?.familyDetails?.mother?.phoneNumber} readOnly />
        </div>
        <div className="form-group-fb">
          <label>Educational Attainment</label>
          <input type="text" name="motherEducation" defaultValue={state?.familyDetails?.mother?.educationAttainment} readOnly />
        </div>
      </div>

      {/* Guardian */}
      <hr className="separator" />
      <h4>Guardian</h4>
      <div className="form-row-fb">
        <div className="form-group-fb-parents">
          <label>Guardian First Name</label>
          <input type="text" name="guardianFirstName" defaultValue={state?.familyDetails?.guardian?.firstName} readOnly />
        </div>
        <div className="form-group-fb-parents">
          <label>Guardian Last Name</label>
          <input type="text" name="guardianLastName" defaultValue={state?.familyDetails?.guardian?.lastName} readOnly />
        </div>
        <div className="form-group-fb">
          <label>Guardian Middle Name</label>
          <input type="text" name="guardianMiddleName" defaultValue={state?.familyDetails?.guardian?.middleName} readOnly />
        </div>
        <div className="form-group-fb-fb">
          <label>Age</label>
          <input type="number" name="guardianAge" defaultValue={state?.familyDetails?.guardian?.age} readOnly />
        </div>
      </div>
      <div className="form-row-fb">
        <div className="form-group-fb">
          <label>Occupation</label>
          <input type="text" name="guardianOccupation" defaultValue={state?.familyDetails?.guardian?.occupation} readOnly />
        </div>
        <div className="form-group-fb">
          <label>Phone Number</label>
          <input type="text" name="guardianPhoneNumber" defaultValue={state?.familyDetails?.guardian?.phoneNumber} readOnly />
        </div>
        <div className="form-group-fb">
          <label>Educational Attainment</label>
          <input type="text" name="guardianEducation" defaultValue={state?.familyDetails?.guardian?.educationAttainment} readOnly />
        </div>
      </div>

      {/* Siblings */}
      <hr className="separator" />
      <h4>Siblings (Eldest to Youngest)</h4>
      {state?.siblings?.map((sibling, index) => (
        <div key={index} className="form-row-fb">
          <div className="form-group-fb-parents">
            <label>First Name</label>
            <input type="text" defaultValue={sibling.firstName} readOnly />
          </div>
          <div className="form-group-fb-parents">
            <label>Last Name</label>
            <input type="text" defaultValue={sibling.lastName} readOnly />
          </div>
          <div className="form-group-fb">
            <label>Middle Name</label>
            <input type="text" defaultValue={sibling.middleName} readOnly />
          </div>
          <div className="form-group-fb-fb">
            <label>Age</label>
            <input type="number" defaultValue={sibling.age} readOnly />
          </div>
          <div className="form-group-fb">
            <label>Occupation</label>
            <input type="text" defaultValue={sibling.occupation} readOnly />
          </div>
          <div className="form-group-fb">
            <label>Phone Number</label>
            <input type="text" defaultValue={sibling.phoneNumber} readOnly />
          </div>
          <div className="form-group-fb">
            <label>Educational Attainment</label>
            <input type="text" defaultValue={sibling.educationAttainment} readOnly />
          </div>
        </div>
      ))}

      {/* Display Date and Time */}
      <div className="form-row-rv">
        <div className="form-group-rv">
          <label>Date</label>
          <input type="text" name="date" defaultValue={state?.date || "Not provided"} readOnly />
        </div>
        <div className="form-group-rv">
          <label>Time</label>
          <input type="text" name="time" defaultValue={state?.time || "Not provided"} readOnly />
        </div>
      </div>
      {/* Action Buttons */}
      <div className="button-group-rv">
        <button type="submit" className="save-button-rv" onClick={handleSubmit}>Confirm</button>
        <button type="button" className="discard-button-rv" onClick={handleDiscard}>Discard</button>
      </div>
    </form>
  );
};

export default Review;