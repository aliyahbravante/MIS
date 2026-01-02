<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->student_id)) {
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
    exit();
}

$student_id = $conn->real_escape_string($data->student_id);

// Fetch last_name, first_name, status, and strand_track
$query = "
    SELECT 
        p.last_name, 
        p.first_name, 
        UPPER(COALESCE(f.status, 'PENDING')) AS status, 
        COALESCE(e.strand_track, 'N/A') AS strand_track
    FROM personalinfo p
    LEFT JOIN finalstep f ON p.student_id = f.student_id
    LEFT JOIN enrollmentdata e ON p.student_id = e.student_id
    WHERE p.student_id = ?
";

$stmt = $conn->prepare($query);
$stmt->bind_param("s", $student_id);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    $stmt->bind_result($last_name, $first_name, $status, $strand_track);
    $stmt->fetch();

    // Debugging: Log or output the fetched values
    error_log("Fetched strand_track: " . $strand_track);  // Logs to the PHP error log

    // Fetch the description of the strand from the strands table
    $strand_query = "
        SELECT description 
        FROM strands 
        WHERE strand = ?
    ";
    
    $strand_stmt = $conn->prepare($strand_query);
    $strand_stmt->bind_param("s", $strand_track);
    $strand_stmt->execute();
    $strand_stmt->store_result();

    $strand_description = "N/A"; // Default to "N/A" if no description is found

    if ($strand_stmt->num_rows > 0) {
        $strand_stmt->bind_result($strand_description);
        $strand_stmt->fetch();
    }

    // Check if the student is already enrolled
    $enrollment_query = "
        SELECT 
            e.user_id, 
            e.password, 
            e.parent_user_id, 
            e.parent_password 
        FROM enrolledstudent e
        WHERE e.student_id = ?
    ";

    $enrollment_stmt = $conn->prepare($enrollment_query);
    $enrollment_stmt->bind_param("s", $student_id);
    $enrollment_stmt->execute();
    $enrollment_stmt->store_result();

    if ($enrollment_stmt->num_rows > 0) {
        // Student is already enrolled, return existing data
        $enrollment_stmt->bind_result($user_id, $password, $parent_user_id, $parent_password);
        $enrollment_stmt->fetch();
    
        echo json_encode([
            "success" => true,
            "last_name" => $last_name,
            "first_name" => $first_name,
            "status" => $status,
            "strand_track" => $strand_track,
            "strand_description" => $strand_description,  // Include the strand description in the response
            "is_enrolled" => true,
            "user_id" => $user_id,
            "password" => $password,
            "parent_user_id" => $parent_user_id,
            "parent_password" => $parent_password
        ]);
    
        $enrollment_stmt->close();
        $strand_stmt->close();
        $stmt->close();
        $conn->close();
        exit();
    }

    // Generate new credentials if not already enrolled
    $current_year = date('Y'); // Get current year
    
    // Get the last user_id to generate the next sequential student ID
    $last_user_query = "SELECT user_id FROM enrolledstudent ORDER BY user_id DESC LIMIT 1";
    $last_user_result = $conn->query($last_user_query);

    $next_user_id = $current_year . "-0001"; // Default: current year-0001 if no records exist

    if ($last_user_result && $last_user_result->num_rows > 0) {
        $last_user_row = $last_user_result->fetch_assoc();
        $last_user_id = $last_user_row['user_id'];
        
        // Extract year and number from the last user_id (format: YYYY-NNNN)
        if (preg_match('/^(\d{4})-(\d+)$/', $last_user_id, $matches)) {
            $last_year = $matches[1];
            $last_number = intval($matches[2]);
            
            // Check if current year is different from last saved year
            if ($current_year != $last_year) {
                // New year - reset to 0001
                $next_user_id = $current_year . "-0001";
            } else {
                // Same year - increment the number
                $next_number = $last_number + 1;
                $next_user_id = $current_year . "-" . str_pad($next_number, 4, '0', STR_PAD_LEFT);
            }
        }
    }

    // Get the last parent_user_id to generate the next sequential parent ID
    $last_parent_query = "SELECT parent_user_id FROM enrolledstudent ORDER BY parent_user_id DESC LIMIT 1";
    $last_parent_result = $conn->query($last_parent_query);

    $next_parent_user_id = $current_year . "-01"; // Default: current year-01 if no records exist

    if ($last_parent_result && $last_parent_result->num_rows > 0) {
        $last_parent_row = $last_parent_result->fetch_assoc();
        $last_parent_user_id = $last_parent_row['parent_user_id'];
        
        // Extract year and number from the last parent_user_id (format: YYYY-NN)
        if (preg_match('/^(\d{4})-(\d+)$/', $last_parent_user_id, $matches)) {
            $last_year = $matches[1];
            $last_number = intval($matches[2]);
            
            // Check if current year is different from last saved year
            if ($current_year != $last_year) {
                // New year - reset to 01
                $next_parent_user_id = $current_year . "-01";
            } else {
                // Same year - increment the number
                $next_number = $last_number + 1;
                $next_parent_user_id = $current_year . "-" . str_pad($next_number, 2, '0', STR_PAD_LEFT);
            }
        }
    }
    
    // Generate random passwords (4 digits each)
    $password = rand(1000, 9999); // For student
    $parent_password = rand(1000, 9999); // For parent
    
    echo json_encode([
        "success" => true,
        "last_name" => $last_name,
        "first_name" => $first_name,
        "status" => $status,
        "strand_track" => $strand_track,
        "strand_description" => $strand_description, // Include the strand description in the response
        "parent_user_id" => $next_parent_user_id,
        "parent_password" => $parent_password,
        "user_id" => $next_user_id,
        "password" => $password,
        "is_enrolled" => false
    ]);
    
    $strand_stmt->close();
    $stmt->close();
    $conn->close();
    
} else {
    echo json_encode(["success" => false, "message" => "Student ID not found."]);
}
?>