<?php
/**
 * GET /api/contenido.php — contenido de la invitación (lo del código más lo
 * editado en el panel). La invitación lo pide al cargar; si no responde,
 * usa lo que trae en el código, así que nunca queda en blanco.
 */

declare(strict_types=1);

require __DIR__ . '/_base.php';

try {
    $c = contenido();
} catch (Throwable $e) {
    error_log('[contenido] ' . $e->getMessage());
    responder_json(['ok' => false], 500);
}

$cuerpo = json_encode(['ok' => true, 'contenido' => $c], JSON_UNESCAPED_UNICODE);
$etag = '"' . substr(md5((string) $cuerpo), 0, 16) . '"';

// El navegador pregunta siempre "¿cambió?" (no-cache) y, si no cambió,
// recibe un 304 vacío. Así un cambio del panel se ve al instante y repetir
// la misma respuesta a cada invitado no cuesta casi nada.
header('Cache-Control: no-cache');
header('ETag: ' . $etag);
if (trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) {
    http_response_code(304);
    exit;
}
http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
echo $cuerpo;
