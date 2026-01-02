
import React, { useState, useEffect } from "react";
import './adminreport.css';
import { FaFilter, FaSortAmountUp, FaSortAmountDown, FaSortAlphaDown, FaTimes } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import cnaLogo from '../assets/cnalogo.png';

const AdminReport = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showReportTable, setShowReportTable] = useState(false);
  const [isGenerateReportModalOpen, setIsGenerateReportModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [facultyData, setFacultyData] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [originalFacultyData, setOriginalFacultyData] = useState([]);
  const [reportTitle, setReportTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [preparedBy, setPreparedBy] = useState("");
  const [sortOrder, setSortOrder] = useState('none');
  const [activeFilterTab, setActiveFilterTab] = useState('student');
  const [appliedFilters, setAppliedFilters] = useState({});
  const [appliedFacultyFilters, setAppliedFacultyFilters] = useState({});
  
  // Audit log URL
  const AUDIT_LOG_URL = 'http://ncamisshs.com/backend/audit_log.php';
  
  const [filterParams, setFilterParams] = useState({
    name: "",
    province: "",
    municipality: "",
    barangay: "",
    religion: "",
    gender: "",
    yearLevel: "",
    strand: "",
    section: "",
    academicStatus: "",
    tuitionFeeStatus: "",
    curriculum: "",
    ageFrom: "",
    ageTo: "",
    schoolYearFrom: "",
    schoolYearTo: "",
    paymentCollectionDate: "",
    paymentDay: "",
    paymentMonth: "",
    paymentYear: "",
    gradesFrom: "",
    gradesTo: "",
    preparedBy: ""
  });

  const [facultyFilterParams, setFacultyFilterParams] = useState({
    facultyName: "",
    subject: "",
    strand: "",
    section: "",
    yearLevel: ""
  });

  // Faculty filter options
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [facultySubjectOptions, setFacultySubjectOptions] = useState([]);
  const [facultyStrandOptions, setFacultyStrandOptions] = useState([]);
  const [facultySectionOptions, setFacultySectionOptions] = useState([]);
  const [facultyYearLevelOptions, setFacultyYearLevelOptions] = useState(["All", "11", "12"]);
  
  // All options (unfiltered)
  const [allFacultyOptions, setAllFacultyOptions] = useState([]);
  const [allFacultySubjectOptions, setAllFacultySubjectOptions] = useState([]);
  const [allFacultyStrandOptions, setAllFacultyStrandOptions] = useState([]);
  const [allFacultySectionOptions, setAllFacultySectionOptions] = useState([]);
  
  // Location-related states
  const [locationData, setLocationData] = useState([]);
  const [focusedField, setFocusedField] = useState(null);
  const [fieldPriority, setFieldPriority] = useState({
    province: false,
    municipality: false,
    barangay: false
  });
  const [suggestions, setSuggestions] = useState({
    barangay: [],
    municipality: [],
    province: []
  });

  // Options for dropdowns
  const genderOptions = ["All", "Male", "Female"];
  const academicStatusOptions = ["All", "PASSED", "FAILED", "DROPPED", "GRADUATED", "TRANSFERRED"];
  const tuitionFeeStatusOptions = ["All", "Voucher", "Fully Paid", "Partial"];
  const provinceOptions = ["All", "Camarines Norte", "Camarines Sur", "Albay", "Sorsogon", "Catanduanes", "Masbate"];
  const curriculumOptions = ["All", "Old", "New"];
  const municipalityOptions = ["All", "Daet", "Basud", "Capalonga", "Jose Panganiban", "Labo", "Mercedes", "Paracale", "San Lorenzo Ruiz", "San Vicente", "Santa Elena", "Talisay", "Vinzons"];
  const barangayOptions = ["All", "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5", "Barangay 6", "Barangay 7", "Barangay 8", "Calasgasan", "Gahonon", "Lag-on", "Mambalite", "Pamorangon"];
  const [strandOptions, setStrandOptions] = useState([]);
  const [allSectionOptions, setAllSectionOptions] = useState([]);
  const [filteredSectionOptions, setFilteredSectionOptions] = useState([]);
  const yearLevelOptions = ["All", "11", "12"];
  const [schoolYearOptions, setSchoolYearOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  
  // Fetch location data
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("http://ncamisshs.com/backend/get_locations.php");
        const data = await response.json();
        
        if (data.success) {
          setLocationData(data.locations);
        } else {
          console.error("Failed to fetch locations:", data.message);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);


  // Fetch faculty options
  useEffect(() => {
    const fetchFacultyOptions = async () => {
      try {
        const response = await fetch("http://ncamisshs.com/backend/search_faculty.php?type=getOptions");
        const data = await response.json();
        
        if (data.success) {
          // Store all options
          setAllFacultyOptions(data.facultyOptions ? ["All", ...data.facultyOptions] : ["All"]);
          setAllFacultySubjectOptions(data.subjectOptions ? ["All", ...data.subjectOptions] : ["All"]);
          setAllFacultyStrandOptions(data.strandOptions ? ["All", ...data.strandOptions] : ["All"]);
          setAllFacultySectionOptions(data.sectionOptions ? ["All", ...data.sectionOptions] : ["All"]);
          
          // Set initial filtered options
          setFacultyOptions(data.facultyOptions ? ["All", ...data.facultyOptions] : ["All"]);
          setFacultySubjectOptions(data.subjectOptions ? ["All", ...data.subjectOptions] : ["All"]);
          setFacultyStrandOptions(data.strandOptions ? ["All", ...data.strandOptions] : ["All"]);
          setFacultySectionOptions(data.sectionOptions ? ["All", ...data.sectionOptions] : ["All"]);
        }
      } catch (error) {
        console.error("Error fetching faculty options:", error);
        // Set defaults on error
        setAllFacultyOptions(["All"]);
        setFacultyOptions(["All"]);
        setAllFacultySubjectOptions(["All"]);
        setFacultySubjectOptions(["All"]);
        setAllFacultyStrandOptions(["All"]);
        setFacultyStrandOptions(["All"]);
        setAllFacultySectionOptions(["All"]);
        setFacultySectionOptions(["All"]);
      }
    };
    
    fetchFacultyOptions();
  }, []);

  // Update faculty dropdown options based on selections
  useEffect(() => {
    const updateFacultyDropdowns = async () => {
      if (activeFilterTab !== 'faculty') return;
      
      console.log('=== UPDATING FACULTY DROPDOWNS ===');
      console.log('Current Filters:', facultyFilterParams);
      
      try {
        // Get filtered strands (include year level in the filter)
        const strandParams = new URLSearchParams();
        strandParams.append('type', 'getFilteredOptions');
        strandParams.append('getStrands', 'true');
        
        // Include faculty name for strand filtering if faculty is selected
        if (facultyFilterParams.facultyName && facultyFilterParams.facultyName !== "All") {
          strandParams.append('facultyName', facultyFilterParams.facultyName);
        }
        if (facultyFilterParams.yearLevel && facultyFilterParams.yearLevel !== "All") {
          strandParams.append('yearLevel', facultyFilterParams.yearLevel);
        }
        if (facultyFilterParams.subject && facultyFilterParams.subject !== "All") {
          strandParams.append('subject', facultyFilterParams.subject);
        }
        
        const strandResponse = await fetch(`http://ncamisshs.com/backend/search_faculty.php?${strandParams.toString()}`);
        const strandData = await strandResponse.json();
        console.log('Strands fetched:', strandData.strands);
        if (strandData.success && strandData.strands) {
          if (strandData.strands.length > 0) {
            setFacultyStrandOptions(["All", ...strandData.strands]);
          } else {
            setFacultyStrandOptions([]);
          }
        }
        
        // Get year levels that faculty teaches
        const yearLevelParams = new URLSearchParams();
        yearLevelParams.append('type', 'getFilteredOptions');
        yearLevelParams.append('getYearLevels', 'true');
        
        // Include faculty name for year level filtering if faculty is selected
        if (facultyFilterParams.facultyName && facultyFilterParams.facultyName !== "All") {
          yearLevelParams.append('facultyName', facultyFilterParams.facultyName);
        }
        if (facultyFilterParams.strand && facultyFilterParams.strand !== "All") {
          yearLevelParams.append('strand', facultyFilterParams.strand);
        }
        if (facultyFilterParams.subject && facultyFilterParams.subject !== "All") {
          yearLevelParams.append('subject', facultyFilterParams.subject);
        }
        
        const yearLevelResponse = await fetch(`http://ncamisshs.com/backend/search_faculty.php?${yearLevelParams.toString()}`);
        const yearLevelData = await yearLevelResponse.json();
        console.log('Year levels fetched:', yearLevelData.yearLevels);
        if (yearLevelData.success && yearLevelData.yearLevels && yearLevelData.yearLevels.length > 0) {
          // Check if faculty is selected
          const hasFacultySelected = facultyFilterParams.facultyName && facultyFilterParams.facultyName !== "All";
          
          if (hasFacultySelected) {
            // If faculty is selected, show "All" option only if there are multiple year levels
            if (yearLevelData.yearLevels.length === 1) {
              setFacultyYearLevelOptions(yearLevelData.yearLevels);
            } else {
              setFacultyYearLevelOptions(["All", ...yearLevelData.yearLevels]);
            }
          } else {
            // If no faculty is selected, don't show "All" option
            setFacultyYearLevelOptions(yearLevelData.yearLevels);
          }
        } else {
          // No year levels found - set empty array
          setFacultyYearLevelOptions([]);
        }
        
        // Get filtered sections
        const sectionParams = new URLSearchParams();
        sectionParams.append('type', 'getFilteredOptions');
        sectionParams.append('getSections', 'true');
        
        // Include faculty name for section filtering if faculty is selected
        if (facultyFilterParams.facultyName && facultyFilterParams.facultyName !== "All") {
          sectionParams.append('facultyName', facultyFilterParams.facultyName);
        }
        if (facultyFilterParams.strand && facultyFilterParams.strand !== "All") {
          sectionParams.append('strand', facultyFilterParams.strand);
        }
        if (facultyFilterParams.yearLevel && facultyFilterParams.yearLevel !== "All") {
          sectionParams.append('yearLevel', facultyFilterParams.yearLevel);
        }
        if (facultyFilterParams.subject && facultyFilterParams.subject !== "All") {
          sectionParams.append('subject', facultyFilterParams.subject);
        }
        
        const sectionResponse = await fetch(`http://ncamisshs.com/backend/search_faculty.php?${sectionParams.toString()}`);
        const sectionData = await sectionResponse.json();
        if (sectionData.success && sectionData.sections) {
          if (sectionData.sections.length > 0) {
            setFacultySectionOptions(["All", ...sectionData.sections]);
          } else {
            // No sections found matching the criteria
            setFacultySectionOptions([]);
          }
        } else {
          // Error or no data
          setFacultySectionOptions([]);
        }
        
        // Get filtered subjects based on faculty + strand + year level
        const subjectParams = new URLSearchParams();
        subjectParams.append('type', 'getFilteredOptions');
        subjectParams.append('getSubjects', 'true');
        
        // Include faculty name for subject filtering if faculty is selected
        if (facultyFilterParams.facultyName && facultyFilterParams.facultyName !== "All") {
          subjectParams.append('facultyName', facultyFilterParams.facultyName);
          
          // If strand is selected, filter subjects by strand (ignore year level)
          if (facultyFilterParams.strand && facultyFilterParams.strand !== "All") {
            subjectParams.append('strand', facultyFilterParams.strand);
          }
          
          // If year level is selected, filter subjects by year level (ignore strand)
          if (facultyFilterParams.yearLevel && facultyFilterParams.yearLevel !== "All") {
            subjectParams.append('yearLevel', facultyFilterParams.yearLevel);
          }
        } else {
          // If no faculty is selected, filter by strand and year level only
          if (facultyFilterParams.strand && facultyFilterParams.strand !== "All") {
            subjectParams.append('strand', facultyFilterParams.strand);
          }
          if (facultyFilterParams.yearLevel && facultyFilterParams.yearLevel !== "All") {
            subjectParams.append('yearLevel', facultyFilterParams.yearLevel);
          }
        }
        
        console.log('Fetching subjects with params:', subjectParams.toString());
        const subjectResponse = await fetch(`http://ncamisshs.com/backend/search_faculty.php?${subjectParams.toString()}`);
        const subjectData = await subjectResponse.json();
        console.log('Subjects fetched:', subjectData.subjects);
        if (subjectData.success && subjectData.subjects) {
          if (subjectData.subjects.length > 0) {
            // If only one subject is available, don't show "All" option
            if (subjectData.subjects.length === 1) {
              setFacultySubjectOptions(subjectData.subjects);
            } else {
              setFacultySubjectOptions(["All", ...subjectData.subjects]);
            }
          } else {
            // No subjects found matching the criteria
            setFacultySubjectOptions([]);
          }
        } else {
          // Error or no data
          setFacultySubjectOptions([]);
        }
        
        // Get filtered faculty (if no faculty selected but other filters are)
        if (!facultyFilterParams.facultyName || facultyFilterParams.facultyName === "All") {
          const facultyParams = new URLSearchParams();
          facultyParams.append('type', 'getFilteredOptions');
          facultyParams.append('getFaculty', 'true');
          
          if (facultyFilterParams.strand && facultyFilterParams.strand !== "All") {
            facultyParams.append('strand', facultyFilterParams.strand);
          }
          if (facultyFilterParams.section && facultyFilterParams.section !== "All") {
            facultyParams.append('section', facultyFilterParams.section);
          }
          if (facultyFilterParams.yearLevel && facultyFilterParams.yearLevel !== "All") {
            facultyParams.append('yearLevel', facultyFilterParams.yearLevel);
          }
          if (facultyFilterParams.subject && facultyFilterParams.subject !== "All") {
            facultyParams.append('subject', facultyFilterParams.subject);
          }
          
          const facultyResponse = await fetch(`http://ncamisshs.com/backend/search_faculty.php?${facultyParams.toString()}`);
          const facultyData = await facultyResponse.json();
          if (facultyData.success && facultyData.faculty) {
            if (facultyData.faculty.length > 0) {
              setFacultyOptions(["All", ...facultyData.faculty]);
            } else {
              setFacultyOptions([]);
            }
          }
        }
      } catch (error) {
        console.error("Error updating faculty dropdowns:", error);
      }
    };
    
    updateFacultyDropdowns();
  }, [facultyFilterParams, activeFilterTab]);

  // Location filter functions
  const getProvinces = () => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(locationData.map(location => location.province))].sort();
  };

  const getMunicipalitiesForProvince = (province) => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(
      locationData
        .filter(location => location.province === province)
        .map(location => location.municipality)
    )].sort();
  };

  const getBarangaysForMunicipalityAndProvince = (municipality, province) => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(
      locationData
        .filter(location => location.municipality === municipality && location.province === province)
        .map(location => location.barangay)
    )].sort();
  };

  const getProvincesForMunicipality = (municipality) => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(
      locationData
        .filter(location => location.municipality === municipality)
        .map(location => location.province)
    )].sort();
  };

  const getMunicipalitiesForBarangay = (barangay) => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(
      locationData
        .filter(location => location.barangay === barangay)
        .map(location => location.municipality)
    )].sort();
  };

  const getProvincesForBarangay = (barangay) => {
    if (!locationData || !locationData.length) return [];
    return [...new Set(
      locationData
        .filter(location => location.barangay === barangay)
        .map(location => location.province)
    )].sort();
  };

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

  // Handle province change
  const handleProvinceChange = (e) => {
    const value = e.target.value;
    const newFilterParams = {
      ...filterParams,
      province: value
    };
    setFilterParams(newFilterParams);
    
    // Auto-update report title based on current filters
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
    
    if (value && !fieldPriority.province) {
      setFieldPriority(prev => ({ ...prev, province: true }));
    }
    
    if (focusedField === 'province') {
      setSuggestions({
        ...suggestions,
        province: filterProvinces(value, filterParams.municipality)
      });
    }
    
    if (!value || !fieldPriority.municipality) {
      setFilterParams(prev => ({
        ...prev,
        municipality: '',
        barangay: ''
      }));
      setFieldPriority(prev => ({ 
        ...prev, 
        municipality: false, 
        barangay: false 
      }));
    }
  };

  // Handle municipality change
  const handleMunicipalityChange = (e) => {
    const value = e.target.value;
    const newFilterParams = {
      ...filterParams,
      municipality: value
    };
    setFilterParams(newFilterParams);
    
    // Auto-update report title based on current filters
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
    
    if (value && !fieldPriority.municipality) {
      setFieldPriority(prev => ({ ...prev, municipality: true }));
    }
    
    if (focusedField === 'municipality') {
      setSuggestions({
        ...suggestions,
        municipality: filterMunicipalities(value, filterParams.province)
      });
    }
    
    // Auto-fill province when municipality is typed
    if (value && value.trim() && !fieldPriority.province) {
      const exactMatches = locationData.filter(loc => 
        loc.municipality.toLowerCase() === value.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        const uniqueProvinces = [...new Set(exactMatches.map(loc => loc.province))];
        if (uniqueProvinces.length === 1) {
          setFilterParams(prev => ({
            ...prev,
            province: uniqueProvinces[0]
          }));
          setFieldPriority(prev => ({ ...prev, province: true }));
        }
      }
    }
    
    if (!value || !fieldPriority.barangay) {
      setFilterParams(prev => ({
        ...prev,
        barangay: ''
      }));
      setFieldPriority(prev => ({ ...prev, barangay: false }));
    }
  };

  // Helper function for barangay auto-fill
  const triggerBarangayAutoFill = (exactMatches) => {
    if (!fieldPriority.municipality && !filterParams.municipality) {
      const uniqueMunicipalities = [...new Set(exactMatches.map(loc => loc.municipality))];
      
      if (uniqueMunicipalities.length === 1) {
        setFilterParams(prev => ({
          ...prev,
          municipality: uniqueMunicipalities[0]
        }));
        setFieldPriority(prev => ({ ...prev, municipality: true }));
        
        if (!fieldPriority.province) {
          const uniqueProvinces = [...new Set(exactMatches.map(loc => loc.province))];
          
          if (uniqueProvinces.length === 1) {
            setFilterParams(prev => ({
              ...prev,
              province: uniqueProvinces[0]
            }));
            setFieldPriority(prev => ({ ...prev, province: true }));
          }
        }
      } else if (uniqueMunicipalities.length > 1) {
        setFilterParams(prev => ({
          ...prev,
          municipality: ''
        }));
        setSuggestions(prev => ({
          ...prev,
          municipality: uniqueMunicipalities
        }));
        setTimeout(() => {
          setFocusedField('municipality');
        }, 100);
      }
    }
    
    if (!fieldPriority.province && filterParams.municipality && !filterParams.province) {
      const matchingProvinces = exactMatches
        .filter(loc => loc.municipality === filterParams.municipality)
        .map(loc => loc.province);
      const uniqueProvinces = [...new Set(matchingProvinces)];
      
      if (uniqueProvinces.length === 1) {
        setFilterParams(prev => ({
          ...prev,
          province: uniqueProvinces[0]
        }));
        setFieldPriority(prev => ({ ...prev, province: true }));
      }
    }
  };

  // Handle barangay change
  const handleBarangayChange = (e) => {
    const value = e.target.value;
    const newFilterParams = {
      ...filterParams,
      barangay: value
    };
    setFilterParams(newFilterParams);
    
    // Auto-update report title based on current filters
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
    
    if (value && !fieldPriority.barangay) {
      setFieldPriority(prev => ({ ...prev, barangay: true }));
    }
    
    if (focusedField === 'barangay') {
      setSuggestions({
        ...suggestions,
        barangay: filterBarangays(value, filterParams.municipality, filterParams.province)
      });
    }
    
    // Auto-fill municipality and province when barangay is typed
    if (value && value.trim()) {
      const exactMatches = locationData.filter(loc => 
        loc.barangay.toLowerCase() === value.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        triggerBarangayAutoFill(exactMatches);
      }
    }
  };

  // Handle selection from dropdowns
  const handleSelectProvince = (province) => {
    const newFilterParams = {
      ...filterParams,
      province: province
    };
    setFilterParams(newFilterParams);
    
    // Auto-update report title based on current filters
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
    
    setFieldPriority(prev => ({ ...prev, province: true }));
    
    if (!fieldPriority.municipality) {
      setFilterParams(prev => ({
        ...prev,
        municipality: ''
      }));
      setFieldPriority(prev => ({ ...prev, municipality: false }));
    }
    if (!fieldPriority.barangay) {
      setFilterParams(prev => ({
        ...prev,
        barangay: ''
      }));
      setFieldPriority(prev => ({ ...prev, barangay: false }));
    }
    
    setFocusedField(null);
  };

  const handleSelectMunicipality = (municipality) => {
    const newFilterParams = {
      ...filterParams,
      municipality: municipality
    };
    setFilterParams(newFilterParams);
    
    // Auto-update report title based on current filters
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
    
    setFieldPriority(prev => ({ ...prev, municipality: true }));
    
    // Auto-fill province when municipality is selected
    if (municipality && municipality.trim() && !fieldPriority.province) {
      const exactMatches = locationData.filter(loc => 
        loc.municipality.toLowerCase() === municipality.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        const uniqueProvinces = [...new Set(exactMatches.map(loc => loc.province))];
        if (uniqueProvinces.length === 1) {
          setFilterParams(prev => ({
            ...prev,
            province: uniqueProvinces[0]
          }));
          setFieldPriority(prev => ({ ...prev, province: true }));
        }
      }
    }
    
    if (!fieldPriority.barangay) {
      setFilterParams(prev => ({
        ...prev,
        barangay: ''
      }));
      setFieldPriority(prev => ({ ...prev, barangay: false }));
    }
    
    setFocusedField(null);
  };

  const handleSelectBarangay = (barangay) => {
    const newFilterParams = {
      ...filterParams,
      barangay: barangay
    };
    setFilterParams(newFilterParams);
    
    // Auto-update report title based on current filters
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
    
    setFieldPriority(prev => ({ ...prev, barangay: true }));
    
    // Auto-fill municipality and province when barangay is selected
    if (barangay && barangay.trim()) {
      const exactMatches = locationData.filter(loc => 
        loc.barangay.toLowerCase() === barangay.toLowerCase().trim()
      );
      
      if (exactMatches.length > 0) {
        triggerBarangayAutoFill(exactMatches);
      }
    }
  };

  // Focus handlers
  const handleFocus = (field) => {
    setFocusedField(field);
    
    if (field === 'barangay') {
      setSuggestions({
        ...suggestions,
        barangay: filterBarangays(filterParams.barangay, filterParams.municipality, filterParams.province)
      });
    } else if (field === 'municipality') {
      setSuggestions({
        ...suggestions,
        municipality: filterMunicipalities(filterParams.municipality, filterParams.province)
      });
    } else if (field === 'province') {
      setSuggestions({
        ...suggestions,
        province: filterProvinces(filterParams.province, filterParams.municipality)
      });
    }
  };

  // Handle click outside
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

  // Filter sections based on selected strand
  useEffect(() => {
    if (filterParams.strand && filterParams.strand !== "All" && filterParams.strand !== "") {
      // Fetch sections for the selected strand
      const fetchSectionsForStrand = async () => {
        try {
          const response = await fetch(`http://ncamisshs.com/backend/search_students.php?getSections=true&strand=${filterParams.strand}`);
          const data = await response.json();
          
          if (data.success && data.sections && data.sections.length > 0) {
            setFilteredSectionOptions(["All", ...data.sections]);
          } else {
            setFilteredSectionOptions(["All"]);
          }
        } catch (error) {
          console.error("Error fetching sections for strand:", error);
          setFilteredSectionOptions(["All"]);
        }
      };
      
      fetchSectionsForStrand();
    } else {
      // Show all sections if no strand is selected or "All" is selected
      setFilteredSectionOptions(allSectionOptions);
    }
  }, [filterParams.strand, allSectionOptions]);
  
  // Fetch strand, section, and school year options from the database
  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        console.log("Fetching options from server...");
        
        const defaultStrands = ["All", "STEM", "ABM", "HUMSS", "GAS", "ICT", "HE"];
        const defaultSections = ["All"];
        const defaultSchoolYears = ["All", "2023-2024", "2024-2025"];
        const defaultFaculty = ["All", "John Doe", "Jane Smith", "Robert Johnson"];
        const defaultSubjects = ["All", "Mathematics", "Science", "English", "Filipino", "History"];
        
        try {
          const response = await fetch("http://ncamisshs.com/backend/search_students.php");
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Response:", data);
          
          if (data.success) {
            if (data.strandOptions && data.strandOptions.length > 0) {
              setStrandOptions(["All", ...data.strandOptions]);
            } else {
              setStrandOptions(defaultStrands);
            }
            
            if (data.sectionOptions && data.sectionOptions.length > 0) {
              setAllSectionOptions(["All", ...data.sectionOptions]);
              setFilteredSectionOptions(["All", ...data.sectionOptions]);
            } else {
              setAllSectionOptions(defaultSections);
              setFilteredSectionOptions(defaultSections);
            }
            
            if (data.schoolYearOptions && data.schoolYearOptions.length > 0) {
              setSchoolYearOptions(["All", ...data.schoolYearOptions]);
            } else {
              setSchoolYearOptions(defaultSchoolYears);
            }
          } else {
            setStrandOptions(defaultStrands);
            setAllSectionOptions(defaultSections);
            setFilteredSectionOptions(defaultSections);
            setSchoolYearOptions(defaultSchoolYears);
          }
          
          setSubjectOptions(defaultSubjects);
          
        } catch (fetchError) {
          console.error("Error fetching options:", fetchError);
          setStrandOptions(defaultStrands);
          setAllSectionOptions(defaultSections);
          setFilteredSectionOptions(defaultSections);
          setSchoolYearOptions(defaultSchoolYears);
          setSubjectOptions(defaultSubjects);
        }
      } catch (error) {
        console.error("General error:", error);
        setStrandOptions(["All", "STEM", "ABM", "HUMSS", "GAS", "ICT", "HE"]);
        setAllSectionOptions(["All"]);
        setFilteredSectionOptions(["All"]);
        setSchoolYearOptions(["All", "2023-2024", "2024-2025"]);
        setSubjectOptions(["All", "Mathematics", "Science", "English", "Filipino", "History"]);
      } finally {
        setOptionsLoading(false);
      }
    };
    
    fetchOptions();
  }, []);
  
  const handleFilterClick = () => {
    setShowFilterOptions(!showFilterOptions);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    const newFilterParams = {
      ...filterParams,
      [name]: value
    };
    setFilterParams(newFilterParams);
    
    // Auto-update report title based on current filters
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
  };

  const handlePaymentDateChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    
    const newFilterParams = {
      ...filterParams,
      [name]: digitsOnly
    };
    
    // Combine into paymentCollectionDate for backend
    const day = newFilterParams.paymentDay || '';
    const month = newFilterParams.paymentMonth || '';
    const year = newFilterParams.paymentYear || '';
    
    // Build date string - format for backend parsing
    // Format examples: "1/" (day only), "/12/" (month only), "//2025" (year only), "1/12/2025" (full)
    let dateString = '';
    if (day || month || year) {
      if (day && !month && !year) {
        // Day only: "1/" or "01/" - ensure it ends with slash for backend parsing
        dateString = day + '/';
      } else if (!day && month && !year) {
        // Month only: "/12/" - ensure slashes before and after
        dateString = '/' + month + '/';
      } else if (!day && !month && year) {
        // Year only: "//2025" - ensure slashes before
        dateString = '//' + year;
      } else if (day && month && !year) {
        // Day and month: "1/12/" - ensure trailing slash
        dateString = day + '/' + month + '/';
      } else if (day && !month && year) {
        // Day and year: "1//2025" - ensure double slash
        dateString = day + '//' + year;
      } else if (!day && month && year) {
        // Month and year: "/12/2025" - ensure leading slash
        dateString = '/' + month + '/' + year;
      } else if (day && month && year) {
        // Full date: "1/12/2025"
        dateString = day + '/' + month + '/' + year;
      }
    }
    
    // Debug log
    console.log('Payment Date Input:', { day, month, year, dateString });
    
    newFilterParams.paymentCollectionDate = dateString;
    setFilterParams(newFilterParams);
    
    // Auto-update report title based on current filters
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
  };

  const handleFacultyInputChange = (e) => {
    const { name, value } = e.target;
    const newFacultyFilterParams = {
      ...facultyFilterParams,
      [name]: value
    };
    setFacultyFilterParams(newFacultyFilterParams);
    
    // Auto-update report title based on current filters
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
  };

  // Sorting functions
  const handleSort = (type) => {
    let dataToSort, originalData, setData;
    
    if (activeFilterTab === 'student') {
      if (students.length === 0) return;
      dataToSort = [...originalStudents];
      setData = setStudents;
    } else {
      // Check if we're showing faculty data or student data (when faculty is selected)
      if (students.length > 0) {
        // We're showing students of a faculty
        if (students.length === 0) return;
        dataToSort = [...originalStudents];
        setData = setStudents;
      } else {
        // We're showing faculty list
        if (facultyData.length === 0) return;
        dataToSort = [...originalFacultyData];
        setData = setFacultyData;
      }
    }

    let sortedData = [...dataToSort];
    
    switch(type) {
      case 'asc':
        if (activeFilterTab === 'student') {
          sortedData.sort((a, b) => (a.student_id || 0) - (b.student_id || 0));
        } else if (students.length > 0) {
          // Sorting students of faculty
          sortedData.sort((a, b) => (a.student_id || 0) - (b.student_id || 0));
        } else {
          // Sorting faculty list - use faculty_name for consistent sorting
          sortedData.sort((a, b) => {
            const nameA = (a.faculty_name || a.teacher || '').toLowerCase();
            const nameB = (b.faculty_name || b.teacher || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        }
        setSortOrder('asc');
        break;
      case 'desc':
        if (activeFilterTab === 'student') {
          sortedData.sort((a, b) => (b.student_id || 0) - (a.student_id || 0));
        } else if (students.length > 0) {
          // Sorting students of faculty
          sortedData.sort((a, b) => (b.student_id || 0) - (a.student_id || 0));
        } else {
          // Sorting faculty list - use faculty_name for consistent sorting
          sortedData.sort((a, b) => {
            const nameA = (a.faculty_name || a.teacher || '').toLowerCase();
            const nameB = (b.faculty_name || b.teacher || '').toLowerCase();
            return nameB.localeCompare(nameA);
          });
        }
        setSortOrder('desc');
        break;
      case 'alpha':
        if (activeFilterTab === 'student') {
          sortedData.sort((a, b) => {
            const nameA = `${a.last_name || ''}, ${a.first_name || ''}`.toLowerCase();
            const nameB = `${b.last_name || ''}, ${b.first_name || ''}`.toLowerCase();
            return nameA.localeCompare(nameB);
          });
        } else if (students.length > 0) {
          // Sorting students of faculty alphabetically
          sortedData.sort((a, b) => {
            const nameA = (a.student_name || `${a.last_name || ''}, ${a.first_name || ''}`).toLowerCase();
            const nameB = (b.student_name || `${b.last_name || ''}, ${b.first_name || ''}`).toLowerCase();
            return nameA.localeCompare(nameB);
          });
        } else {
          // Sorting faculty list alphabetically
          sortedData.sort((a, b) => {
            const nameA = (a.faculty_name || a.teacher || '').toLowerCase();
            const nameB = (b.faculty_name || b.teacher || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        }
        setSortOrder('alpha');
        break;
      case 'none':
      default:
        sortedData = [...dataToSort];
        setSortOrder('none');
    }
    
    setData(sortedData);
  };

  // Generate a descriptive report title based on current filter parameters
  // Helper function to format payment collection date for title
  const formatPaymentCollectionTitle = (day, month, year) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    let titleParts = [];
    
    if (day && month && year) {
      // Full date: "Day 1 of November 2025"
      const dayNum = parseInt(day);
      const monthName = monthNames[parseInt(month) - 1];
      titleParts.push(`Day ${dayNum} of ${monthName} ${year}`);
    } else if (day && month && !year) {
      // Day and Month: "Day 1 of November"
      const dayNum = parseInt(day);
      const monthName = monthNames[parseInt(month) - 1];
      titleParts.push(`Day ${dayNum} of ${monthName}`);
    } else if (month && year) {
      // Month and Year: "November 2025"
      const monthName = monthNames[parseInt(month) - 1];
      titleParts.push(`${monthName} ${year}`);
    } else if (year) {
      // Year only: "2025"
      titleParts.push(year);
    } else if (month) {
      // Month only: "November"
      const monthName = monthNames[parseInt(month) - 1];
      titleParts.push(monthName);
    } else if (day) {
      // Day only: "Day 1"
      const dayNum = parseInt(day);
      titleParts.push(`Day ${dayNum}`);
    }
    
    if (titleParts.length > 0) {
      return `Payment Collection report for ${titleParts.join(" ")}`;
    }
    
    return null;
  };

  const generateAutoReportTitle = (useCurrentFilters = false) => {
    if (activeFilterTab === 'faculty') {
      // Use current filter params if requested, otherwise use applied filters
      const currentFilters = useCurrentFilters ? facultyFilterParams : appliedFacultyFilters;
      
      // Check if showing students of faculty (faculty + optional filters)
      const hasFacultyName = currentFilters.facultyName && currentFilters.facultyName !== "" && currentFilters.facultyName !== "All";
      const hasStrand = currentFilters.strand && currentFilters.strand !== "" && currentFilters.strand !== "All";
      const hasYearLevel = currentFilters.yearLevel && currentFilters.yearLevel !== "" && currentFilters.yearLevel !== "All";
      const hasSubject = currentFilters.subject && currentFilters.subject !== "" && currentFilters.subject !== "All";
      const hasSection = currentFilters.section && currentFilters.section !== "" && currentFilters.section !== "All";
      
      // Count active filters
      const activeFilters = [hasFacultyName, hasStrand, hasYearLevel, hasSubject, hasSection].filter(Boolean).length;
      
      if (hasFacultyName) {
        // Faculty is selected - show students of faculty
        const titleParts = [];
        
        if (hasSubject) {
          titleParts.push(`${currentFilters.subject} Students`);
        } else if (hasStrand && hasYearLevel) {
          const displayYearLevel = currentFilters.yearLevel === "11" ? "Grade 11" : currentFilters.yearLevel === "12" ? "Grade 12" : `Grade ${currentFilters.yearLevel}`;
          titleParts.push(`${currentFilters.strand} ${displayYearLevel} Students`);
        } else if (hasYearLevel) {
          const displayYearLevel = currentFilters.yearLevel === "11" ? "Grade 11" : currentFilters.yearLevel === "12" ? "Grade 12" : `Grade ${currentFilters.yearLevel}`;
          titleParts.push(`All ${displayYearLevel} Students`);
        } else if (hasStrand) {
          titleParts.push(`All ${currentFilters.strand} Students`);
        } else {
          titleParts.push("All Students");
        }
        
        if (hasSection) {
          titleParts.push(`Section ${currentFilters.section}`);
        }
        
        titleParts.push(`of ${currentFilters.facultyName}`);
        
        return titleParts.join(" ");
      } else {
        // No faculty selected - show faculty list
        let title = "Faculty Report";
        const titleParts = [];
        
        if (hasSubject) {
          titleParts.push(`Teaching ${currentFilters.subject}`);
        }
        if (hasStrand) {
          titleParts.push(`in ${currentFilters.strand}`);
        }
        if (hasYearLevel) {
          const displayYearLevel = currentFilters.yearLevel === "11" ? "Grade 11" : currentFilters.yearLevel === "12" ? "Grade 12" : `Grade ${currentFilters.yearLevel}`;
          titleParts.push(`for ${displayYearLevel}`);
        }
        if (hasSection) {
          titleParts.push(`Section ${currentFilters.section}`);
        }
        
        if (titleParts.length > 0) {
          title += ": " + titleParts.join(" ");
        }
        
        return title;
      }
    }
    
    // Enhanced Student filter title generation
    // Use current filter params if requested, otherwise use applied filters
    const currentStudentFilters = useCurrentFilters ? filterParams : appliedFilters;
    
    const filterInfo = {
      gender: currentStudentFilters.gender && currentStudentFilters.gender !== "All" ? currentStudentFilters.gender : "",
      ageRange: currentStudentFilters.ageFrom && currentStudentFilters.ageTo ? `${currentStudentFilters.ageFrom}-${currentStudentFilters.ageTo} years old` : "",
      yearLevel: currentStudentFilters.yearLevel && currentStudentFilters.yearLevel !== "All" ? currentStudentFilters.yearLevel : "",
      strand: currentStudentFilters.strand && currentStudentFilters.strand !== "All" ? currentStudentFilters.strand : "",
      section: currentStudentFilters.section && currentStudentFilters.section !== "All" ? currentStudentFilters.section : "",
      schoolYear: currentStudentFilters.schoolYearFrom && currentStudentFilters.schoolYearTo ? `${currentStudentFilters.schoolYearFrom} to ${currentStudentFilters.schoolYearTo}` : "",
      grades: currentStudentFilters.gradesFrom && currentStudentFilters.gradesTo ? `${currentStudentFilters.gradesFrom}-${currentStudentFilters.gradesTo}` : "",
      name: currentStudentFilters.name || "",
      municipality: currentStudentFilters.municipality && currentStudentFilters.municipality !== "All" ? currentStudentFilters.municipality : "",
      province: currentStudentFilters.province && currentStudentFilters.province !== "All" ? currentStudentFilters.province : "",
      barangay: currentStudentFilters.barangay && currentStudentFilters.barangay !== "All" ? currentStudentFilters.barangay : "",
      religion: currentStudentFilters.religion && currentStudentFilters.religion !== "All" ? currentStudentFilters.religion : "",
      academicStatus: currentStudentFilters.academicStatus && currentStudentFilters.academicStatus !== "All" ? currentStudentFilters.academicStatus : "",
      tuitionFeeStatus: currentStudentFilters.tuitionFeeStatus && currentStudentFilters.tuitionFeeStatus !== "All" ? currentStudentFilters.tuitionFeeStatus : "",
      curriculum: currentStudentFilters.curriculum && currentStudentFilters.curriculum !== "All" ? currentStudentFilters.curriculum : ""
    };
    
    // Handle "All" selections
    if (currentStudentFilters.gender === "All") filterInfo.gender = "All";
    if (currentStudentFilters.yearLevel === "All") filterInfo.yearLevel = "All";
    if (currentStudentFilters.strand === "All") filterInfo.strand = "All";
    if (currentStudentFilters.section === "All") filterInfo.section = "All";
    if (currentStudentFilters.academicStatus === "All") filterInfo.academicStatus = "All";
    if (currentStudentFilters.tuitionFeeStatus === "All") filterInfo.tuitionFeeStatus = "All";
    if (currentStudentFilters.curriculum === "All") filterInfo.curriculum = "All";
    
    // Count active filters
    const activeFilters = Object.values(filterInfo).filter(value => value !== "").length;
    
    // Special case: Individual student search
    if (filterInfo.name) {
      return `Student Information: ${filterInfo.name}`;
    }
    
    // Build descriptive title based on filters
    const titleParts = [];
    
    // Academic information (most important)
    const academicInfo = [];
    if (filterInfo.yearLevel) {
      academicInfo.push(filterInfo.yearLevel === "All" ? "All Grade Levels" : `Grade ${filterInfo.yearLevel}`);
    }
    if (filterInfo.strand) {
      academicInfo.push(filterInfo.strand === "All" ? "All Strands" : filterInfo.strand);
    }
    if (filterInfo.section) {
      academicInfo.push(filterInfo.section === "All" ? "All Sections" : `Section ${filterInfo.section}`);
    }
    
    if (academicInfo.length > 0) {
      titleParts.push(academicInfo.join(" "));
    }
    
    // Demographics
    if (filterInfo.gender) {
      titleParts.push(filterInfo.gender === "All" ? "All Genders" : `${filterInfo.gender} Students`);
    }
    
    if (filterInfo.ageRange) {
      titleParts.push(`Aged ${filterInfo.ageRange}`);
    }
    
    // Location information
    const locationInfo = [];
    if (filterInfo.barangay) {
      locationInfo.push(`Brgy. ${filterInfo.barangay}`);
    }
    if (filterInfo.municipality) {
      locationInfo.push(filterInfo.municipality);
    }
    if (filterInfo.province) {
      locationInfo.push(filterInfo.province);
    }
    
    if (locationInfo.length > 0) {
      titleParts.push(`from ${locationInfo.join(", ")}`);
    }
    
    // Additional filters
    if (filterInfo.religion) {
      titleParts.push(`with ${filterInfo.religion} Religion`);
    }
    
    if (filterInfo.academicStatus) {
      titleParts.push(`${filterInfo.academicStatus} Status`);
    }
    
    if (filterInfo.tuitionFeeStatus) {
      titleParts.push(`${filterInfo.tuitionFeeStatus} Payment`);
    }
    
    if (filterInfo.curriculum) {
      titleParts.push(`${filterInfo.curriculum} Curriculum`);
    }
    
    if (filterInfo.grades) {
      titleParts.push(`with Grades ${filterInfo.grades}`);
    }
    
    if (filterInfo.schoolYear) {
      titleParts.push(`S.Y. ${filterInfo.schoolYear}`);
    }
    
    // Generate final title
    let title = "Student Report";
    if (titleParts.length > 0) {
      title += ": " + titleParts.join(" ");
    }
    
    return title;
  };
  
  const handleOpenModal = (filterType) => {
    setActiveFilterTab(filterType);
    setIsModalOpen(true);
    
    // Generate title based on current filters when modal opens
    const autoTitle = generateAutoReportTitle(true);
    setReportTitle(autoTitle);
  };
  
  const handleAddFilter = async () => {
    setLoading(true);
    setIsModalOpen(false);
    setShowFilterOptions(false);
    
    try {
      if (activeFilterTab === 'faculty') {
        // Save the current filter params as applied filters FIRST
        setAppliedFacultyFilters({...facultyFilterParams});
        
        const params = new URLSearchParams();
        
        Object.keys(facultyFilterParams).forEach(key => {
          if (facultyFilterParams[key] && key !== 'preparedBy' && facultyFilterParams[key] !== 'All') {
            params.append(key, facultyFilterParams[key]);
          }
        });
        
        setPreparedBy(filterParams.preparedBy);
        
        // Generate title immediately with current filter params (since state hasn't updated yet)
        // We'll use the facultyFilterParams directly instead of waiting for appliedFacultyFilters to update
        const tempAppliedFacultyFilters = {...facultyFilterParams};
        
        // Generate auto title based on the filters we just applied
        let autoTitle;
        const hasFacultyName = tempAppliedFacultyFilters.facultyName && tempAppliedFacultyFilters.facultyName !== "" && tempAppliedFacultyFilters.facultyName !== "All";
        const hasStrand = tempAppliedFacultyFilters.strand && tempAppliedFacultyFilters.strand !== "" && tempAppliedFacultyFilters.strand !== "All";
        const hasYearLevel = tempAppliedFacultyFilters.yearLevel && tempAppliedFacultyFilters.yearLevel !== "" && tempAppliedFacultyFilters.yearLevel !== "All";
        const hasSubject = tempAppliedFacultyFilters.subject && tempAppliedFacultyFilters.subject !== "" && tempAppliedFacultyFilters.subject !== "All";
        const hasSection = tempAppliedFacultyFilters.section && tempAppliedFacultyFilters.section !== "" && tempAppliedFacultyFilters.section !== "All";
        
        if (hasFacultyName) {
          // Faculty is selected - show students of faculty
          const titleParts = [];
          
          if (hasSubject) {
            titleParts.push(`${tempAppliedFacultyFilters.subject} Students`);
          } else if (hasStrand && hasYearLevel) {
            const displayYearLevel = tempAppliedFacultyFilters.yearLevel === "11" ? "Grade 11" : tempAppliedFacultyFilters.yearLevel === "12" ? "Grade 12" : `Grade ${tempAppliedFacultyFilters.yearLevel}`;
            titleParts.push(`${tempAppliedFacultyFilters.strand} ${displayYearLevel} Students`);
          } else if (hasYearLevel) {
            const displayYearLevel = tempAppliedFacultyFilters.yearLevel === "11" ? "Grade 11" : tempAppliedFacultyFilters.yearLevel === "12" ? "Grade 12" : `Grade ${tempAppliedFacultyFilters.yearLevel}`;
            titleParts.push(`All ${displayYearLevel} Students`);
          } else if (hasStrand) {
            titleParts.push(`All ${tempAppliedFacultyFilters.strand} Students`);
          } else {
            titleParts.push("All Students");
          }
          
          if (hasSection) {
            titleParts.push(`Section ${tempAppliedFacultyFilters.section}`);
          }
          
          titleParts.push(`of ${tempAppliedFacultyFilters.facultyName}`);
          
          autoTitle = titleParts.join(" ");
        } else {
          // No faculty selected - show faculty list
          autoTitle = "Faculty Report";
          const titleParts = [];
          
          if (hasSubject) {
            titleParts.push(`Teaching ${tempAppliedFacultyFilters.subject}`);
          }
          if (hasStrand) {
            titleParts.push(`in ${tempAppliedFacultyFilters.strand}`);
          }
          if (hasYearLevel) {
            const displayYearLevel = tempAppliedFacultyFilters.yearLevel === "11" ? "Grade 11" : tempAppliedFacultyFilters.yearLevel === "12" ? "Grade 12" : `Grade ${tempAppliedFacultyFilters.yearLevel}`;
            titleParts.push(`for ${displayYearLevel}`);
          }
          if (hasSection) {
            titleParts.push(`Section ${tempAppliedFacultyFilters.section}`);
          }
          
          if (titleParts.length > 0) {
            autoTitle += ": " + titleParts.join(" ");
          }
        }
        
        setReportTitle(autoTitle);
        
        // Console log for debugging what we're sending
        console.log('=== SENDING FACULTY FILTER REQUEST ===');
        console.log('Filter Params:', facultyFilterParams);
        console.log('URL Params:', params.toString());
        console.log('Full URL:', `http://ncamisshs.com/backend/search_faculty.php?type=searchFaculty&${params.toString()}`);
        console.log('======================================');
        
        const response = await fetch(`http://ncamisshs.com/backend/search_faculty.php?type=searchFaculty&${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Console log for ALL faculty filter results
        console.log('=== FACULTY FILTER RESULTS ===');
        console.log('Response Type:', data.type);
        console.log('Faculty Name:', data.facultyName || 'Not set');
        console.log('Strand:', data.strand || 'All');
        console.log('Year Level:', data.yearLevel || 'All');
        console.log('Has Other Filters:', data.hasOtherFilters);
        console.log('Has Only Faculty:', data.hasOnlyFaculty);
        console.log('Has Faculty Strand YearLevel:', data.hasFacultyStrandYearLevel);
        console.log('Has Faculty YearLevel:', data.hasFacultyYearLevel);
        console.log('Total Records Found:', data.data?.length || 0);
        if (data.data && data.data.length > 0) {
          console.log('First 5 students:');
          data.data.slice(0, 5).forEach((s, i) => {
            console.log(`  ${i+1}. ${s.student_name || s.first_name + ' ' + s.last_name} - ${s.grade_level} ${s.strand} - Section: ${s.section}`);
          });
        }
        console.log('Full Data:', data.data);
        console.log('==============================');
        
        if (data.success) {
          // Check if we're showing students of a faculty
          if (data.type === 'students' && data.facultyName) {
            // Set the data as students instead of faculty
            setOriginalStudents(data.data || []);
            setStudents(data.data || []);
            setShowReportTable(true);
            setSortOrder('none');
            
            // Generate title for students of faculty
            let dataAutoTitle;
            if (data.hasFacultyStrandYearLevel) {
              // Show students of faculty with specific strand and year level
              const displayYearLevel = data.yearLevel === "11" ? "Grade 11" : data.yearLevel === "12" ? "Grade 12" : `Grade ${data.yearLevel}`;
              dataAutoTitle = `${data.strand} ${displayYearLevel} Students of ${data.facultyName}`;
            } else if (data.hasFacultyYearLevel) {
              // Show all students of faculty in specific year level (all strands)
              const displayYearLevel = data.yearLevel === "11" ? "Grade 11" : data.yearLevel === "12" ? "Grade 12" : `Grade ${data.yearLevel}`;
              dataAutoTitle = `All ${displayYearLevel} Students of ${data.facultyName}`;
            } else if (data.hasOnlyFaculty) {
              // Show all students of faculty (both Grade 11 and 12)
              dataAutoTitle = `All Students of ${data.facultyName}`;
            } else if (data.strand && data.strand !== "All") {
              // Show students of faculty with specific strand (both grade levels)
              dataAutoTitle = `All ${data.strand} Students of ${data.facultyName}`;
            } else {
              dataAutoTitle = `All Students of ${data.facultyName}`;
            }
            setReportTitle(dataAutoTitle);
          } else {
            // Regular faculty data
            const fetchedFaculty = data.faculty || data.data || [];
            setOriginalFacultyData(fetchedFaculty);
            setFacultyData(fetchedFaculty);
            setShowReportTable(true);
            setSortOrder('none');
          }
        } else {
          alert("Error fetching faculty data: " + (data.message || "Unknown error"));
        }
      } else {
        // Student filter - Save applied filters FIRST
        // Include payment date fields in applied filters
        const filtersToApply = {...filterParams};
        setAppliedFilters(filtersToApply);
        
        const params = new URLSearchParams();
        
        Object.keys(filterParams).forEach(key => {
          // Skip paymentDay, paymentMonth, paymentYear - use paymentCollectionDate instead
          if (filterParams[key] && key !== 'preparedBy' && key !== 'All' && 
              key !== 'paymentDay' && key !== 'paymentMonth' && key !== 'paymentYear') {
            params.append(key, filterParams[key]);
          }
        });
        
        setPreparedBy(filterParams.preparedBy);
        
        // Generate title immediately with current filter params
        const tempAppliedFilters = {...filterParams};
        
        // Check for payment collection date first (highest priority)
        const hasPaymentCollection = (tempAppliedFilters.paymentDay && tempAppliedFilters.paymentDay !== "") ||
                                     (tempAppliedFilters.paymentMonth && tempAppliedFilters.paymentMonth !== "") ||
                                     (tempAppliedFilters.paymentYear && tempAppliedFilters.paymentYear !== "") ||
                                     (tempAppliedFilters.paymentCollectionDate && tempAppliedFilters.paymentCollectionDate !== "");
        
        let autoTitle;
        if (hasPaymentCollection) {
          const paymentTitle = formatPaymentCollectionTitle(
            tempAppliedFilters.paymentDay || "",
            tempAppliedFilters.paymentMonth || "",
            tempAppliedFilters.paymentYear || ""
          );
          if (paymentTitle) {
            autoTitle = paymentTitle;
          } else {
            autoTitle = "Payment Collection Report";
          }
        } else {
          // Generate student auto title
          const filterInfo = {
            gender: tempAppliedFilters.gender && tempAppliedFilters.gender !== "All" ? tempAppliedFilters.gender : "",
            ageRange: tempAppliedFilters.ageFrom && tempAppliedFilters.ageTo ? `${tempAppliedFilters.ageFrom}-${tempAppliedFilters.ageTo} years old` : "",
            yearLevel: tempAppliedFilters.yearLevel && tempAppliedFilters.yearLevel !== "All" ? tempAppliedFilters.yearLevel : "",
            strand: tempAppliedFilters.strand && tempAppliedFilters.strand !== "All" ? tempAppliedFilters.strand : "",
            section: tempAppliedFilters.section && tempAppliedFilters.section !== "All" ? tempAppliedFilters.section : "",
            schoolYear: tempAppliedFilters.schoolYearFrom && tempAppliedFilters.schoolYearTo ? `${tempAppliedFilters.schoolYearFrom} to ${tempAppliedFilters.schoolYearTo}` : "",
            grades: tempAppliedFilters.gradesFrom && tempAppliedFilters.gradesTo ? `${tempAppliedFilters.gradesFrom}-${tempAppliedFilters.gradesTo}` : "",
            name: tempAppliedFilters.name || "",
            municipality: tempAppliedFilters.municipality && tempAppliedFilters.municipality !== "All" ? tempAppliedFilters.municipality : "",
            province: tempAppliedFilters.province && tempAppliedFilters.province !== "All" ? tempAppliedFilters.province : "",
            barangay: tempAppliedFilters.barangay && tempAppliedFilters.barangay !== "All" ? tempAppliedFilters.barangay : "",
            religion: tempAppliedFilters.religion && tempAppliedFilters.religion !== "All" ? tempAppliedFilters.religion : "",
            academicStatus: tempAppliedFilters.academicStatus && tempAppliedFilters.academicStatus !== "All" ? tempAppliedFilters.academicStatus : "",
            tuitionFeeStatus: tempAppliedFilters.tuitionFeeStatus && tempAppliedFilters.tuitionFeeStatus !== "All" ? tempAppliedFilters.tuitionFeeStatus : "",
            curriculum: tempAppliedFilters.curriculum && tempAppliedFilters.curriculum !== "All" ? tempAppliedFilters.curriculum : ""
          };
          
          // Handle "All" selections
          if (tempAppliedFilters.gender === "All") filterInfo.gender = "All";
          if (tempAppliedFilters.yearLevel === "All") filterInfo.yearLevel = "All";
          if (tempAppliedFilters.strand === "All") filterInfo.strand = "All";
          if (tempAppliedFilters.section === "All") filterInfo.section = "All";
          if (tempAppliedFilters.academicStatus === "All") filterInfo.academicStatus = "All";
          if (tempAppliedFilters.tuitionFeeStatus === "All") filterInfo.tuitionFeeStatus = "All";
          if (tempAppliedFilters.curriculum === "All") filterInfo.curriculum = "All";
          
          // Special case: Individual student search
          if (filterInfo.name) {
            autoTitle = `Student Information: ${filterInfo.name}`;
          } else {
          // Build descriptive title based on filters
          const titleParts = [];
          
          // Academic information (most important)
          const academicInfo = [];
          if (filterInfo.yearLevel) {
            academicInfo.push(filterInfo.yearLevel === "All" ? "All Grade Levels" : `Grade ${filterInfo.yearLevel}`);
          }
          if (filterInfo.strand) {
            academicInfo.push(filterInfo.strand === "All" ? "All Strands" : filterInfo.strand);
          }
          if (filterInfo.section) {
            academicInfo.push(filterInfo.section === "All" ? "All Sections" : `Section ${filterInfo.section}`);
          }
          
          if (academicInfo.length > 0) {
            titleParts.push(academicInfo.join(" "));
          }
          
          // Demographics
          if (filterInfo.gender) {
            titleParts.push(filterInfo.gender === "All" ? "All Genders" : `${filterInfo.gender} Students`);
          }
          
          if (filterInfo.ageRange) {
            titleParts.push(`Aged ${filterInfo.ageRange}`);
          }
          
          // Location information
          const locationInfo = [];
          if (filterInfo.barangay) {
            locationInfo.push(`Brgy. ${filterInfo.barangay}`);
          }
          if (filterInfo.municipality) {
            locationInfo.push(filterInfo.municipality);
          }
          if (filterInfo.province) {
            locationInfo.push(filterInfo.province);
          }
          
          if (locationInfo.length > 0) {
            titleParts.push(`from ${locationInfo.join(", ")}`);
          }
          
          // Additional filters
          if (filterInfo.religion) {
            titleParts.push(`with ${filterInfo.religion} Religion`);
          }
          
          if (filterInfo.academicStatus) {
            titleParts.push(`${filterInfo.academicStatus} Status`);
          }
          
          if (filterInfo.tuitionFeeStatus) {
            titleParts.push(`${filterInfo.tuitionFeeStatus} Payment`);
          }
          
          if (filterInfo.curriculum) {
            titleParts.push(`${filterInfo.curriculum} Curriculum`);
          }
          
          if (filterInfo.grades) {
            titleParts.push(`with Grades ${filterInfo.grades}`);
          }
          
          if (filterInfo.schoolYear) {
            titleParts.push(`S.Y. ${filterInfo.schoolYear}`);
          }
          
          // Generate final title
          autoTitle = "Student Report";
          if (titleParts.length > 0) {
            autoTitle += ": " + titleParts.join(" ");
          }
          }
        }
        
        setReportTitle(autoTitle);
        
        const response = await fetch(`http://ncamisshs.com/backend/search_students.php?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const fetchedStudents = data.students || [];
          setOriginalStudents(fetchedStudents);
          setStudents(fetchedStudents);
          setShowReportTable(true);
          setSortOrder('none');
        } else {
          alert("Error fetching data: " + (data.message || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (activeFilterTab === 'student') {
      const resetParams = {
        name: "",
        province: "",
        municipality: "",
        barangay: "",
        religion: "",
        gender: "",
        yearLevel: "",
        strand: "",
        section: "",
        academicStatus: "",
        tuitionFeeStatus: "",
        curriculum: "",
        ageFrom: "",
        ageTo: "",
        schoolYearFrom: "",
        schoolYearTo: "",
        paymentCollectionDate: "",
        paymentDay: "",
        paymentMonth: "",
        paymentYear: "",
        gradesFrom: "",
        gradesTo: "",
        preparedBy: ""
      };
      setFilterParams(resetParams);
      setFieldPriority({
        province: false,
        municipality: false,
        barangay: false
      });
      
      // Reset report title
      setReportTitle("Student Report");
    } else {
      const resetFacultyParams = {
        facultyName: "",
        subject: "",
        strand: "",
        section: "",
        yearLevel: ""
      };
      setFacultyFilterParams(resetFacultyParams);
      
      // Reset to all options
      setFacultyOptions(allFacultyOptions);
      setFacultySubjectOptions(allFacultySubjectOptions);
      setFacultyStrandOptions(allFacultyStrandOptions);
      setFacultySectionOptions(allFacultySectionOptions);
      setFacultyYearLevelOptions(["All", "11", "12"]);
      
      // Reset report title
      setReportTitle("Faculty Report");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openGenerateReportModal = () => {
    setIsGenerateReportModalOpen(true);
  };

  const closeGenerateReportModal = () => {
    setIsGenerateReportModalOpen(false);
  };

  const handleGenerateReport = async (format) => {
    if (!reportTitle) {
      const autoTitle = generateAutoReportTitle();
      setReportTitle(autoTitle);
      
      if (!autoTitle) {
        alert("Please enter a report title");
        return;
      }
    }

    setPreparedBy(filterParams.preparedBy);

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    await logAudit(format, reportTitle);

    if (format === "pdf") {
      generatePDF(formattedDate, formattedTime);
    } else if (format === "excel") {
      generateExcel(formattedDate, formattedTime);
    } else if (format === "csv") {
      generateCSV(formattedDate, formattedTime);
    }
    
    closeGenerateReportModal();
  };
  
  // Function to log audit for report generation
  const logAudit = async (format, reportTitle) => {
    try {
      const formatUpper = format.toUpperCase();
      const preparedByName = filterParams.preparedBy && filterParams.preparedBy.trim() !== "" 
        ? filterParams.preparedBy 
        : "Admin";
      const description = `Generated ${reportTitle} (${formatUpper}) by ${preparedByName}`;
      
      const response = await fetch(AUDIT_LOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: 'Admin',
          action: 'GENERATE',
          details: description
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to log audit:', result.message);
      } else {
        console.log('Audit logged successfully:', description);
      }
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  const generatePDF = async (formattedDate, formattedTime) => {
    try {
      // Determine orientation based on number of columns
      const columns = getTableColumns();
      const shouldUseLandscape = columns.length > 6; // Switch to landscape if more than 6 columns
      
      const doc = new jsPDF({
        orientation: shouldUseLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      
        const addLogoAndHeader = async () => {
          try {
            const logoSize = 20;
            const logoX = 40; // Moved closer to the text
            const logoY = 15; // Centered with the middle line "Northills College of Asia (NCA), INC."
          
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = cnaLogo;
          
          return new Promise((resolve) => {
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                
                doc.addImage(dataURL, 'PNG', logoX, logoY, logoSize, logoSize);
              } catch (e) {
                console.warn("Could not add logo:", e);
              }
              resolve();
            };
            
            img.onerror = () => {
              console.warn("Could not load logo");
              resolve();
            };
          });
        } catch (error) {
          console.warn("Logo error:", error);
        }
      };

      await addLogoAndHeader();

      // Position header text centered on the page, same vertical level as logo
      const headerX = pageWidth / 2; // Center the text
      let currentY = 20; // Same Y position as logo

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text("Republic of the Philippines", headerX, currentY, { align: 'center' });
      currentY += 6;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Northills College of Asia (NCA), INC.", headerX, currentY, { align: 'center' });
      currentY += 6;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text("Daet, Camarines Norte", headerX, currentY, { align: 'center' });
      currentY += 20;

      const titleText = reportTitle.toUpperCase();
      const tableStartX = 20;
      const tableWidth = pageWidth - 40;
      const titleX = tableStartX;
      const titleY = currentY;
      const titleHeight = 8;
      
      // Calculate appropriate font size based on title length and orientation
      let fontSize = shouldUseLandscape ? 14 : 12; // Start with larger font for landscape
      const maxWidth = tableWidth - 10; // Leave some padding
      
      // Test different font sizes to find the best fit
      const maxFontSize = shouldUseLandscape ? 16 : 12;
      const minFontSize = shouldUseLandscape ? 10 : 8;
      
      for (let testSize = maxFontSize; testSize >= minFontSize; testSize--) {
        doc.setFontSize(testSize);
        const textWidth = doc.getTextWidth(titleText);
        if (textWidth <= maxWidth) {
          fontSize = testSize;
          break;
        }
      }
      
      // If still too long even at minimum size, truncate the text
      let finalTitleText = titleText;
      if (fontSize === minFontSize) {
        doc.setFontSize(minFontSize);
        let truncatedText = titleText;
        while (doc.getTextWidth(truncatedText) > maxWidth && truncatedText.length > 0) {
          truncatedText = truncatedText.substring(0, truncatedText.length - 1);
        }
        finalTitleText = truncatedText;
      }
      
      doc.setFontSize(fontSize);
      doc.setFont(undefined, 'bold');
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.rect(titleX, titleY - 5, tableWidth, titleHeight, 'FD');
      
      doc.line(titleX, titleY - 5, titleX + tableWidth, titleY - 5);
      doc.line(titleX, titleY - 5, titleX, titleY + 3);
      doc.line(titleX + tableWidth, titleY - 5, titleX + tableWidth, titleY + 3);
      
      doc.text(finalTitleText, pageWidth / 2, titleY, { align: 'center' });
      currentY += 3;

      let tableData = [];
      
      if (activeFilterTab === 'faculty') {
        // Check if we're showing students of a faculty or faculty list
        if (students.length > 0) {
          // Showing students of a faculty
          tableData = students.map((student, index) => {
            return [index + 1, ...columns.map(column => getStudentValue(student, column))];
          });
        } else {
          // Showing faculty list
          tableData = facultyData.map((faculty, index) => {
            return [index + 1, ...columns.map(column => getFacultyValue(faculty, column))];
          });
        }
      } else {
        tableData = students.map((student, index) => {
          return [index + 1, ...columns.map(column => getStudentValue(student, column))];
        });
      }

      // Calculate column widths - smaller width for NO. column
      const columnWidths = [];
      columnWidths.push(15); // NO. column - smaller width
      
      // Calculate remaining width for other columns
      const remainingWidth = pageWidth - 40 - 15; // Total width minus margins and NO. column
      const otherColumnsWidth = remainingWidth / columns.length;
      
      // Ensure minimum column width for readability
      const minColumnWidth = shouldUseLandscape ? 20 : 15;
      const adjustedColumnWidth = Math.max(otherColumnsWidth, minColumnWidth);
      
      for (let i = 0; i < columns.length; i++) {
        columnWidths.push(adjustedColumnWidth);
      }

      doc.autoTable({
        head: [["NO.", ...columns]],
        body: tableData,
        startY: currentY,
        margin: { left: tableStartX, right: tableStartX },
        theme: 'grid',
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 }, // NO. column - centered and smaller
          // All other columns will be left-aligned by default
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          halign: 'left' // Left align all text by default
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
          halign: 'left' // Left align headers
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
          halign: 'left' // Left align alternate rows
        },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.3,
        columnWidths: columnWidths
      });

      const finalY = doc.lastAutoTable.finalY + 30;
      const rightMargin = pageWidth - 50;
      
      const currentPreparedBy = "Bernadette Gadil";
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text("Prepared By:", rightMargin, finalY, { align: 'center' });
      
      // Add space for signature above the name (2 blank lines)
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(currentPreparedBy, rightMargin, finalY + 16, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${formattedDate} at ${formattedTime}`, rightMargin, finalY + 24, { align: 'center' });

      doc.save(`${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF report");
    }
  };

  const generateExcel = (formattedDate, formattedTime) => {
    try {
      const columns = getTableColumns();
      const wsData = [];
      
      wsData.push(["Republic of the Philippines"]);
      wsData.push(["Northills College of Asia (NCA), INC."]);
      wsData.push(["Daet, Camarines Norte"]);
      wsData.push([]);
      wsData.push([reportTitle.toUpperCase()]);
      
      if (filterParams.preparedBy && filterParams.preparedBy.trim() !== "") {
        wsData.push([`Prepared By: ${filterParams.preparedBy}`]);
      }
      
      wsData.push([]);
      wsData.push(["NO.", ...columns]);
      
      if (activeFilterTab === 'faculty') {
        // Check if we're showing students of a faculty or faculty list
        if (students.length > 0) {
          // Showing students of a faculty
          students.forEach((student, index) => {
            wsData.push([
              index + 1,
              ...columns.map(column => getStudentValue(student, column))
            ]);
          });
        } else {
          // Showing faculty list
          facultyData.forEach((faculty, index) => {
            wsData.push([
              index + 1,
              ...columns.map(column => getFacultyValue(faculty, column))
            ]);
          });
        }
      } else {
        students.forEach((student, index) => {
          wsData.push([
            index + 1,
            ...columns.map(column => getStudentValue(student, column))
          ]);
        });
      }
      
      wsData.push([]);
      wsData.push([]);
      wsData.push([]);
      
      const signatureRowIndex = wsData.length;
      wsData.push(new Array(columns.length + 1).fill(""));
      wsData.push(new Array(columns.length + 1).fill(""));
      wsData.push(new Array(columns.length + 1).fill(""));
      
      const currentPreparedBy = "Bernadette Gadil";
      wsData[signatureRowIndex][columns.length] = currentPreparedBy;
      wsData[signatureRowIndex + 1][columns.length] = "Prepared By";
      wsData[signatureRowIndex + 2][columns.length] = `${formattedDate} at ${formattedTime}`;

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      const colWidths = [
        { wch: 5 },
        ...columns.map(() => ({ wch: 20 }))
      ];
      ws['!cols'] = colWidths;
      
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: columns.length } }
      ];
      
      if (filterParams.preparedBy && filterParams.preparedBy.trim() !== "") {
        merges.push({ s: { r: 5, c: 0 }, e: { r: 5, c: columns.length } });
      }
      
      ws['!merges'] = merges;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      
      XLSX.writeFile(wb, `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("An error occurred while generating the Excel report");
    }
  };

  const generateCSV = (formattedDate, formattedTime) => {
    try {
      const columns = getTableColumns();
      let csvContent = "";
      
      csvContent += "Republic of the Philippines\n";
      csvContent += "Northills College of Asia (NCA), INC.\n";
      csvContent += "Daet, Camarines Norte\n";
      csvContent += "\n";
      csvContent += `${reportTitle.toUpperCase()}\n`;
      
      if (filterParams.preparedBy && filterParams.preparedBy.trim() !== "") {
        csvContent += `Prepared By: ${filterParams.preparedBy}\n`;
      }
      
      csvContent += "\n";
      csvContent += "NO.," + columns.join(",") + "\n";
      
      if (activeFilterTab === 'faculty') {
        // Check if we're showing students of a faculty or faculty list
        if (students.length > 0) {
          // Showing students of a faculty
          students.forEach((student, index) => {
            const row = [
              index + 1,
              ...columns.map(column => {
                const value = getStudentValue(student, column);
                return value.includes(",") || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
              })
            ];
            csvContent += row.join(",") + "\n";
          });
        } else {
          // Showing faculty list
          facultyData.forEach((faculty, index) => {
            const row = [
              index + 1,
              ...columns.map(column => {
                const value = getFacultyValue(faculty, column);
                return value.includes(",") || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
              })
            ];
            csvContent += row.join(",") + "\n";
          });
        }
      } else {
        students.forEach((student, index) => {
          const row = [
            index + 1,
            ...columns.map(column => {
              const value = getStudentValue(student, column);
              return value.includes(",") || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
            })
          ];
          csvContent += row.join(",") + "\n";
        });
      }
      
      csvContent += "\n";
      csvContent += "\n";
      const currentPreparedBy = "Bernadette Gadil";
      csvContent += `,,,,,,"${currentPreparedBy}"\n`;
      csvContent += `,,,,,,"Prepared By"\n`;
      csvContent += `,,,,,,"${formattedDate} at ${formattedTime}"\n`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("An error occurred while generating the CSV report");
    }
  };

  const getTableColumns = () => {
    if (activeFilterTab === 'faculty') {
      const hasFaculty = appliedFacultyFilters.facultyName && appliedFacultyFilters.facultyName !== "" && appliedFacultyFilters.facultyName !== "All";
      const hasStrand = appliedFacultyFilters.strand && appliedFacultyFilters.strand !== "" && appliedFacultyFilters.strand !== "All";
      const hasYearLevel = appliedFacultyFilters.yearLevel && appliedFacultyFilters.yearLevel !== "" && appliedFacultyFilters.yearLevel !== "All";
      const hasSection = appliedFacultyFilters.section && appliedFacultyFilters.section !== "" && appliedFacultyFilters.section !== "All";
      const hasSubject = appliedFacultyFilters.subject && appliedFacultyFilters.subject !== "" && appliedFacultyFilters.subject !== "All";
      
      // Check if filters are applied (including "All" selections)
      const hasStrandFilter = appliedFacultyFilters.strand && appliedFacultyFilters.strand !== "";
      const hasYearLevelFilter = appliedFacultyFilters.yearLevel && appliedFacultyFilters.yearLevel !== "";
      const hasSectionFilter = appliedFacultyFilters.section && appliedFacultyFilters.section !== "";
      const hasSubjectFilter = appliedFacultyFilters.subject && appliedFacultyFilters.subject !== "";

      // If no faculty is selected or All is selected, show faculty listing
      if (!hasFaculty) {
        const columns = ["FACULTY NAME"];
        
        // Check what filters are applied to determine columns (using filter variables that include "All")
        const hasOnlyYearLevel = hasYearLevelFilter && !hasStrandFilter && !hasSectionFilter && !hasSubjectFilter;
        const hasStrandAndYearLevel = hasStrandFilter && hasYearLevelFilter && !hasSectionFilter && !hasSubjectFilter;
        const hasOnlyStrand = hasStrandFilter && !hasYearLevelFilter && !hasSectionFilter && !hasSubjectFilter;
        const hasOnlySubject = hasSubjectFilter && !hasStrandFilter && !hasYearLevelFilter && !hasSectionFilter;
        const hasOnlySection = hasSectionFilter && !hasStrandFilter && !hasYearLevelFilter && !hasSubjectFilter;
        const hasStrandAndSubject = hasStrandFilter && hasSubjectFilter && !hasYearLevelFilter && !hasSectionFilter;
        const hasStrandAndSection = hasStrandFilter && hasSectionFilter && !hasYearLevelFilter && !hasSubjectFilter;
        const hasYearLevelAndSubject = hasYearLevelFilter && hasSubjectFilter && !hasStrandFilter && !hasSectionFilter;
        const hasYearLevelAndSection = hasYearLevelFilter && hasSectionFilter && !hasStrandFilter && !hasSubjectFilter;
        const hasSubjectAndSection = hasSubjectFilter && hasSectionFilter && !hasStrandFilter && !hasYearLevelFilter;
        const hasStrandYearLevelAndSubject = hasStrandFilter && hasYearLevelFilter && hasSubjectFilter && !hasSectionFilter;
        const hasStrandYearLevelAndSection = hasStrandFilter && hasYearLevelFilter && hasSectionFilter && !hasSubjectFilter;
        const hasStrandSubjectAndSection = hasStrandFilter && hasSubjectFilter && hasSectionFilter && !hasYearLevelFilter;
        const hasYearLevelSubjectAndSection = hasYearLevelFilter && hasSubjectFilter && hasSectionFilter && !hasStrandFilter;
        const hasAllFilters = hasStrandFilter && hasYearLevelFilter && hasSubjectFilter && hasSectionFilter;
        
        if (hasOnlyYearLevel) {
          // Year level only: Faculty Name, Grade
          columns.push("GRADE");
        } else if (hasStrandAndYearLevel) {
          // Strand + Year Level: Faculty Name, Strand, Grade
          columns.push("STRAND", "GRADE");
        } else if (hasOnlyStrand) {
          // Strand only: Faculty Name, Strand
          columns.push("STRAND");
        } else if (hasOnlySubject) {
          // Subject only: Faculty Name, Subject
          columns.push("SUBJECT");
        } else if (hasOnlySection) {
          // Section only: Faculty Name, Section
          columns.push("SECTION");
        } else if (hasStrandAndSubject) {
          // Strand + Subject: Faculty Name, Strand, Subject
          columns.push("STRAND", "SUBJECT");
        } else if (hasStrandAndSection) {
          // Strand + Section: Faculty Name, Strand, Section
          columns.push("STRAND", "SECTION");
        } else if (hasYearLevelAndSubject) {
          // Year Level + Subject: Faculty Name, Grade, Subject
          columns.push("GRADE", "SUBJECT");
        } else if (hasYearLevelAndSection) {
          // Year Level + Section: Faculty Name, Grade, Section
          columns.push("GRADE", "SECTION");
        } else if (hasSubjectAndSection) {
          // Subject + Section: Faculty Name, Subject, Section
          columns.push("SUBJECT", "SECTION");
        } else if (hasStrandYearLevelAndSubject) {
          // Strand + Year Level + Subject: Faculty Name, Strand, Grade, Subject
          columns.push("STRAND", "GRADE", "SUBJECT");
        } else if (hasStrandYearLevelAndSection) {
          // Strand + Year Level + Section: Faculty Name, Strand, Grade, Section
          columns.push("STRAND", "GRADE", "SECTION");
        } else if (hasStrandSubjectAndSection) {
          // Strand + Subject + Section: Faculty Name, Strand, Subject, Section
          columns.push("STRAND", "SUBJECT", "SECTION");
        } else if (hasYearLevelSubjectAndSection) {
          // Year Level + Subject + Section: Faculty Name, Grade, Subject, Section
          columns.push("GRADE", "SUBJECT", "SECTION");
        } else if (hasAllFilters) {
          // All filters: Faculty Name, Strand, Grade, Subject, Section
          columns.push("STRAND", "GRADE", "SUBJECT", "SECTION");
        } else {
          // Default: show all relevant columns based on applied filters (including "All")
          if (hasStrandFilter) {
            columns.push("STRAND");
          }
          if (hasYearLevelFilter) {
            columns.push("GRADE");
          }
          if (hasSectionFilter) {
            columns.push("SECTION");
          }
          if (hasSubjectFilter) {
            columns.push("SUBJECT");
          }
        }
        
        return columns;
      }

      // If faculty is selected, show student information
      const columns = ["STUDENT NAME"];
      
      // Add columns based on what filters are selected for student view (including "All")
      if (hasStrandFilter) columns.push("STRAND");
      if (hasYearLevelFilter) columns.push("YEAR LEVEL");
      if (hasSectionFilter) columns.push("SECTION");
      if (hasSubjectFilter) columns.push("SUBJECT");
      
      // If no other filters selected, show all relevant student info
      if (!hasStrandFilter && !hasYearLevelFilter && !hasSectionFilter && !hasSubjectFilter) {
        columns.push("YEAR LEVEL", "STRAND", "SECTION");
      }
      
      return columns;
    }
    
    // Student columns (existing code)
    const columns = ["NAME"];
    
    // Check if payment collection date filter is applied
    const hasPaymentCollection = (appliedFilters.paymentCollectionDate && appliedFilters.paymentCollectionDate !== "") ||
                                 (appliedFilters.paymentDay && appliedFilters.paymentDay !== "") ||
                                 (appliedFilters.paymentMonth && appliedFilters.paymentMonth !== "") ||
                                 (appliedFilters.paymentYear && appliedFilters.paymentYear !== "");
    
    if (hasPaymentCollection) {
      // When payment collection filter is applied, show specific columns
      return ["NAME", "STRAND", "GRADE LEVEL", "SECTION", "MODE OF PAYMENT", "DATE", "AMOUNT PAID"];
    }
    
    // Check if only searching by name (no other filters)
    if (appliedFilters.name && 
        !appliedFilters.municipality && 
        !appliedFilters.province &&
        !appliedFilters.barangay &&
        !appliedFilters.religion && 
        !appliedFilters.gender && 
        !appliedFilters.strand && 
        !appliedFilters.section && 
        !appliedFilters.yearLevel && 
        !appliedFilters.schoolYearFrom && 
        !appliedFilters.ageFrom && 
        !appliedFilters.gradesFrom &&
        !appliedFilters.academicStatus &&
        !appliedFilters.tuitionFeeStatus &&
        !appliedFilters.curriculum) {
      return ["NAME", "EMAIL", "GRADE LEVEL", "STRAND", "SECTION"];
    }
    
    // Rest of the student column logic (existing code)
    const hasBarangay = appliedFilters.barangay && appliedFilters.barangay !== "All" && appliedFilters.barangay !== "";
    const hasMunicipality = appliedFilters.municipality && appliedFilters.municipality !== "All" && appliedFilters.municipality !== "";
    const hasProvince = appliedFilters.province && appliedFilters.province !== "All" && appliedFilters.province !== "";
    
    const onlyLocationFilters = (hasProvince || hasMunicipality || hasBarangay) &&
        !appliedFilters.religion && 
        !appliedFilters.gender && 
        !appliedFilters.strand && 
        !appliedFilters.section && 
        !appliedFilters.yearLevel && 
        !appliedFilters.schoolYearFrom && 
        !appliedFilters.ageFrom && 
        !appliedFilters.gradesFrom &&
        !appliedFilters.academicStatus &&
        !appliedFilters.tuitionFeeStatus &&
        !appliedFilters.curriculum;
    
    if (onlyLocationFilters) {
      if (hasBarangay) {
        columns.push("BARANGAY");
        columns.push("MUNICIPALITY");
        columns.push("PROVINCE");
        return columns;
      } else if (hasMunicipality) {
        columns.push("MUNICIPALITY");
        columns.push("PROVINCE");
        return columns;
      } else if (hasProvince) {
        columns.push("PROVINCE");
        return columns;
      }
    }
    
    const hasStrand = appliedFilters.strand && appliedFilters.strand !== "" && appliedFilters.strand !== "All";
    const hasSection = appliedFilters.section && appliedFilters.section !== "" && appliedFilters.section !== "All";
    const hasStrandAll = appliedFilters.strand === "All";
    const hasSectionAll = appliedFilters.section === "All";
    
    const onlyStrandFilter = hasStrand && 
        !hasSection &&
        !hasSectionAll &&
        !appliedFilters.name &&
        !hasProvince && !hasMunicipality && !hasBarangay &&
        !appliedFilters.religion && 
        !appliedFilters.gender && 
        !appliedFilters.yearLevel && 
        !appliedFilters.schoolYearFrom && 
        !appliedFilters.ageFrom && 
        !appliedFilters.gradesFrom &&
        !appliedFilters.academicStatus &&
        !appliedFilters.tuitionFeeStatus &&
        !appliedFilters.curriculum;
    
    if (onlyStrandFilter) {
      columns.push("STRAND");
      return columns;
    }
    
    if (hasStrand && hasSectionAll) {
      columns.push("SECTION");
      columns.push("STRAND");
      
      if (!appliedFilters.name &&
          !hasProvince && !hasMunicipality && !hasBarangay &&
          !appliedFilters.religion && 
          !appliedFilters.gender && 
          !appliedFilters.yearLevel && 
          !appliedFilters.schoolYearFrom && 
          !appliedFilters.ageFrom && 
          !appliedFilters.gradesFrom &&
          !appliedFilters.academicStatus &&
          !appliedFilters.tuitionFeeStatus &&
          !appliedFilters.curriculum) {
        return columns;
      }
    }
    
    if (hasSection) {
      columns.push("SECTION");
      columns.push("STRAND");
    }
    
    if (hasStrandAll) {
      if (!hasSection && !hasSectionAll) {
        columns.push("STRAND");
      }
    }
    
    if (hasSectionAll && !hasStrand) {
      if (!columns.includes("SECTION")) columns.push("SECTION");
      if (!columns.includes("STRAND")) columns.push("STRAND");
    }
    
    if (appliedFilters.name) columns.push("EMAIL");
    
    if (hasProvince) columns.push("PROVINCE");
    if (hasMunicipality) columns.push("MUNICIPALITY");
    if (hasBarangay) columns.push("BARANGAY");
    if (appliedFilters.religion && appliedFilters.religion !== "") columns.push("RELIGION");
    if (appliedFilters.gender && appliedFilters.gender !== "") columns.push("GENDER");
    
    if (!columns.includes("STRAND") && hasStrand) {
      columns.push("STRAND");
    }
    
    if (!columns.includes("SECTION") && hasSectionAll) {
      columns.push("SECTION");
    }
    
    if (appliedFilters.yearLevel && appliedFilters.yearLevel !== "") columns.push("GRADE LEVEL");
    if (appliedFilters.schoolYearFrom && appliedFilters.schoolYearTo) columns.push("SCHOOL YEAR");
    if (appliedFilters.ageFrom && appliedFilters.ageTo) columns.push("AGE");
    if (appliedFilters.gradesFrom && appliedFilters.gradesTo) columns.push("GRADES");
    if (appliedFilters.academicStatus && appliedFilters.academicStatus !== "") columns.push("ACADEMIC STATUS");
    if (appliedFilters.tuitionFeeStatus && appliedFilters.tuitionFeeStatus !== "") columns.push("TUITION FEE STATUS");
    if (appliedFilters.curriculum && appliedFilters.curriculum !== "") columns.push("CURRICULUM");
    
    return columns;
  };

  const getFacultyValue = (faculty, column) => {
    switch(column) {
      case "FACULTY NAME":
        return faculty.faculty_name || faculty.teacher || '-';
      case "SUBJECT":
        return faculty.subject || faculty.description || '-';
      case "STRAND":
        return faculty.strand || '-';
      case "SECTION":
        return faculty.section || '-';
      case "YEAR LEVEL":
        return faculty.year_level || '-';
      case "GRADE":
        return faculty.year_level || '-';
      case "SCHEDULE":
        return faculty.schedule_day && faculty.schedule_time 
          ? `${faculty.schedule_day} ${faculty.schedule_time}` 
          : '-';
      default:
        return '-';
    }
  };

  const getStudentValue = (student, column) => {
    switch(column) {
      case "NAME":
        // Check if payment collection filter is active - show name without middle initial
        const hasPaymentCollection = (appliedFilters.paymentCollectionDate && appliedFilters.paymentCollectionDate !== "") ||
                                     (appliedFilters.paymentDay && appliedFilters.paymentDay !== "") ||
                                     (appliedFilters.paymentMonth && appliedFilters.paymentMonth !== "") ||
                                     (appliedFilters.paymentYear && appliedFilters.paymentYear !== "");
        if (hasPaymentCollection) {
          return `${student.last_name || ''}, ${student.first_name || ''}`;
        }
        return `${student.last_name || ''}, ${student.first_name || ''}${student.middle_name ? ' ' + student.middle_name.charAt(0) + '.' : ''}`;
      case "STUDENT NAME":
        // Check if payment collection filter is active - show name without middle initial
        const hasPaymentCollectionForStudent = (appliedFilters.paymentCollectionDate && appliedFilters.paymentCollectionDate !== "") ||
                                               (appliedFilters.paymentDay && appliedFilters.paymentDay !== "") ||
                                               (appliedFilters.paymentMonth && appliedFilters.paymentMonth !== "") ||
                                               (appliedFilters.paymentYear && appliedFilters.paymentYear !== "");
        if (hasPaymentCollectionForStudent) {
          return student.student_name || `${student.last_name || ''}, ${student.first_name || ''}`;
        }
        return student.student_name || `${student.last_name || ''}, ${student.first_name || ''}${student.middle_name ? ' ' + student.middle_name.charAt(0) + '.' : ''}`;
      case "GRADE":
        return student.grade_level || student.year_level || '-';
      case "EMAIL":
        return student.email || '-';
      case "GENDER":
        return student.gender || '-';
      case "RELIGION":
        return student.religion || '-';
      case "PROVINCE":
        return student.province || '-';
      case "MUNICIPALITY":
        return student.municipality || '-';
      case "BARANGAY":
        return student.barangay || '-';
      case "STRAND":
        return student.strand || student.strand_track || '-';
      case "SECTION":
        return student.faculty_section || student.section || '-';
      case "GRADE LEVEL":
        return student.grade_level || student.year_level || '-';
      case "YEAR LEVEL":
        return student.grade_level || student.year_level || '-';
      case "SUBJECT":
        return student.subject || '-';
      case "SCHOOL YEAR":
        return student.school_year || '-';
      case "AGE":
        return student.age || '-';
      case "GRADES":
        return student.final_grade ? Math.round(student.final_grade) : '-';
      case "ACADEMIC STATUS":
        return student.academic_status || '-';
      case "TUITION FEE STATUS":
        return student.tuition_fee_status || '-';
      case "CURRICULUM":
        return student.curriculum || '-';
      case "MODE OF PAYMENT":
        return student.mode_of_payment || '-';
      case "DATE":
        if (student.payment_date) {
          // Format date from YYYY-MM-DD to dd/mm/yyyy
          const date = new Date(student.payment_date);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return '-';
      case "AMOUNT PAID":
        return student.amount_paid ? `₱${parseFloat(student.amount_paid).toFixed(2)}` : '-';
      default:
        return '-';
    }
  };

  return (
    <div className="admin-report-container-ar">
      <div className="header-report-ar">
        <h2>REPORTS</h2>
        <div className="header-actions-ar">
          {showReportTable && (activeFilterTab === 'student' ? students.length > 0 : facultyData.length > 0) && (
            <div className="sorting-buttons-ar">
              <button 
                className={`sort-btn-ar ${sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => handleSort('asc')}
                title="Sort Ascending"
              >
                <FaSortAmountUp />
              </button>
              <button 
                className={`sort-btn-ar ${sortOrder === 'desc' ? 'active' : ''}`}
                onClick={() => handleSort('desc')}
                title="Sort Descending"
              >
                <FaSortAmountDown />
              </button>
              <button 
                className={`sort-btn-ar ${sortOrder === 'alpha' ? 'active' : ''}`}
                onClick={() => handleSort('alpha')}
                title="Sort Alphabetically"
              >
                <FaSortAlphaDown />
              </button>
            </div>
          )}
          
          <div className="filter-dropdown-ar">
            <FaFilter className="filter-icon-ar" onClick={handleFilterClick} />
            {showFilterOptions && (
              <div className="filter-options-ar">
                <button onClick={() => handleOpenModal('student')}>STUDENT FILTER</button>
                <button onClick={() => handleOpenModal('faculty')}>FACULTY FILTER</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {isModalOpen && (
        <div className="modal-overlay-ar">
          <div className="modal-ar">
            <div className="modal-header-ar">
              <h3>{activeFilterTab === 'student' ? 'STUDENT REPORT' : 'FACULTY REPORT'}</h3>
              <button className="close-modal-x-btn" onClick={closeModal}>
                <FaTimes className="close-icon-r" />
              </button> 
            </div>
            
            {activeFilterTab === 'student' ? (
              <div className="form-ar">
                <div className="form-group-ar">
                  <label>Student name</label>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Enter name" 
                    value={filterParams.name}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group-ar">
                  <label>Year level</label>
                  <select
                    name="yearLevel"
                    value={filterParams.yearLevel}
                    onChange={handleInputChange}
                  >
                    <option value="">Select year level</option>
                    {yearLevelOptions.map(option => (
                      <option key={option} value={option}>
                        {option === "All" ? "All" : `Grade ${option}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Province</label>
                  <div className="autocomplete-container">
                    <input 
                      type="text" 
                      value={filterParams.province} 
                      onChange={handleProvinceChange}
                      onFocus={() => handleFocus('province')}
                      placeholder="Type to search"
                    />
                    {focusedField === 'province' && suggestions.province.length > 0 && (
                      <ul className="suggestions-list">
                        {suggestions.province.map((suggestion, index) => (
                          <li 
                            key={index} 
                            onClick={() => handleSelectProvince(suggestion)}
                            className="suggestion-item"
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="form-group-ar">
                  <label>Strand</label>
                  <select
                    name="strand"
                    value={filterParams.strand}
                    onChange={handleInputChange}
                  >
                    <option value="">Select strand</option>
                    {optionsLoading ? (
                      <option value="" disabled>Loading strands...</option>
                    ) : strandOptions.length > 0 ? (
                      strandOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))
                    ) : (
                      <option value="" disabled>No strands available</option>
                    )}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Municipality</label>
                  <div className="autocomplete-container">
                    <input 
                      type="text" 
                      value={filterParams.municipality} 
                      onChange={handleMunicipalityChange}
                      onFocus={() => handleFocus('municipality')}
                      placeholder="Type to search"
                    />
                    {focusedField === 'municipality' && suggestions.municipality.length > 0 && (
                      <ul className="suggestions-list">
                        {suggestions.municipality.map((suggestion, index) => (
                          <li 
                            key={index} 
                            onClick={() => handleSelectMunicipality(suggestion)}
                            className="suggestion-item"
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="form-group-ar">
                  <label>Section</label>
                  <select
                    name="section"
                    value={filterParams.section}
                    onChange={handleInputChange}
                  >
                    <option value="">Select section</option>
                    {optionsLoading ? (
                      <option value="" disabled>Loading sections...</option>
                    ) : filteredSectionOptions.length > 0 ? (
                      filteredSectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))
                    ) : (
                      <option value="" disabled>No sections available for selected strand</option>
                    )}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Barangay</label>
                  <div className="autocomplete-container">
                    <input 
                      type="text" 
                      value={filterParams.barangay} 
                      onChange={handleBarangayChange}
                      onFocus={() => handleFocus('barangay')}
                      placeholder="Type to search"
                    />
                    {focusedField === 'barangay' && suggestions.barangay.length > 0 && (
                      <ul className="suggestions-list">
                        {suggestions.barangay.map((suggestion, index) => (
                          <li 
                            key={index} 
                            onClick={() => handleSelectBarangay(suggestion)}
                            className="suggestion-item"
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="form-group-ar">
                  <label>Academic Status</label>
                  <select
                    name="academicStatus"
                    value={filterParams.academicStatus}
                    onChange={handleInputChange}
                  >
                    <option value="">Select academic status</option>
                    {academicStatusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Religion</label>
                  <input
                    type="text"
                    name="religion"
                    placeholder="Enter religion (e.g., Catholic, INC)"
                    value={filterParams.religion}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group-ar">
                  <label>Tuition Fee Status</label>
                  <select
                    name="tuitionFeeStatus"
                    value={filterParams.tuitionFeeStatus}
                    onChange={handleInputChange}
                  >
                    <option value="">Select tuition fee status</option>
                    {tuitionFeeStatusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Gender</label>
                  <select 
                    name="gender"
                    value={filterParams.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Curriculum</label>
                  <select
                    name="curriculum"
                    value={filterParams.curriculum}
                    onChange={handleInputChange}
                  >
                    <option value="">Select curriculum</option>
                    {curriculumOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Age</label>
                  <div className="age-group-ar">
                    <select
                      name="ageFrom"
                      value={filterParams.ageFrom}
                      onChange={handleInputChange}
                    >
                      <option value="">From</option>
                      {Array.from({ length: 10 }, (_, i) => i + 15).map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                    <span>to</span>
                    <select
                      name="ageTo"
                      value={filterParams.ageTo}
                      onChange={handleInputChange}
                    >
                      <option value="">to</option>
                      {Array.from({ length: 10 }, (_, i) => i + 15).map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group-ar">
                  <label>School year</label>
                  <div className="school-year-range">
                    <select
                      name="schoolYearFrom"
                      value={filterParams.schoolYearFrom}
                      onChange={handleInputChange}
                      className="school-year-select"
                    >
                      <option value="">From</option>
                      {optionsLoading ? (
                        <option value="" disabled>Loading...</option>
                      ) : schoolYearOptions.length > 0 ? (
                        schoolYearOptions.filter(opt => opt !== "All").map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))
                      ) : (
                        <option value="" disabled>No school years available</option>
                      )}
                    </select>
                    <span className="to-text">to</span>
                    <select
                      name="schoolYearTo"
                      value={filterParams.schoolYearTo}
                      onChange={handleInputChange}
                      className="school-year-select"
                    >
                      <option value="">to</option>
                      {optionsLoading ? (
                        <option value="" disabled>Loading...</option>
                      ) : schoolYearOptions.length > 0 ? (
                        schoolYearOptions.filter(opt => opt !== "All").map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))
                      ) : (
                        <option value="" disabled>No school years available</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="form-group-ar">
                  <label>Grades</label>
                  <div className="grades-range">
                    <select
                      name="gradesFrom"
                      value={filterParams.gradesFrom}
                      onChange={handleInputChange}
                    >
                      <option value="">From</option>
                      {Array.from({ length: 101 }, (_, i) => i).map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                    <span>to</span>
                    <select
                      name="gradesTo"
                      value={filterParams.gradesTo}
                      onChange={handleInputChange}
                    >
                      <option value="">to</option>
                      {Array.from({ length: 101 }, (_, i) => i).map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group-ar">
                  <label>Payment Collection</label>
                  <div className="payment-date-input-group">
                    <input
                      type="text"
                      name="paymentDay"
                      placeholder="dd"
                      value={filterParams.paymentDay || ''}
                      onChange={handlePaymentDateChange}
                      maxLength="2"
                      className="payment-date-part"
                    />
                    <span className="date-separator">/</span>
                    <input
                      type="text"
                      name="paymentMonth"
                      placeholder="mm"
                      value={filterParams.paymentMonth || ''}
                      onChange={handlePaymentDateChange}
                      maxLength="2"
                      className="payment-date-part"
                    />
                    <span className="date-separator">/</span>
                    <input
                      type="text"
                      name="paymentYear"
                      placeholder="yyyy"
                      value={filterParams.paymentYear || ''}
                      onChange={handlePaymentDateChange}
                      maxLength="4"
                      className="payment-date-part"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-ar">
                <div className="form-group-ar">
                  <label>Faculty name</label>
                  <select
                    name="facultyName"
                    value={facultyFilterParams.facultyName}
                    onChange={handleFacultyInputChange}
                  >
                    <option value="">Select faculty</option>
                    {facultyOptions.length > 0 ? (
                      facultyOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))
                    ) : (
                      <option value="" disabled>No faculty available</option>
                    )}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Subject</label>
                  <select
                    name="subject"
                    value={facultyFilterParams.subject}
                    onChange={handleFacultyInputChange}
                  >
                    <option value="">Select subject</option>
                    {facultySubjectOptions.length > 0 ? (
                      facultySubjectOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))
                    ) : (
                      <option value="" disabled>No subjects available</option>
                    )}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Strand</label>
                  <select
                    name="strand"
                    value={facultyFilterParams.strand}
                    onChange={handleFacultyInputChange}
                  >
                    <option value="">Select strand</option>
                    {facultyStrandOptions.length > 0 ? (
                      facultyStrandOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))
                    ) : (
                      <option value="" disabled>No strands available</option>
                    )}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Section</label>
                  <select
                    name="section"
                    value={facultyFilterParams.section}
                    onChange={handleFacultyInputChange}
                  >
                    <option value="">Select section</option>
                    {facultySectionOptions.length > 0 ? (
                      facultySectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))
                    ) : (
                      <option value="" disabled>No sections available</option>
                    )}
                  </select>
                </div>

                <div className="form-group-ar">
                  <label>Year level</label>
                  <select
                    name="yearLevel"
                    value={facultyFilterParams.yearLevel}
                    onChange={handleFacultyInputChange}
                  >
                    <option value="">Select year level</option>
                    {facultyYearLevelOptions.length > 0 ? (
                      facultyYearLevelOptions.map(option => (
                        <option key={option} value={option}>
                          {option === "All" ? "All" : `Grade ${option}`}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No year levels available</option>
                    )}
                  </select>
                </div>

              </div>
            )}
            
            <div className="report-button-group-ar">
              <button className="apply-filter-button-ar" onClick={handleAddFilter}>
                {loading ? "Loading..." : "APPLY FILTER"}
              </button>
              <button className="reset-button-ar" onClick={handleReset}>RESET</button>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {showReportTable && (
        <div className="report-table-container-ar">
          {loading ? (
            <div className="loading-indicator">Loading data...</div>
          ) : (activeFilterTab === 'student' ? students.length > 0 : (activeFilterTab === 'faculty' && students.length > 0) ? students.length > 0 : facultyData.length > 0) ? (
            <>
              <table className="report-table-ar">
                <thead>
                  <tr>
                    <th>NO.</th>
                    {getTableColumns().map((column, index) => (
                      <th 
                        key={index}
                        style={column === "AMOUNT PAID" ? {textAlign: 'right'} : {}}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeFilterTab === 'student' || (activeFilterTab === 'faculty' && students.length > 0) ? (
                    <>
                      {students.map((student, index) => (
                        <tr key={student.student_id || index}>
                          <td>{index + 1}</td>
                          {getTableColumns().map((column, colIndex) => (
                            <td 
                              key={colIndex}
                              style={column === "AMOUNT PAID" ? {textAlign: 'right'} : {}}
                            >
                              {getStudentValue(student, column)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* Total row for payment collection */}
                      {((appliedFilters.paymentCollectionDate && appliedFilters.paymentCollectionDate !== "") ||
                        (appliedFilters.paymentDay && appliedFilters.paymentDay !== "") ||
                        (appliedFilters.paymentMonth && appliedFilters.paymentMonth !== "") ||
                        (appliedFilters.paymentYear && appliedFilters.paymentYear !== "")) && (() => {
                        const columns = getTableColumns();
                        const amountPaidIndex = columns.findIndex(col => col === "AMOUNT PAID");
                        const totalAmount = students.reduce((sum, student) => {
                          const amount = parseFloat(student.amount_paid || 0);
                          return sum + amount;
                        }, 0);
                        // Total row: NO. column (1) + all columns before AMOUNT PAID (amountPaidIndex) = amountPaidIndex + 1
                        // Then AMOUNT PAID column
                        return (
                          <tr className="total-row-ar" style={{backgroundColor: '#f5f5f5', fontWeight: 'bold'}}>
                            <td colSpan={amountPaidIndex + 1} style={{textAlign: 'right', paddingRight: '20px'}}>TOTAL:</td>
                            <td style={{fontWeight: 'bold', textAlign: 'right'}}>
                              ₱{totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })()}
                    </>
                  ) : (
                    facultyData.map((faculty, index) => (
                      <tr key={faculty.id || index}>
                        <td>{index + 1}</td>
                        {getTableColumns().map((column, colIndex) => (
                          <td key={colIndex}>{getFacultyValue(faculty, column)}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="generate-report-section">
                <input 
                  type="text" 
                  placeholder="Title Report" 
                  className="report-title-input" 
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
                <button className="generate-report-button-ar" onClick={openGenerateReportModal}>GENERATE REPORT</button>
              </div>
            </>
          ) : (
            <div className="no-results">
              {activeFilterTab === 'student' ? 
                'No students found matching your criteria.' : 
                (activeFilterTab === 'faculty' && students.length === 0) ? 
                  'This faculty has no students handled.' : 
                  'No faculty found matching your criteria.'
              }
            </div>
          )}
        </div>
      )}

      {/* Generate Report Modal */}
      {isGenerateReportModalOpen && (
        <div className="modal-overlay-ar">
          <div className="generate-report-modal">
            <h3>GENERATE REPORT</h3>
            <div className="generate-report-form">
              <div className="form-group-ar">
                <label>Report Title <span className="required">*</span></label>
                <input 
                  type="text" 
                  placeholder="Enter report title" 
                  className="report-modal-input" 
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group-ar">
                <label>Prepared By</label>
                <input 
                  type="text" 
                  value="Bernadette Gadil"
                  className="report-modal-input"
                  readOnly
                  style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                />
              </div>
              <div className="form-group-ar">
                <label>Format <span className="required">*</span></label>
                <div className="select-wrapper">
                  <select className="report-modal-input" id="report-format">
                    <option value="">Select format</option>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>
              <div className="generate-report-actions">
                <button 
                  className="generate-btn" 
                  onClick={() => {
                    const format = document.getElementById('report-format').value;
                    if (!format) {
                      alert("Please select a format");
                      return;
                    }
                    if (!reportTitle) {
                      alert("Please enter a report title");
                      return;
                    }
                    handleGenerateReport(format);
                  }}
                >
                  Generate
                </button>
              </div>
            </div>
            <button className="close-modal-btn" onClick={closeGenerateReportModal}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReport;