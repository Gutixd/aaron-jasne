<?php
/**
 * Descarga las fotos de los invitados en un ZIP, por partes
 * (?parte=1, 2, …). Un solo ZIP con miles de fotos haría que el hosting
 * corte la descarga por tiempo o memoria; por partes siempre termina.
 */

declare(strict_types=1);

require __DIR__ . '/_sesion.php';

if (!sesion_activa()) {
    header('Location: ./');
    exit;
}

// Fotos de a 150 (igual que FOTOS_POR_ZIP en index.php); videos de a 10,
// porque cada uno pesa hasta 100 MB.
$videos = ($_GET['tipo'] ?? '') === 'video';
define('POR_PARTE', $videos ? 10 : 150);

$parte = max(1, (int) ($_GET['parte'] ?? 1));
$album = in_array($_GET['album'] ?? '', ['general', 'favoritas'], true) ? $_GET['album'] : null;
$q = db()->prepare('SELECT archivo, autor, creado FROM fotos WHERE tipo ' . ($videos ? 'LIKE' : 'NOT LIKE') . " 'video/%'"
    . ($album ? ' AND album = ?' : '')
    . ' ORDER BY creado ASC, id ASC LIMIT ' . POR_PARTE . ' OFFSET ?');
$q->execute($album ? [$album, ($parte - 1) * POR_PARTE] : [($parte - 1) * POR_PARTE]);
$fotos = $q->fetchAll();

if (!$fotos) {
    header('Location: ./?v=fotos');
    exit;
}

@set_time_limit(300);
$tmp = tempnam(sys_get_temp_dir(), 'ajzip');
$zip = new ZipArchive();
$zip->open($tmp, ZipArchive::OVERWRITE);
foreach ($fotos as $i => $f) {
    $ruta = carpeta_fotos() . '/' . basename((string) $f['archivo']);
    if (!is_file($ruta)) continue;
    // "0012 Camila 21-35.jpg": ordenadas por hora y con quién la subió.
    $autor = preg_replace('/[^\p{L}\p{N} ]+/u', '', (string) ($f['autor'] ?? '')) ?: 'invitado';
    $nombre = sprintf('%04d %s %s.%s', ($parte - 1) * POR_PARTE + $i + 1, mb_substr($autor, 0, 30),
        (new DateTimeImmutable($f['creado']))->format('H-i'), pathinfo($ruta, PATHINFO_EXTENSION));
    // Las fotos ya vienen comprimidas: guardarlas sin volver a comprimir es más rápido.
    $zip->addFile($ruta, $nombre);
    $zip->setCompressionName($nombre, ZipArchive::CM_STORE);
}
$zip->close();

header('Content-Type: application/zip');
header('Content-Length: ' . filesize($tmp));
header('Content-Disposition: attachment; filename="' . ($videos ? 'videos' : 'fotos') . '-boda-aaron-jasne-' . ($album ?? 'todas') . '-parte-' . $parte . '.zip"');
readfile($tmp);
unlink($tmp);
