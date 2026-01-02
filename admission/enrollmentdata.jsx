import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import to access location state
import './enrollmentdata.css'; 

const EnrollmentData = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const [learnerReferenceNumber, setLearnerReferenceNumber] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 11');
  const [schoolYear, setSchoolYear] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [strandTrack, setStrandTrack] = useState('');
  const [campus, setCampus] = useState('');
  const [elementary, setElementary] = useState('');
  const [yearGraduatedElem, setYearGraduatedElem] = useState('');
  const [elementaryAwards, setElementaryAwards] = useState('');
  const [elementaryGwa, setElementaryGwa] = useState('');
  const [secondary, setSecondary] = useState('');
  const [yearGraduatedSec, setYearGraduatedSec] = useState('');
  const [secondaryAwards, setSecondaryAwards] = useState('');
  const [secondaryGwa, setSecondaryGwa] = useState('');
  const [sports, setSports] = useState('');
  const [favoriteSubjects, setFavoriteSubjects] = useState('');

  const [strandOptions, setStrandOptions] = useState([]);

  // Function to handle numeric input (allows numbers and one decimal point)
  const handleNumericInput = (value, setter) => {
    // Allow only numbers and one decimal point
    const numericRegex = /^\d*\.?\d*$/;
    if (numericRegex.test(value) || value === '') {
      setter(value);
    }
  };

  // Function to handle year input (only whole numbers)
  const handleYearInput = (value, setter) => {
    // Allow only whole numbers
    const yearRegex = /^\d*$/;
    if (yearRegex.test(value) || value === '') {
      setter(value);
    }
  };

  // Set initial school year based on the current year
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    setSchoolYear(`${currentYear}-${nextYear}`);

    // Fetch the strand options dynamically
   // Modify the fetchStrands function to use the correct URL
const fetchStrands = async () => {
  try {
    // Use the production backend URL
    const response = await fetch('http://ncamisshs.com/backend/fetch_strands.php');
    const data = await response.json();

    if (data.success === true) {
      // Remove duplicates from the strands array by using a Set
      const uniqueStrands = [
        ...new Set(data.strands.map((strand) => strand.strand)),
      ];

      // Set the unique strands to state
      setStrandOptions(uniqueStrands);
    } else {
      console.error('Failed to fetch strands:', data.message);
    }
  } catch (error) {
    console.error('Error fetching strands:', error);
  }
};

    fetchStrands();
  }, []);

  // Set initial school year based on the current year
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    setSchoolYear(`${currentYear}-${nextYear}`);
  }, []);

  const handlePrevious = () => {
    navigate('/personalinfo');
  };

  const handleNext = () => {
    const enrollmentData = {
      learnerReferenceNumber,
      gradeLevel,
      schoolYear,
      curriculum,
      strandTrack,
      campus,
      elementary,
      yearGraduatedElem,
      elementaryAwards: elementaryAwards.trim() || 'N/A', // Set to N/A if empty
      elementaryGwa,
      secondary,
      yearGraduatedSec,
      secondaryAwards: secondaryAwards.trim() || 'N/A', // Set to N/A if empty
      secondaryGwa,
      sports: sports.trim() || 'N/A', // Set to N/A if empty
      favoriteSubjects: favoriteSubjects.trim() || 'N/A', // Set to N/A if empty
      ...state,
    };

    navigate('/family-background', { state: enrollmentData });
  };

  return (
    <div className="enrollment-data-form">
      <h2>Enrollment Data</h2>
      <form>
        <div className="form-row-ed">
          <div className="form-group-ed">
            <label>Learner Reference Number <span className="required">*</span></label>
            <input
              type="text"
              value={learnerReferenceNumber}
              onChange={(e) => setLearnerReferenceNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-group-ed">
            <label>Grade Level <span className="required">*</span></label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              required
            >
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>
          <div className="form-group-ed">
            <label>School Year <span className="required">*</span></label>
            <input
              type="text"
              value={schoolYear}
              readOnly
              required
            />
          </div>
        </div>

        <div className="form-row-ed">
          <div className="form-group-ed">
            <label>Curriculum <span className="required">*</span></label>
            <select
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              required
            >
              <option>Select Curriculum</option>
              <option>Old</option>
              <option>New</option>
            </select>
          </div>
          <div className="form-group-ed">
          <label>Strand/Track<span className="required">*</span></label>
            <select
              value={strandTrack}
              onChange={(e) => setStrandTrack(e.target.value)}
              required
            >
              <option>Select Strand/Track</option>
              {strandOptions.map((strand, index) => (
                <option key={index} value={strand}>{strand}</option> // 'strand' is the unique value
              ))}
            </select>
          </div>
          <div className="form-group-ed">
            <label>Campus<span className="required">*</span></label>
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              required
            >
              <option>Select Campus</option>
              <option>Labo Campus</option>
              <option>Daet Campus</option>
            </select>
          </div>
        </div>
        
        <hr className="separator" />

        <div className="form-row-ed">
          <div className="form-group-ed">
            <label>Elementary <span className="required">*</span></label>
            <input
              type="text"
              value={elementary}
              onChange={(e) => setElementary(e.target.value)}
              required
            />
          </div>
          <div className="form-group-ed">
            <label>Year Graduated (Elementary)<span className="required">*</span></label>
            <input
              type="text"
              value={yearGraduatedElem}
              onChange={(e) => handleYearInput(e.target.value, setYearGraduatedElem)}
              placeholder="e.g., 2019"
              required
            />
          </div>
        </div>

        <div className="form-row-ed">
          <div className="form-group-ed">
            <label>Awards/Achievements Received</label>
            <input
              type="text"
              value={elementaryAwards}
              onChange={(e) => setElementaryAwards(e.target.value)}
              placeholder="If none, leave this blank"
            />
          </div>
          <div className="form-group-ed">
            <label>General Weighted Average <span className="required">*</span></label>
            <input
              type="text"
              value={elementaryGwa}
              onChange={(e) => handleNumericInput(e.target.value, setElementaryGwa)}
              placeholder="e.g., 95.6"
              required
            />
          </div>
        </div>

        <hr className="separator" />

        <div className="form-row-ed">
          <div className="form-group-ed">
            <label>Secondary <span className="required">*</span></label>
            <input
              type="text"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              required
            />
          </div>
          <div className="form-group-ed">
            <label>Year Graduated (Secondary)<span className="required">*</span></label>
            <input
              type="text"
              value={yearGraduatedSec}
              onChange={(e) => handleYearInput(e.target.value, setYearGraduatedSec)}
              placeholder="e.g., 2023"
              required
            />
          </div>
        </div>

        <div className="form-row-ed">
          <div className="form-group-ed">
            <label>Awards/Achievements Received</label>
            <input
              type="text"
              value={secondaryAwards}
              onChange={(e) => setSecondaryAwards(e.target.value)}
              placeholder="If none, leave this blank"
            />
          </div>
          <div className="form-group-ed">
            <label>General Weighted Average <span className="required">*</span></label>
            <input
              type="text"
              value={secondaryGwa}
              onChange={(e) => handleNumericInput(e.target.value, setSecondaryGwa)}
              placeholder="e.g., 87.5"
              required
            />
          </div>
        </div>

        <div className="form-row-ed">
          <div className="form-group-ed">
            <label>Sport/s</label>
            <input
              type="text"
              value={sports}
              onChange={(e) => setSports(e.target.value)}
              placeholder="If none, leave this blank"
            />
          </div>
          <div className="form-group-ed">
            <label>Favorite Subject/s</label>
            <input
              type="text"
              value={favoriteSubjects}
              onChange={(e) => setFavoriteSubjects(e.target.value)}
              placeholder="If none, leave this blank"
            />
          </div>
        </div>

        <div className="button-container">
          <button type="button" className="previous-button-ed" onClick={handlePrevious}>
            Previous
          </button>
          <button type="button" className="next-button-ed" onClick={handleNext}>
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnrollmentData;