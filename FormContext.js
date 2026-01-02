import React, { createContext, useState } from 'react';

export const FormContext = createContext();

export const FormProvider = ({ children }) => {
  const [personalInfo, setPersonalInfo] = useState({});
  const [enrollmentData, setEnrollmentData] = useState({});
  const [familyBackground, setFamilyBackground] = useState({});
  const [finalStep, setFinalStep] = useState({});

  return (
    <FormContext.Provider value={{ personalInfo, setPersonalInfo, enrollmentData, setEnrollmentData, familyBackground, setFamilyBackground, finalStep, setFinalStep }}>
      {children}
    </FormContext.Provider>
  );
};
