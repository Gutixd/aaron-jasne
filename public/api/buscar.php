<?php
/**
 * POST /api/buscar.php — busca al invitado por su nombre.
 *
 * Por nombre escrito o por el código de su link personal (?i=…).
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
$codigo = is_array($d) && is_string($d['codigo'] ?? null) ? strtolower(trim($d['codigo'])) : '';

try {
    if (!hay_lista()) {
        responder_json(['ok' => true, 'modo' => 'abierto']);
    }
    // Más holgado que confirmar (la gente prueba variantes de su nombre),
    // pero suficiente para que nadie recorra la lista a punta de intentos.
    if (!dentro_del_limite('buscar', 30, 10)) {
        responder_json(['ok' => false, 'error' => 'Demasiados intentos seguidos. Espera unos minutos.'], 429);
    }

    // Link personal: el código identifica al invitado sin escribir nada.
    if ($codigo !== '') {
        $inv = invitado_por_codigo($codigo);
        responder_json($inv
            ? ['ok' => true, 'modo' => 'lista', 'encontrado' => true, 'invitado' => invitado_publico($inv)]
            : ['ok' => true, 'modo' => 'lista', 'encontrado' => false, 'motivo' => 'codigo']);
    }

    if ($nombre === null) {
        responder_json(['ok' => false, 'error' => 'Escribe tu nombre y apellido.'], 422);
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
    responder_json(['ok' => true, 'modo' => 'lista', 'encontrado' => true, 'invitado' => invitado_publico($r['invitado'])]);
} catch (Throwable $e) {
    error_log('[buscar] ' . $e->getMessage());
    responder_json(['ok' => false, 'error' => 'No pudimos revisar la lista en este momento.'], 500);
}
