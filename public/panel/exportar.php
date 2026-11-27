<?php
/** Descarga todas las confirmaciones en CSV (abre bien en Excel en español). */

declare(strict_types=1);

require __DIR__ . '/_sesion.php';

if (!sesion_activa()) {
    header('Location: ./');
    exit;
}

$filas = db()->query(
    'SELECT nombre, telefono, asiste, acompanantes, alimentacion, mensaje, creado
     FROM confirmaciones ORDER BY creado DESC'
)->fetchAll();

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="confirmaciones-aaron-jasne.csv"');

/**
 * Excel ejecuta como fórmula cualquier celda que empiece con = + - @. Un
 * invitado podría escribir "=HYPERLINK(...)" en su mensaje; con el apóstrofo
 * delante Excel lo muestra como texto.
 */
$celda = static function (mixed $v): string {
    $s = (string) ($v ?? '');
    return preg_match('/^[=+\-@\t\r]/', $s) ? "'" . $s : $s;
};

$out = fopen('php://output', 'w');
fwrite($out, "\xEF\xBB\xBF"); // BOM: sin él Excel rompe los acentos
// Punto y coma: es el separador que espera Excel con configuración regional chilena.
fputcsv($out, ['Nombre', 'Teléfono', 'Asiste', 'Acompañantes', 'Personas', 'Alimentación', 'Mensaje', 'Fecha'], ';');
foreach ($filas as $f) {
    $asiste = (int) $f['asiste'] === 1;
    fputcsv($out, [
        $celda($f['nombre']),
        $celda($f['telefono']),
        $asiste ? 'Sí' : 'No',
        $asiste ? $f['acompanantes'] : 0,
        $asiste ? 1 + (int) $f['acompanantes'] : 0,
        $celda($f['alimentacion']),
        $celda($f['mensaje']),
        $f['creado'],
    ], ';');
}
fclose($out);
