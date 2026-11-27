<?php
/**
 * /api/fotos.php — fotos que suben los invitados el día de la boda.
 *
 *   GET  → { estado: "antes" | "abierto" | "cerrado", max_mb }
 *   POST → sube UNA foto (multipart: foto, autor?, sitio=trampa)
 *
 * Una foto por petición: así ninguna subida choca con los límites de PHP
 * del hosting y, si se corta la señal, solo se pierde esa foto.
 *
 * Límites para que nada se sature (config.php › 'fotos'):
 *   - solo dentro de la ventana desde/hasta,
 *   - solo imágenes reales (se revisa el contenido, no el nombre),
 *   - tamaño máximo por foto, fotos por persona por hora,
 *   - tope total de fotos y de espacio.
 */

declare(strict_types=1);

require __DIR__ . '/_base.php';

$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
$r = reglas_fotos();

if ($metodo === 'GET') {
    responder_json(['ok' => true, 'estado' => estado_fotos(), 'max_mb' => $r['max_mb']]);
}
if ($metodo !== 'POST') {
    header('Allow: GET, POST');
    responder_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

if (!empty($_POST['sitio'])) {
    responder_json(['ok' => true]); // trampa para bots
}
if (estado_fotos() !== 'abierto') {
    responder_json(['ok' => false, 'error' => 'La subida de fotos no está abierta en este momento.'], 403);
}

$f = $_FILES['foto'] ?? null;
if (!is_array($f) || !is_string($f['tmp_name'] ?? null)) {
    responder_json(['ok' => false, 'error' => 'No llegó ninguna foto.'], 422);
}
if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE
    || $f['size'] > $r['max_mb'] * 1024 * 1024) {
    responder_json(['ok' => false, 'error' => "La foto pesa más de {$r['max_mb']} MB."], 413);
}
if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
    responder_json(['ok' => false, 'error' => 'La foto no llegó completa. Inténtalo de nuevo.'], 422);
}

// Tipo real según el contenido del archivo, no según su nombre.
$tipos = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/heic' => 'heic', 'image/heif' => 'heif'];
$tipo = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) ?: '';
if (!isset($tipos[$tipo])) {
    responder_json(['ok' => false, 'error' => 'Solo se pueden subir fotos (JPG, PNG, WEBP o HEIC).'], 415);
}

$autor = limpiar_texto($_POST['autor'] ?? null, 80);
// Álbum: 'favoritas' solo si lo piden; cualquier otro valor va a 'general'.
$album = ($_POST['album'] ?? '') === 'favoritas' ? 'favoritas' : 'general';

try {
    // El límite por persona va por celular, no por IP: en la fiesta todos
    // comparten el mismo Wi-Fi (una sola IP) y un tope por IP dejaría a
    // todo el salón con 60 fotos. Cada celular manda un identificador al
    // azar que guarda en su navegador. Como alguien podría inventarlo, hay
    // además un tope por IP mucho más alto, y los topes totales de abajo.
    $disp = is_string($_POST['dispositivo'] ?? null) && preg_match('/^[a-z0-9]{8,40}$/', $_POST['dispositivo'])
        ? $_POST['dispositivo'] : 'sin-id';
    if (!dentro_del_limite('foto|' . $disp, $r['por_hora'], 60)) {
        responder_json(['ok' => false, 'error' => 'Subiste muchas fotos seguidas. Espera un rato y sigue.'], 429);
    }
    if (!dentro_del_limite('foto-ip', $r['por_hora'] * 25, 60)) {
        responder_json(['ok' => false, 'error' => 'Hay muchas fotos subiéndose a la vez. Inténtalo en unos minutos.'], 429);
    }

    $t = db()->query('SELECT COUNT(*) AS n, COALESCE(SUM(bytes), 0) AS b FROM fotos')->fetch();
    if ((int) $t['n'] >= $r['max_fotos'] || (int) $t['b'] + $f['size'] > $r['max_total_mb'] * 1024 * 1024) {
        responder_json(['ok' => false, 'error' => 'Ya llegamos al máximo de fotos. ¡Gracias por compartir!'], 507);
    }

    // Nombre al azar: nunca se usa el nombre que trae el archivo.
    $archivo = date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $tipos[$tipo];
    if (!move_uploaded_file($f['tmp_name'], carpeta_fotos() . '/' . $archivo)) {
        throw new RuntimeException('No se pudo mover el archivo subido.');
    }

    db()->prepare('INSERT INTO fotos (archivo, tipo, bytes, autor, album, creado) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$archivo, $tipo, (int) $f['size'], $autor, $album, ahora()]);
} catch (Throwable $e) {
    error_log('[fotos] ' . $e->getMessage());
    responder_json(['ok' => false, 'error' => 'No pudimos guardar la foto. Inténtalo de nuevo.'], 500);
}

responder_json(['ok' => true]);
