<?php
require_once 'config.php';

$conn = getDBConnection();

// SQL untuk membuat tabel
$sql = "CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kelembapan INT NOT NULL,
    status ENUM('kering', 'normal', 'basah') NOT NULL,
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waktu (waktu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

if ($conn->query($sql) === TRUE) {
    echo json_encode([
        'success' => true,
        'message' => 'Tabel sensor_data berhasil dibuat!'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $conn->error
    ]);
}

$conn->close();
?>