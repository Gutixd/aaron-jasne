<?php
/**
 * Prepara el backend para probarlo en este equipo, sin MySQL:
 *   php servidor/preparar-local.php
 *
 * Crea servidor/local.sqlite con el esquema, servidor/config.local.php y una
 * clave aleatoria para el panel, guardada en CLAVE-PANEL.txt. Los tres están
 * en .gitignore. Si ya existen, no los toca.
 */

$base   = __DIR__;
$sqlite = "$base/local.sqlite";
$cfg    = "$base/config.local.php";
$txt    = dirname($base) . '/CLAVE-PANEL.txt';

$pdo = new PDO('sqlite:' . $sqlite, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec(file_get_contents("$base/schema.sqlite.sql"));
echo "Base local lista: $sqlite\n";

if (is_file($cfg)) {
    echo "config.local.php ya existía, no lo toco.\n";
    exit(0);
}

$clave = rtrim(strtr(base64_encode(random_bytes(12)), '+/', '-_'), '=');
$contenido = "<?php\n// Solo para pruebas locales. No va a git ni al servidor.\nreturn " . var_export([
    'db' => ['dsn' => 'sqlite:' . str_replace('\\', '/', $sqlite), 'usuario' => null, 'clave' => null],
    'panel_clave_hash' => password_hash($clave, PASSWORD_DEFAULT),
    'sal' => bin2hex(random_bytes(16)),
], true) . ";\n";

file_put_contents($cfg, $contenido);
file_put_contents($txt, "Clave del panel LOCAL (http://localhost:4410/panel/): $clave\n");
echo "Configuración local creada. Clave del panel guardada en CLAVE-PANEL.txt\n";
