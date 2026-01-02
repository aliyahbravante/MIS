import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './studentdashboard.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_BASE_URL = "https://ncamisshs.com/backend";

const StudentDashboard = () => {
  const location = useLocation();
  const studentId = location.state?.student_id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    subjectsData: [
      { name: 'Completed', value: 0, color: '#0f6b51', count: 0 }, 
      { name: 'Remaining', value: 0, color: '#19ac83', count: 0 },
    ],
    paymentData: [
      { name: 'Paid', value: 0, color: '#0f6b51', amount: 0 },
      { name: 'Remaining', value: 0, color: '#19ac83', amount: 0 },
    ],
    gradesData: [], 
    gwaData: [],
    userName: `Student ${studentId || 'Unknown'}`,
    hasSubjectsData: false,
    hasPaymentData: false,
    hasGradesData: false,
    hasGwaData: false
  });
  const [totalFees, setTotalFees] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState('1ST');

  // Helper to normalize semester values
  const normalizeSemester = (sem) => {
    if (!sem) return '1ST';
    const s = (sem + '').trim().toUpperCase();
    if (s === '2ND' || s === '2ND SEM' || s === 'SECOND' || s === 'SECOND SEM') return '2ND';
    return '1ST';
  };

  // Function to fetch student details
  const fetchStudentDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/student_details.php`, {
        params: { student_id: studentId }
      });

      if (response.data.success && response.data.data.personalinfo) {
        const { first_name, last_name } = response.data.data.personalinfo;
        return `${first_name} ${last_name}`;
      } else {
        console.error('Failed to fetch student details:', response.data.message);
        return `Student ${studentId}`;
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      return `Student ${studentId}`;
    }
  };

  // Fetch GWA data separately
  useEffect(() => {
    const fetchGwaPerSemester = async () => {
      if (!studentId) return;

      try {
        const gradesResponse = await axios.get(`${API_BASE_URL}/fetch_grades_by_student.php`, {
          params: { student_id: studentId }
        });
        
        console.log('GWA Fetch Response:', gradesResponse.data);
        
        let hasGwaData = false;
        let gwaData = [];

        if (gradesResponse.data.success && Array.isArray(gradesResponse.data.grades)) {
          const allGrades = gradesResponse.data.grades;
          console.log('All Grades for GWA:', allGrades);

          if (allGrades.length > 0) {
            // Group grades by semester
            const semesterGrades = {
              '1ST': [],
              '2ND': []
            };

            // Collect valid grades for each semester
            allGrades.forEach(grade => {
              console.log('Processing grade:', grade);
              console.log('Semester value:', grade.semester);
              console.log('Final grade value:', grade.final_grade);
              
              const sem = normalizeSemester(grade.semester);
              console.log('Normalized semester:', sem);
              
              const finalGrade = parseFloat(grade.final_grade);
              
              if (!isNaN(finalGrade) && finalGrade >= 0 && finalGrade <= 100) {
                semesterGrades[sem].push(finalGrade);
                console.log(`Added grade ${finalGrade} to ${sem}`);
              }
            });

            console.log('Semester Grades:', semesterGrades);

            // Calculate GWA for each semester
            const firstSemGwa = semesterGrades['1ST'].length > 0 
              ? Number((semesterGrades['1ST'].reduce((sum, grade) => sum + grade, 0) / semesterGrades['1ST'].length).toFixed(2))
              : null;

            const secondSemGwa = semesterGrades['2ND'].length > 0
              ? Number((semesterGrades['2ND'].reduce((sum, grade) => sum + grade, 0) / semesterGrades['2ND'].length).toFixed(2))
              : null;

            console.log('First Sem GWA:', firstSemGwa);
            console.log('Second Sem GWA:', secondSemGwa);

            // Always show both semesters (with 0 for semesters with no data)
            if (firstSemGwa !== null || secondSemGwa !== null) {
              hasGwaData = true;
            }
            
            // Always add both semesters to the chart
            gwaData.push({
              sem: '1ST SEM',
              gwa: firstSemGwa || 0,
              color: '#1E9C75',
              hasData: firstSemGwa !== null
            });
            
            gwaData.push({
              sem: '2ND SEM',
              gwa: secondSemGwa || 0,
              color: '#91DCC3',
              hasData: secondSemGwa !== null
            });
          }
        }

        console.log('Final GWA Data:', gwaData);
        console.log('Has GWA Data:', hasGwaData);

        setDashboardData(prevData => {
          const updated = {
            ...prevData,
            gwaData: gwaData,
            hasGwaData: hasGwaData
          };
          console.log('Updated Dashboard Data with GWA:', updated);
          return updated;
        });
      } catch (err) {
        console.error('Error in fetchGwaPerSemester:', err);
      }
    };

    fetchGwaPerSemester();
  }, [studentId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student details first
        const studentName = await fetchStudentDetails();
        
        // Initialize flags for data availability
        let hasSubjectsData = false;
        let hasPaymentData = false;
        let hasGradesData = false;

        // Fetch subjects
        const subjectsResponse = await axios.get(`${API_BASE_URL}/fetch_subjects.php`, {
          params: { student_id: studentId }
        });

        let subjectsWithGrades = [];
        if (Array.isArray(subjectsResponse.data) && subjectsResponse.data.length > 0) {
          hasSubjectsData = true;

          // Fetch grades for each subject
          subjectsWithGrades = await Promise.all(
            subjectsResponse.data.map(async (subject) => {
              try {
                const gradesResponse = await axios.get(`${API_BASE_URL}/fetch_grades.php`, {
                  params: { subject_id: subject.subject_id }
                });
                
                const grades = gradesResponse.data.grades || [];
                const studentGrade = grades.find(g => g.student_id === studentId);

                // Use normalized semester from the grade record if available, otherwise fallback to subject.semester
                const semester = studentGrade && studentGrade.semester
                  ? normalizeSemester(studentGrade.semester)
                  : normalizeSemester(subject.semester);

                return {
                  ...subject,
                  grade: studentGrade ? studentGrade.final_grade : null,
                  isCompleted: studentGrade && studentGrade.final_grade !== null,
                  semester: semester,
                  first_quarter: studentGrade ? studentGrade.first_quarter : null,
                  second_quarter: studentGrade ? studentGrade.second_quarter : null
                };
              } catch (error) {
                console.error(`Error fetching grades for subject ${subject.subject_id}:`, error);
                return { ...subject, grade: null, isCompleted: false, first_quarter: null, second_quarter: null };
              }
            })
          );
        }

        // Fetch payment records
        let paymentRecords = [];
        let totalPaid = 0;
        let totalBalance = 0;
        let totalFees = 5000; // Always 5000 for the school
        let isVoucher = false;

        try {
          const paymentResponse = await axios.get(`${API_BASE_URL}/fetch_payment_records.php`, {
            params: { student_id: studentId }
          });

          console.log('Payment Response:', paymentResponse.data);

          if (paymentResponse.data.success && Array.isArray(paymentResponse.data.payment_records)) {
            paymentRecords = paymentResponse.data.payment_records;
            
            if (paymentRecords.length > 0) {
              hasPaymentData = true;
              
              // Check if any payment is a voucher (case-insensitive check)
              const voucherPayment = paymentRecords.find(payment => 
                payment.mode_of_payment && 
                payment.mode_of_payment.toLowerCase().trim().includes('voucher')
              );
              
              console.log('Voucher Payment Found:', voucherPayment);
              
              if (voucherPayment) {
                // Student has voucher - fully paid
                isVoucher = true;
                totalPaid = 5000;
                totalBalance = 0;
                console.log('Student is on voucher - Fully Paid');
              } else {
                // Regular payment - calculate from records
                // Sum all amount_paid for total paid
                totalPaid = paymentRecords.reduce((sum, record) => {
                  const amount = parseFloat(record.amount_paid || 0);
                  return sum + amount;
                }, 0);

                // Find the latest payment record to get the most recent balance
                const latestPayment = paymentRecords.reduce((latest, current) => {
                  const latestId = latest.receipt_number ? parseInt(latest.receipt_number) : parseInt(latest.payment_id);
                  const currentId = current.receipt_number ? parseInt(current.receipt_number) : parseInt(current.payment_id);
                  return currentId > latestId ? current : latest;
                });

                totalBalance = latestPayment ? parseFloat(latestPayment.balance || 0) : 0;
                
                // Ensure total doesn't exceed 5000
                if (totalPaid > 5000) {
                  totalPaid = 5000;
                  totalBalance = 0;
                }
                
                console.log('Regular Payment - Paid:', totalPaid, 'Balance:', totalBalance);
              }
            } else {
              // No payment records yet - show default values
              hasPaymentData = true;
              totalPaid = 0;
              totalBalance = 5000;
              console.log('No payment records - Default values');
            }
          } else {
            // No payment data at all - show default values
            hasPaymentData = true;
            totalPaid = 0;
            totalBalance = 5000;
            console.log('No payment data from API - Default values');
          }
        } catch (error) {
          console.error('Payment records fetch error:', error.response?.data || error.message);
          // Even on error, show default values
          hasPaymentData = true;
          totalPaid = 0;
          totalBalance = 5000;
        }

        // Calculate subjects data
        let subjectsData = [
          { name: 'Completed', value: 0, color: '#0f6b51', count: 0 },
          { name: 'Remaining', value: 0, color: '#19ac83', count: 0 }
        ];

        if (hasSubjectsData && subjectsWithGrades.length > 0) {
          const completedSubjects = subjectsWithGrades.filter(subject => subject.isCompleted);
          const remainingSubjects = subjectsWithGrades.filter(subject => !subject.isCompleted);
          
          const totalSubjects = subjectsWithGrades.length;
          const completedCount = completedSubjects.length;
          const remainingCount = remainingSubjects.length;

          subjectsData = [
            { 
              name: 'Completed', 
              value: (completedCount / totalSubjects) * 100, 
              color: '#0f6b51', 
              count: completedCount 
            },
            { 
              name: 'Remaining', 
              value: (remainingCount / totalSubjects) * 100, 
              color: '#19ac83', 
              count: remainingCount 
            }
          ];
        }

        // Calculate payment data with voucher handling
        let paymentData = [
          { name: 'Paid', value: 0, color: '#0f6b51', amount: 0 },
          { name: 'Remaining', value: 0, color: '#19ac83', amount: 0 }
        ];

        if (hasPaymentData && totalFees > 0) {
          // Calculate percentages
          const paidPercent = (totalPaid / totalFees) * 100;
          const balancePercent = (totalBalance / totalFees) * 100;

          paymentData = [
            {
              name: 'Paid',
              value: paidPercent,
              color: '#0f6b51',
              amount: totalPaid
            },
            {
              name: 'Remaining',
              value: balancePercent,
              color: '#19ac83',
              amount: totalBalance
            }
          ];

          console.log('Final Payment Data:', paymentData);
          console.log('Paid:', totalPaid, 'Balance:', totalBalance, 'Total:', totalFees);
        }

        // Prepare grades data for the chart based on selected semester
        let gradesData = [];
        if (hasSubjectsData && subjectsWithGrades.length > 0) {
          const filteredGrades = subjectsWithGrades.filter(subject => {
            return subject.grade !== null && subject.semester === selectedSemester;
          });

          if (filteredGrades.length > 0) {
            hasGradesData = true;
            gradesData = filteredGrades
              .map(subject => ({
                subject: subject.description,
                grade: parseFloat(subject.grade),
                color: '#1E9C75'
              }))
              .sort((a, b) => b.grade - a.grade);
          }
        }

        setDashboardData(prevData => ({
          ...prevData,
          subjectsData: subjectsData,
          paymentData: paymentData,
          gradesData: gradesData,
          userName: studentName,
          hasSubjectsData: hasSubjectsData,
          hasPaymentData: hasPaymentData,
          hasGradesData: hasGradesData
        }));
        setTotalFees(totalFees);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchData();
    } else {
      setError('Student ID not found. Please log in again.');
      setLoading(false);
    }
  }, [studentId, selectedSemester]);

  // Custom renderer for donut chart labels
  const renderCustomizedDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Component for displaying "No data" message
  const NoDataMessage = ({ message }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px',
      color: '#666',
      fontSize: '14px',
      fontStyle: 'italic'
    }}>
      {message}
    </div>
  );

  if (loading) {
    return <div className="loading-container">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard-container-sd">
      <h1 className="dashboard-title-sd">Dashboard <span>/ {dashboardData.userName}</span></h1>

      <div className="dashboard-grid">
        {/* First row with two cards */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <h3 className="card-title-sd">SUBJECTS OVERVIEW</h3>
            <div className="chart-container">
              {!dashboardData.hasSubjectsData ? (
                <NoDataMessage message="No subjects data available" />
              ) : (
                <>
                  <div className="chart-header">
                    <div className="chart-summary">
                      <div className="summary-item">
                        <div className="summary-value">{dashboardData.subjectsData.reduce((acc, item) => acc + item.count, 0)}</div>
                        <div className="summary-label">Total Subjects</div>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={dashboardData.subjectsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        label={renderCustomizedDonutLabel}
                      >
                        {dashboardData.subjectsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => {
                        const item = props.payload;
                        return [`${value.toFixed(1)}% (${item.count} subjects)`, name];
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-legend">
                    {dashboardData.subjectsData.map((entry, index) => (
                      <div key={`legend-${index}`} className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: entry.color }}></div>
                        <span>{entry.name} ({entry.count})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title-sd">PAYMENT STATUS</h3>
            {!dashboardData.hasPaymentData ? (
              <NoDataMessage message="No payment data available" />
            ) : (
              <div className="chart-container">
                <div className="chart-header">
                  <div className="chart-summary">
                    <div className="summary-item">
                      <div className="summary-value">₱{totalFees.toLocaleString()}</div>
                      <div className="summary-label">Total Fees</div>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboardData.paymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      label={renderCustomizedDonutLabel}
                    >
                      {dashboardData.paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => {
                      const item = props.payload;
                      return [`${value.toFixed(1)}% (₱${item.amount.toLocaleString()})`, name];
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {dashboardData.paymentData.map((entry, index) => (
                    <div key={`legend-${index}`} className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: entry.color }}></div>
                      <span>{entry.name} (₱{entry.amount.toLocaleString()})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Second row with two cards */}
        <div className="dashboard-row">
          <div className="dashboard-card grade-performance-card">
            <h3 className="card-title-sd">GRADE PERFORMANCE</h3>
            <div className="semester-filter">
              <select 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="semester-select"
              >
                <option value="1ST">1ST Semester</option>
                <option value="2ND">2ND Semester</option>
              </select>
            </div>
            {!dashboardData.hasGradesData ? (
              <NoDataMessage message={`No grade data available for ${selectedSemester} semester`} />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  data={dashboardData.gradesData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis 
                    dataKey="subject" 
                    type="category" 
                    width={80}
                    tick={{ fontSize: 9, fill: '#555' }}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, 'Grade']} />
                  <Bar dataKey="grade" radius={[0, 10, 10, 0]}>
                    {dashboardData.gradesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="dashboard-card">
            <h3 className="card-title-sd">GWA PER SEMESTER</h3>
            {!dashboardData.hasGwaData ? (
              <NoDataMessage message="No GWA data available" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  data={dashboardData.gwaData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="sem" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const hasData = props.payload.hasData;
                      return hasData ? [`${value}`, 'GWA'] : ['No data yet', ''];
                    }} 
                  />
                  <Bar dataKey="gwa" radius={[10, 10, 0, 0]}>
                    {dashboardData.gwaData.map((entry, index) => (
                      <Cell 
                        key={`cell-gwa-${index}`} 
                        fill={entry.hasData ? entry.color : '#E0E0E0'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;