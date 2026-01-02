import React, { useState, useEffect } from 'react';
import './familybackground.css';
import { useNavigate, useLocation } from 'react-router-dom';

const FamilyBackground = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location; // state holds data from EnrollmentData and PersonalInfoForm

  // State for modal and sibling data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [siblings, setSiblings] = useState([]);
  const [newSibling, setNewSibling] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    age: '',
    occupation: '',
    phoneNumber: '',
    educationAttainment: '',
  });

  // State for family member data
  const [fatherData, setFatherData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    age: '',
    occupation: '',
    phoneNumber: '',
    educationAttainment: '',
  });

  const [motherData, setMotherData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    age: '',
    occupation: '',
    phoneNumber: '',
    educationAttainment: '',
  });

  const [guardianData, setGuardianData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    age: '',
    occupation: '',
    phoneNumber: '',
    educationAttainment: '',
  });

  // State for guardian checkboxes
  const [guardianSameAsFather, setGuardianSameAsFather] = useState(false);
  const [guardianSameAsMother, setGuardianSameAsMother] = useState(false);

  // Log the received data from previous components on mount
  useEffect(() => {
    if (state) {
      console.log("Data received from EnrollmentData and PersonalInfoForm:");
      console.log(state); // Log all received data for verification
    } else {
      console.log("No data received.");
    }
  }, [state]);

  // Handle father data changes
  const handleFatherChange = (e) => {
    const { name, value } = e.target;
    const fieldName = name.replace('father', '').replace(/^./, str => str.toLowerCase());
    setFatherData({ ...fatherData, [fieldName]: value });

    // Update guardian if same as father is checked
    if (guardianSameAsFather) {
      setGuardianData({ ...guardianData, [fieldName]: value });
    }
  };

  // Handle mother data changes
  const handleMotherChange = (e) => {
    const { name, value } = e.target;
    const fieldName = name.replace('mother', '').replace(/^./, str => str.toLowerCase());
    setMotherData({ ...motherData, [fieldName]: value });

    // Update guardian if same as mother is checked
    if (guardianSameAsMother) {
      setGuardianData({ ...guardianData, [fieldName]: value });
    }
  };

  // Handle guardian data changes
  const handleGuardianChange = (e) => {
    const { name, value } = e.target;
    const fieldName = name.replace('guardian', '').replace(/^./, str => str.toLowerCase());
    setGuardianData({ ...guardianData, [fieldName]: value });
  };

  // Handle guardian same as father checkbox
  const handleSameAsFatherChange = (e) => {
    const isChecked = e.target.checked;
    setGuardianSameAsFather(isChecked);
    
    if (isChecked) {
      setGuardianSameAsMother(false); // Uncheck mother option
      setGuardianData({ ...fatherData }); // Copy father's data
    } else {
      // Clear guardian data when unchecked
      setGuardianData({
        firstName: '',
        lastName: '',
        middleName: '',
        age: '',
        occupation: '',
        phoneNumber: '',
        educationAttainment: '',
      });
    }
  };

  // Handle guardian same as mother checkbox
  const handleSameAsMotherChange = (e) => {
    const isChecked = e.target.checked;
    setGuardianSameAsMother(isChecked);
    
    if (isChecked) {
      setGuardianSameAsFather(false); // Uncheck father option
      setGuardianData({ ...motherData }); // Copy mother's data
    } else {
      // Clear guardian data when unchecked
      setGuardianData({
        firstName: '',
        lastName: '',
        middleName: '',
        age: '',
        occupation: '',
        phoneNumber: '',
        educationAttainment: '',
      });
    }
  };

  // Navigation functions
  const handlePrevious = () => {
    navigate('/enrollment-data');
  };

  const handleNext = (event) => {
    event.preventDefault();
    
    // Gather all family background data
    const familyBackgroundData = {
      ...state, // Existing data from PersonalInfoForm and EnrollmentData
      familyDetails: {
        father: {
          firstName: fatherData.firstName.trim() || 'N/A',
          lastName: fatherData.lastName.trim() || 'N/A',
          middleName: fatherData.middleName.trim() || 'N/A',
          age: fatherData.age || 'N/A',
          occupation: fatherData.occupation.trim() || 'N/A',
          phoneNumber: fatherData.phoneNumber.trim() || 'N/A',
          educationAttainment: fatherData.educationAttainment.trim() || 'N/A',
        },
        mother: {
          firstName: motherData.firstName.trim() || 'N/A',
          lastName: motherData.lastName.trim() || 'N/A',
          middleName: motherData.middleName.trim() || 'N/A',
          age: motherData.age || 'N/A',
          occupation: motherData.occupation.trim() || 'N/A',
          phoneNumber: motherData.phoneNumber.trim() || 'N/A',
          educationAttainment: motherData.educationAttainment.trim() || 'N/A',
        },
        guardian: {
          firstName: guardianData.firstName.trim() || 'N/A',
          lastName: guardianData.lastName.trim() || 'N/A',
          middleName: guardianData.middleName.trim() || 'N/A',
          age: guardianData.age || 'N/A',
          occupation: guardianData.occupation.trim() || 'N/A',
          phoneNumber: guardianData.phoneNumber.trim() || 'N/A',
          educationAttainment: guardianData.educationAttainment.trim() || 'N/A',
        },
      },
      siblings: siblings.map(sibling => ({
        firstName: sibling.firstName.trim() || 'N/A',
        lastName: sibling.lastName.trim() || 'N/A',
        middleName: sibling.middleName.trim() || 'N/A',
        age: sibling.age || 'N/A',
        occupation: sibling.occupation.trim() || 'N/A',
        phoneNumber: sibling.phoneNumber.trim() || 'N/A',
        educationAttainment: sibling.educationAttainment.trim() || 'N/A',
      })),
    };
    
    navigate('/requirements', { state: familyBackgroundData });
  };

  // Modal handling functions
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewSibling({
      firstName: '',
      lastName: '',
      middleName: '',
      age: '',
      occupation: '',
      phoneNumber: '',
      educationAttainment: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSibling({ ...newSibling, [name]: value });
  };

  const addSibling = () => {
    setSiblings([...siblings, newSibling]);
    closeModal();
  };

  return (
    <div className="family-background-form">
      <h2>Family Background</h2>
      <form onSubmit={handleNext}>
        <h4>Father</h4>
        <div className="form-row-fb">
          <div className="form-group-fb-parents">
            <label>Father First Name <span className="required">*</span></label>
            <input 
              type="text" 
              name="fatherFirstName" 
              value={fatherData.firstName}
              onChange={handleFatherChange}
              required 
            />
          </div>
          <div className="form-group-fb-parents">
            <label>Father Last Name <span className="required">*</span></label>
            <input 
              type="text" 
              name="fatherLastName" 
              value={fatherData.lastName}
              onChange={handleFatherChange}
              required 
            />
          </div>
          <div className="form-group-fb">
            <label>Father Middle Name</label>
            <input 
              type="text" 
              name="fatherMiddleName" 
              value={fatherData.middleName}
              onChange={handleFatherChange}
              placeholder="If none, leave it blank" 
            />
          </div>
          <div className="form-group-fb-fb">
            <label>Age <span className="required">*</span></label>
            <input 
              type="number" 
              name="fatherAge" 
              value={fatherData.age}
              onChange={handleFatherChange}
              required
            />
          </div>
        </div>

        <div className="form-row-fb">
          <div className="form-group-fb">
            <label>Occupation <span className="required">*</span></label>
            <input 
              type="text" 
              name="fatherOccupation" 
              value={fatherData.occupation}
              onChange={handleFatherChange}
              required 
            />
          </div>
          <div className="form-group-fb">
            <label>Phone Number <span className="required">*</span></label>
            <input 
              type="text" 
              name="fatherPhoneNumber" 
              value={fatherData.phoneNumber}
              onChange={handleFatherChange}
              required 
            />
          </div>
          <div className="form-group-fb">
            <label>Educational Attainment <span className="required">*</span></label>
            <input 
              type="text" 
              name="fatherEducationAttainment" 
              value={fatherData.educationAttainment}
              onChange={handleFatherChange}
              required
            />
          </div>
        </div>

        <hr className="separator" />

        <h4>Mother</h4>
        <div className="form-row-fb">
          <div className="form-group-fb-parents">
            <label>Mother First Name <span className="required">*</span></label>
            <input 
              type="text" 
              name="motherFirstName" 
              value={motherData.firstName}
              onChange={handleMotherChange}
              required 
            />
          </div>
          <div className="form-group-fb-parents">
            <label>Mother Last Name <span className="required">*</span></label>
            <input 
              type="text" 
              name="motherLastName" 
              value={motherData.lastName}
              onChange={handleMotherChange}
              required 
            />
          </div>
          <div className="form-group-fb">
            <label>Mother Middle Name</label>
            <input 
              type="text" 
              name="motherMiddleName" 
              value={motherData.middleName}
              onChange={handleMotherChange}
              placeholder="If none, leave it blank" 
            />
          </div>
          <div className="form-group-fb-fb">
            <label>Age <span className="required">*</span></label>
            <input 
              type="number" 
              name="motherAge" 
              value={motherData.age}
              onChange={handleMotherChange}
              required
            />
          </div>
        </div>

        <div className="form-row-fb">
          <div className="form-group-fb">
            <label>Occupation <span className="required">*</span></label>
            <input 
              type="text" 
              name="motherOccupation" 
              value={motherData.occupation}
              onChange={handleMotherChange}
              required 
            />
          </div>
          <div className="form-group-fb">
            <label>Phone Number <span className="required">*</span></label>
            <input 
              type="text" 
              name="motherPhoneNumber" 
              value={motherData.phoneNumber}
              onChange={handleMotherChange}
              required 
            />
          </div>
          <div className="form-group-fb">
            <label>Educational Attainment <span className="required">*</span></label>
            <input 
              type="text" 
              name="motherEducationAttainment" 
              value={motherData.educationAttainment}
              onChange={handleMotherChange}
              required
            />
          </div>
        </div>

        <hr className="separator" />

        <h4>Guardian</h4>
        
        {/* Guardian Same As Checkboxes */}
        <div className="form-row-fb checkbox-row">
          <div className="form-group checkbox-container">
            <input 
              type="checkbox" 
              id="sameAsFather" 
              checked={guardianSameAsFather} 
              onChange={handleSameAsFatherChange} 
              className="same-guardian-checkbox"
            />
            <label htmlFor="sameAsFather" className="checkbox-label">
              Same as Father
            </label>
          </div>
          <div className="form-group checkbox-container">
            <input 
              type="checkbox" 
              id="sameAsMother" 
              checked={guardianSameAsMother} 
              onChange={handleSameAsMotherChange} 
              className="same-guardian-checkbox"
            />
            <label htmlFor="sameAsMother" className="checkbox-label">
              Same as Mother
            </label>
          </div>
        </div>

        <div className="form-row-fb">
          <div className="form-group-fb-parents">
            <label>Guardian First Name <span className="required">*</span></label>
            <input 
              type="text" 
              name="guardianFirstName" 
              value={guardianData.firstName}
              onChange={handleGuardianChange}
              disabled={guardianSameAsFather || guardianSameAsMother}
              required 
            />
          </div>
          <div className="form-group-fb-parents">
            <label>Guardian Last Name <span className="required">*</span></label>
            <input 
              type="text" 
              name="guardianLastName" 
              value={guardianData.lastName}
              onChange={handleGuardianChange}
              disabled={guardianSameAsFather || guardianSameAsMother}
              required 
            />
          </div>
          <div className="form-group-fb">
            <label>Guardian Middle Name</label>
            <input 
              type="text" 
              name="guardianMiddleName" 
              value={guardianData.middleName}
              onChange={handleGuardianChange}
              disabled={guardianSameAsFather || guardianSameAsMother}
              placeholder="If none, leave it blank" 
            />
          </div>
          <div className="form-group-fb-fb">
            <label>Age <span className="required">*</span></label>
            <input 
              type="number" 
              name="guardianAge" 
              value={guardianData.age}
              onChange={handleGuardianChange}
              disabled={guardianSameAsFather || guardianSameAsMother}
              required
            />
          </div>
        </div>
        
        <div className="form-row-fb">
          <div className="form-group-fb">
            <label>Occupation <span className="required">*</span></label>
            <input 
              type="text" 
              name="guardianOccupation" 
              value={guardianData.occupation}
              onChange={handleGuardianChange}
              disabled={guardianSameAsFather || guardianSameAsMother}
              required 
            />
          </div>
          <div className="form-group-fb">
            <label>Phone Number <span className="required">*</span></label>
            <input 
              type="text" 
              name="guardianPhoneNumber" 
              value={guardianData.phoneNumber}
              onChange={handleGuardianChange}
              disabled={guardianSameAsFather || guardianSameAsMother}
              required 
            />
          </div>
          <div className="form-group-fb">
            <label>Educational Attainment <span className="required">*</span></label>
            <input 
              type="text" 
              name="guardianEducationAttainment" 
              value={guardianData.educationAttainment}
              onChange={handleGuardianChange}
              disabled={guardianSameAsFather || guardianSameAsMother}
              required
            />
          </div>
        </div>
        
        <hr className="separator" />

        <h4>Siblings (Eldest to Youngest)</h4>
        {siblings.map((sibling, index) => (
          <div key={index} className="form-row-fb">
            <div className="form-group-fb-parents">
              <label>First Name</label>
              <input type="text" value={sibling.firstName} readOnly />
            </div>
            <div className="form-group-fb-parents">
              <label>Last Name</label>
              <input type="text" value={sibling.lastName} readOnly />
            </div>
            <div className="form-group-fb">
              <label>Middle Name</label>
              <input type="text" value={sibling.middleName} readOnly />
            </div>
            <div className="form-group-fb-fb">
              <label>Age</label>
              <input type="number" value={sibling.age} readOnly />
            </div>
            <div className="form-row-fb">
              <div className="form-group-fb-sibling">
                <label>Occupation</label>
                <input type="text" value={sibling.occupation} readOnly />
              </div>
              <div className="form-group-fb-sibling">
                <label>Phone Number</label>
                <input type="text" value={sibling.phoneNumber} readOnly />
              </div>
              <div className="form-group-fb-sibling">
                <label>Educational Attainment</label>
                <input type="text" value={sibling.educationAttainment} readOnly />
              </div>
            </div>
          </div>
        ))}

        {/* Add Sibling Button */}
        <button type="button" className="add-sibling-button-fb" onClick={openModal}>
          + Add Sibling
        </button>

        {/* Modal for Adding New Sibling */}
        {isModalOpen && (
          <div className="modal-fb">
            <div className="modal-content-fb">
              <h3>Add Sibling</h3>
              <input type="text" name="firstName" placeholder="First Name" onChange={handleInputChange} value={newSibling.firstName} />
              <input type="text" name="lastName" placeholder="Last Name" onChange={handleInputChange} value={newSibling.lastName} />
              <input type="text" name="middleName" placeholder="Middle Name (If none, leave blank)" onChange={handleInputChange} value={newSibling.middleName} />
              <input type="number" name="age" placeholder="Age" onChange={handleInputChange} value={newSibling.age} />
              <input type="text" name="occupation" placeholder="Occupation" onChange={handleInputChange} value={newSibling.occupation} />
              <input type="text" name="phoneNumber" placeholder="Phone Number" onChange={handleInputChange} value={newSibling.phoneNumber} />
              <input type="text" name="educationAttainment" placeholder="Educational Attainment" onChange={handleInputChange} value={newSibling.educationAttainment} />
              <div className="button-container-fb">
              <button className="add-modal-button-fb" onClick={addSibling}>Add</button>
              <button className="cancel-button-fb" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="button-container-fb">
          <button type="button" className="previous-button-fb" onClick={handlePrevious}>
            Previous
          </button>
          <button type="submit" className="next-button-fb">Next</button>
        </div>
      </form>
    </div>
  );
};

export default FamilyBackground;