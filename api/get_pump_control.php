<?php
header('Content-Type: application/json');

// Baca file kontrol pompa
if (file_exists('pump_control.json')) {
    $control_data = json_decode(file_get_contents('pump_control.json'), true);
    echo json_encode([
        'success' => true,
        'data' => $control_data
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Tidak ada perintah kontrol',
        'data' => [
            'pump_status' => 0,
            'manual_mode' => false
        ]
    ]);
}
?>