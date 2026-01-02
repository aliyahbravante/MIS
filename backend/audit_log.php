<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set timezone to Philippines
date_default_timezone_set('Asia/Manila');

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users
ini_set('log_errors', 1);
ini_set('error_log', 'audit_logs_error.log'); // Log errors to a file

$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Set MySQL session timezone to Philippines
$conn->query("SET time_zone = '+08:00'");

$requestMethod = $_SERVER["REQUEST_METHOD"];
$data = json_decode(file_get_contents("php://input"));

// Log the request method and data for debugging
error_log("Request Method: $requestMethod");
if ($data) {
    error_log("Request Data: " . json_encode($data));
}

switch ($requestMethod) {
    case "GET":
        // Fetch all audit logs with 12-hour format timestamp
        $sql = "SELECT audit_id, user, action, details, 
                DATE_FORMAT(date_time, '%Y-%m-%d %h:%i:%s %p') as date_time 
                FROM audit_logs";
        
        // Add filtering options if provided
        $conditions = [];
        $params = [];
        $types = "";
        
        if (isset($_GET['user']) && !empty($_GET['user'])) {
            $conditions[] = "user = ?";
            $params[] = $_GET['user'];
            $types .= "s";
        }
        
        if (isset($_GET['action']) && !empty($_GET['action'])) {
            $conditions[] = "action = ?";
            $params[] = $_GET['action'];
            $types .= "s";
        }
        
        if (isset($_GET['date_from']) && !empty($_GET['date_from'])) {
            $conditions[] = "DATE(date_time) >= ?";
            $params[] = $_GET['date_from'];
            $types .= "s";
        }
        
        if (isset($_GET['date_to']) && !empty($_GET['date_to'])) {
            $conditions[] = "DATE(date_time) <= ?";
            $params[] = $_GET['date_to'];
            $types .= "s";
        }
        
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        
        $sql .= " ORDER BY audit_id DESC";
        
        // Add limit if provided
        if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
            $sql .= " LIMIT " . intval($_GET['limit']);
        }
        
        if (!empty($params)) {
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                error_log("Prepare Error: " . $conn->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Error preparing query: " . $conn->error]);
                break;
            }
            
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();
            $stmt->close();
        } else {
            $result = $conn->query($sql);
        }
        
        if (!$result) {
            error_log("Query Error: " . $conn->error);
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error fetching audit logs: " . $conn->error]);
            break;
        }
        
        $audit_logs = [];
        while ($row = $result->fetch_assoc()) {
            $audit_logs[] = $row;
        }
        
        echo json_encode([
            "success" => true, 
            "audit_logs" => $audit_logs,
            "total_count" => count($audit_logs)
        ]);
        break;

    case "POST":
        // Save new audit log entry with proper timezone
        if (!empty($data->user) && !empty($data->action) && !empty($data->details)) {
            // Use NOW() function which will use the session timezone we set
            $stmt = $conn->prepare("INSERT INTO audit_logs (user, action, details, date_time) VALUES (?, ?, ?, NOW())");
            
            if (!$stmt) {
                error_log("Prepare Error: " . $conn->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to prepare statement: " . $conn->error]);
                break;
            }
            
            $stmt->bind_param("sss", $data->user, $data->action, $data->details);
            
            if ($stmt->execute()) {
                $audit_id = $conn->insert_id;
                
                // Get the actual inserted timestamp in 12-hour format
                $time_stmt = $conn->prepare("SELECT DATE_FORMAT(date_time, '%Y-%m-%d %h:%i:%s %p') as formatted_time FROM audit_logs WHERE audit_id = ?");
                $time_stmt->bind_param("i", $audit_id);
                $time_stmt->execute();
                $time_result = $time_stmt->get_result();
                $time_row = $time_result->fetch_assoc();
                $time_stmt->close();
                
                echo json_encode([
                    "success" => true, 
                    "message" => "Audit log saved successfully.",
                    "audit_id" => $audit_id,
                    "timestamp" => $time_row['formatted_time'],
                    "timezone" => "Asia/Manila (UTC+8)"
                ]);
            } else {
                error_log("Execute Error: " . $stmt->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to save audit log: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode([
                "success" => false, 
                "message" => "Invalid data for audit log. Required fields: user, action, details.",
                "received_data" => [
                    "user" => isset($data->user) ? $data->user : "missing",
                    "action" => isset($data->action) ? $data->action : "missing",
                    "details" => isset($data->details) ? $data->details : "missing"
                ]
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method Not Allowed. Only GET and POST are supported for audit logs."]);
        break;
}

$conn->close();
?>