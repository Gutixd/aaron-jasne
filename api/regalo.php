<?php
/**
 * POST /api/regalo.php — el invitado avisa que hizo su regalo.
 *
 * La página nunca recibe ni mueve dinero: la transferencia la hace cada
 * invitado desde su banco. Esto solo deja registro (nombre, monto opcional
 * y mensaje) para que los novios sepan a quién agradecer.
 */

declare(strict_types=1);

require __DIR__ . '/_base.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$d = json_decode(file_get_contents('php://input', false, null, 0, 4096) ?: '', true);
if (!is_array($d)) {
    responder_json(['ok' => false, 'error' => 'Datos inválidos.'], 400);
}
if (!empty($d['sitio'])) {
    responder_json(['ok' => true]); // trampa para bots
}

$nombre = limpiar_texto($d['nombre'] ?? null, 120);
if ($nombre === null || mb_strlen($nombre) < 2) {
    responder_json(['ok' => false, 'error' => 'Escribe tu nombre.'], 422);
}

// Monto en pesos, opcional. Acepta "50.000", "$50000" o un número.
$monto = null;
if (isset($d['monto']) && $d['monto'] !== '' && $d['monto'] !== null) {
    $digitos = preg_replace('/\D/', '', (string) $d['monto']) ?? '';
    if ($digitos === '' || strlen($digitos) > 9 || (int) $digitos < 1) {
        responder_json(['ok' => false, 'error' => 'El monto no parece correcto.'], 422);
    }
    $monto = (int) $digitos;
}
$mensaje = limpiar_texto($d['mensaje'] ?? null, 800);

try {
    if (!dentro_del_limite('regalo', 10, 10)) {
        responder_json(['ok' => false, 'error' => 'Demasiados envíos seguidos. Espera unos minutos.'], 429);
    }
    $codigo = is_string($d['codigo'] ?? null) ? strtolower(trim($d['codigo'])) : '';
    $inv = $codigo !== '' ? invitado_por_codigo($codigo) : null;

    db()->prepare('INSERT INTO regalos (invitado_id, nombre, monto, mensaje, creado) VALUES (?, ?, ?, ?, ?)')
        ->execute([$inv ? (int) $inv['id'] : null, $nombre, $monto, $mensaje, ahora()]);
} catch (Throwable $e) {
    error_log('[regalo] ' . $e->getMessage());
    responder_json(['ok' => false, 'error' => 'No pudimos guardar tu aviso. Inténtalo de nuevo.'], 500);
}

responder_json(['ok' => true]);
