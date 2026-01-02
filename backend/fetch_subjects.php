<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;

if (!$student_id) {
    echo json_encode(["success" => false, "message" => "No student ID provided."]);
    exit();
}

// Fetch strand_track, section, and grade_level from enrollmentdata
$studentQuery = "SELECT grade_level, strand_track, section FROM enrollmentdata WHERE student_id = ?";
$stmt = $conn->prepare($studentQuery);
$stmt->bind_param("s", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Student not found."]);
    exit();
}

$student = $result->fetch_assoc();
$grade_level = preg_replace('/[^0-9]/', '', $student['grade_level']); // Extract numeric grade (e.g., "11" from "Grade 11")
$strand_prefix = strtok($student['strand_track'], ' -'); // Extract the prefix (e.g., "ABM" from "ABM - Accountancy, Business & Management")
$section = $student['section'];

// Fetch matching subjects
$subjectsQuery = "SELECT subject_id, description, schedule, teacher, grade, strand, section 
                  FROM subjects 
                  WHERE grade = ? AND strand = ? AND section = ?";
$stmt = $conn->prepare($subjectsQuery);
$stmt->bind_param("sss", $grade_level, $strand_prefix, $section);
$stmt->execute();
$result = $stmt->get_result();

$subjects = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $subjects[] = [
            "subject_id" => $row["subject_id"],
            "description" => $row["description"],
            "schedule" => $row["schedule"],
            "teacher" => $row["teacher"],
            "grade" => $row["grade"],
            "strand" => $row["strand"],
            "section" => $row["section"]
        ];
    }
}

// Always return an array, even if empty
echo json_encode($subjects);

$conn->close();
?>