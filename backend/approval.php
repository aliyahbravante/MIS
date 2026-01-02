<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Handle CORS
header("Access-Control-Allow-Origin: *"); // Allow all domains (you can restrict this to a specific domain)
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow specific methods
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // Allow headers like Content-Type and Authorization

// Handle preflight OPTIONS request
if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
    // Respond with the necessary CORS headers for preflight request
    http_response_code(200);  // Send a successful response code for preflight
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

// Database connection setup
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northilscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

require '../PHPMailer-master/src/Exception.php';
require '../PHPMailer-master/src/PHPMailer.php';
require '../PHPMailer-master/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields from POST data
    if (isset($data['student_id']) && isset($data['status']) && isset($data['email']) && isset($data['first_name']) && isset($data['last_name'])) {
        
        $student_id = $data['student_id'];
        $status = $data['status'];  // Expected value: 'Approved' or 'Pending'
        $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
        $first_name = htmlspecialchars($data['first_name']);
        $last_name = htmlspecialchars($data['last_name']);
        
        // Check if status is valid ('Approved' or 'Pending')
        if (!in_array($status, ['Approved', 'Pending'])) {
            echo json_encode(["success" => false, "message" => "Invalid status value."]);
            exit();
        }
        
        // Update the student status in the database (finalstep table)
        $sql = "UPDATE finalstep SET status = ? WHERE student_id = ?";
        $stmt = $conn->prepare($sql);

        if ($stmt === false) {
            error_log("SQL Error: " . $conn->error);
            echo json_encode(["success" => false, "message" => "Error preparing the query."]);
            exit();
        }

        $stmt->bind_param("si", $status, $student_id);

        if ($stmt->execute()) {
            // Send an email notification to the applicant using PHPMailer
            $mail = new PHPMailer(true);
            try {
                // SMTP settings
                $mail->SMTPDebug = 0;
                $mail->isSMTP();
                $mail->Host = 'smtp.gmail.com';
                $mail->SMTPAuth = true;
                $mail->Username = 'collegeofasianorthills@gmail.com'; // Your Gmail address
                $mail->Password = 'avzz uauu rtpq hrrd'; // Your Gmail App Password
                $mail->SMTPSecure = 'tls';
                $mail->Port = 587;

                $mail->setFrom('collegeofasianorthills@gmail.com', 'Northills College of Asia');
                $mail->addAddress($email);

                $mail->isHTML(true);
                $mail->Subject = 'Application Status';
                
                // Email body with dynamic content
                if ($status === 'Approved') {
                    $mail->Body = "
                        <html>
                        <body>
                            <h2 style='color: #004d00;'>Dear $first_name $last_name,</h2>
                            <p>Your application has been <strong>Approved</strong>.</p>
                            <p>Thank you for your interest in Northills College of Asia.</p>
                            <p>We look forward to welcoming you!</p>
                        </body>
                        </html>
                    ";
                } elseif ($status === 'Pending') {
                    $mail->Body = "
                        <html>
                        <body>
                            <h2 style='color: #ff4500;'>Dear $first_name $last_name,</h2>
                            <p>Your application is currently <strong>Pending</strong>.</p>
                            <p>We are still reviewing your submitted documents.</p>
                            <p>Thank you for your patience.</p>
                        </body>
                        </html>
                    ";
                }

                // Attempt to send the email
                if ($mail->send()) {
                    echo json_encode([
                        "success" => true,
                        "message" => "Application status '$status' and email sent successfully!"
                    ]);
                } else {
                    echo json_encode([
                        "success" => false,
                        "message" => "Failed to send email notification."
                    ]);
                }
            } catch (Exception $e) {
                echo json_encode([
                    "success" => false,
                    "message" => "Mailer Error: {$mail->ErrorInfo}"
                ]);
            }
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to update the application status."
            ]);
        }

        $stmt->close();
    } else {
        echo json_encode(["success" => false, "message" => "Missing required data."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}

$conn->close();
?>
