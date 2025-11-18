<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conn = getDBConnection();
    
    // Ambil data dari request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['kelembapan'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Data kelembapan tidak ditemukan'
        ]);
        exit;
    }
    
    $kelembapan = intval($input['kelembapan']);
    $status = getStatus($kelembapan);
    
    // Insert data ke database
    $stmt = $conn->prepare("INSERT INTO sensor_data (kelembapan, status) VALUES (?, ?)");
    $stmt->bind_param("is", $kelembapan, $status);
    
    if ($stmt->execute()) {
        $pumpDuration = getPumpDuration($status);
        
        echo json_encode([
            'success' => true,
            'message' => 'Data berhasil disimpan',
            'data' => [
                'id' => $conn->insert_id,
                'kelembapan' => $kelembapan,
                'status' => $status,
                'pump_duration' => $pumpDuration
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $stmt->error
        ]);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Method tidak diizinkan'
    ]);
}
?>