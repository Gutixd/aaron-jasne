<?php
// Router del servidor PHP local (php -S localhost:4411 -t public servidor/router-local.php).
// Apunta el backend a la configuración de prueba y deja que el servidor
// atienda el archivo pedido de forma normal.
putenv('AJ_CONFIG=' . __DIR__ . '/config.local.php');
return false;
