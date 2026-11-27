<?php
// Uso: php servidor/crear-clave.php "la-clave-del-panel"
// Imprime el hash para pegarlo en config.php como panel_clave_hash.
if ($argc < 2 || strlen($argv[1]) < 10) {
    fwrite(STDERR, "Uso: php crear-clave.php \"clave de al menos 10 caracteres\"\n");
    exit(1);
}
echo password_hash($argv[1], PASSWORD_DEFAULT), PHP_EOL;
