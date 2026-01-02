import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./viewschedule.css";

const ViewSchedule = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { date, time } = location.state || {};

  const [studentDetails, setStudentDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (date && time) {
      fetchStudentDetails();
    } else {
      setError("Date and time parameters are missing");
      setLoading(false);
    }
  }, [date, time]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = "http://ncamisshs.com/backend";
      const response = await fetch(`${baseUrl}/view-schedule.php?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Map each student with a computed `submitted` status
        setStudentDetails(
          data.students.map((student) => ({
            ...student,
            submitted:
              student.birth_certificate === "SUBMITTED" &&
              student.good_moral === "SUBMITTED" &&
              student.highschool_diploma === "SUBMITTED" &&
              student.TOR === "SUBMITTED" &&
              student.id_picture === "SUBMITTED",
          }))
        );
      } else {
        throw new Error(data.message || "Failed to fetch student details.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to view applicant details
  const viewApplicantDetails = (student_id) => {
    // Navigate to the ViewApplicants page with the student_id
    navigate('/viewapplicants', { state: { student_id } });
  };

  return (
    <div className="schedule-container">
      <div className="viewschedule-header">
        <button
          type="button"
          className="breadcrumb-schedule"
          onClick={() => navigate("/schedule")}
        >
          Submission Date /
        </button>
      </div>
      <h2 className="viewschedule-title">{date} - {time}</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : studentDetails.length > 0 ? (
        <div className="table-responsive">
          <table className="view-schedule-table">
            <thead>
              <tr>
                <th>NO.</th>
                <th>NAME</th>
                <th>STRAND</th>
                <th>EMAIL</th>
                <th>CP NUMBER</th>
                <th>LEARNER REFERENCE NUMBER (LRN)</th>
                <th>SUBMITTED</th>
                
              </tr>
            </thead>
            <tbody>
              {studentDetails.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{index + 1}</td>
                  <td>{student.name}</td>
                  <td>{student.strand}</td>
                  <td>{student.email}</td>
                  <td>{student.contact_number}</td>
                  <td>{student.LRN}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="submitted-checkbox"
                      checked={student.submitted}
                      disabled
                    />
                  </td>
                  <td>
                  
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No students found for the selected date and time.</p>
      )}
    </div>
  );
};

export default ViewSchedule;