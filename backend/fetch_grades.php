<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database credentials
$servername = "localhost";
$username = "u572625467_group_v";  // Hostinger database username
$password = "Northills_12345";   // Database password
$dbname = "u572625467_northillscoa";  // Hostinger database name

// Connect to the database
$conn = new mysqli($servername, $username, $password, $dbname);

// Check database connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Get the subject_id from the request
$subject_id = isset($_GET['subject_id']) ? intval($_GET['subject_id']) : null;

// Validate the subject_id
if (!$subject_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required parameter: subject_id"]);
    exit();
}

// Fetch grades for the given subject_id
$query = "
    SELECT g.student_id, g.first_quarter, g.second_quarter, g.final_grade, g.remarks, g.semester,
           s.description AS subject_description, s.teacher AS subject_teacher
    FROM grades g
    JOIN subjects s ON g.subject_id = s.subject_id
    WHERE g.subject_id = ?
";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $subject_id);
$stmt->execute();
$result = $stmt->get_result();

// Check if any grades were found
$grades = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $grades[] = [
            "student_id" => $row["student_id"],
            "subject_description" => $row["subject_description"],
            "first_quarter" => $row["first_quarter"],
            "second_quarter" => $row["second_quarter"],
            "final_grade" => $row["final_grade"],
            "remarks" => $row["remarks"],
            "subject_teacher" => $row["subject_teacher"],  // Include teacher's name
            "semester" => $row["semester"]                 // Add this line!
        ];
    }
}

// Return grades with teacher's name (empty or populated)
http_response_code(200);
echo json_encode([
    "success" => true,
    "grades" => $grades
]);

$stmt->close();
$conn->close();
?>