<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database connection setup
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Validate and get the student_id from the request
$student_id = isset($_GET['student_id']) && is_numeric($_GET['student_id']) ? intval($_GET['student_id']) : null;

if (!$student_id) {
    echo json_encode(["success" => false, "message" => "Invalid or missing student_id."]);
    exit();
}

// Function to fetch data from a table
function fetchData($conn, $query, $student_id) {
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

// Queries for fetching data
$queries = [
    "personalinfo" => "SELECT first_name, last_name, middle_name, extension_name, age, birthday, birthday_place, civil_status, religion, citizenship, sex, contact_number, email, TO_BASE64(picture) AS picture FROM personalinfo WHERE student_id = ?",
    "enrollmentdata" => "SELECT LRN, grade_level, school_year, curriculum, strand_track, campus, sports, fav_subjects, section FROM enrollmentdata WHERE student_id = ?",
    "mother" => "SELECT mother_fname, mother_lname, mother_midname, mother_age, mother_occupation, mother_phoneNum, mother_educAttainment FROM mother WHERE student_id = ?",
    "father" => "SELECT father_fname, father_lname, father_midname, father_age, father_occupation, father_phoneNum, father_educAttainment FROM father WHERE student_id = ?",
    "guardian" => "SELECT guardian_fname, guardian_lname, guardian_midname, guardian_age, guardian_occupation, guardian_phoneNum, guardian_educAttainment FROM guardian WHERE student_id = ?",
    "present_address" => "SELECT house_no, barangay, municipality, province FROM present_address WHERE student_id = ?",
    "permanent_address" => "SELECT house_no, barangay, municipality, province FROM permanent_address WHERE student_id = ?",
    "sibling" => "SELECT sibling_fname, sibling_lname, sibling_midname, sibling_age, sibling_occupation, sibling_phoneNum, sibling_educAttainment FROM sibling WHERE student_id = ?",
    "finalstep" => "SELECT submission_date, submission_time, birth_certificate, good_moral, highschool_diploma, TOR, id_picture, status FROM finalstep WHERE student_id = ?"
];

// Fetch data from all tables
$data = [];
foreach ($queries as $key => $query) {
    $data[$key] = fetchData($conn, $query, $student_id);
}

// Check if at least one dataset is found
if (empty(array_filter($data))) {
    echo json_encode(["success" => false, "message" => "No data found for the given student_id."]);
    exit();
}

// Return data as JSON
echo json_encode(["success" => true, "data" => $data]);

// Close the database connection
$conn->close();
?>
