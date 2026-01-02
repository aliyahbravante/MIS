import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FaArrowLeft } from 'react-icons/fa';
import './accountregistration.css';

import cnaLogo from '../assets/cnalogo.png';
const AccountRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [inlineError, setInlineError] = useState('');
  const [highlightedFields, setHighlightedFields] = useState([]);

  const handleBackToFrontpage = () => {
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setHighlightedFields((prevFields) => prevFields.filter(field => field !== e.target.name));
  };

  const handleRegister = async () => {
    const emptyFields = Object.keys(formData).filter(field => !formData[field]);

    if (emptyFields.length > 0) {
      setInlineError("Please fill in all fields.");
      setHighlightedFields(emptyFields);
      return;
    }

    if (!formData.email.endsWith('@gmail.com')) {
      setInlineError("Please enter a valid Gmail address (e.g., yourname@gmail.com).");
      setHighlightedFields(['email']);
      return;
    }

    if (formData.password && !formData.confirm_password) {
      setInlineError("Please confirm your password.");
      setHighlightedFields(['confirm_password']);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setInlineError("Passwords do not match!");
      setHighlightedFields(['password', 'confirm_password']);
      return;
    }

    try {
      const response = await fetch('http://ncamisshs.com/backend/accountreg.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const emailResult = await sendEmail(formData.email, formData.first_name, formData.last_name);

        if (emailResult && emailResult.success) {
          setModalMessage("Registration successful! A confirmation email has been sent.");
        } else {
          setModalMessage("Registration successful, but failed to send confirmation email.");
        }

        setModalOpen(true);

        setTimeout(() => {
          setModalOpen(false);
          navigate('/admission-login');
        }, 3000);
      } else if (result.error === "email_exists") {
        setInlineError("An account with this email already exists.");
        setHighlightedFields(['email']);
      } else {
        setInlineError(result.message || 'Registration failed!');
      }
    } catch (error) {
      console.error("Error:", error);
      setModalMessage('An error occurred while registering.');
      setModalOpen(true);
    }
  };

  const sendEmail = async (email, firstName, lastName) => {
    try {
        const response = await fetch('http://ncamisshs.com/backend/send_email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, first_name: firstName, last_name: lastName })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, message: "Error sending email." };
    }
};

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const closeModal = () => setModalOpen(false);

  return (
    <div className="admin-container">
      <div className="regis-background-image">
            <button className="back-button-upper-left" onClick={handleBackToFrontpage}>
                  <FaArrowLeft className="back-icon-upper" />
                  Back
                </button>
        <div className="registration-box-ar">
          <img src={cnaLogo} alt="Logo" className="logo-img-ar" />
          <h2 className="regis-system-title">ONLINE PRE-ADMISSION SYSTEM</h2>
          <h2 className="welcome-title-ar">Welcome Future NCAeans!</h2>
          <div className="login-form">
            <hr className="separator-ar" />
            <h2 className="register-title-ar">ACCOUNT REGISTRATION</h2>
            <input type="text" name="first_name" placeholder="First Name" className={`input-field-ar ${highlightedFields.includes('first_name') ? 'highlight' : ''}`} value={formData.first_name} onChange={handleChange} />
            <input type="text" name="last_name" placeholder="Last Name" className={`input-field-ar ${highlightedFields.includes('last_name') ? 'highlight' : ''}`} value={formData.last_name} onChange={handleChange} />
            <input type="email" name="email" placeholder="Email" className={`input-field-ar ${highlightedFields.includes('email') ? 'highlight' : ''}`} value={formData.email} onChange={handleChange} />
            <div className="password-container-arr">
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" className={`input-field-ar ${highlightedFields.includes('password') ? 'highlight' : ''}`} value={formData.password} onChange={handleChange} />
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="eye-icon-arr" onClick={togglePasswordVisibility} />
            </div>
            <div className="password-container-arr">
              <input type={showConfirmPassword ? "text" : "password"} name="confirm_password" placeholder="Confirm Password" className={`input-field-ar ${highlightedFields.includes('confirm_password') ? 'highlight' : ''}`} value={formData.confirm_password} onChange={handleChange} />
              <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="eye-icon-arr" onClick={toggleConfirmPasswordVisibility} />
            </div>
            {inlineError && <p className="inline-error">{inlineError}</p>}
            <button className="regis-button-ar" onClick={handleRegister}>REGISTER</button>
            {/* Log in link */}
            <p className="login-message-ar">
  If you already have an account, then
  <span className="login-link-ar" onClick={() => navigate('/admission-login')}> LOG IN</span>
</p>

          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay-ar">
          <div className="modal-content-ar">
            <h2>{modalMessage}</h2>
            <button onClick={closeModal} className="modal-close-button-ar">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountRegistration;
