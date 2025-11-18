<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Konfigurasi Database
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'db_watering');

// Fungsi untuk koneksi database
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        die(json_encode([
            'success' => false,
            'message' => 'Koneksi database gagal: ' . $conn->connect_error
        ]));
    }
    
    return $conn;
}

// Fungsi untuk menentukan status berdasarkan kelembapan
function getStatus($kelembapan) {
    if ($kelembapan < 40) {
        return 'kering';
    } elseif ($kelembapan >= 40 && $kelembapan < 70) {
        return 'normal';
    } else {
        return 'basah';
    }
}

// Fungsi untuk menentukan durasi pompa
function getPumpDuration($status) {
    switch($status) {
        case 'kering':
            return 10; // 10 detik
        case 'normal':
            return 5;  // 5 detik
        case 'basah':
            return 0;  // Tidak menyala
        default:
            return 0;
    }
}
?>