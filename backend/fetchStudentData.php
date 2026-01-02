<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database connection setup
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northilscoa";  // Your Hostinger database name

// Create the connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Determine which data to fetch based on the request
$dataType = isset($_GET['type']) ? $_GET['type'] : 'all';

// Get the student_id from the request
$studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;

$response = ['success' => true];

// Get gender distribution data
if ($dataType == 'gender' || $dataType == 'all') {
    $genderSql = "SELECT personalinfo.sex as gender, COUNT(*) as count 
                  FROM enrolledstudent 
                  JOIN personalinfo ON enrolledstudent.student_id = personalinfo.student_id 
                  GROUP BY personalinfo.sex";
    
    $genderResult = $conn->query($genderSql);
    $genderData = [];
    
    if ($genderResult && $genderResult->num_rows > 0) {
        while ($row = $genderResult->fetch_assoc()) {
            $genderData[] = [
                'name' => $row['gender'],
                'value' => (int)$row['count'],
                'color' => $row['gender'] == 'Male' ? '#4CAF50' : '#2E7D32'
            ];
        }
    }
    
    $response['genderData'] = $genderData;
}

// Get enrollment data by year
if ($dataType == 'enrollment' || $dataType == 'all') {
    $enrollmentSql = "SELECT YEAR(created_at) as year, COUNT(*) as enrolled 
                      FROM enrolledstudent 
                      WHERE YEAR(created_at) >= 2024 
                      GROUP BY YEAR(created_at) 
                      ORDER BY year";
    
    $enrollmentResult = $conn->query($enrollmentSql);
    $actualEnrollmentData = [];
    
    if ($enrollmentResult && $enrollmentResult->num_rows > 0) {
        while ($row = $enrollmentResult->fetch_assoc()) {
            $actualEnrollmentData[$row['year']] = (int)$row['enrolled'];
        }
    }
    
    // Create array with years 2024-2030 by default
    $enrollmentData = [];
    $colors = ['#1B5E20', '#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784'];
    
    for ($year = 2024; $year <= 2030; $year++) {
        $colorIndex = $year - 2024;
        $enrollmentData[] = [
            'year' => (string)$year,
            'enrolled' => isset($actualEnrollmentData[$year]) ? $actualEnrollmentData[$year] : 0,
            'color' => $colors[$colorIndex % count($colors)]
        ];
    }
    
    // Add any additional years from the database beyond 2030
    foreach ($actualEnrollmentData as $year => $count) {
        if ($year > 2030) {
            $colorIndex = $year - 2024;
            $enrollmentData[] = [
                'year' => (string)$year,
                'enrolled' => $count,
                'color' => $colors[$colorIndex % count($colors)]
            ];
        }
    }
    
    $response['enrollmentData'] = $enrollmentData;
}

// Get strand distribution data - UPDATED TO USE STRAND TABLE
if ($dataType == 'strand' || $dataType == 'all') {
    // First fetch all unique strands from the strand table
    $strandsSql = "SELECT DISTINCT strand FROM strands ORDER BY strand";
    $strandsResult = $conn->query($strandsSql);
    
    $strandData = [];
    $colors = ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9'];
    $colorIndex = 0;
    
    if ($strandsResult && $strandsResult->num_rows > 0) {
        while ($strandRow = $strandsResult->fetch_assoc()) {
            $strandName = $strandRow['strand'];
            
            // For each strand, count enrolled students with this strand_track
            $countSql = "SELECT COUNT(*) as students 
                         FROM enrolledstudent 
                         JOIN enrollmentdata ON enrolledstudent.student_id = enrollmentdata.student_id 
                         WHERE enrollmentdata.strand_track = ?";
            
            $stmt = $conn->prepare($countSql);
            $stmt->bind_param("s", $strandName);
            $stmt->execute();
            $countResult = $stmt->get_result();
            $countRow = $countResult->fetch_assoc();
            
            $studentCount = (int)$countRow['students'];
            
            // Add to the array even if count is 0
            $strandData[] = [
                'strand' => $strandName,
                'students' => $studentCount,
                'color' => $colors[$colorIndex % count($colors)]
            ];
            
            $colorIndex++;
            $stmt->close();
        }
    }
    
    $response['strandData'] = $strandData;
}

// Get user info (name) based on student_id from personalinfo table
if ($studentId) {
    $userSql = "SELECT first_name, middle_name, last_name FROM personalinfo WHERE student_id = ?";
    $stmt = $conn->prepare($userSql);
    $stmt->bind_param("s", $studentId);
    $stmt->execute();
    $userResult = $stmt->get_result();
    
    if ($userResult && $userResult->num_rows > 0) {
        $userRow = $userResult->fetch_assoc();
        
        // Format the name (last name, first name)
        $fullName = $userRow['last_name'] . " " . $userRow['first_name'];
        
        // Add middle name or initial if available
        if (!empty($userRow['middle_name'])) {
            // If middle name is provided, add the first character followed by a period
            $middleInitial = substr($userRow['middle_name'], 0, 1) . ".";
            $fullName .= " " . $middleInitial;
        }
        
        $response['userName'] = $fullName;
    } else {
        $response['userName'] = 'Student'; // Default if no name found
    }
    $stmt->close();
} else {
    $response['userName'] = 'Student'; // Default if no student_id provided
}

// Return the data as JSON
echo json_encode($response);

// Close the database connection
$conn->close();
?>