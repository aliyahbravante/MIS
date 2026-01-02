<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// If this is a preflight OPTIONS request, respond with 200 OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Hostinger Database Configuration
$servername = "localhost";
$username = "u572625467_group_v";
$password = "Northills_12345";
$dbname = "u572625467_northillscoa";

// Create connection with error handling
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit();
}

// Initialize response array
$response = [];

// Function to safely execute queries and handle errors
function executeQuery($conn, $sql, $defaultValue = 0) {
    $result = $conn->query($sql);
    if (!$result) {
        error_log("Query failed: " . $conn->error . " - SQL: " . $sql);
        return $defaultValue;
    }
    $row = $result->fetch_assoc();
    return $row ? ($row[array_key_first($row)] ?? $defaultValue) : $defaultValue;
}

// Fetch PENDING applicants
$sql = "SELECT COUNT(*) AS pendingApplicants FROM finalstep WHERE status = 'PENDING'";
$response['pendingApplicants'] = executeQuery($conn, $sql);

// Fetch APPROVED applicants (enrolled students)
$sql = "SELECT COUNT(*) AS enrolledStudents FROM finalstep WHERE status = 'APPROVE'";
$response['enrolledStudents'] = executeQuery($conn, $sql);

// Fetch the number of subjects
$sql = "SELECT COUNT(*) AS subjects FROM subjects";
$response['subjects'] = executeQuery($conn, $sql);

// Fetch the number of strands
$sql = "SELECT COUNT(DISTINCT strand) AS strands FROM strands";
$response['strands'] = executeQuery($conn, $sql);

// Fetch the number of available slots
$sql = "SELECT SUM(slots) AS availableSlots FROM schedule";
$response['availableSlots'] = executeQuery($conn, $sql);

// Fetch the number of faculties
$sql = "SELECT COUNT(*) AS faculties FROM faculty";
$response['faculties'] = executeQuery($conn, $sql);

// Fetch DROP count
$sql = "SELECT COUNT(*) AS dropCount FROM finalstep WHERE status = 'DROP'";
$response['Drop'] = executeQuery($conn, $sql);

// Fetch the number of male and female students who are APPROVED
$sql = "
    SELECT LOWER(pi.sex) AS sex, COUNT(*) AS count 
    FROM personalinfo pi
    JOIN finalstep fs ON pi.student_id = fs.student_id
    WHERE fs.status = 'APPROVE'
    GROUP BY LOWER(pi.sex)";
$result = $conn->query($sql);

// Default values for gender counts
$response['maleStudents'] = 0;
$response['femaleStudents'] = 0;

if ($result) {
    while ($row = $result->fetch_assoc()) {
        if (strtolower($row['sex']) == 'male') {
            $response['maleStudents'] = $row['count'];
        } elseif (strtolower($row['sex']) == 'female') {
            $response['femaleStudents'] = $row['count'];
        }
    }
} else {
    error_log("Gender query failed: " . $conn->error);
}

// Get the maximum year from the database dynamically
$maxYearQuery = "SELECT MAX(LEFT(school_year, 4)) AS max_year FROM enrollmentdata";
$maxYearResult = $conn->query($maxYearQuery);
$maxYear = 2025; // Default fallback
if ($maxYearResult && $row = $maxYearResult->fetch_assoc()) {
    $maxYear = (int)$row['max_year'];
}

// Fetch enrollment data by school year from 2020 to max year in database
$sql = "
    SELECT 
        LEFT(e.school_year, 4) AS year, 
        COUNT(*) AS count 
    FROM finalstep f
    JOIN enrollmentdata e ON f.student_id = e.student_id
    WHERE f.status = 'APPROVE' AND LEFT(e.school_year, 4) BETWEEN '2020' AND '$maxYear'
    GROUP BY year 
    ORDER BY year ASC";
$result = $conn->query($sql);

$enrollmentByYear = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $enrollmentByYear[$row['year']] = $row['count'];
    }
} else {
    error_log("Enrollment data query failed: " . $conn->error);
}

// Fill missing years from 2020 to max year with 0
$response['enrollmentData'] = [];
for ($year = 2020; $year <= $maxYear; $year++) {
    $response['enrollmentData'][] = [
        "school_year" => $year,
        "count" => isset($enrollmentByYear[$year]) ? (int)$enrollmentByYear[$year] : 0
    ];
}

// Debug log the response
error_log("Final response: " . json_encode($response));

// Return the response
echo json_encode($response);

$conn->close();
?>