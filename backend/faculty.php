<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users
ini_set('log_errors', 1);
ini_set('error_log', 'faculty_error.log'); // Log errors to a file

$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Corrected database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$requestMethod = $_SERVER["REQUEST_METHOD"];
$rawData = file_get_contents("php://input");
error_log("Received raw data: " . $rawData);
$data = json_decode($rawData);
error_log("Decoded data: " . print_r($data, true));

// Log the request method and data for debugging
error_log("Request Method: $requestMethod");
if ($data) {
    error_log("Request Data: " . json_encode($data));
}

switch ($requestMethod) {
    case "GET":
        if (isset($_GET['type']) && $_GET['type'] == 'faculty') {
            // Fetch faculty data
            $sql = "SELECT * FROM faculty";
            $result = $conn->query($sql);
            
            if (!$result) {
                error_log("Query Error: " . $conn->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Error fetching faculty: " . $conn->error]);
                break;
            }
            
            $faculty = [];
            while ($row = $result->fetch_assoc()) {
                $faculty[] = $row;
            }
            echo json_encode($faculty);
        } elseif (isset($_GET['type']) && $_GET['type'] == 'strands') {
            // Fetch only strand names from the strands table (without strand_id)
            $sql = "SELECT strand FROM strands";
            $result = $conn->query($sql);

            if ($result) {
                $strands = [];
                while ($row = $result->fetch_assoc()) {
                    $strands[] = $row['strand']; // Only add the strand name
                }
                echo json_encode($strands);  // Send an array of strand names only
            } else {
                error_log("Query Error: " . $conn->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to fetch strands data."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid request type."]);
        }
        break;

    case "POST":
        if (!empty($data->facultyName) && !empty($data->email) && !empty($data->contactNum) && !empty($data->strand) && !empty($data->grade_level) && !empty($data->facultyStatus)) {
            $stmt = $conn->prepare("INSERT INTO faculty (facultyName, email, contactNum, strand, grade_level, facultyStatus) VALUES (?, ?, ?, ?, ?, ?)");
            
            if (!$stmt) {
                error_log("Prepare Error: " . $conn->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to prepare statement: " . $conn->error]);
                break;
            }
            
            $stmt->bind_param("ssssss", $data->facultyName, $data->email, $data->contactNum, $data->strand, $data->grade_level, $data->facultyStatus);
            
            if ($stmt->execute()) {
                // Get the last inserted faculty_id
                $faculty_id = $conn->insert_id;

                // Insert the faculty_id into the related tables
                $relatedTables = [
                    "facultyinfo",
                    "facultyelem",
                    "facultyjunior",
                    "facultycollege",
                    "facultyfather",
                    "facultymother",
                    "facultysibling",
                    "facultypermanent",
                    "facultypresent"
                ];

                $allSuccess = true;

                foreach ($relatedTables as $table) {
                    $sql = "INSERT INTO $table (faculty_id) VALUES (?)";
                    $relatedStmt = $conn->prepare($sql);
                    
                    if (!$relatedStmt) {
                        error_log("Prepare Error for $table: " . $conn->error);
                        $allSuccess = false;
                        break;
                    }
                    
                    $relatedStmt->bind_param("i", $faculty_id);

                    if (!$relatedStmt->execute()) {
                        error_log("Execute Error for $table: " . $relatedStmt->error);
                        $allSuccess = false;
                        break;
                    }

                    $relatedStmt->close();
                }

                if ($allSuccess) {
                    echo json_encode(["success" => true, "message" => "Faculty and related data added successfully."]);
                } else {
                    http_response_code(500);
                    echo json_encode(["success" => false, "message" => "Failed to add data to related tables."]);
                }
            } else {
                error_log("Execute Error: " . $stmt->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to add faculty: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for faculty."]);
        }
        break;

    case "PUT":
        // Log all fields for debugging
        error_log("Checking fields:");
        error_log("faculty_id: " . (isset($data->faculty_id) ? $data->faculty_id : 'not set'));
        error_log("facultyName: " . (isset($data->facultyName) ? $data->facultyName : 'not set'));
        error_log("email: " . (isset($data->email) ? $data->email : 'not set'));
        error_log("contactNum: " . (isset($data->contactNum) ? $data->contactNum : 'not set'));
        error_log("strand: " . (isset($data->strand) ? $data->strand : 'not set'));
        error_log("grade_level: " . (isset($data->grade_level) ? $data->grade_level : 'not set'));
        error_log("facultyStatus: " . (isset($data->facultyStatus) ? $data->facultyStatus : 'not set'));

        if (!empty($data->faculty_id) && !empty($data->facultyName) && !empty($data->email) && !empty($data->contactNum) && !empty($data->strand) && !empty($data->grade_level) && !empty($data->facultyStatus)) {
            $stmt = $conn->prepare("UPDATE faculty SET facultyName = ?, email = ?, contactNum = ?, strand = ?, grade_level = ?, facultyStatus = ? WHERE faculty_id = ?");
            
            if (!$stmt) {
                error_log("Prepare Error: " . $conn->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to prepare statement: " . $conn->error]);
                break;
            }
            
            $stmt->bind_param("ssssssi", $data->facultyName, $data->email, $data->contactNum, $data->strand, $data->grade_level, $data->facultyStatus, $data->faculty_id);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Faculty updated successfully."]);
            } else {
                error_log("Execute Error: " . $stmt->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to update faculty: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for update."]);
        }
        break;

    case "DELETE":
        if (!empty($data->faculty_id)) {
            // Delete from related tables first
            $relatedTables = [
                "facultyinfo",
                "facultyelem",
                "facultyjunior",
                "facultycollege",
                "facultyfather",
                "facultymother",
                "facultysibling",
                "facultypermanent",
                "facultypresent"
            ];

            $allSuccess = true;

            foreach ($relatedTables as $table) {
                $sql = "DELETE FROM $table WHERE faculty_id = ?";
                $relatedStmt = $conn->prepare($sql);
                
                if (!$relatedStmt) {
                    error_log("Prepare Error for $table: " . $conn->error);
                    $allSuccess = false;
                    break;
                }
                
                $relatedStmt->bind_param("i", $data->faculty_id);

                if (!$relatedStmt->execute()) {
                    error_log("Execute Error for $table: " . $relatedStmt->error);
                    $allSuccess = false;
                    break;
                }

                $relatedStmt->close();
            }

            if ($allSuccess) {
                // Delete from the main faculty table
                $stmt = $conn->prepare("DELETE FROM faculty WHERE faculty_id = ?");
                
                if (!$stmt) {
                    error_log("Prepare Error: " . $conn->error);
                    http_response_code(500);
                    echo json_encode(["success" => false, "message" => "Failed to prepare statement: " . $conn->error]);
                    break;
                }
                
                $stmt->bind_param("i", $data->faculty_id);
                
                if ($stmt->execute()) {
                    echo json_encode(["success" => true, "message" => "Faculty and related data deleted successfully."]);
                } else {
                    error_log("Execute Error: " . $stmt->error);
                    http_response_code(500);
                    echo json_encode(["success" => false, "message" => "Failed to delete faculty: " . $stmt->error]);
                }
                $stmt->close();
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to delete data from related tables."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for deletion."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method Not Allowed"]);
        break;
}

$conn->close();
?>