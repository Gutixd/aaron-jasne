<?php
/**
 * Plantilla de configuración. En el servidor se copia como
 * public_html/api/config.php y se completan los valores.
 *
 * config.php NUNCA va a git: tiene la clave de la base de datos.
 */
return [
    'db' => [
        // Hostinger: hPanel › Bases de datos › MySQL. El host suele ser "localhost".
        'dsn'     => 'mysql:host=localhost;dbname=NOMBRE_DE_LA_BASE;charset=utf8mb4',
        'usuario' => 'USUARIO_DE_LA_BASE',
        'clave'   => 'CLAVE_DE_LA_BASE',
    ],

    // Hash de la clave del panel. Para crearlo:
    //   php servidor/crear-clave.php "tu-clave"
    'panel_clave_hash' => '',

    // Texto aleatorio largo. Se usa para no guardar IPs reales.
    'sal' => 'CAMBIAR-POR-TEXTO-ALEATORIO',

    // Fotos que suben los invitados. Solo se puede subir entre "desde" y
    // "hasta" (hora de Chile, formato exacto AAAA-MM-DD HH:MM:SS). Las fotos
    // se guardan fuera de public_html, en la carpeta fotos-invitados/.
    'fotos' => [
        'desde'        => '2027-01-15 12:00:00', // el día de la boda
        'hasta'        => '2027-01-22 23:59:59', // una semana después
        'max_mb'       => 15,    // por foto (la página ya las achica antes de subir)
        'max_total_mb' => 8000,  // tope de todo lo subido
        'max_fotos'    => 3000,  // tope de cantidad
        'por_hora'     => 60,    // fotos por persona cada hora
        'max_video_mb'       => 100,   // por video (aprox. 1 minuto)
        'max_video_total_mb' => 10000, // tope de todos los videos
    ],
];
