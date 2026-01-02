import React from 'react';
import { HashRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';

import Sidebar from './sidebar/sidebar';
import AdminSidebar from './sidebar/adminsidebar';
import StudentSidebar from './sidebar/studentsidebar';
import ParentSidebar from './sidebar/parentsidebar'; 
import FacultySidebar from './sidebar/facultysidebar'; 
import Applicants from './admin/applicants';
import PersonalInfoForm from './admission/personalinfo';
import EnrollmentData from './admission/enrollmentdata';
import FamilyBackground from './admission/familybackground';
import Requirements from './admission/requirements';
import FinalStep from './admission/finalstep';
import Review from './admission/review';
import Complete from './admission/complete';
import FrontPage from './frontpage/frontpage';
import AdmissionPortal from './admission/admissionportal';
import AdmissionLogin from './admission/admissionlogin';
import AccountRegistration from './admission/accountregistration';
import OfficiallyEnrolled from './admission/officiallyenrolled';
import OldStudent from './admission/oldstudent'; // ✅ Add this import
import SubmittedEnrollment from './admission/submittedenrollment'; // ✅ Add this import
import AdminLogin from './admin/adminlogin';
import FacultyLogin from './facultyportal/facultylogin';
import ParentLogin from './parent/parentlogin';
import StudentLogin from './student/studentlogin';
import ViewApplicants from './admin/viewapplicants';
import EnrolledStudents from './admin/enrolledstudents';
import ProfileEnrolledStudents from './admin/profileenrolledstudents';
import Subjects from './admin/subjects';
import Strands from './admin/strands';
import Schedule from './admin/schedule';
import ViewSchedule from './admin/viewschedule';
import Faculty from './admin/faculty';
import Payment from './admin/payment';
import AdmissionResult from './admission/admissionresult';
import Dashboard from './admin/dashboard';
import StudentDashboard from './student/studentdashboard';
import StudentProfile from './student/studentprofile';
import StudentEnrolledSubject from './student/studentenrolledsubject';
import StudentGrades from './student/studentgrades';
import StudentPaymentRecords from './student/studentpaymentrecords';
import ParentDashboard from './parent/parentsdashboard';
import PStudentProfile from './parent/pstudentprofile';
import PStudentEnrolledSubject from './parent/pstudentenrolledsubject';
import PStudentGrades from './parent/pstudentgrades';
import PStudentPaymentRecords from './parent/pstudentpaymentrecords';
import FacultyDashboard from './facultyportal/facultydashboard';
import FacultyProfile from './facultyportal/facultyprofile';
import SubjectSchedule from './facultyportal/subjectschedule';
import SubjectEnrolledStudents from './facultyportal/subjectenrolledstudents';
import FGrades from './facultyportal/fgrades';
import Announcement from './admin/announcement';
import AdminReport from './admin/adminreport';
import AuditLogs from './admin/auditlogs';

const App = () => {
  const location = useLocation();

  const getActiveStep = () => {
    switch (location.pathname) {
      case '/enrollment-data':
        return 2;
      case '/family-background':
        return 3;
      case '/requirements':
        return 4;
      case '/final-step':
        return 5;
      case '/review':
        return 6;
      case '/complete':
        return 7;
      case '/admission-result':
          return 8;
      default:
        return 1;
    }
  };

  const excludedSidebarPaths = [
    '/',
    '/admission-portal', 
    '/admission-login',
    '/account-registration',
    '/old-student', // ✅ Add this to excluded paths
    '/submittedenrollment', // ✅ Add this to excluded paths
    '/admin-login',
    '/officially-enrolled',
    '/view-applicants',
    '/applicants',
    '/enrolled-students',
    '/profile-enrolled-students',
    '/subjects',
    '/strands',
    '/schedule',
    '/view-schedule',
    '/faculty',
    '/payment',
    '/dashboard',
    '/faculty-portal-login',    
    '/parent-login',    
    '/student-login',
    '/student-dashboard',
    '/student-profile',
    '/student-enrolled-subject',
    '/student-grades',
    '/student-payment-records',
    '/parent-dashboard',
    '/p-student-profile',
    '/p-student-enrolled-subject',
    '/p-student-grades',
    '/p-student-payment-records',
    '/faculty-dashboard',
    '/faculty-profile',
    '/subject-schedule',
    '/subject-enrolled-students',
    '/fgrades',
    '/announcement',
    '/admin-report',
    '/audit-logs',
  ];

  const adminSidebarPaths = [
    '/applicants',
    '/view-applicants',
    '/enrolled-students',
    '/profile-enrolled-students',
    '/subjects',
    '/strands',
    '/schedule',
    '/view-schedule',
    '/payment',
    '/faculty',
    '/dashboard',
    '/announcement',
    '/admin-report',
    '/audit-logs',
  ];
  const studentSidebarPaths = [
    '/student-dashboard',
    '/student-profile',
    '/student-enrolled-subject',
    '/student-grades',
    '/student-payment-records',
  ];

  const parentSidebarPaths = [
    '/parent-dashboard',
    '/p-student-profile',
    '/p-student-enrolled-subject',
    '/p-student-grades',
    '/p-student-payment-records',
  ];

  const facultySidebarPaths = [
    '/faculty-dashboard',
    '/faculty-profile',
    '/subject-schedule',
    '/subject-enrolled-students',
    '/fgrades',
  ];

  
  return (
    <div className="app-container">
      {/* Render Sidebar unless the current path is in excludedSidebarPaths */}
      {!excludedSidebarPaths.includes(location.pathname) && 
      !adminSidebarPaths.includes(location.pathname) &&
      !studentSidebarPaths.includes(location.pathname) &&
      !parentSidebarPaths.includes(location.pathname) &&
      !facultySidebarPaths.includes(location.pathname) && (
        <div className="sidebar-container">
          <Sidebar activeStep={getActiveStep()} />
        </div>
      )}

      {/* Render AdminSidebar if the current path is in adminSidebarPaths */}
      {adminSidebarPaths.includes(location.pathname) && (
        <div className="adminsidebar-container">
          <AdminSidebar />
        </div>
      )}

       {/* Render StudentSidebar if the current path is in studentSidebarPaths */}
       {studentSidebarPaths.includes(location.pathname) && (
        <div className="studentsidebar-container">
          <StudentSidebar />
        </div>
      )}

                {/* Render ParentSidebar if the current path is in parentSidebarPaths */}
                {parentSidebarPaths.includes(location.pathname) && (
        <div className="parentsidebar-container">
          <ParentSidebar />
        </div>
      )}

                      {/* Render FacultySidebar if the current path is in facultySidebarPaths */}
                      {facultySidebarPaths.includes(location.pathname) && (
        <div className="faculty-sidebar-container">
          <FacultySidebar />
        </div>
      )}

      {/* Main content area with specific containers for different routes */}
      <div
        className={`${
          location.pathname === '/' ? '' : // Remove any container class for frontpage
          location.pathname === '/admission-portal' ? 'admissionlogin-container' : 
          location.pathname === '/admission-login' ? 'admissionlogin-container' :
          location.pathname === '/old-student' ? 'admissionlogin-container' : // ✅ Add container class for old-student
          location.pathname === '/submittedenrollment' ? 'admissionlogin-container' : // ✅ Add container class for submitted enrollment
          location.pathname === '/officially-enrolled' ? 'admissionlogin-container' :
          location.pathname === '/admin-login' ? 'login-container' :
          location.pathname === '/faculty-portal-login' ? 'login-container' :
          location.pathname === '/parent-login' ? 'login-container' :
          location.pathname === '/student-login' ? 'login-container' :
          location.pathname === '/account-registration' ? 'accountregistration-container' :
          location.pathname === '/applicants' ? 'second-container' :
          location.pathname === '/view-applicants' ? 'view-applicants-container' :
          location.pathname === '/profile-enrolled-students' ? 'view-applicants-container' :
          location.pathname === '/subjects' ? 'second-container' :
          location.pathname === '/announcement' ? 'second-container' :
          location.pathname === '/admin-report' ? 'second-container' :
          location.pathname === '/audit-logs' ? 'second-container' :
          location.pathname === '/strands' ? 'second-container' :
          location.pathname === '/schedule' ? 'second-container' :
          location.pathname === '/view-schedule' ? 'second-container' :
          location.pathname === '/faculty' ? 'second-container' :
          location.pathname === '/payment' ? 'second-container' :
          location.pathname === '/dashboard' ? 'second-container' :
          location.pathname === '/student-dashboard' ? 'second-container' :
          location.pathname === '/student-profile' ? 'second-container' :
          location.pathname === '/student-enrolled-subject' ? 'second-container' :
          location.pathname === '/student-grades' ? 'second-container' :
          location.pathname === '/student-payment-records' ? 'second-container' :
          location.pathname === '/parent-dashboard' ? 'second-container' :
          location.pathname === '/p-student-profile' ? 'second-container' :
          location.pathname === '/p-student-enrolled-subject' ? 'second-container' :
          location.pathname === '/p-student-grades' ? 'second-container' :
          location.pathname === '/p-student-payment-records' ? 'second-container' :
          location.pathname === '/faculty-dashboard' ? 'second-container' :
          location.pathname === '/faculty-profile' ? 'second-container' :
          location.pathname === '/subject-schedule' ? 'second-container' :
          location.pathname === '/subject-enrolled-students' ? 'second-container' :
          location.pathname === '/fgrades' ? 'second-container' :
          location.pathname === '/enrolled-students' ? 'second-container' : ''
        }`}
      >
        <Routes>
          <Route path="/personalinfo" element={<PersonalInfoForm />} />
          <Route path="/enrollment-data" element={<EnrollmentData />} />
          <Route path="/family-background" element={<FamilyBackground />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/final-step" element={<FinalStep />} />
          <Route path="/review" element={<Review />} />
          <Route path="/complete" element={<Complete />} />
          <Route path="/admission-result" element={<AdmissionResult />} />
          <Route path="/" element={<FrontPage />} />
          <Route path="/admission-portal" element={<AdmissionPortal />} />
          <Route path="/admission-login" element={<AdmissionLogin />} />
          <Route path="/old-student" element={<OldStudent />} /> {/* ✅ Add this route */}
          <Route path="/submittedenrollment" element={<SubmittedEnrollment />} /> {/* ✅ Add this route */}
          <Route path="/officially-enrolled" element={<OfficiallyEnrolled />} />
          <Route path="/account-registration" element={< AccountRegistration />} />
          <Route path="/applicants" element={<Applicants />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/faculty-portal-login" element={<FacultyLogin />} />
          <Route path="/parent-login" element={<ParentLogin />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/view-applicants" element={<ViewApplicants />} />
          <Route path="/enrolled-students" element={<EnrolledStudents />} />
          <Route path="/profile-enrolled-students" element={<ProfileEnrolledStudents />} />
          <Route path="/announcement" element={<Announcement />} />
          <Route path="/admin-report" element={<AdminReport />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/strands" element={<Strands />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/view-schedule" element={<ViewSchedule />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student-profile" element={<StudentProfile/>} />
          <Route path="/student-enrolled-subject" element={<StudentEnrolledSubject/>} />
          <Route path="/student-grades" element={<StudentGrades/>} />
          <Route path="/student-payment-records" element={<StudentPaymentRecords/>} />
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
          <Route path="/p-student-profile" element={<PStudentProfile/>} />
          <Route path="/p-student-enrolled-subject" element={<PStudentEnrolledSubject/>} />
          <Route path="/p-student-grades" element={<PStudentGrades/>} />
          <Route path="/p-student-payment-records" element={<PStudentPaymentRecords/>} />
          <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
          <Route path="/faculty-profile" element={<FacultyProfile />} />
          <Route path="/subject-schedule" element={<SubjectSchedule />} />
          <Route path="/subject-enrolled-students" element={<SubjectEnrolledStudents />} />
          <Route path="/fgrades" element={<FGrades />} />
        </Routes>
      </div>
    </div>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;