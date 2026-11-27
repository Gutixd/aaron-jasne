<?php
/**
 * Base compartida del backend: configuración, conexión y respuestas.
 *
 * No se llama directamente desde el navegador (el .htaccess de esta carpeta
 * lo bloquea); la incluyen confirmar.php y el panel.
 */

declare(strict_types=1);

date_default_timezone_set('America/Santiago');

/** Configuración de config.php. Sin ella el backend no arranca. */
function config(): array
{
    static $cfg = null;
    if ($cfg !== null) {
        return $cfg;
    }
    // En Hostinger: api/config.php. En local, AJ_CONFIG apunta a
    // servidor/config.local.php, fuera de public/, para que la configuración
    // de prueba nunca termine copiada dentro del sitio compilado.
    $ruta = getenv('AJ_CONFIG') ?: __DIR__ . '/config.php';
    if (!is_file($ruta)) {
        http_response_code(503);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Servidor sin configurar.']);
        exit;
    }
    $cfg = require $ruta;
    return $cfg;
}

/** Conexión PDO. Funciona igual con MySQL (Hostinger) y SQLite (local). */
function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $c = config()['db'];
    $pdo = new PDO($c['dsn'], $c['usuario'] ?? null, $c['clave'] ?? null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    preparar_tablas($pdo);
    return $pdo;
}

/**
 * Crea las tablas si no existen. Así no hace falta abrir phpMyAdmin para
 * instalar: basta con crear la base vacía y completar config.php. Son dos
 * sentencias "IF NOT EXISTS" que no hacen nada cuando las tablas ya están.
 */
function preparar_tablas(PDO $pdo): void
{
    $motor = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $archivo = __DIR__ . '/../../servidor/schema.' . ($motor === 'sqlite' ? 'sqlite' : 'mysql') . '.sql';
    if (is_file($archivo)) {
        $pdo->exec(file_get_contents($archivo));
        return;
    }

    // En el servidor solo viaja public/, así que el esquema MySQL va también aquí.
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS confirmaciones (
           id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
           nombre VARCHAR(120) NOT NULL,
           telefono VARCHAR(40) NULL,
           asiste TINYINT(1) NOT NULL,
           acompanantes TINYINT UNSIGNED NOT NULL DEFAULT 0,
           alimentacion VARCHAR(300) NULL,
           mensaje VARCHAR(800) NULL,
           creado DATETIME NOT NULL,
           INDEX idx_creado (creado)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS intentos (
           id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
           ip_hash CHAR(64) NOT NULL,
           creado DATETIME NOT NULL,
           INDEX idx_ip (ip_hash, creado)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

/** Fecha y hora de Chile en formato que entienden MySQL y SQLite. */
function ahora(string $modificador = 'now'): string
{
    return (new DateTimeImmutable($modificador))->format('Y-m-d H:i:s');
}

/** IP del visitante convertida en hash con sal: nunca se guarda la IP real. */
function ip_hash(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return hash('sha256', config()['sal'] . '|' . $ip);
}

function responder_json(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Texto de usuario: sin caracteres de control, recortado y con largo máximo. */
function limpiar_texto(mixed $valor, int $max): ?string
{
    if (!is_string($valor)) {
        return null;
    }
    $t = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $valor) ?? '');
    if ($t === '') {
        return null;
    }
    return mb_substr($t, 0, $max);
}

/**
 * Límite de intentos por IP en una ventana de tiempo. Sirve para el
 * formulario público y para el login del panel (con distinto `tipo`).
 * Devuelve false si ya se pasó del límite.
 */
function dentro_del_limite(string $tipo, int $maximo, int $minutos): bool
{
    $clave = hash('sha256', $tipo . '|' . ip_hash());

    // Limpieza oportunista: lo de más de un día ya no sirve.
    db()->prepare('DELETE FROM intentos WHERE creado < ?')->execute([ahora('-1 day')]);

    $q = db()->prepare('SELECT COUNT(*) FROM intentos WHERE ip_hash = ? AND creado >= ?');
    $q->execute([$clave, ahora("-{$minutos} minutes")]);
    if ((int) $q->fetchColumn() >= $maximo) {
        return false;
    }
    db()->prepare('INSERT INTO intentos (ip_hash, creado) VALUES (?, ?)')->execute([$clave, ahora()]);
    return true;
}
