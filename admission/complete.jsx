import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './complete.css';

const Complete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { date, time } = location.state || { date: '', time: '' };

  return (
      <div className="content">
        <h2>Complete</h2>
        <div className="checkmark">✔</div>
        <p>
          Your application has been successfully submitted. <br />
          Please bring the required documents on <strong>{date}</strong> at <strong>{time}</strong>. See you!
        </p>
        <button className="ok-button" onClick={() => navigate('/')}>
          Ok Got It!
        </button>
      </div>
  );
};

export default Complete;
