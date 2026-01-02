import React from 'react';
import { useNavigate } from 'react-router-dom';
import './admissionresult.css';
import { FaRegClock } from "react-icons/fa";

const AdmissionResult = () => {
  const navigate = useNavigate();

  return (
      <div className="content-ar">
        <h2>Waiting for Admitting</h2>
        <li><FaRegClock className="waiting-icon" /></li>
        <p>
          Your application has been successfully submitted. <br />
          Please wait for the Approval of your Admission. God Bless you!
        </p>
        <button className="ok-button-ar" onClick={() => navigate('/')}>
          Ok Got It!
        </button>
      </div>
  );
};

export default AdmissionResult;
