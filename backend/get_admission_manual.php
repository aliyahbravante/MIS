<?php
// Admission Manual PDF Endpoint
// Place your admission_manual.pdf file in the same directory as this PHP file

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Path to the PDF file - Update this path if your PDF is in a different location
$pdfPath = __DIR__ . '/admission_manual.pdf';

// Alternative paths you can use:
// $pdfPath = __DIR__ . '/../public/admission_manual.pdf'; // If PDF is in public folder
// $pdfPath = __DIR__ . '/documents/admission_manual.pdf'; // If PDF is in a documents subfolder

// Check if file exists
if (!file_exists($pdfPath)) {
    http_response_code(404);
    header("Content-Type: application/json");
    echo json_encode([
        "success" => false,
        "message" => "Admission manual PDF not found. Please upload the PDF file to the backend folder."
    ]);
    exit();
}

// Get file info
$fileName = basename($pdfPath);
$fileSize = filesize($pdfPath);

// Set headers for PDF download
header("Content-Type: application/pdf");
header("Content-Disposition: attachment; filename=\"" . $fileName . "\"");
header("Content-Length: " . $fileSize);
header("Cache-Control: public, must-revalidate, max-age=0");
header("Pragma: public");
header("Expires: 0");

// Output the PDF file
readfile($pdfPath);
exit();
?>

