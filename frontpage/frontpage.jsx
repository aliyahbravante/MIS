import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { IoMenu, IoClose } from "react-icons/io5"; 
import { LiaHomeSolid } from "react-icons/lia";
import { SlGraduation } from "react-icons/sl";
import { GoGoal } from "react-icons/go";
import { RiQuestionAnswerLine } from "react-icons/ri";
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';


import cnaLogo from '../assets/cnalogo.png';
import pic1 from '../assets/pic1.jpg';
import pic2 from '../assets/pic2.jpg';
import pic3 from '../assets/pic3.jpg';
import pic4 from '../assets/pic4.jpg';
import pic5 from '../assets/pic5.jpg';
import pic6 from '../assets/pic6.jpg';

import './FrontPage.css';

const FrontPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const menuRef = useRef(null);


  const programsOfferedRef = useRef(null);
  const headerSectionRef = useRef(null);
  const visionMissionRef = useRef(null);
  const whyChooseUsRef = useRef(null);

  // Function to scroll to a section and close the menu
  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false); // Close menu after clicking
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);


 
  return (
    <div className="frontpage">
    {/* Navigation Bar */}
    <nav className="navbar-fp">
        <div className="logo-container-fp">
          <img src={cnaLogo} alt="Logo" className="logo-img-fp" />
          <div className="divider-line-fp"></div>
          <div className="logo-text-fp">
            <h1>Northills</h1>
            <h2>College of Asia</h2>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="hamburger-menu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <IoClose /> : <IoMenu />}
        </div>

        {/* Navigation Links */}
        <ul ref={menuRef} className={`nav-links-fp ${menuOpen ? 'active' : ''}`}>
          <li>
            <button onClick={() => scrollToSection(headerSectionRef)}>
              <LiaHomeSolid className="icon-menu" /> Home
            </button>
          </li>
          <li>
            <button onClick={() => scrollToSection(programsOfferedRef)}>
              <SlGraduation className="icon-menu" /> Course
            </button>
          </li>
          <li>
            <button onClick={() => scrollToSection(visionMissionRef)}>
              <GoGoal className="icon-menu" /> Vision & Mission
            </button>
          </li>
          <li>
            <button onClick={() => scrollToSection(whyChooseUsRef)}>
              <RiQuestionAnswerLine className="icon-menu" /> Why Choose Us?
            </button>
          </li>
        </ul>
      </nav>
      <header ref={headerSectionRef} id="header-section" className="header-section">
        <div className="header-content">
          <h1>LEARNING FOR A</h1>
          <h1>BETTER FUTURE</h1>
          <div className="buttons-container">
          <Link to="/admin-login">
            <button>Administrator</button>
            </Link>
            <Link to="/faculty-portal-login">
            <button>Faculty</button>
            </Link>
            <Link to="/student-login">
            <button>Student</button>
            </Link>
            <Link to="/parent-login">
            <button>Parent</button>
            </Link>
            <Link to="/admission-portal">
              <button>Admission</button>
            </Link>
          </div>
        </div>
      </header>

      <section ref={programsOfferedRef} id="programs-offered" className="programs-offered">
    <h2>PROGRAMS OFFERED</h2>
    <div class="campus-container">
        
        <div class="campus-box">
            <h3>DAET CAMPUS</h3>
            
            <div class="program-category">OFFERING ACADEMIC & TVL TRACKS</div>
            <ul class="program-list">
                <li>GAS – General Academic Strand</li>
                <li>ABM – Accountancy, Business and Management</li>
                <li>HUMSS – Humanities and Social Sciences</li>
                <li>HE – Home Economics</li>
                <li>ICT – Information and Communication Technology</li>
            </ul>
            
            <div class="program-category">TESDA ACCREDITED PROGRAMS</div>
            <ul class="program-list">
                <li>Bookkeeping NC II</li>
                <li>Computer System and Servicing NC II</li>
                <li>Food and Beverages Services NC II</li>
                <li>Housekeeping NC II</li>
            </ul>
        </div>

        <div class="campus-box">
            <h3>LABO CAMPUS</h3>
            
            <div class="program-category">OFFERING ACADEMIC & TVL TRACKS</div>
            <ul class="program-list">
                <li>GAS – General Academic Strand</li>
                <li>ABM – Accountancy, Business and Management</li>
                <li>HUMSS – Humanities and Social Sciences</li>
                <li>HE – Home Economics</li>
                <li>ICT – Information and Communication Technology</li>
                <li>IA – Industrial Arts</li>
            </ul>
            
            <div class="program-category">SOON TO OFFER</div>
            <ul class="program-list">
                <li>STEM – Science, Technology, Engineering, and Mathematics</li>
            </ul>

            <div class="program-category">4-YEAR PROGRAM</div>
            <ul class="program-list">
                <li>BSENTREP – Bachelor of Science Entrepreneurship</li>
                <li>BTVTED – Bachelor of Technical - Vocational Teacher Education</li>
                <li>BECED – Bachelor of Early Childhood Education</li>
            </ul>
        </div>

    </div>
</section>

{/* Vision and Mission */}
<section ref={visionMissionRef} id="vision-mission" className="vision-mission">
  <h2>INSTITUTIONAL VISION AND MISSION</h2>
  <div className="vision-mission-container">
    <div className="vision-box">
      <h3>VISION</h3>
      <p>"To be an institution that offers excellent learning experiences and produces globally competent professionals."</p>
    </div>
    <div className="mission-box">
      <h3>MISSION</h3>
      <p>"To deliver quality education through innovative teaching strategies and a strong foundation in both academics and character."</p>
    </div>
  </div>
</section>
{/* Why Choose Us Section */}
<section ref={whyChooseUsRef} id="why-choose-us" className="why-choose-us">
<h2>WHY CHOOSE US?</h2>
        <div className="why-slider-container">
          <Swiper
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            loop={true}
            slidesPerView="auto"
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 1.5,
              slideShadows: true,
            }}
            pagination={{ clickable: true }}
            navigation={true}
            modules={[EffectCoverflow, Pagination, Navigation]}
            className="swiper-container"
          >
            <SwiperSlide>
              <img 
                src={pic1} 
                alt="Why Choose Us 1" 
                className="slider-img" 
                onClick={() => setSelectedImage(pic1)}
                style={{ cursor: 'pointer' }}
              />
            </SwiperSlide>
            <SwiperSlide>
              <img 
                src={pic2} 
                alt="Why Choose Us 2" 
                className="slider-img" 
                onClick={() => setSelectedImage(pic2)}
                style={{ cursor: 'pointer' }}
              />
            </SwiperSlide>
            <SwiperSlide>
              <img 
                src={pic3} 
                alt="Why Choose Us 3" 
                className="slider-img" 
                onClick={() => setSelectedImage(pic3)}
                style={{ cursor: 'pointer' }}
              />
            </SwiperSlide>
            <SwiperSlide>
              <img 
                src={pic4} 
                alt="Why Choose Us 4" 
                className="slider-img" 
                onClick={() => setSelectedImage(pic4)}
                style={{ cursor: 'pointer' }}
              />
            </SwiperSlide>
            <SwiperSlide>
              <img 
                src={pic5} 
                alt="Why Choose Us 5" 
                className="slider-img" 
                onClick={() => setSelectedImage(pic5)}
                style={{ cursor: 'pointer' }}
              />
            </SwiperSlide>
            <SwiperSlide>
              <img 
                src={pic6} 
                alt="Why Choose Us 6" 
                className="slider-img" 
                onClick={() => setSelectedImage(pic6)}
                style={{ cursor: 'pointer' }}
              />
            </SwiperSlide>
          </Swiper>
          <p>Our school is a top-tier institution offering quality education and affordable tuition fees.</p>
        </div>
      </section>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div 
          className="image-modal" 
          onClick={() => setSelectedImage(null)}
        >
          <span className="close-modal" onClick={() => setSelectedImage(null)}>&times;</span>
          <img 
            src={selectedImage} 
            alt="Zoomed" 
            className="zoomed-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

{/* Footer */}
<footer className="footer-section">
  <div className="footer-content">
    <img
      src={cnaLogo} // Using the imported logo
      alt="NCA Logo"
      className="footer-logo"
    />
    <p className="footer-quote">"WE CARE FOR YOUR FUTURE"</p>
    <p className="footer-inquiry">FOR INQUIRIES, VISIT US AT:</p>
    <p className="footer-address">
      <strong>NCA Daet Campus</strong> - 3F Guerra Bldg., Gov., Panotes Ave., Daet, Camarines Norte
      <br />
      <strong>NCA Labo Campus</strong> - Maharlika Highway, Bautista, Labo, Camarines Norte
      <br />
      <br />
      <strong>Contact no:</strong> 0918-205-0673 / 0948-440-8224 / 0938-636-5081
      <br />
      <strong>Fb:</strong>{' '}
      <a href="https://www.facebook.com/share/17XKcdy8BR/" target="_blank" rel="noopener noreferrer" className="footer-link">
        https://www.facebook.com/share/17XKcdy8BR/
      </a>
      <br />
      <a href="https://www.facebook.com/NCALaboCampus?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="footer-link">
        https://www.facebook.com/NCALaboCampus?mibextid=ZbWKwL
      </a>
    </p>
  </div>
</footer>

    </div>
  );
};

export default FrontPage;