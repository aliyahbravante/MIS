import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './finalstep.css'; // Ensure that the CSS is correctly imported

const FinalStep = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location; // This includes data from previous steps

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showCheckboxError, setShowCheckboxError] = useState(false);
  const [scheduleOptions, setScheduleOptions] = useState([]); // State to store fetched schedule data
  const [filteredTimeOptions, setFilteredTimeOptions] = useState([]);

  useEffect(() => {
    console.log("Received data in FinalStep:", state);

    // Fetch the schedule data from the server
    fetchScheduleData();
  }, [state]);

  // Add new useEffect to filter time options when date changes
  useEffect(() => {
    if (date) {
      const times = scheduleOptions
        .filter(item => item.date === date)
        .map(item => item.time);
      setFilteredTimeOptions(times);
      // Reset time selection when date changes
      setTime('');
    } else {
      setFilteredTimeOptions([]);
      setTime('');
    }
  }, [date, scheduleOptions]);

  // Function to fetch the schedule data from the API
  const fetchScheduleData = async () => {
    try {
      // Determine API URL based on environment
      const apiUrl = "http://ncamisshs.com/backend/schedule.php";
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setScheduleOptions(data); // Set the fetched data to state
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    }
  };

  const handlePrevious = () => {
    navigate('/requirements', { state });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  
    // Check if the user confirmed the information
    if (!isConfirmed) {
      setShowCheckboxError(true);
    } else {
      // Collect all necessary data for submission
      const formData = {
        ...state,  // Include all previous step data
        date,      // Include the selected date
        time,      // Include the selected time
      };
  
      // Navigate to the review page with the collected form data
      navigate('/review', { state: formData });
    }
  };
  
  const handleCheckboxChange = () => {
    setIsConfirmed(!isConfirmed);
    setShowCheckboxError(false); // Clear the error when the checkbox is checked
  };

  // Get unique dates from scheduleOptions
  const uniqueDates = Array.from(new Set(scheduleOptions.map(item => item.date)));

  return (
    <div className="final-step-form">
      <h2>Final Step</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row-fs">
          <div className="form-group-fs">
            <label>Date <span className="required">*</span></label>
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            >
              <option value="">Select a date</option>
              {/* Populate date options dynamically from uniqueDates */}
              {uniqueDates.map((uniqueDate) => (
                <option key={uniqueDate} value={uniqueDate}>
                  {uniqueDate}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-fs">
            <label>Time <span className="required">*</span></label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={!date} // Disable time selection if no date is selected
            >
              <option value="">Select a time</option>
              {/* Populate time options dynamically from filteredTimeOptions */}
              {filteredTimeOptions.map((timeOption, index) => (
                <option key={index} value={timeOption}>
                  {timeOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="checkbox-group">
          <div className={`checkbox-container ${showCheckboxError ? 'checkbox-error' : ''}`}>
            <input
              type="checkbox"
              id="confirmCheckbox"
              checked={isConfirmed}
              onChange={handleCheckboxChange}
              className="checkbox-input"
            />
            <label htmlFor="confirmCheckbox" className="check-lbl">
              Confirm that all the information you provided is true and accurate.
            </label>
          </div>

          {showCheckboxError && (
            <span className="checkbox-error-message">
              You must check this box before submitting.
            </span>
          )}
        </div>

        <div className="button-container">
          <button type="button" className="previous-button" onClick={handlePrevious}>
            Previous
          </button>
          <button type="submit" className="submit-button">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinalStep;