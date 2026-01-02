import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './applicants.css';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Applicants = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // API base URL
  const API_BASE_URL = 'http://ncamisshs.com/backend/fetch_applicants.php';
  const AUDIT_LOG_URL = 'http://ncamisshs.com/backend/audit_log.php';

  // Function to remove duplicates based on student_id
  const removeDuplicates = useCallback((applicantsArray) => {
    const seen = new Set();
    return applicantsArray.filter(applicant => {
      // Use student_id as primary identifier, fallback to email if student_id is null
      const identifier = applicant.student_id || applicant.email || `${applicant.name}_${applicant.contact_number}`;
      
      if (seen.has(identifier)) {
        return false; // Skip duplicate
      }
      seen.add(identifier);
      return true;
    });
  }, []);

  // Function to log audit
  const logAudit = useCallback(async (applicantName) => {
    try {
      const response = await fetch(AUDIT_LOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: 'Admin',
          action: 'VIEW',
          details: `Viewed Applicant Detail: ${applicantName}`
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to log audit:', result.message);
      }
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }, [AUDIT_LOG_URL]);

  // Fetch applicants from the server
  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      console.log("Fetching applicants from:", API_BASE_URL);
      
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("Raw response:", text);
      
      // Check if response is empty
      if (!text || text.trim() === '') {
        setApplicants([]);
        return;
      }
      
      try {
        const data = JSON.parse(text);
        console.log("Parsed data:", data);
        
        if (data.success && Array.isArray(data.applicants)) {
          // Remove duplicates before setting state
          const uniqueApplicants = removeDuplicates(data.applicants);
          setApplicants(uniqueApplicants);
          console.log(`Fetched ${data.applicants.length} applicants, ${uniqueApplicants.length} unique`);
        } else {
          throw new Error(data.message || 'Failed to fetch applicants or invalid data format');
        }
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        throw new Error(`JSON parsing error: ${jsonError.message}`);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching applicants:', err);
      // Don't clear existing data on error, just show error message
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, removeDuplicates]);

  // Load applicants on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadApplicants = async () => {
      if (isMounted) {
        await fetchApplicants();
      }
    };
    
    loadApplicants();
    
    return () => {
      isMounted = false;
    };
  }, [fetchApplicants]);

  const viewApplicant = useCallback(async (applicantData) => {
    try {
      // Log the audit before navigating
      await logAudit(applicantData.name || 'Unknown Applicant');
      
      // Pass the student_id to the view details page using React Router's navigate method
      navigate('/view-applicants', { 
        state: { student_id: applicantData.student_id },
        replace: false // Ensure we don't replace current history entry
      });
    } catch (error) {
      console.error('Error in viewApplicant:', error);
    }
  }, [navigate, logAudit]);

  const goToSchedule = useCallback(() => {
    navigate('/schedule');
  }, [navigate]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Memoized filtered applicants to prevent unnecessary recalculations
  const filteredApplicants = useMemo(() => {
    if (!searchQuery.trim()) {
      return applicants;
    }
    
    const searchLower = searchQuery.toLowerCase().trim();
    return applicants.filter((applicant) => {
      const name = applicant.name?.toLowerCase() || '';
      const email = applicant.email?.toLowerCase() || '';
      const contactNumber = applicant.contact_number?.toLowerCase() || '';
      const lrn = applicant.LRN?.toLowerCase() || '';
      
      return (
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        contactNumber.includes(searchLower) ||
        lrn.includes(searchLower)
      );
    });
  }, [applicants, searchQuery]);

  // Generate unique key for each row
  const getRowKey = useCallback((applicant, index) => {
    return applicant.student_id || 
           `${applicant.email}_${index}` || 
           `${applicant.name}_${applicant.contact_number}_${index}` ||
           `applicant_${index}`;
  }, []);

  return (
    <div className="applicants-container-ap">
      <div className="header-ap">
        <h2 className="application-title-ap">APPLICANTS LIST</h2>
        <p className="total-label-ap">Total: <span className="total-count-ap">{filteredApplicants.length}</span></p>
      </div>

      <div className="top-controls-applicants-ap">
        <div className="search-bar-applicants-ap">
          <input 
            type="text" 
            placeholder="Search by name, email, contact or LRN" 
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <button className="schedule-button-ap" onClick={goToSchedule}>Schedule</button>
      </div>

      {loading ? (
        <div className="loading-indicator">Loading applicants...</div>
      ) : error ? (
        <div className="error-message">
          Error: {error}
          <button 
            onClick={fetchApplicants} 
            style={{ 
              marginLeft: '10px', 
              padding: '5px 10px', 
              backgroundColor: '#006400', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="application-table-container-ap">
          <table className="application-table-ap">
            <thead>
              <tr>
                <th>NO.</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>CONTACT NUMBER</th>
                <th>LEARNER REFERENCE NUMBER (LRN)</th>
                <th>VIEW</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((applicant, index) => (
                  <tr key={getRowKey(applicant, index)}>
                    <td>{index + 1}</td>
                    <td>{applicant.name || 'N/A'}</td>
                    <td>{applicant.email || 'N/A'}</td>
                    <td>{applicant.contact_number || 'N/A'}</td>
                    <td>{applicant.LRN || 'N/A'}</td>
                    <td>
                      <FaEye
                        className="view-icon-ap"
                        onClick={() => viewApplicant(applicant)}
                        style={{ cursor: 'pointer', color: '#006400' }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    {searchQuery ? 'No applicants found matching your search' : 'No applicants found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Applicants;