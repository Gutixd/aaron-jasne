<?php
/**
 * POST /api/confirmar.php — guarda una respuesta del formulario.
 *
 * Recibe JSON. Repite todas las validaciones del navegador: nunca se confía
 * solo en lo que valida el cliente.
 */

declare(strict_types=1);

require __DIR__ . '/_base.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$crudo = file_get_contents('php://input', false, null, 0, 8192);
$d = json_decode($crudo ?: '', true);
if (!is_array($d)) {
    responder_json(['ok' => false, 'error' => 'Datos inválidos.'], 400);
}

// Trampa para bots: un campo oculto que una persona nunca llena. Si viene
// con algo, respondemos "ok" sin guardar, para no darle pistas.
if (!empty($d['sitio'])) {
    responder_json(['ok' => true]);
}

$nombre = limpiar_texto($d['nombre'] ?? null, 120);
if ($nombre === null || mb_strlen($nombre) < 2) {
    responder_json(['ok' => false, 'error' => 'Escribe tu nombre completo.'], 422);
}

if (!isset($d['asiste']) || !is_bool($d['asiste'])) {
    responder_json(['ok' => false, 'error' => 'Dinos si nos acompañas.'], 422);
}
$asiste = $d['asiste'];

$acompanantes = $d['acompanantes'] ?? 0;
if (!is_int($acompanantes) || $acompanantes < 0 || $acompanantes > 10) {
    responder_json(['ok' => false, 'error' => 'El número de acompañantes no parece correcto.'], 422);
}
if (!$asiste) {
    $acompanantes = 0;
}

$telefono = limpiar_texto($d['telefono'] ?? null, 40);
if ($telefono !== null && !preg_match('/^[\d\s+().\-]{6,40}$/', $telefono)) {
    responder_json(['ok' => false, 'error' => 'El teléfono no parece válido.'], 422);
}
$alimentacion = $asiste ? limpiar_texto($d['alimentacion'] ?? null, 300) : null;
$mensaje      = limpiar_texto($d['mensaje'] ?? null, 800);

try {
    // 20 cada 10 min por IP. No menos: las compañías móviles chilenas
    // comparten una IP pública entre muchos clientes (CGNAT) y varios
    // invitados distintos podrían caer en el mismo contador.
    if (!dentro_del_limite('confirmar', 20, 10)) {
        responder_json(['ok' => false, 'error' => 'Demasiados envíos seguidos. Espera unos minutos.'], 429);
    }

    db()->prepare(
        'INSERT INTO confirmaciones
           (nombre, telefono, asiste, acompanantes, alimentacion, mensaje, creado)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([$nombre, $telefono, $asiste ? 1 : 0, $acompanantes, $alimentacion, $mensaje, ahora()]);
} catch (Throwable $e) {
    error_log('[confirmar] ' . $e->getMessage());
    responder_json(['ok' => false, 'error' => 'No pudimos guardar tu respuesta. Inténtalo de nuevo.'], 500);
}

responder_json(['ok' => true]);
