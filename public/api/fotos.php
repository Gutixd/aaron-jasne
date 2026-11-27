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

/** "128M" / "1G" de php.ini → MB. */
$iniMb = static function (string $clave): int {
    $v = trim((string) ini_get($clave));
    $n = (int) $v;
    return match (strtoupper(substr($v, -1))) { 'G' => $n * 1024, 'K' => (int) ($n / 1024), 'M' => $n, default => (int) ($n / 1048576) };
};
// El tope real de un video es el menor entre lo configurado y lo que
// acepta PHP en el hosting (upload_max_filesize y post_max_size).
$maxVideoMb = min($r['max_video_mb'], max(1, $iniMb('upload_max_filesize')), max(1, $iniMb('post_max_size')) - 1);

if ($metodo === 'GET') {
    responder_json(['ok' => true, 'estado' => estado_fotos(), 'max_mb' => $r['max_mb'], 'max_video_mb' => $maxVideoMb]);
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
// Un archivo más grande que post_max_size llega sin $_FILES: se avisa igual.
if (!is_array($f) || !is_string($f['tmp_name'] ?? null)) {
    $largo = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    responder_json($largo > 1048576
        ? ['ok' => false, 'error' => "El archivo pesa más de {$maxVideoMb} MB."]
        : ['ok' => false, 'error' => 'No llegó ninguna foto.'], $largo > 1048576 ? 413 : 422);
}
if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE) {
    responder_json(['ok' => false, 'error' => "El archivo pesa más de {$maxVideoMb} MB."], 413);
}
if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
    responder_json(['ok' => false, 'error' => 'El archivo no llegó completo. Inténtalo de nuevo.'], 422);
}

// Tipo real según el contenido del archivo, no según su nombre.
$fotos  = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/heic' => 'heic', 'image/heif' => 'heif'];
$videos = ['video/mp4' => 'mp4', 'video/quicktime' => 'mov', 'video/webm' => 'webm', 'video/3gpp' => '3gp', 'video/x-m4v' => 'm4v'];
$tipos = $fotos + $videos;
$tipo = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) ?: '';
if (!isset($tipos[$tipo])) {
    responder_json(['ok' => false, 'error' => 'Solo se pueden subir fotos o videos.'], 415);
}
$esVideo = isset($videos[$tipo]);
if ($esVideo ? $f['size'] > $maxVideoMb * 1048576 : $f['size'] > $r['max_mb'] * 1048576) {
    responder_json(['ok' => false, 'error' => $esVideo
        ? "El video pesa más de {$maxVideoMb} MB. Prueba con uno más corto (1 minuto aprox.)."
        : "La foto pesa más de {$r['max_mb']} MB."], 413);
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

    // Topes separados: los videos tienen su propio espacio y nunca se
    // comen el de las fotos (ni al revés).
    $t = db()->query("SELECT
        SUM(CASE WHEN tipo LIKE 'video/%' THEN 0 ELSE 1 END) AS nf,
        COALESCE(SUM(CASE WHEN tipo LIKE 'video/%' THEN 0 ELSE bytes END), 0) AS bf,
        COALESCE(SUM(CASE WHEN tipo LIKE 'video/%' THEN bytes ELSE 0 END), 0) AS bv
      FROM fotos")->fetch();
    $lleno = $esVideo
        ? (int) $t['bv'] + $f['size'] > $r['max_video_total_mb'] * 1048576
        : (int) $t['nf'] >= $r['max_fotos'] || (int) $t['bf'] + $f['size'] > $r['max_total_mb'] * 1048576;
    if ($lleno) {
        responder_json(['ok' => false, 'error' => $esVideo
            ? 'Ya llegamos al máximo de videos, pero aún puedes subir fotos. ¡Gracias!'
            : 'Ya llegamos al máximo de fotos. ¡Gracias por compartir!'], 507);
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
