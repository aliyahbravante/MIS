import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./submittedenrollment.css";
import backgroundImg from "../assets/frontpage.jpg";

const SubmittedEnrollment = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  const handleGotIt = () => {
    navigate("/admission-portal");
  };

  return (
    <div
      className="submitenrollment-container"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className="submitenrollment-card">
        {/* Circle with check inside */}
        <div className="submitted-enrollment-checkmark-circle">
          <span className="submitted-enrollment-checkmark">✓</span>
        </div>

        <p>
          Enrollment Submitted Successfully!
          <br />
          Please wait for the confirmation of your enrollment status. Welcome
          back and God bless you!
        </p>
        <button className="submitenrollment-btn" onClick={handleGotIt}>
          Got it!
        </button>
      </div>
    </div>
  );
};

export default SubmittedEnrollment;