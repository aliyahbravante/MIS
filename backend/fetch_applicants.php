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
$password = "Northills_12345";   // Your password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// SQL query to fetch applicant data, only those with "PENDING" status in the finalstep table
$sql = "SELECT 
            personalinfo.student_id, 
            personalinfo.first_name, 
            personalinfo.last_name, 
            personalinfo.email, 
            personalinfo.contact_number, 
            enrollmentdata.LRN
        FROM personalinfo
        JOIN enrollmentdata ON personalinfo.student_id = enrollmentdata.student_id
        LEFT JOIN finalstep ON personalinfo.student_id = finalstep.student_id
        WHERE UPPER(finalstep.status) = 'PENDING' OR finalstep.status IS NULL";

$result = $conn->query($sql);

// Check for data and output JSON - ALWAYS return a valid JSON response
$applicants = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $applicants[] = [
            "student_id" => $row["student_id"],
            "name" => $row["last_name"] . ", " . $row["first_name"],
            "email" => $row["email"],
            "contact_number" => $row["contact_number"],
            "LRN" => $row["LRN"]
        ];
    }
    echo json_encode(["success" => true, "applicants" => $applicants]);
} else {
    // Return empty array but valid JSON when no results
    echo json_encode(["success" => true, "applicants" => [], "message" => "No applicants found"]);
}

$conn->close();
?>