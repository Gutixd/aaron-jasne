<?php
/**
 * Entrega una foto subida por los invitados. Solo con sesión del panel:
 * las fotos viven fuera de la web y este es el único camino para verlas.
 */

declare(strict_types=1);

require __DIR__ . '/_sesion.php';

if (!sesion_activa()) {
    http_response_code(403);
    exit;
}

$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
$q = db()->prepare('SELECT archivo, tipo FROM fotos WHERE id = ?');
$q->execute([$id ?: 0]);
$f = $q->fetch();
$ruta = $f ? carpeta_fotos() . '/' . basename((string) $f['archivo']) : '';

if (!$f || !is_file($ruta)) {
    http_response_code(404);
    exit;
}

header('Content-Type: ' . $f['tipo']);
header('Content-Length: ' . filesize($ruta));
header('Content-Disposition: inline; filename="' . basename($ruta) . '"');
// Las fotos no cambian: el navegador puede guardarlas mientras dure la sesión.
header('Cache-Control: private, max-age=86400');
readfile($ruta);
