import './personalinfo.css';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import photoPlaceholder from '../assets/photo.png';

const PersonalInfoForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenFileInput = useRef(null);

  // Get email from login state
  const passedEmail = location.state?.email || '';

  // Individual state variables for each field
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [extensionName, setExtensionName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthdayPlace, setBirthdayPlace] = useState('');
  const [age, setAge] = useState('');
  
  const [civilStatus, setCivilStatus] = useState('Single');
  const [religion, setReligion] = useState('');
  const [citizenship, setCitizenship] = useState('');
  const [sex, setSex] = useState('female');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState(passedEmail);
  const [fbidlink, setFbidlink] = useState('');

  // Address states
  const [presentHouseStreetPurok, setPresentHouseStreetPurok] = useState('');
  const [presentBarangay, setPresentBarangay] = useState('');
  const [presentMunicipality, setPresentMunicipality] = useState('');
  const [presentProvince, setPresentProvince] = useState('');
  const [presentZipcode, setPresentZipcode] = useState('');

  const [permanentHouseStreetPurok, setPermanentHouseStreetPurok] = useState('');
  const [permanentBarangay, setPermanentBarangay] = useState('');
  const [permanentMunicipality, setPermanentMunicipality] = useState('');
  const [permanentProvince, setPermanentProvince] = useState('');
  const [permanentZipcode, setPermanentZipcode] = useState('');

  // Track which field is currently focused
  const [focusedField, setFocusedField] = useState(null);
  
  // Track which field was filled first to determine priority
  const [presentFieldPriority, setPresentFieldPriority] = useState({
    province: false,
    municipality: false,
    barangay: false
  });
  
  const [permanentFieldPriority, setPermanentFieldPriority] = useState({
    province: false,
    municipality: false,
    barangay: false
  });
  
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
  
  // State for location data
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add state for the checkbox
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [image, setImage] = useState(null);

  // Add validation states
  const [emailError, setEmailError] = useState('');
  const [imageError, setImageError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Function to validate text fields (not empty/only spaces)
  const validateTextField = (value, fieldName) => {
    if (!value || !value.trim()) {
      return `${fieldName} is required and cannot be empty or contain only spaces.`;
    }
    return '';
  };

  // Function to handle text input changes with trimming
  const handleTextInputChange = (value, setter, fieldName) => {
    setter(value);
    const error = validateTextField(value, fieldName);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Function to trim value on blur (when user leaves the field)
  const handleTextInputBlur = (value, setter, fieldName) => {
    const trimmedValue = value.trim();
    setter(trimmedValue);
    const error = validateTextField(trimmedValue, fieldName);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Email validation function
  const validateEmail = (emailValue) => {
    if (!emailValue) {
      return 'Email is required.';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return 'Please enter a valid email address.';
    }
    
    const domainPart = emailValue.split('@')[1];
    if (!domainPart) {
      return 'Please enter a valid email address.';
    }
    
    const domainExtensionRegex = /\.[a-zA-Z]{2,}$/;
    if (!domainExtensionRegex.test(domainPart)) {
      return 'Please enter a valid email address with proper domain (e.g., .com, .org, .net).';
    }
    
    return '';
  };

  // Handle email change with validation
  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);
    const validationError = validateEmail(emailValue);
    setEmailError(validationError);
  };

  // Update the useEffect for fetching locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get("http://ncamisshs.com/backend/get_locations.php");
        
        if (response.data.success) {
          setLocationData(response.data.locations);
        } else {
          console.error("Failed to fetch locations:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Effect to update permanent address when checkbox is toggled
  useEffect(() => {
    if (sameAsPresent) {
      setPermanentHouseStreetPurok(presentHouseStreetPurok);
      setPermanentBarangay(presentBarangay);
      setPermanentMunicipality(presentMunicipality);
      setPermanentProvince(presentProvince);
      setPermanentZipcode(presentZipcode);
      // Copy priority as well
      setPermanentFieldPriority(presentFieldPriority);
    }
  }, [
    sameAsPresent, 
    presentHouseStreetPurok, 
    presentBarangay, 
    presentMunicipality, 
    presentProvince, 
    presentZipcode,
    presentFieldPriority
  ]);

  // Handle checkbox change
  const handleSameAddressChange = (e) => {
    setSameAsPresent(e.target.checked);
  };

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

  // Function to get barangays for a specific municipality and province
  const getBarangaysForMunicipalityAndProvince = (municipality, province) => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(
      locationData
        .filter(location => location.municipality === municipality && location.province === province)
        .map(location => location.barangay)
    )].sort();
  };

  // Function to get all provinces that have a specific municipality
  const getProvincesForMunicipality = (municipality) => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(
      locationData
        .filter(location => location.municipality === municipality)
        .map(location => location.province)
    )].sort();
  };

  // Function to get all municipalities that have a specific barangay
  const getMunicipalitiesForBarangay = (barangay) => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(
      locationData
        .filter(location => location.barangay === barangay)
        .map(location => location.municipality)
    )].sort();
  };

  // Function to get all provinces that have a specific barangay
  const getProvincesForBarangay = (barangay) => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(
      locationData
        .filter(location => location.barangay === barangay)
        .map(location => location.province)
    )].sort();
  };

  // Filter functions for search
  const filterMunicipalities = (input, province = null) => {
    const inputLower = input.toLowerCase();
    let municipalities;
    
    if (province) {
      municipalities = getMunicipalitiesForProvince(province);
    } else {
      municipalities = [...new Set(locationData.map(loc => loc.municipality))];
    }
    
    return municipalities
      .filter(municipality => municipality.toLowerCase().includes(inputLower))
      .sort();
  };

  const filterProvinces = (input, municipality = null) => {
    const inputLower = input.toLowerCase();
    let provinces;
    
    if (municipality) {
      provinces = getProvincesForMunicipality(municipality);
    } else {
      provinces = [...new Set(locationData.map(loc => loc.province))];
    }
    
    return provinces
      .filter(province => province.toLowerCase().includes(inputLower))
      .sort();
  };

  const filterBarangays = (input, municipality = null, province = null) => {
    const inputLower = input.toLowerCase();
    let barangays;
    
    if (municipality && province) {
      barangays = getBarangaysForMunicipalityAndProvince(municipality, province);
    } else if (municipality) {
      barangays = [...new Set(
        locationData
          .filter(loc => loc.municipality === municipality)
          .map(loc => loc.barangay)
      )];
    } else if (province) {
      barangays = [...new Set(
        locationData
          .filter(loc => loc.province === province)
          .map(loc => loc.barangay)
      )];
    } else {
      barangays = [...new Set(locationData.map(loc => loc.barangay))];
    }
    
    return barangays
      .filter(barangay => barangay.toLowerCase().includes(inputLower))
      .sort();
  };

  // PRESENT ADDRESS HANDLERS
  const handlePresentProvinceChange = (e) => {
    const value = e.target.value;
    setPresentProvince(value);
    
    // Mark province as having priority if it's being set
    if (value && !presentFieldPriority.province) {
      setPresentFieldPriority(prev => ({ ...prev, province: true }));
    }
    
    // Only update suggestions if this field is focused
    if (focusedField === 'present-province') {
      setPresentSuggestions({
        ...presentSuggestions,
        province: filterProvinces(value, presentMunicipality)
      });
    }
    
    // Clear municipality and barangay only if province has priority or if clearing province
    if (!value || !presentFieldPriority.municipality) {
      setPresentMunicipality('');
      setPresentBarangay('');
      setPresentFieldPriority(prev => ({ 
        ...prev, 
        municipality: false, 
        barangay: false 
      }));
    }
  };

  const handlePresentMunicipalityChange = (e) => {
    const value = e.target.value;
    setPresentMunicipality(value);
    
    // Mark municipality as having priority if it's being set
    if (value && !presentFieldPriority.municipality) {
      setPresentFieldPriority(prev => ({ ...prev, municipality: true }));
    }
    
    // Only update suggestions if this field is focused
    if (focusedField === 'present-municipality') {
      setPresentSuggestions({
        ...presentSuggestions,
        municipality: filterMunicipalities(value, presentProvince)
      });
    }
    
    // Auto-fill province when municipality is typed (exact match)
    if (value && value.trim() && !presentFieldPriority.province) {
      // Find exact matches for the municipality
      const exactMatches = locationData.filter(loc => 
        loc.municipality.toLowerCase() === value.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        const uniqueProvinces = [...new Set(exactMatches.map(loc => loc.province))];
        if (uniqueProvinces.length === 1) {
          // Only one province has this municipality, auto-fill it
          setPresentProvince(uniqueProvinces[0]);
          setPresentFieldPriority(prev => ({ ...prev, province: true }));
        }
        // If multiple provinces have this municipality, leave province empty for user to choose
      }
    }
    
    // Clear barangay only if municipality has priority or if clearing municipality
    if (!value || !presentFieldPriority.barangay) {
      setPresentBarangay('');
      setPresentFieldPriority(prev => ({ ...prev, barangay: false }));
    }
  };

  // Helper function to handle barangay auto-fill logic
  const triggerBarangayAutoFill = (exactMatches, addressType) => {
    console.log('triggerBarangayAutoFill called:', { exactMatches, addressType }); // Debug log
    
    const isPresent = addressType === 'present';
    const fieldPriority = isPresent ? presentFieldPriority : permanentFieldPriority;
    const municipalityValue = isPresent ? presentMunicipality : permanentMunicipality;
    const provinceValue = isPresent ? presentProvince : permanentProvince;
    
    console.log('Current state:', { fieldPriority, municipalityValue, provinceValue }); // Debug log
    
    // Auto-fill municipality if not set and only one unique municipality
    if (!fieldPriority.municipality && !municipalityValue) {
      const uniqueMunicipalities = [...new Set(exactMatches.map(loc => loc.municipality))];
      console.log('Unique municipalities found:', uniqueMunicipalities); // Debug log
      
      if (uniqueMunicipalities.length === 1) {
        console.log('Auto-filling municipality:', uniqueMunicipalities[0]); // Debug log
        
        if (isPresent) {
          setPresentMunicipality(uniqueMunicipalities[0]);
          setPresentFieldPriority(prev => ({ ...prev, municipality: true }));
        } else {
          setPermanentMunicipality(uniqueMunicipalities[0]);
          setPermanentFieldPriority(prev => ({ ...prev, municipality: true }));
        }
        
        // Auto-fill province if only one unique province for this municipality
        if (!fieldPriority.province) {
          const uniqueProvinces = [...new Set(exactMatches.map(loc => loc.province))];
          console.log('Unique provinces found:', uniqueProvinces); // Debug log
          
          if (uniqueProvinces.length === 1) {
            console.log('Auto-filling province:', uniqueProvinces[0]); // Debug log
            
            if (isPresent) {
              setPresentProvince(uniqueProvinces[0]);
              setPresentFieldPriority(prev => ({ ...prev, province: true }));
            } else {
              setPermanentProvince(uniqueProvinces[0]);
              setPermanentFieldPriority(prev => ({ ...prev, province: true }));
            }
          }
        }
      } else if (uniqueMunicipalities.length > 1) {
        console.log('Multiple municipalities found, updating suggestions for user to choose'); // Debug log
        
        // Clear current municipality and show dropdown with options
        if (isPresent) {
          setPresentMunicipality(''); // Clear current value
          setPresentSuggestions(prev => ({
            ...prev,
            municipality: uniqueMunicipalities
          }));
          // Use setTimeout to ensure the state updates first
          setTimeout(() => {
            setFocusedField('present-municipality');
          }, 100);
        } else {
          setPermanentMunicipality(''); // Clear current value
          setPermanentSuggestions(prev => ({
            ...prev,
            municipality: uniqueMunicipalities
          }));
          setTimeout(() => {
            setFocusedField('permanent-municipality');
          }, 100);
        }
      }
    }
    
    // Auto-fill province if municipality is set but province is not
    if (!fieldPriority.province && municipalityValue && !provinceValue) {
      const matchingProvinces = exactMatches
        .filter(loc => loc.municipality === municipalityValue)
        .map(loc => loc.province);
      const uniqueProvinces = [...new Set(matchingProvinces)];
      
      console.log('Matching provinces for existing municipality:', uniqueProvinces); // Debug log
      
      if (uniqueProvinces.length === 1) {
        console.log('Auto-filling province (municipality already set):', uniqueProvinces[0]); // Debug log
        
        if (isPresent) {
          setPresentProvince(uniqueProvinces[0]);
          setPresentFieldPriority(prev => ({ ...prev, province: true }));
        } else {
          setPermanentProvince(uniqueProvinces[0]);
          setPermanentFieldPriority(prev => ({ ...prev, province: true }));
        }
      }
    }
  };

  const handlePresentBarangayChange = (e) => {
    const value = e.target.value;
    console.log('handlePresentBarangayChange called with value:', value); // Debug log
    setPresentBarangay(value);
    
    // Mark barangay as having priority if it's being set
    if (value && !presentFieldPriority.barangay) {
      setPresentFieldPriority(prev => ({ ...prev, barangay: true }));
    }
    
    // Only update suggestions if this field is focused
    if (focusedField === 'present-barangay') {
      setPresentSuggestions({
        ...presentSuggestions,
        barangay: filterBarangays(value, presentMunicipality, presentProvince)
      });
    }
    
    // Auto-fill municipality and province when barangay is typed (only for exact matches)
    if (value && value.trim()) {
      // Find exact matches for the barangay (case insensitive)
      const exactMatches = locationData.filter(loc => 
        loc.barangay.toLowerCase() === value.toLowerCase().trim()
      );
      
      console.log('Exact matches found in typing:', exactMatches); // Debug log
      
      if (exactMatches.length > 0) {
        triggerBarangayAutoFill(exactMatches, 'present');
      }
    }
  };

  // PERMANENT ADDRESS HANDLERS
  const handlePermanentProvinceChange = (e) => {
    const value = e.target.value;
    setPermanentProvince(value);
    
    if (value && !permanentFieldPriority.province) {
      setPermanentFieldPriority(prev => ({ ...prev, province: true }));
    }
    
    if (focusedField === 'permanent-province') {
      setPermanentSuggestions({
        ...permanentSuggestions,
        province: filterProvinces(value, permanentMunicipality)
      });
    }
    
    if (!value || !permanentFieldPriority.municipality) {
      setPermanentMunicipality('');
      setPermanentBarangay('');
      setPermanentFieldPriority(prev => ({ 
        ...prev, 
        municipality: false, 
        barangay: false 
      }));
    }
  };

  const handlePermanentMunicipalityChange = (e) => {
    const value = e.target.value;
    setPermanentMunicipality(value);
    
    if (value && !permanentFieldPriority.municipality) {
      setPermanentFieldPriority(prev => ({ ...prev, municipality: true }));
    }
    
    if (focusedField === 'permanent-municipality') {
      setPermanentSuggestions({
        ...permanentSuggestions,
        municipality: filterMunicipalities(value, permanentProvince)
      });
    }
    
    // Auto-fill province when municipality is typed (exact match)
    if (value && value.trim() && !permanentFieldPriority.province) {
      // Find exact matches for the municipality
      const exactMatches = locationData.filter(loc => 
        loc.municipality.toLowerCase() === value.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        const uniqueProvinces = [...new Set(exactMatches.map(loc => loc.province))];
        if (uniqueProvinces.length === 1) {
          // Only one province has this municipality, auto-fill it
          setPermanentProvince(uniqueProvinces[0]);
          setPermanentFieldPriority(prev => ({ ...prev, province: true }));
        }
        // If multiple provinces have this municipality, leave province empty for user to choose
      }
    }
    
    if (!value || !permanentFieldPriority.barangay) {
      setPermanentBarangay('');
      setPermanentFieldPriority(prev => ({ ...prev, barangay: false }));
    }
  };

  const handlePermanentBarangayChange = (e) => {
    const value = e.target.value;
    setPermanentBarangay(value);
    
    if (value && !permanentFieldPriority.barangay) {
      setPermanentFieldPriority(prev => ({ ...prev, barangay: true }));
    }
    
    if (focusedField === 'permanent-barangay') {
      setPermanentSuggestions({
        ...permanentSuggestions,
        barangay: filterBarangays(value, permanentMunicipality, permanentProvince)
      });
    }
    
    // Auto-fill municipality and province when barangay is typed (only for exact matches)
    if (value && value.trim()) {
      // Find exact matches for the barangay (case insensitive)
      const exactMatches = locationData.filter(loc => 
        loc.barangay.toLowerCase() === value.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        triggerBarangayAutoFill(exactMatches, 'permanent');
      }
    }
  };

  // Handle selection from dropdowns - PRESENT ADDRESS
  const handleSelectPresentProvince = (province) => {
    setPresentProvince(province);
    setPresentFieldPriority(prev => ({ ...prev, province: true }));
    
    // Clear municipality and barangay if they don't have priority
    if (!presentFieldPriority.municipality) {
      setPresentMunicipality('');
      setPresentFieldPriority(prev => ({ ...prev, municipality: false }));
    }
    if (!presentFieldPriority.barangay) {
      setPresentBarangay('');
      setPresentFieldPriority(prev => ({ ...prev, barangay: false }));
    }
    
    setFocusedField(null);
  };

  const handleSelectPresentMunicipality = (municipality) => {
    setPresentMunicipality(municipality);
    setPresentFieldPriority(prev => ({ ...prev, municipality: true }));
    
    // Auto-fill province when municipality is selected from dropdown
    if (municipality && municipality.trim() && !presentFieldPriority.province) {
      // Find exact matches for the selected municipality
      const exactMatches = locationData.filter(loc => 
        loc.municipality.toLowerCase() === municipality.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        const uniqueProvinces = [...new Set(exactMatches.map(loc => loc.province))];
        if (uniqueProvinces.length === 1) {
          // Only one province has this municipality, auto-fill it
          setPresentProvince(uniqueProvinces[0]);
          setPresentFieldPriority(prev => ({ ...prev, province: true }));
        }
      }
    }
    
    // Clear barangay if it doesn't have priority
    if (!presentFieldPriority.barangay) {
      setPresentBarangay('');
      setPresentFieldPriority(prev => ({ ...prev, barangay: false }));
    }
    
    setFocusedField(null);
  };

  const handleSelectPresentBarangay = (barangay) => {
    console.log('handleSelectPresentBarangay called with barangay:', barangay); // Debug log
    setPresentBarangay(barangay);
    setPresentFieldPriority(prev => ({ ...prev, barangay: true }));
    
    // Auto-fill municipality and province when barangay is selected from dropdown
    if (barangay && barangay.trim()) {
      // Find exact matches for the selected barangay
      const exactMatches = locationData.filter(loc => 
        loc.barangay.toLowerCase() === barangay.toLowerCase().trim()
      );
      
      console.log('Exact matches found in dropdown selection:', exactMatches); // Debug log
      
      if (exactMatches.length > 0) {
        triggerBarangayAutoFill(exactMatches, 'present');
      } else {
        console.log('No exact matches found for:', barangay); // Debug log
      }
    }
    
    // Don't set focused field to null immediately if we need to show municipality dropdown
    // setFocusedField(null); // Remove this to allow municipality dropdown to show
  };

  // Handle selection from dropdowns - PERMANENT ADDRESS
  const handleSelectPermanentProvince = (province) => {
    setPermanentProvince(province);
    setPermanentFieldPriority(prev => ({ ...prev, province: true }));
    
    if (!permanentFieldPriority.municipality) {
      setPermanentMunicipality('');
      setPermanentFieldPriority(prev => ({ ...prev, municipality: false }));
    }
    if (!permanentFieldPriority.barangay) {
      setPermanentBarangay('');
      setPermanentFieldPriority(prev => ({ ...prev, barangay: false }));
    }
    
    setFocusedField(null);
  };

  const handleSelectPermanentMunicipality = (municipality) => {
    setPermanentMunicipality(municipality);
    setPermanentFieldPriority(prev => ({ ...prev, municipality: true }));
    
    // Auto-fill province when municipality is selected from dropdown
    if (municipality && municipality.trim() && !permanentFieldPriority.province) {
      // Find exact matches for the selected municipality
      const exactMatches = locationData.filter(loc => 
        loc.municipality.toLowerCase() === municipality.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        const uniqueProvinces = [...new Set(exactMatches.map(loc => loc.province))];
        if (uniqueProvinces.length === 1) {
          // Only one province has this municipality, auto-fill it
          setPermanentProvince(uniqueProvinces[0]);
          setPermanentFieldPriority(prev => ({ ...prev, province: true }));
        }
      }
    }
    
    if (!permanentFieldPriority.barangay) {
      setPermanentBarangay('');
      setPermanentFieldPriority(prev => ({ ...prev, barangay: false }));
    }
    
    setFocusedField(null);
  };

  const handleSelectPermanentBarangay = (barangay) => {
    setPermanentBarangay(barangay);
    setPermanentFieldPriority(prev => ({ ...prev, barangay: true }));
    
    // Auto-fill municipality and province when barangay is selected from dropdown
    if (barangay && barangay.trim()) {
      // Find exact matches for the selected barangay
      const exactMatches = locationData.filter(loc => 
        loc.barangay.toLowerCase() === barangay.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        triggerBarangayAutoFill(exactMatches, 'permanent');
      }
    }
    
    setFocusedField(null);
  };

  // Focus handlers
  const handleFocus = (field) => {
    setFocusedField(field);
    
    // Update suggestions based on which field is focused
    if (field === 'present-barangay') {
      setPresentSuggestions({
        ...presentSuggestions,
        barangay: filterBarangays(presentBarangay, presentMunicipality, presentProvince)
      });
    } else if (field === 'present-municipality') {
      setPresentSuggestions({
        ...presentSuggestions,
        municipality: filterMunicipalities(presentMunicipality, presentProvince)
      });
    } else if (field === 'present-province') {
      setPresentSuggestions({
        ...presentSuggestions,
        province: filterProvinces(presentProvince, presentMunicipality)
      });
    } else if (field === 'permanent-barangay') {
      setPermanentSuggestions({
        ...permanentSuggestions,
        barangay: filterBarangays(permanentBarangay, permanentMunicipality, permanentProvince)
      });
    } else if (field === 'permanent-municipality') {
      setPermanentSuggestions({
        ...permanentSuggestions,
        municipality: filterMunicipalities(permanentMunicipality, permanentProvince)
      });
    } else if (field === 'permanent-province') {
      setPermanentSuggestions({
        ...permanentSuggestions,
        province: filterProvinces(permanentProvince, permanentMunicipality)
      });
    }
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

  // Navigate to the next form and pass all individual states
  const handleNext = (event) => {
    event.preventDefault();
    
    // Validate all required text fields (excluding middle name and extension name)
    const requiredFields = [
      { value: firstName, name: 'First Name' },
      { value: lastName, name: 'Last Name' },
      { value: birthday, name: 'Birthday' },
      { value: birthdayPlace, name: 'Birthday Place' },
      { value: age, name: 'Age' },
      { value: religion, name: 'Religion' },
      { value: citizenship, name: 'Citizenship' },
      { value: contactNumber, name: 'Contact Number' },
      { value: presentHouseStreetPurok, name: 'Present Address - House/Street/Purok' },
      { value: presentBarangay, name: 'Present Address - Barangay' },
      { value: presentMunicipality, name: 'Present Address - Municipality' },
      { value: presentProvince, name: 'Present Address - Province' },
      { value: presentZipcode, name: 'Present Address - Zip Code' },
      { value: permanentHouseStreetPurok, name: 'Permanent Address - House/Street/Purok' },
      { value: permanentBarangay, name: 'Permanent Address - Barangay' },
      { value: permanentMunicipality, name: 'Permanent Address - Municipality' },
      { value: permanentProvince, name: 'Permanent Address - Province' },
      { value: permanentZipcode, name: 'Permanent Address - Zip Code' }
    ];

    let hasErrors = false;
    const newFieldErrors = {};

    // Validate all required fields
    requiredFields.forEach(field => {
      const error = validateTextField(field.value, field.name);
      if (error) {
        newFieldErrors[field.name] = error;
        hasErrors = true;
      }
    });

    // Validate email
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      hasErrors = true;
    }
    
    // Validate image
    if (!image) {
      setImageError('Profile picture is required before proceeding.');
      hasErrors = true;
    }

    // Set all field errors
    setFieldErrors(newFieldErrors);
    
    // If there are errors, don't proceed
    if (hasErrors) {
      return;
    }
    
    // Clear errors if validation passes
    setEmailError('');
    setImageError('');
    setFieldErrors({});
    
    navigate('/enrollment-data', {
      state: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim() || 'N/A',
        extensionName: extensionName.trim() || 'N/A',
        birthday,
        birthdayPlace: birthdayPlace.trim(),
        age,
        civilStatus,
        religion: religion.trim(),
        citizenship: citizenship.trim(),
        sex,
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        fbidlink: fbidlink.trim(),
        presentAddress: {
          houseStreetPurok: presentHouseStreetPurok.trim(),
          barangay: presentBarangay.trim(),
          municipality: presentMunicipality.trim(),
          province: presentProvince.trim(),
          zipcode: presentZipcode.trim(),
        },
        permanentAddress: {
          houseStreetPurok: permanentHouseStreetPurok.trim(),
          barangay: permanentBarangay.trim(),
          municipality: permanentMunicipality.trim(),
          province: permanentProvince.trim(),
          zipcode: permanentZipcode.trim(),
        },
        image
      }
    });
  };

  // Handle image upload and processing
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setImageError('Please upload a valid image file (JPEG, JPG, or PNG).');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImageError('File size must be less than 5MB.');
        return;
      }
      
      setImage(file);
      setImageError('');
    }
  };

  // Trigger hidden file input for image selection
  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  return (
    <div className="personal-info-form-1">
      <h2>Personal Information</h2>
      <form onSubmit={handleNext}>
        {/* Name Section */}
        <div className="form-row">
          <div className="form-group">
            <label>First Name <span className="required">*</span></label>
            <input 
              type="text" 
              value={firstName} 
              onChange={(e) => handleTextInputChange(e.target.value, setFirstName, 'First Name')}
              onBlur={(e) => handleTextInputBlur(e.target.value, setFirstName, 'First Name')}
              required 
              style={{
                borderColor: fieldErrors['First Name'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['First Name'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['First Name']}
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Last Name <span className="required">*</span></label>
            <input 
              type="text" 
              value={lastName} 
              onChange={(e) => handleTextInputChange(e.target.value, setLastName, 'Last Name')}
              onBlur={(e) => handleTextInputBlur(e.target.value, setLastName, 'Last Name')}
              required 
              style={{
                borderColor: fieldErrors['Last Name'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['Last Name'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Last Name']}
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Middle Name</label>
            <input 
              type="text" 
              value={middleName} 
              placeholder="If none, leave it blank" 
              onChange={(e) => setMiddleName(e.target.value)}
              onBlur={(e) => setMiddleName(e.target.value.trim())}
            />
          </div>
          <div className="form-group">
            <label>Extension Name</label>
            <input 
              type="text" 
              value={extensionName} 
              placeholder="If none, leave it blank" 
              onChange={(e) => setExtensionName(e.target.value)}
              onBlur={(e) => setExtensionName(e.target.value.trim())}
            />
          </div>
        </div>

        {/* Age, Birthday, Religion, and Civil Status Section */}
        <div className="form-row">
          <div className="form-group-pi">
            <label>Birthday <span className="required">*</span></label>
            <input 
              type="date" 
              value={birthday} 
              onChange={(e) => {
                setBirthday(e.target.value);
                setFieldErrors(prev => ({ ...prev, 'Birthday': '' }));
              }}
              required 
              style={{
                borderColor: fieldErrors['Birthday'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['Birthday'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Birthday']}
              </span>
            )}
          </div>
          <div className="form-group-bp">
            <label>Birthday Place <span className="required">*</span></label>
            <input 
              type="text" 
              value={birthdayPlace} 
              onChange={(e) => handleTextInputChange(e.target.value, setBirthdayPlace, 'Birthday Place')}
              onBlur={(e) => handleTextInputBlur(e.target.value, setBirthdayPlace, 'Birthday Place')}
              required 
              style={{
                borderColor: fieldErrors['Birthday Place'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['Birthday Place'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Birthday Place']}
              </span>
            )}
          </div>
          <div className="form-group-pis">
            <label>Age <span className="required">*</span></label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => {
                setAge(e.target.value);
                setFieldErrors(prev => ({ ...prev, 'Age': '' }));
              }}
              required 
              style={{
                borderColor: fieldErrors['Age'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['Age'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Age']}
              </span>
            )}
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="form-row">
          <div className="form-group-cs">
            <label>Civil Status <span className="required">*</span></label>
            <select value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)} required>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div className="form-group-css">
            <label>Religion <span className="required">*</span></label>
            <input 
              type="text" 
              value={religion} 
              onChange={(e) => handleTextInputChange(e.target.value, setReligion, 'Religion')}
              onBlur={(e) => handleTextInputBlur(e.target.value, setReligion, 'Religion')}
              required 
              style={{
                borderColor: fieldErrors['Religion'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['Religion'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Religion']}
              </span>
            )}
          </div>
          <div className="form-group-css">
            <label>Citizenship <span className="required">*</span></label>
            <input 
              type="text" 
              value={citizenship} 
              onChange={(e) => handleTextInputChange(e.target.value, setCitizenship, 'Citizenship')}
              onBlur={(e) => handleTextInputBlur(e.target.value, setCitizenship, 'Citizenship')}
              required 
              style={{
                borderColor: fieldErrors['Citizenship'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['Citizenship'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Citizenship']}
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Sex <span className="required">*</span></label>
            <select value={sex} onChange={(e) => setSex(e.target.value)} required>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-row">
          <div className="form-group">
            <label>Contact Number <span className="required">*</span></label>
            <input 
              type="text" 
              value={contactNumber} 
              onChange={(e) => handleTextInputChange(e.target.value, setContactNumber, 'Contact Number')}
              onBlur={(e) => handleTextInputBlur(e.target.value, setContactNumber, 'Contact Number')}
              required 
              style={{
                borderColor: fieldErrors['Contact Number'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['Contact Number'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Contact Number']}
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input 
              type="email" 
              value={email} 
              onChange={handleEmailChange} 
              onBlur={(e) => setEmail(e.target.value.trim())}
              required 
              style={{
                borderColor: emailError ? '#dc3545' : ''
              }}
            />
            {emailError && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {emailError}
              </span>
            )}
            {/* Add this note below the email input */}
            <span style={{color: '#666', fontSize: '11px', marginTop: '4px', display: 'block', fontStyle: 'italic'}}>
              Please use your registered email address
            </span>
          </div>
        </div>

        {/* Present Address Section */}
        <h4>Present Address</h4>
        <div className="form-row">
          
          
          <div className="form-group">
            <label>Province <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={presentProvince} 
                onChange={(e) => {
                  handlePresentProvinceChange(e);
                  setFieldErrors(prev => ({ ...prev, 'Present Address - Province': '' }));
                }}
                onFocus={() => handleFocus('present-province')}
                onBlur={(e) => {
                  const trimmedValue = e.target.value.trim();
                  setPresentProvince(trimmedValue);
                  const error = validateTextField(trimmedValue, 'Present Address - Province');
                  setFieldErrors(prev => ({ ...prev, 'Present Address - Province': error }));
                }}
                placeholder="Type to search"
                required 
                style={{
                  borderColor: fieldErrors['Present Address - Province'] ? '#dc3545' : ''
                }}
              />
              {focusedField === 'present-province' && presentSuggestions.province.length > 0 && (
                <ul className="suggestions-list">
                  {presentSuggestions.province.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => {
                        handleSelectPresentProvince(suggestion);
                        setFieldErrors(prev => ({ ...prev, 'Present Address - Province': '' }));
                      }}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {fieldErrors['Present Address - Province'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Present Address - Province']}
              </span>
            )}
          </div>
          
          <div className="form-group">
            <label>Municipality <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={presentMunicipality} 
                onChange={(e) => {
                  handlePresentMunicipalityChange(e);
                  setFieldErrors(prev => ({ ...prev, 'Present Address - Municipality': '' }));
                }}
                onFocus={() => handleFocus('present-municipality')}
                onBlur={(e) => {
                  const trimmedValue = e.target.value.trim();
                  setPresentMunicipality(trimmedValue);
                  const error = validateTextField(trimmedValue, 'Present Address - Municipality');
                  setFieldErrors(prev => ({ ...prev, 'Present Address - Municipality': error }));
                }}
                placeholder="Type to search"
                required 
                style={{
                  borderColor: fieldErrors['Present Address - Municipality'] ? '#dc3545' : ''
                }}
              />
              {focusedField === 'present-municipality' && presentSuggestions.municipality.length > 0 && (
                <ul className="suggestions-list">
                  {presentSuggestions.municipality.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => {
                        handleSelectPresentMunicipality(suggestion);
                        setFieldErrors(prev => ({ ...prev, 'Present Address - Municipality': '' }));
                      }}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {fieldErrors['Present Address - Municipality'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Present Address - Municipality']}
              </span>
            )}
          </div>
          
          <div className="form-group">
            <label>Barangay <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={presentBarangay} 
                onChange={(e) => {
                  handlePresentBarangayChange(e);
                  setFieldErrors(prev => ({ ...prev, 'Present Address - Barangay': '' }));
                }}
                onFocus={() => handleFocus('present-barangay')}
                onBlur={(e) => {
                  const trimmedValue = e.target.value.trim();
                  setPresentBarangay(trimmedValue);
                  const error = validateTextField(trimmedValue, 'Present Address - Barangay');
                  setFieldErrors(prev => ({ ...prev, 'Present Address - Barangay': error }));
                }}
                placeholder="Type to search"
                required 
                style={{
                  borderColor: fieldErrors['Present Address - Barangay'] ? '#dc3545' : ''
                }}
              />
              {focusedField === 'present-barangay' && presentSuggestions.barangay.length > 0 && (
                <ul className="suggestions-list">
                  {presentSuggestions.barangay.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => {
                        handleSelectPresentBarangay(suggestion);
                        setFieldErrors(prev => ({ ...prev, 'Present Address - Barangay': '' }));
                      }}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {fieldErrors['Present Address - Barangay'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Present Address - Barangay']}
              </span>
            )}
          </div>
          <div className="form-group-p">
            <label>House No./Street/Purok <span className="required">*</span></label>
            <input 
              type="text" 
              value={presentHouseStreetPurok} 
              onChange={(e) => handleTextInputChange(e.target.value, setPresentHouseStreetPurok, 'Present Address - House/Street/Purok')}
              onBlur={(e) => handleTextInputBlur(e.target.value, setPresentHouseStreetPurok, 'Present Address - House/Street/Purok')}
              required 
              style={{
                borderColor: fieldErrors['Present Address - House/Street/Purok'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['Present Address - House/Street/Purok'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Present Address - House/Street/Purok']}
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Zip Code <span className="required">*</span></label>
            <input 
              type="number" 
              value={presentZipcode} 
              onChange={(e) => {
                setPresentZipcode(e.target.value);
                setFieldErrors(prev => ({ ...prev, 'Present Address - Zip Code': '' }));
              }}
              required 
              style={{
                borderColor: fieldErrors['Present Address - Zip Code'] ? '#dc3545' : ''
              }}
            />
            {fieldErrors['Present Address - Zip Code'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Present Address - Zip Code']}
              </span>
            )}
          </div>
        </div>

        {/* Checkbox for same address */}
        <div className="form-row checkbox-row">
          <div className="form-group checkbox-container">
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
        <div className="form-row">
          

          <div className="form-group">
            <label>Province <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={permanentProvince} 
                onChange={(e) => {
                  if (!sameAsPresent) {
                    handlePermanentProvinceChange(e);
                    setFieldErrors(prev => ({ ...prev, 'Permanent Address - Province': '' }));
                  }
                }}
                onFocus={() => !sameAsPresent && handleFocus('permanent-province')}
                onBlur={(e) => {
                  if (!sameAsPresent) {
                    const trimmedValue = e.target.value.trim();
                    setPermanentProvince(trimmedValue);
                    const error = validateTextField(trimmedValue, 'Permanent Address - Province');
                    setFieldErrors(prev => ({ ...prev, 'Permanent Address - Province': error }));
                  }
                }}
                placeholder="Type to search"
                required 
                disabled={sameAsPresent}
                style={{
                  borderColor: fieldErrors['Permanent Address - Province'] ? '#dc3545' : ''
                }}
              />
              {!sameAsPresent && focusedField === 'permanent-province' && permanentSuggestions.province.length > 0 && (
                <ul className="suggestions-list">
                  {permanentSuggestions.province.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => {
                        handleSelectPermanentProvince(suggestion);
                        setFieldErrors(prev => ({ ...prev, 'Permanent Address - Province': '' }));
                      }}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!sameAsPresent && fieldErrors['Permanent Address - Province'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Permanent Address - Province']}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Municipality <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={permanentMunicipality} 
                onChange={(e) => {
                  if (!sameAsPresent) {
                    handlePermanentMunicipalityChange(e);
                    setFieldErrors(prev => ({ ...prev, 'Permanent Address - Municipality': '' }));
                  }
                }}
                onFocus={() => !sameAsPresent && handleFocus('permanent-municipality')}
                onBlur={(e) => {
                  if (!sameAsPresent) {
                    const trimmedValue = e.target.value.trim();
                    setPermanentMunicipality(trimmedValue);
                    const error = validateTextField(trimmedValue, 'Permanent Address - Municipality');
                    setFieldErrors(prev => ({ ...prev, 'Permanent Address - Municipality': error }));
                  }
                }}
                placeholder="Type to search"
                required 
                disabled={sameAsPresent}
                style={{
                  borderColor: fieldErrors['Permanent Address - Municipality'] ? '#dc3545' : ''
                }}
              />
              {!sameAsPresent && focusedField === 'permanent-municipality' && permanentSuggestions.municipality.length > 0 && (
                <ul className="suggestions-list">
                  {permanentSuggestions.municipality.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => {
                        handleSelectPermanentMunicipality(suggestion);
                        setFieldErrors(prev => ({ ...prev, 'Permanent Address - Municipality': '' }));
                      }}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!sameAsPresent && fieldErrors['Permanent Address - Municipality'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Permanent Address - Municipality']}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Barangay <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={permanentBarangay} 
                onChange={(e) => {
                  if (!sameAsPresent) {
                    handlePermanentBarangayChange(e);
                    setFieldErrors(prev => ({ ...prev, 'Permanent Address - Barangay': '' }));
                  }
                }}
                onFocus={() => !sameAsPresent && handleFocus('permanent-barangay')}
                onBlur={(e) => {
                  if (!sameAsPresent) {
                    const trimmedValue = e.target.value.trim();
                    setPermanentBarangay(trimmedValue);
                    const error = validateTextField(trimmedValue, 'Permanent Address - Barangay');
                    setFieldErrors(prev => ({ ...prev, 'Permanent Address - Barangay': error }));
                  }
                }}
                placeholder="Type to search"
                required 
                disabled={sameAsPresent}
                style={{
                  borderColor: fieldErrors['Permanent Address - Barangay'] ? '#dc3545' : ''
                }}
              />
              {!sameAsPresent && focusedField === 'permanent-barangay' && permanentSuggestions.barangay.length > 0 && (
                <ul className="suggestions-list">
                  {permanentSuggestions.barangay.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => {
                        handleSelectPermanentBarangay(suggestion);
                        setFieldErrors(prev => ({ ...prev, 'Permanent Address - Barangay': '' }));
                      }}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!sameAsPresent && fieldErrors['Permanent Address - Barangay'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Permanent Address - Barangay']}
              </span>
            )}
          </div>
          <div className="form-group-p">
            <label>House No./Street/Purok <span className="required">*</span></label>
            <input 
              type="text" 
              value={permanentHouseStreetPurok} 
              onChange={(e) => {
                if (!sameAsPresent) {
                  handleTextInputChange(e.target.value, setPermanentHouseStreetPurok, 'Permanent Address - House/Street/Purok');
                }
              }}
              onBlur={(e) => {
                if (!sameAsPresent) {
                  handleTextInputBlur(e.target.value, setPermanentHouseStreetPurok, 'Permanent Address - House/Street/Purok');
                }
              }}
              required 
              disabled={sameAsPresent}
              style={{
                borderColor: fieldErrors['Permanent Address - House/Street/Purok'] ? '#dc3545' : ''
              }}
            />
            {!sameAsPresent && fieldErrors['Permanent Address - House/Street/Purok'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Permanent Address - House/Street/Purok']}
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Zip Code <span className="required">*</span></label>
            <input 
              type="number" 
              value={permanentZipcode} 
              onChange={(e) => {
                if (!sameAsPresent) {
                  setPermanentZipcode(e.target.value);
                  setFieldErrors(prev => ({ ...prev, 'Permanent Address - Zip Code': '' }));
                }
              }}
              required 
              disabled={sameAsPresent}
              style={{
                borderColor: fieldErrors['Permanent Address - Zip Code'] ? '#dc3545' : ''
              }}
            />
            {!sameAsPresent && fieldErrors['Permanent Address - Zip Code'] && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {fieldErrors['Permanent Address - Zip Code']}
              </span>
            )}
          </div>
        </div>

        {/* Profile Picture Upload */}
        <h4>Profile Picture <span className="required">*</span></h4>
        <h5>Upload Recent 2 x 2 Picture</h5>
        <div className="form-group">
          <div className="image-upload-container">
            <div className="box-decoration" onClick={handleClick} style={{ 
              cursor: "pointer",
              borderColor: imageError ? '#dc3545' : ''
            }}>
              {image ? (
                <img src={URL.createObjectURL(image)} alt="upload image" className="img-display-after" />
              ) : (
                <img src={photoPlaceholder} alt="upload image" className="img-display-before" />
              )}
              <label htmlFor="image-upload-input" className="image-upload-label">
                {image ? image.name : "Choose an Image"}
              </label>
              <input
                id="image-upload-input"
                type="file"
                onChange={handleImageChange}
                ref={hiddenFileInput}
                style={{ display: "none" }}
                accept="image/jpeg,image/jpg,image/png"
              />
            </div>
            {imageError && (
              <span style={{color: '#dc3545', fontSize: '12px', marginTop: '8px', display: 'block', textAlign: 'center'}}>
                {imageError}
              </span>
            )}
          </div>
        </div>
        <h5>Please upload a recent 2x2 ID photo with <span className="b">white background, Full Name (Last Name, First Name, MI)</span>.</h5>
        <h5>No side views, no selfies to avoid errors in validation process.</h5>

        <button type="submit" className="next-button-pi">Next →</button>
      </form>
    </div>
  );
};

export default PersonalInfoForm;