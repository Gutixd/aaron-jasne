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
];
