<?php
/**
 * POST /api/buscar.php — busca al invitado por su nombre.
 *
 * Responde solo lo que el invitado necesita para confirmar: cómo se le
 * saluda, sus cupos y si ya había respondido. Nunca la lista completa.
 *
 *   { modo: "abierto" }                       no hay lista cargada
 *   { modo: "lista", encontrado: false, ... } no está / hay varios
 *   { modo: "lista", encontrado: true, invitado: {...} }
 */

declare(strict_types=1);

require __DIR__ . '/_base.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$d = json_decode(file_get_contents('php://input', false, null, 0, 2048) ?: '', true);
$nombre = is_array($d) ? limpiar_texto($d['nombre'] ?? null, 120) : null;

try {
    if (!hay_lista()) {
        responder_json(['ok' => true, 'modo' => 'abierto']);
    }
    if ($nombre === null) {
        responder_json(['ok' => false, 'error' => 'Escribe tu nombre y apellido.'], 422);
    }
    // Más holgado que confirmar (la gente prueba variantes de su nombre),
    // pero suficiente para que nadie recorra la lista a punta de intentos.
    if (!dentro_del_limite('buscar', 30, 10)) {
        responder_json(['ok' => false, 'error' => 'Demasiados intentos seguidos. Espera unos minutos.'], 429);
    }

    $r = buscar_invitado($nombre);
    if (!empty($r['corto'])) {
        responder_json(['ok' => true, 'modo' => 'lista', 'encontrado' => false, 'motivo' => 'corto']);
    }
    if (!empty($r['varios'])) {
        responder_json(['ok' => true, 'modo' => 'lista', 'encontrado' => false, 'motivo' => 'varios']);
    }
    if (empty($r['invitado'])) {
        responder_json(['ok' => true, 'modo' => 'lista', 'encontrado' => false, 'motivo' => 'no_esta']);
    }

    $inv = $r['invitado'];
    $previa = respuesta_de((int) $inv['id']);
    responder_json([
        'ok'         => true,
        'modo'       => 'lista',
        'encontrado' => true,
        'invitado'   => [
            'nombre' => $inv['nombre'],
            'cupos'  => (int) $inv['cupos'],
            'previa' => $previa === null ? null : [
                'asiste'   => (int) $previa['asiste'] === 1,
                'personas' => (int) $previa['asiste'] === 1 ? 1 + (int) $previa['acompanantes'] : 0,
            ],
        ],
    ]);
} catch (Throwable $e) {
    error_log('[buscar] ' . $e->getMessage());
    responder_json(['ok' => false, 'error' => 'No pudimos revisar la lista en este momento.'], 500);
}
