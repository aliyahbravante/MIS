import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import "./facultyprofile.css";
import photo from '../assets/photo.png';

const FacultyProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { faculty_id } = location.state || {}; // Retrieve faculty_id from state
  const [image, setImage] = useState(null); // For uploaded image
  const hiddenFileInput = useRef(null);
  const [loading, setLoading] = useState(true); // Loading state
  const [criticalError, setCriticalError] = useState(null); // Only for critical errors
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false); // Track if user has data
  
  // Track which field is currently focused for address autocomplete
  const [focusedField, setFocusedField] = useState(null);
  
  // State for location data
  const [locationData, setLocationData] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  
  // Add state for the checkbox
  const [sameAsPresent, setSameAsPresent] = useState(false);
  
  // Suggestions for dropdowns
  const [presentSuggestions, setPresentSuggestions] = useState({
    barangay: [],
    municipality: [],
    province: []
  });
  
  const [permanentSuggestions, setPermanentSuggestions] = useState({
    barangay: [],
    municipality: [],
    province: []
  });
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    suffix: "",
    age: "",
    birthday: "",
    birthplace: "",
    civil_status: "",
    religion: "",
    citizenship: "",
    sex: "",
    contact_number: "",
    email: "",
    present_address: {
      house_street_purok: "",
      barangay: "",
      municipality: "",
      province: "",
      zip_code: "",
    },
    permanent_address: {
      house_street_purok: "",
      barangay: "",
      municipality: "",
      province: "",
      zip_code: "",
    },
    elementary: { school_name: "", year_graduated: "" },
    junior: { school_name: "", year_graduated: "" },
    college: { school_name: "", course: "", year_graduated: "" },
    father: { 
      first_name: "", 
      last_name: "", 
      middle_name: "", 
      age: "", 
      occupation: "", 
      phone_number: "", 
      educational_attainment: "" 
    },
    mother: { 
      first_name: "", 
      last_name: "", 
      middle_name: "", 
      age: "", 
      occupation: "", 
      phone_number: "", 
      educational_attainment: "" 
    },
    siblings: [
      { first_name: "", last_name: "", middle_name: "", age: "", occupation: "", phone_number: "", educational_attainment: ""  },
    ],
  });
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  // Fetch location data
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const apiUrl = "http://ncamisshs.com/backend/get_locations.php";
        console.log("Fetching locations from:", apiUrl);
        
        const response = await axios.get(apiUrl);
        console.log("Locations response:", response.data);
        
        if (response.data.success) {
          console.log("Locations found:", response.data.locations.length, "locations");
          setLocationData(response.data.locations);
        } else {
          console.warn("Failed to fetch locations:", response.data.message);
          console.log("Setting locations to empty array");
          setLocationData([]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        console.log("Setting locations to empty array due to error");
        setLocationData([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (faculty_id) {
      setLoading(true);
      setCriticalError(null);
      const apiUrl = `http://ncamisshs.com/backend/getFacultyDetails.php?faculty_id=${faculty_id}`;
      console.log("Fetching faculty details from:", apiUrl);
      
      fetch(apiUrl)
        .then((response) => {
          if (!response.ok) {
            console.warn(`Could not fetch faculty details. Status: ${response.status}`);
            return { success: false, message: `HTTP ${response.status}` };
          }
          return response.json();
        })
        .then((data) => {
          console.log("Faculty details response:", data);
          
          if (data.success && data.data) {
            console.log("Faculty data found:", data.data);
            setHasExistingData(true);
            
            const fetchedData = data.data;
            setFormData((prev) => ({
              ...prev,
              ...fetchedData,
              present_address: fetchedData.present_address || prev.present_address,
              permanent_address: fetchedData.permanent_address || prev.permanent_address,
              elementary: fetchedData.elementary || prev.elementary,
              junior: fetchedData.junior || prev.junior,
              college: fetchedData.college || prev.college,
              father: fetchedData.father || prev.father,
              mother: fetchedData.mother || prev.mother,
              siblings: fetchedData.siblings || prev.siblings,
            }));
            
            if (fetchedData.image_path) {
              console.log("Faculty image found");
              setImage(`data:image/jpeg;base64,${fetchedData.image_path}`); // Use base64
            } else {
              console.log("No faculty image found");
            }
          } else {
            console.warn("No faculty data found:", data.message || "No data returned");
            console.log("Faculty will start with empty form - this is normal for new profiles");
            setHasExistingData(false);
            // Keep default empty formData - this is normal for new faculty profiles
          }
        })
        .catch((error) => {
          console.error("Error fetching faculty details:", error);
          console.log("Faculty will start with empty form due to error");
          setHasExistingData(false);
          // Don't set critical error for data fetching issues - just continue with empty form
        })
        .finally(() => setLoading(false));
    } else {
      console.log("No faculty_id provided - starting with empty form");
      setHasExistingData(false);
      setLoading(false);
    }
  }, [faculty_id]);
  
  // Effect to update permanent address when checkbox is toggled
  useEffect(() => {
    if (sameAsPresent) {
      setFormData(prevData => ({
        ...prevData,
        permanent_address: {
          ...prevData.present_address
        }
      }));
    }
  }, [sameAsPresent]);

  // Handle checkbox change
  const handleSameAddressChange = (e) => {
    setSameAsPresent(e.target.checked);
  };

  // Address autocomplete helper functions
  // Function to get all unique provinces
  const getProvinces = () => {
    if (!locationData || !locationData.length) return [];
    
    return [...new Set(locationData.map(location => location.province))].sort();
  };

  // Function to get municipalities for a specific province
  const getMunicipalitiesForProvince = (province) => {
    if (!locationData || !locationData.length) return [];
    
    return [...new Set(
      locationData
        .filter(location => location.province === province)
        .map(location => location.municipality)
    )].sort();
  };

  // Function to get barangays for a specific municipality (and optionally province)
  const getBarangaysForMunicipality = (municipality, province = null) => {
    if (!locationData || !locationData.length) return [];
    
    let filtered = locationData.filter(location => location.municipality === municipality);
    
    if (province) {
      filtered = filtered.filter(location => location.province === province);
    }
    
    return [...new Set(filtered.map(location => location.barangay))].sort();
  };

  // Function to find province for a municipality
  const getProvinceForMunicipality = (municipality) => {
    if (!locationData || !locationData.length) return null;
    
    const municipalityData = locationData.find(location => location.municipality === municipality);
    return municipalityData ? municipalityData.province : null;
  };

  // Filter functions for search
  const filterMunicipalities = (input) => {
    if (!input) return [];
    
    const inputLower = input.toLowerCase();
    return [...new Set(locationData.map(loc => loc.municipality))]
      .filter(municipality => municipality.toLowerCase().includes(inputLower))
      .sort();
  };

  const filterProvinces = (input) => {
    if (!input) return [];
    
    const inputLower = input.toLowerCase();
    return [...new Set(locationData.map(loc => loc.province))]
      .filter(province => province.toLowerCase().includes(inputLower))
      .sort();
  };

  const filterBarangays = (input, municipality = null) => {
    if (!input) return [];
    
    const inputLower = input.toLowerCase();
    
    if (municipality) {
      return getBarangaysForMunicipality(municipality)
        .filter(barangay => barangay.toLowerCase().includes(inputLower));
    }
    
    return [...new Set(locationData.map(loc => loc.barangay))]
      .filter(barangay => barangay.toLowerCase().includes(inputLower))
      .sort();
  };

  // General handle change function for nested objects
  const handleChange = (field, value, nestedField = null, section = null) => {
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [nestedField]: { ...prev[section][nestedField], [field]: value },
        },
      }));
    } else if (nestedField) {
      setFormData((prev) => ({
        ...prev,
        [nestedField]: { ...prev[nestedField], [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Handle focus for address fields
  const handleFocus = (field) => {
    setFocusedField(field);
    
    // Update suggestions based on which field is focused
    if (field === 'present-barangay') {
      if (formData.present_address.municipality) {
        // If municipality is selected, show barangays from that municipality
        setPresentSuggestions({
          ...presentSuggestions,
          barangay: getBarangaysForMunicipality(formData.present_address.municipality)
        });
      } else {
        // Otherwise show filtered barangays based on current input
        setPresentSuggestions({
          ...presentSuggestions,
          barangay: filterBarangays(formData.present_address.barangay)
        });
      }
    } else if (field === 'present-municipality') {
      if (formData.present_address.province) {
        // If province is selected, show municipalities from that province
        setPresentSuggestions({
          ...presentSuggestions,
          municipality: getMunicipalitiesForProvince(formData.present_address.province)
        });
      } else {
        // Otherwise show filtered municipalities based on current input
        setPresentSuggestions({
          ...presentSuggestions,
          municipality: filterMunicipalities(formData.present_address.municipality)
        });
      }
    } else if (field === 'present-province') {
      setPresentSuggestions({
        ...presentSuggestions,
        province: filterProvinces(formData.present_address.province)
      });
    } else if (field === 'permanent-barangay') {
      if (formData.permanent_address.municipality) {
        // If municipality is selected, show barangays from that municipality
        setPermanentSuggestions({
          ...permanentSuggestions,
          barangay: getBarangaysForMunicipality(formData.permanent_address.municipality)
        });
      } else {
        // Otherwise show filtered barangays based on current input
        setPermanentSuggestions({
          ...permanentSuggestions,
          barangay: filterBarangays(formData.permanent_address.barangay)
        });
      }
    } else if (field === 'permanent-municipality') {
      if (formData.permanent_address.province) {
        // If province is selected, show municipalities from that province
        setPermanentSuggestions({
          ...permanentSuggestions,
          municipality: getMunicipalitiesForProvince(formData.permanent_address.province)
        });
      } else {
        // Otherwise show filtered municipalities based on current input
        setPermanentSuggestions({
          ...permanentSuggestions,
          municipality: filterMunicipalities(formData.permanent_address.municipality)
        });
      }
    } else if (field === 'permanent-province') {
      setPermanentSuggestions({
        ...permanentSuggestions,
        province: filterProvinces(formData.permanent_address.province)
      });
    }
  };

  // Handle address field changes
  const handleAddressChange = (field, value, addressType) => {
    if (field === 'barangay') {
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          barangay: value
        }
      }));
      
      // Update suggestions if this is the focused field
      if (focusedField === `${addressType.split('_')[0]}-barangay`) {
        const suggestions = addressType === 'present_address' ? presentSuggestions : permanentSuggestions;
        const setSuggestions = addressType === 'present_address' ? setPresentSuggestions : setPermanentSuggestions;
        
        // Filter barangays based on municipality if available
        if (formData[addressType].municipality) {
          setSuggestions({
            ...suggestions,
            barangay: filterBarangays(value, formData[addressType].municipality)
          });
        } else {
          setSuggestions({
            ...suggestions,
            barangay: filterBarangays(value)
          });
        }
      }
    } else if (field === 'municipality') {
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          municipality: value,
          // Clear barangay when municipality changes
          barangay: ''
        }
      }));
      
      // Find and set province automatically if possible
      const province = getProvinceForMunicipality(value);
      if (province) {
        setFormData(prev => ({
          ...prev,
          [addressType]: {
            ...prev[addressType],
            municipality: value,
            province: province,
            barangay: ''
          }
        }));
      }
      
      // Update suggestions if this is the focused field
      if (focusedField === `${addressType.split('_')[0]}-municipality`) {
        const suggestions = addressType === 'present_address' ? presentSuggestions : permanentSuggestions;
        const setSuggestions = addressType === 'present_address' ? setPresentSuggestions : setPermanentSuggestions;
        
        setSuggestions({
          ...suggestions,
          municipality: filterMunicipalities(value)
        });
      }
    } else if (field === 'province') {
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          province: value,
          // Clear municipality and barangay
          municipality: '',
          barangay: ''
        }
      }));
      
      // Update suggestions if this is the focused field
      if (focusedField === `${addressType.split('_')[0]}-province`) {
        const suggestions = addressType === 'present_address' ? presentSuggestions : permanentSuggestions;
        const setSuggestions = addressType === 'present_address' ? setPresentSuggestions : setPermanentSuggestions;
        
        setSuggestions({
          ...suggestions,
          municipality: getMunicipalitiesForProvince(value)
        });
      }
    } else {
      // For other fields (house_street_purok, zip_code)
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          [field]: value
        }
      }));
    }
  };

  // Handle selection from address dropdowns
  const handleAddressSelect = (field, value, addressType) => {
    if (field === 'barangay') {
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          barangay: value
        }
      }));
    } else if (field === 'municipality') {
      // Find and set the province automatically
      const province = getProvinceForMunicipality(value);
      
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          municipality: value,
          // Set province if found, clear barangay
          ...(province ? { province } : {}),
          barangay: ''
        }
      }));
      
      // Update barangay suggestions for this municipality
      const suggestions = addressType === 'present_address' ? presentSuggestions : permanentSuggestions;
      const setSuggestions = addressType === 'present_address' ? setPresentSuggestions : setPermanentSuggestions;
      
      setSuggestions({
        ...suggestions,
        barangay: getBarangaysForMunicipality(value)
      });
    } else if (field === 'province') {
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          province: value,
          // Clear municipality and barangay
          municipality: '',
          barangay: ''
        }
      }));
      
      // Update municipality suggestions for this province
      const suggestions = addressType === 'present_address' ? presentSuggestions : permanentSuggestions;
      const setSuggestions = addressType === 'present_address' ? setPresentSuggestions : setPermanentSuggestions;
      
      setSuggestions({
        ...suggestions,
        municipality: getMunicipalitiesForProvince(value)
      });
    }
    
    // Clear focus after selection
    setFocusedField(null);
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const autocompleteContainers = document.querySelectorAll('.autocomplete-container');
      let clickedOutside = true;
      
      autocompleteContainers.forEach(container => {
        if (container.contains(event.target)) {
          clickedOutside = false;
        }
      });
      
      if (clickedOutside) {
        setFocusedField(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSiblingChange = (index, field, value) => {
    const updatedSiblings = [...formData.siblings];
    updatedSiblings[index][field] = value; // Update the correct field of the sibling at the given index
    setFormData((prevData) => ({
      ...prevData,
      siblings: updatedSiblings, // Update the siblings array in the form data
    }));
  };
  
  const addSibling = () => {
    setFormData((prevData) => ({
      ...prevData,
      siblings: [
        ...prevData.siblings,
        { first_name: "", last_name: "", middle_name: "", age: "", occupation: "", phone_number: "", educational_attainment: "" }, // Empty fields for new sibling
      ],
    }));
  };
  
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Image selected:", file.name);
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    
    const payload = {
      faculty_id,
      ...formData,
      image_path: image ? image.split(",")[1] : null, // only send base64 string, not the full data URL
    };
  
    try {
      const url = faculty_id
        ? `http://ncamisshs.com/backend/updateFacultyDetails.php`  // Update request
        : `http://ncamisshs.com/backend/saveFacultyDetails.php`;  // Save request
  
      console.log("Submitting to:", url);
      console.log("Payload:", payload);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("Submit response:", result);
      
      if (result.success) {
        console.log("Profile saved successfully");
        // Navigate directly without showing success alert
        navigate("/faculty-dashboard", { state: { faculty_id } });
      } else {
        alert(`Error saving profile: ${result.message}`);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("An error occurred while saving the profile: " + error.message);
    }
  };

  if (loading || loadingLocations) {
    return (
      <div className="loading-container">
        <p>Loading faculty profile data...</p>
      </div>
    );
  }

  // Only show critical error for authentication/navigation issues
  if (criticalError) {
    return (
      <div className="error-container">
        <h3>Critical Error</h3>
        <p className="error-message">{criticalError}</p>
        <button onClick={() => navigate("/faculty-dashboard", { state: { faculty_id } })}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{faculty_id ? "Update Profile" : "Create Profile"}</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to {faculty_id ? "update" : "create"} this profile?</p>
            </div>
            <div className="modal-footer">
              <button 
                className="confirm-button-fp" 
                onClick={confirmSubmit}
              >
                Confirm
              </button>
               <button 
                className="cancel-button" 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status message for no existing data */}
      {!hasExistingData && faculty_id && (
        <div className="info-message-container">
          <p className="info-message">
            No existing profile data found. You can create a new profile by filling out the form below.
          </p>
        </div>
      )}
  
      <form className="faculty-container-fp" onSubmit={handleFormSubmit}>
        <h2 className="faculty-title-fp">Personal Information</h2>
        <div className="image-and-form-container-fp">
          <div className="image-upload-container-fp">
            <div className="box-decoration-f" onClick={() => hiddenFileInput.current.click()}>
              {image ? (
                <img src={image} alt="faculty" className="img-display-after-f" />
              ) : (
                <img src={photo} alt="upload" className="img-display-before-f" />
              )}
              <label htmlFor="image-upload-input" className="image-upload-label-f">
                {image ? "Change Image" : "Upload Image"}
              </label>
              <input
                id="image-upload-input"
                type="file"
                onChange={handleImageChange}
                ref={hiddenFileInput}
                style={{ display: "none" }}
              />
            </div>
          </div>
  
          {/* Right side - Form Fields */}
          <div className="form-fields-container-f">
            <div className="form-row-f">
              <div className="form-group-f">
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                />
              </div>
              <div className="form-group-f">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                />
              </div>
              <div className="form-group-f">
                <label>Middle Name</label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) => handleChange("middle_name", e.target.value)}
                />
              </div>
              <div className="form-group-f">
                <label>Suffix</label>
                <input
                  type="text"
                  value={formData.suffix}
                  onChange={(e) => handleChange("suffix", e.target.value)}
                />
              </div>
              <div className="form-group-f">
                <label>Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                />
              </div>
            </div>
    
            <div className="form-row-f">
              <div className="form-group-f">
                <label>Birthday</label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => handleChange("birthday", e.target.value)}
                />
              </div>
              <div className="form-group-f">
                <label>Birthplace</label>
                <input
                  type="text"
                  value={formData.birthplace}
                  onChange={(e) => handleChange("birthplace", e.target.value)}
                />
              </div>
              <div className="form-group-f">
                <label>Civil Status</label>
                <select
                  value={formData.civil_status}
                  onChange={(e) => handleChange("civil_status", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>
    
            <div className="form-row-f">
              <div className="form-group-f">
                <label>Religion</label>
                <input
                  type="text"
                  value={formData.religion}
                  onChange={(e) => handleChange("religion", e.target.value)}
                />
              </div>
              <div className="form-group-f">
                <label>Citizenship</label>
                <input
                  type="text"
                  value={formData.citizenship}
                  onChange={(e) => handleChange("citizenship", e.target.value)}
                />
              </div>
              <div className="form-group-f">
                <label>Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => handleChange("sex", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
            </div>
    
            <div className="form-row-f">
              <div className="form-group-f">
                <label>Contact Number</label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) => handleChange("contact_number", e.target.value)}
                />
              </div>
              <div className="form-group-f">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
    
        {/* Present Address Section */}
        <hr className="separator" />
        <h4>Present Address</h4>
        <div className="form-row-f">

            <div className="form-group-f">
            <label>Province</label>
            <div className="autocomplete-container">
              <input
                type="text"
                value={formData.present_address.province}
                onChange={(e) => handleAddressChange("province", e.target.value, "present_address")}
                onFocus={() => handleFocus("present-province")}
                placeholder="Type to search"
              />
              {focusedField === "present-province" && presentSuggestions.province.length > 0 && (
                <ul className="suggestions-list">
                  {presentSuggestions.province.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleAddressSelect("province", suggestion, "present_address")}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
             <div className="form-group-f">
            <label>Municipality</label>
            <div className="autocomplete-container">
              <input
                type="text"
                value={formData.present_address.municipality}
                onChange={(e) => handleAddressChange("municipality", e.target.value, "present_address")}
                onFocus={() => handleFocus("present-municipality")}
                placeholder="Type to search"
              />
              {focusedField === "present-municipality" && presentSuggestions.municipality.length > 0 && (
                <ul className="suggestions-list">
                  {presentSuggestions.municipality.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleAddressSelect("municipality", suggestion, "present_address")}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="form-group-f">
            <label>Barangay</label>
            <div className="autocomplete-container">
              <input
                type="text"
                value={formData.present_address.barangay}
                onChange={(e) => handleAddressChange("barangay", e.target.value, "present_address")}
                onFocus={() => handleFocus("present-barangay")}
                placeholder="Type to search"
              />
              {focusedField === "present-barangay" && presentSuggestions.barangay.length > 0 && (
                <ul className="suggestions-list">
                  {presentSuggestions.barangay.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleAddressSelect("barangay", suggestion, "present_address")}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
       <div className="form-group-f">
            <label>House No./Street/Purok</label>
            <input
              type="text"
              value={formData.present_address.house_street_purok}
              onChange={(e) => handleAddressChange("house_street_purok", e.target.value, "present_address")}
            />
          </div>
          <div className="form-group-f">
            <label>Zip Code</label>
            <input
              type="text"
              value={formData.present_address.zip_code}
              onChange={(e) => handleAddressChange("zip_code", e.target.value, "present_address")}
            />
          </div>
        </div>
        
        {/* Checkbox for same address */}
        <div className="form-row-f checkbox-row">
          <div className="form-group-f checkbox-container">
            <input 
              type="checkbox" 
              id="sameAddress" 
              checked={sameAsPresent} 
              onChange={handleSameAddressChange} 
              className="same-address-checkbox"
            />
            <label htmlFor="sameAddress" className="checkbox-label">
              Same as Present Address
            </label>
          </div>
        </div>
        
        {/* Permanent Address Section */}
        <h4>Permanent Address</h4>
        <div className="form-row-f">
           <div className="form-group-f">
            <label>Province</label>
            <div className="autocomplete-container">
              <input
                type="text"
                value={formData.permanent_address.province}
                onChange={(e) => handleAddressChange("province", e.target.value, "permanent_address")}
                onFocus={() => !sameAsPresent && handleFocus("permanent-province")}
                placeholder="Type to search"
                disabled={sameAsPresent}
              />
              {!sameAsPresent && focusedField === "permanent-province" && permanentSuggestions.province.length > 0 && (
                <ul className="suggestions-list">
                  {permanentSuggestions.province.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleAddressSelect("province", suggestion, "permanent_address")}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
            <div className="form-group-f">
            <label>Municipality</label>
            <div className="autocomplete-container">
              <input
                type="text"
                value={formData.permanent_address.municipality}
                onChange={(e) => handleAddressChange("municipality", e.target.value, "permanent_address")}
                onFocus={() => !sameAsPresent && handleFocus("permanent-municipality")}
                placeholder="Type to search"
                disabled={sameAsPresent}
              />
              {!sameAsPresent && focusedField === "permanent-municipality" && permanentSuggestions.municipality.length > 0 && (
                <ul className="suggestions-list">
                  {permanentSuggestions.municipality.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleAddressSelect("municipality", suggestion, "permanent_address")}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="form-group-f">
            <label>Barangay</label>
            <div className="autocomplete-container">
              <input
                type="text"
                value={formData.permanent_address.barangay}
                onChange={(e) => handleAddressChange("barangay", e.target.value, "permanent_address")}
                onFocus={() => !sameAsPresent && handleFocus("permanent-barangay")}
                placeholder="Type to search"
                disabled={sameAsPresent}
              />
              {!sameAsPresent && focusedField === "permanent-barangay" && permanentSuggestions.barangay.length > 0 && (
                <ul className="suggestions-list">
                  {permanentSuggestions.barangay.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleAddressSelect("barangay", suggestion, "permanent_address")}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
            <div className="form-group-f">
            <label>House No./Street/Purok</label>
            <input
              type="text"
              value={formData.permanent_address.house_street_purok}
              onChange={(e) => handleAddressChange("house_street_purok", e.target.value, "permanent_address")}
              disabled={sameAsPresent}
            />
          </div>
          <div className="form-group-f">
            <label>Zip Code</label>
            <input
              type="text"
              value={formData.permanent_address.zip_code}
              onChange={(e) => handleAddressChange("zip_code", e.target.value, "permanent_address")}
              disabled={sameAsPresent}
            />
          </div>
        </div>
  
        {/* Educational Background */}
        <hr className="separator" />
        <h4>Educational Background</h4>
  
        {/* Elementary */}
        <div className="form-row-f">
          <div className="form-group-f">
            <label>Elementary School Name</label>
            <input
              type="text"
              value={formData.elementary.school_name}
              onChange={(e) =>
                handleChange("school_name", e.target.value, "elementary")
              }
            />
          </div>
          
          <div className="form-group-f">
            <label>Year Graduated</label>
            <input
              type="number"
              value={formData.elementary.year_graduated}
              onChange={(e) =>
                handleChange("year_graduated", e.target.value, "elementary")
              }
            />
          </div>
        </div>
  
        {/* Junior High School */}
        <div className="form-row-f">
          <div className="form-group-f">
            <label>High School Name</label>
            <input
              type="text"
              value={formData.junior.school_name}
              onChange={(e) =>
                handleChange("school_name", e.target.value, "junior")
              }
            />
          </div>
        
          <div className="form-group-f">
            <label>Year Graduated</label>
            <input
              type="number"
              value={formData.junior.year_graduated}
              onChange={(e) =>
                handleChange("year_graduated", e.target.value, "junior")
              }
            />
          </div>
        </div>
  
        {/* College */}
        <div className="form-row-f">
          <div className="form-group-f">
            <label>College School Name</label>
            <input
              type="text"
              value={formData.college.school_name}
              onChange={(e) =>
                handleChange("school_name", e.target.value, "college")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Course</label>
            <input
              type="text"
              value={formData.college.course}
              onChange={(e) =>
                handleChange("course", e.target.value, "college")
              }
            />
          </div>
        
          <div className="form-group-f">
            <label>Year Graduated</label>
            <input
              type="number"
              value={formData.college.year_graduated}
              onChange={(e) =>
                handleChange("year_graduated", e.target.value, "college")
              }
            />
          </div>
        </div>
  
  
        <hr className="separator" />
        <h3>Family Background</h3>
  
        <h4>Father Information</h4>
        <div className="form-row-f">
          <div className="form-group-f">
            <label>Father's First Name</label>
            <input
              type="text"
              value={formData.father.first_name}
              onChange={(e) =>
                handleChange("first_name", e.target.value, "father")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Father's Last Name</label>
            <input
              type="text"
              value={formData.father.last_name}
              onChange={(e) =>
                handleChange("last_name", e.target.value, "father")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Middle Name</label>
            <input
              type="text"
              value={formData.father.middle_name}
              onChange={(e) =>
                handleChange("middle_name", e.target.value, "father")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Age</label>
            <input
              type="number"
              value={formData.father.age}
              onChange={(e) =>
                handleChange("age", e.target.value, "father")
              }
            />
          </div>
        </div>
        <div className="form-row-f">
          <div className="form-group-f">
            <label>Occupation</label>
            <input
              type="text"
              value={formData.father.occupation}
              onChange={(e) =>
                handleChange("occupation", e.target.value, "father")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Phone Number</label>
            <input
              type="text"
              value={formData.father.phone_number}
              onChange={(e) =>
                handleChange("phone_number", e.target.value, "father")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Educational Attainment</label>
            <input
              type="text"
              value={formData.father.educational_attainment}
              onChange={(e) =>
                handleChange("educational_attainment", e.target.value, "father")
              }
            />
          </div>
        </div>
  
        {/* Mother Information */}
        <h4>Mother Information</h4>
        <div className="form-row-f">
          <div className="form-group-f">
            <label>Mother's First Name</label>
            <input
              type="text"
              value={formData.mother.first_name}
              onChange={(e) =>
                handleChange("first_name", e.target.value, "mother")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Mother's Last Name</label>
            <input
              type="text"
              value={formData.mother.last_name}
              onChange={(e) =>
                handleChange("last_name", e.target.value, "mother")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Middle Name</label>
            <input
              type="text"
              value={formData.mother.middle_name}
              onChange={(e) =>
                handleChange("middle_name", e.target.value, "mother")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Age</label>
            <input
              type="number"
              value={formData.mother.age}
              onChange={(e) =>
                handleChange("age", e.target.value, "mother")
              }
            />
          </div>
        </div>
        <div className="form-row-f">
          <div className="form-group-f">
            <label>Occupation</label>
            <input
              type="text"
              value={formData.mother.occupation}
              onChange={(e) =>
                handleChange("occupation", e.target.value, "mother")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Phone Number</label>
            <input
              type="text"
              value={formData.mother.phone_number}
              onChange={(e) =>
                handleChange("phone_number", e.target.value, "mother")
              }
            />
          </div>
          <div className="form-group-f">
            <label>Educational Attainment</label>
            <input
              type="text"
              value={formData.mother.educational_attainment}
              onChange={(e) =>
                handleChange("educational_attainment", e.target.value, "mother")
              }
            />
          </div>
        </div>
  
        {/* Siblings */}
        <h4>Siblings</h4>
        {formData.siblings.map((sibling, index) => (
          <div key={index}>
            <div className="form-row-f">
              <div className="form-group-sibling">
                <label>First Name</label>
                <input
                  type="text"
                  value={sibling.first_name}
                  onChange={(e) =>
                    handleSiblingChange(index, "first_name", e.target.value)
                  }
                />
              </div>
              <div className="form-group-sibling">
                <label>Last Name</label>
                <input
                  type="text"
                  value={sibling.last_name}
                  onChange={(e) =>
                    handleSiblingChange(index, "last_name", e.target.value)
                  }
                />
              </div>
              <div className="form-group-f">
                <label>Middle Name</label>
                <input
                  type="text"
                  value={sibling.middle_name}
                  onChange={(e) =>
                    handleSiblingChange(index, "middle_name", e.target.value)
                  }
                />
              </div>
              <div className="form-group-f">
                <label>Age</label>
                <input
                  type="number"
                  value={sibling.age}
                  onChange={(e) => handleSiblingChange(index, "age", e.target.value)}
                />
              </div>
            </div>
            <div className="form-row-f">
              <div className="form-group-f">
                <label>Occupation</label>
                <input
                  type="text"
                  value={sibling.occupation}
                  onChange={(e) =>
                    handleSiblingChange(index, "occupation", e.target.value)
                  }
                />
              </div>
              <div className="form-group-f">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={sibling.phone_number}
                  onChange={(e) =>
                    handleSiblingChange(index, "phone_number", e.target.value)
                  }
                />
              </div>
              <div className="form-group-f">
                <label>Educational Attainment</label>
                <input
                  type="text"
                  value={sibling.educational_attainment}
                  onChange={(e) =>
                    handleSiblingChange(index, "educational_attainment", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}
  
        <div className="button-group-f">
          <button
            type="button"
            className="add-sibling-button-fp"
            onClick={addSibling}
          >
          + Add Sibling
          </button>
          <button type="submit" className="submit-button-fp">
            {faculty_id ? "Update" : "Create"} Profile
          </button>
        </div>
      </form>
    </>
  );
 };
 export default FacultyProfile;