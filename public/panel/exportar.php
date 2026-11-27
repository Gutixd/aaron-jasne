<?php
/** Descarga la lista de invitados y sus respuestas en CSV (abre bien en Excel en español). */

declare(strict_types=1);

require __DIR__ . '/_sesion.php';

if (!sesion_activa()) {
    header('Location: ./');
    exit;
}

// Una fila por invitado de la lista (con su respuesta, si la hay) y al
// final las respuestas de gente que no está en la lista.
$filas = db()->query(
    'SELECT i.nombre AS invitado, i.cupos, c.nombre, c.telefono, c.asiste, c.acompanantes,
            c.alimentacion, c.canciones, c.mensaje, c.creado
     FROM invitados i LEFT JOIN confirmaciones c ON c.invitado_id = i.id
     ORDER BY i.nombre'
)->fetchAll();
$sueltas = db()->query(
    'SELECT NULL AS invitado, NULL AS cupos, nombre, telefono, asiste, acompanantes,
            alimentacion, canciones, mensaje, creado
     FROM confirmaciones WHERE invitado_id IS NULL ORDER BY creado DESC'
)->fetchAll();
$filas = array_merge($filas, $sueltas);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="invitados-aaron-jasne.csv"');

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
fputcsv($out, ['Invitado', 'Cupos', 'Estado', 'Respondió como', 'Teléfono', 'Personas', 'Alimentación', 'Canciones', 'Mensaje', 'Fecha'], ';');
foreach ($filas as $f) {
    $respondio = $f['creado'] !== null;
    $asiste = $respondio && (int) $f['asiste'] === 1;
    fputcsv($out, [
        $celda($f['invitado'] ?? '(fuera de la lista)'),
        $f['cupos'] ?? '',
        !$respondio ? 'Sin responder' : ($asiste ? 'Asiste' : 'No asiste'),
        $celda($f['nombre']),
        $celda($f['telefono']),
        $asiste ? 1 + (int) $f['acompanantes'] : 0,
        $celda($f['alimentacion']),
        $celda($f['canciones']),
        $celda($f['mensaje']),
        $f['creado'],
    ], ';');
}
fclose($out);
