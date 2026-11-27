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
    // Orden: variable de entorno (local) → api/config.php → config-boda.php
    // fuera de public_html (Hostinger con GIT: esa carpeta la maneja el
    // repositorio y no puede tener archivos propios).
    $ruta = getenv('AJ_CONFIG') ?: (is_file(__DIR__ . '/config.php')
        ? __DIR__ . '/config.php'
        : dirname(__DIR__, 2) . '/config-boda.php');
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
 * Crea las tablas si no existen y agrega columnas nuevas a bases antiguas.
 * Así no hace falta abrir phpMyAdmin para instalar ni para actualizar:
 * basta con crear la base vacía y completar config.php.
 */
function preparar_tablas(PDO $pdo): void
{
    $sqlite = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    $id     = $sqlite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY';
    $fin    = $sqlite ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

    // Lista de invitados que cargan los novios en el panel. Una fila puede
    // ser una persona o una familia: `nombre` es como se le saluda y
    // `busqueda` los nombres con que puede buscarse (uno por línea o coma).
    $pdo->exec("CREATE TABLE IF NOT EXISTS invitados (
        id {$id},
        nombre VARCHAR(120) NOT NULL,
        busqueda VARCHAR(600) NOT NULL DEFAULT '',
        cupos TINYINT UNSIGNED NOT NULL DEFAULT 1,
        telefono VARCHAR(40) NULL,
        creado DATETIME NOT NULL
      ){$fin}");

    // Una fila por respuesta. Con lista de invitados, cada invitado tiene
    // como máximo una: si vuelve a responder, se reemplaza.
    $pdo->exec("CREATE TABLE IF NOT EXISTS confirmaciones (
        id {$id},
        nombre VARCHAR(120) NOT NULL,
        telefono VARCHAR(40) NULL,
        asiste TINYINT(1) NOT NULL,
        acompanantes TINYINT UNSIGNED NOT NULL DEFAULT 0,
        alimentacion VARCHAR(300) NULL,
        mensaje VARCHAR(800) NULL,
        creado DATETIME NOT NULL
      ){$fin}");

    $pdo->exec("CREATE TABLE IF NOT EXISTS intentos (
        id {$id},
        ip_hash CHAR(64) NOT NULL,
        creado DATETIME NOT NULL
      ){$fin}");

    // Fotos que suben los invitados el día de la boda. El archivo va a una
    // carpeta fuera de la web (ver carpeta_fotos); aquí solo sus datos.
    $pdo->exec("CREATE TABLE IF NOT EXISTS fotos (
        id {$id},
        archivo VARCHAR(80) NOT NULL,
        tipo VARCHAR(40) NOT NULL,
        bytes INT UNSIGNED NOT NULL,
        autor VARCHAR(80) NULL,
        creado DATETIME NOT NULL
      ){$fin}");

    // Ajustes editables desde el panel (contenido de la invitación, fechas
    // de la subida de fotos). Una fila por clave, valor en JSON.
    $pdo->exec("CREATE TABLE IF NOT EXISTS ajustes (
        clave VARCHAR(60) NOT NULL PRIMARY KEY,
        valor TEXT NOT NULL,
        actualizado DATETIME NOT NULL
      ){$fin}");

    // Avisos de regalo: el invitado transfiere por su banco y deja aquí su
    // nombre, el monto (opcional) y un mensaje. La página no maneja dinero;
    // esto es solo para que los novios sepan a quién agradecer.
    $pdo->exec("CREATE TABLE IF NOT EXISTS regalos (
        id {$id},
        invitado_id INT NULL,
        nombre VARCHAR(120) NOT NULL,
        monto INT UNSIGNED NULL,
        mensaje VARCHAR(800) NULL,
        creado DATETIME NOT NULL
      ){$fin}");

    // Columnas que llegaron después: se agregan si faltan.
    asegurar_columna($pdo, $sqlite, 'confirmaciones', 'invitado_id', 'INT NULL');
    asegurar_columna($pdo, $sqlite, 'confirmaciones', 'canciones', 'VARCHAR(500) NULL');
    asegurar_columna($pdo, $sqlite, 'invitados', 'codigo', 'VARCHAR(16) NULL');
    asegurar_columna($pdo, $sqlite, 'regalos', 'agradecido', 'TINYINT(1) NOT NULL DEFAULT 0');
    asegurar_columna($pdo, $sqlite, 'invitados', 'enviado', 'TINYINT(1) NOT NULL DEFAULT 0');
    // Dos álbumes de fotos: 'general' (todo) y 'favoritas' (solo las mejores).
    asegurar_columna($pdo, $sqlite, 'fotos', 'album', "VARCHAR(20) NOT NULL DEFAULT 'general'");

    // Todo invitado tiene su código de link personal.
    foreach ($pdo->query("SELECT id FROM invitados WHERE codigo IS NULL OR codigo = ''")->fetchAll() as $f) {
        $pdo->prepare('UPDATE invitados SET codigo = ? WHERE id = ?')->execute([nuevo_codigo(), $f['id']]);
    }
}

/**
 * Código al azar para el link personal (…/?i=k7f3q9mx). Sin letras que se
 * confunden (l, 1, o, 0) por si alguien lo copia a mano. 8 caracteres de 32
 * posibles: imposible de adivinar recorriendo códigos.
 */
function nuevo_codigo(): string
{
    $abc = 'abcdefghijkmnpqrstuvwxyz23456789';
    $c = '';
    for ($i = 0; $i < 8; $i++) {
        $c .= $abc[random_int(0, strlen($abc) - 1)];
    }
    return $c;
}

function invitado_por_codigo(string $codigo): ?array
{
    if (!preg_match('/^[a-z0-9]{6,16}$/', $codigo)) {
        return null;
    }
    $q = db()->prepare('SELECT * FROM invitados WHERE codigo = ?');
    $q->execute([$codigo]);
    return $q->fetch() ?: null;
}

/** Lo que el navegador necesita saber de un invitado. Nunca su teléfono. */
function invitado_publico(array $inv): array
{
    $previa = respuesta_de((int) $inv['id']);
    return [
        'nombre' => $inv['nombre'],
        'cupos'  => (int) $inv['cupos'],
        'codigo' => $inv['codigo'],
        'previa' => $previa === null ? null : [
            'asiste'   => (int) $previa['asiste'] === 1,
            'personas' => (int) $previa['asiste'] === 1 ? 1 + (int) $previa['acompanantes'] : 0,
        ],
    ];
}

/* ─────────────────────────────────────────────── fotos de los invitados ── */

/**
 * Reglas de la subida de fotos, desde config.php (clave 'fotos'):
 *   desde / hasta  — ventana en que se puede subir ('2027-01-16 12:00:00').
 *   max_mb         — tamaño máximo por foto.
 *   max_total_mb   — tope de todo lo subido, para no llenar el hosting.
 *   max_fotos      — tope de cantidad de fotos.
 *   por_hora       — fotos por celular por hora (por IP se permite 25 veces eso,
 *                    porque en la fiesta todos comparten el mismo Wi-Fi).
 * Sin 'desde' y 'hasta' la subida queda cerrada.
 */
function reglas_fotos(): array
{
    // Las fechas pueden venir del panel (ajuste 'fotos'); si no, de config.php.
    $f = array_merge(config()['fotos'] ?? [], array_filter(ajuste('fotos') ?? []));
    return [
        'desde'        => $f['desde'] ?? null,
        'hasta'        => $f['hasta'] ?? null,
        'max_mb'       => (int) ($f['max_mb'] ?? 15),
        'max_total_mb' => (int) ($f['max_total_mb'] ?? 8000),
        'max_fotos'    => (int) ($f['max_fotos'] ?? 3000),
        'por_hora'     => (int) ($f['por_hora'] ?? 60),
    ];
}

/** "antes", "abierto" o "cerrado", según la ventana de config.php. */
function estado_fotos(): string
{
    $r = reglas_fotos();
    if (!$r['desde'] || !$r['hasta']) {
        return 'antes';
    }
    $ahora = ahora();
    if ($ahora < $r['desde']) return 'antes';
    if ($ahora > $r['hasta']) return 'cerrado';
    return 'abierto';
}

/**
 * Carpeta de las fotos: FUERA de public_html, para que nadie pueda verlas
 * ni descargarlas escribiendo una dirección. Solo el panel las entrega.
 */
function carpeta_fotos(): string
{
    $dir = config()['fotos']['carpeta'] ?? dirname(__DIR__, 2) . '/fotos-invitados';
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    return rtrim($dir, '/\\');
}

function asegurar_columna(PDO $pdo, bool $sqlite, string $tabla, string $columna, string $tipo): void
{
    if ($sqlite) {
        $cols = array_column($pdo->query("PRAGMA table_info({$tabla})")->fetchAll(), 'name');
        $existe = in_array($columna, $cols, true);
    } else {
        $q = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?');
        $q->execute([$tabla, $columna]);
        $existe = (int) $q->fetchColumn() > 0;
    }
    if (!$existe) {
        $pdo->exec("ALTER TABLE {$tabla} ADD COLUMN {$columna} {$tipo}");
    }
}

/* ──────────────────────────────────────────────── lista de invitados ── */

/** Minúsculas, sin tildes ni signos y con espacios simples: "José  Pérez." → "jose perez". */
function normalizar_nombre(string $t): string
{
    $t = mb_strtolower($t);
    $t = strtr($t, ['á' => 'a', 'à' => 'a', 'ä' => 'a', 'â' => 'a', 'é' => 'e', 'è' => 'e', 'ë' => 'e', 'ê' => 'e',
                    'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'î' => 'i', 'ó' => 'o', 'ò' => 'o', 'ö' => 'o', 'ô' => 'o',
                    'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'û' => 'u', 'ñ' => 'n', 'ç' => 'c']);
    $t = preg_replace('/[^a-z0-9 ]+/', ' ', $t) ?? '';
    return trim(preg_replace('/\s+/', ' ', $t) ?? '');
}

/** Palabras que no ayudan a distinguir a nadie. */
function palabras_nombre(string $t): array
{
    $vacias = ['de', 'del', 'la', 'las', 'los', 'y', 'e', 'familia', 'flia', 'sr', 'sra', 'srta'];
    return array_values(array_diff(array_filter(explode(' ', normalizar_nombre($t)), 'strlen'), $vacias));
}

/** ¿Hay invitados cargados? Sin lista, el formulario funciona abierto. */
function hay_lista(): bool
{
    return (int) db()->query('SELECT COUNT(*) FROM invitados')->fetchColumn() > 0;
}

/**
 * Busca al invitado por lo que escribió. Coincide si TODAS las palabras
 * escritas (al menos dos: nombre y apellido) están en el nombre del
 * invitado o en alguno de sus nombres de búsqueda, en cualquier orden.
 * "juan perez" encuentra a "Juan Carlos Pérez Soto".
 *
 * Devuelve ['invitado' => fila] si hay exactamente uno, ['varios' => true]
 * si hay más de uno, o [] si no hay ninguno.
 */
function buscar_invitado(string $escrito): array
{
    $buscadas = array_unique(palabras_nombre($escrito));
    if (count($buscadas) < 2) {
        return ['corto' => true];
    }
    $hallados = [];
    foreach (db()->query('SELECT * FROM invitados')->fetchAll() as $inv) {
        $variantes = array_merge([$inv['nombre']], preg_split('/[,
;]+/', (string) $inv['busqueda']) ?: []);
        foreach ($variantes as $v) {
            $palabras = palabras_nombre($v);
            if ($palabras && !array_diff($buscadas, $palabras)) {
                $hallados[$inv['id']] = $inv;
                break;
            }
        }
    }
    if (count($hallados) === 1) {
        return ['invitado' => array_values($hallados)[0]];
    }
    return $hallados ? ['varios' => true] : [];
}

/** Respuesta ya guardada de un invitado, si existe. */
function respuesta_de(int $invitadoId): ?array
{
    $q = db()->prepare('SELECT * FROM confirmaciones WHERE invitado_id = ? ORDER BY creado DESC LIMIT 1');
    $q->execute([$invitadoId]);
    return $q->fetch() ?: null;
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

/* ───────────────────────────────────────────────────────────── ajustes ── */

function ajuste(string $clave): ?array
{
    $q = db()->prepare('SELECT valor FROM ajustes WHERE clave = ?');
    $q->execute([$clave]);
    $v = $q->fetchColumn();
    $d = is_string($v) ? json_decode($v, true) : null;
    return is_array($d) ? $d : null;
}

function guardar_ajuste(string $clave, array $valor): void
{
    $json = json_encode($valor, JSON_UNESCAPED_UNICODE);
    $pdo = db();
    $pdo->prepare('DELETE FROM ajustes WHERE clave = ?')->execute([$clave]);
    $pdo->prepare('INSERT INTO ajustes (clave, valor, actualizado) VALUES (?, ?, ?)')->execute([$clave, $json, ahora()]);
}

/**
 * Contenido de la invitación: lo que viene en el código (contenido-base.json,
 * generado desde event.config.ts) con encima lo editado en el panel.
 * Las listas (programa, menú) se reemplazan enteras, no elemento a elemento.
 */
function contenido(): array
{
    $base = json_decode((string) @file_get_contents(__DIR__ . '/contenido-base.json'), true) ?: [];
    $cambios = ajuste('contenido') ?? [];
    $todo = array_replace_recursive($base, $cambios);
    if (isset($cambios['programa'])) $todo['programa'] = $cambios['programa'];
    if (isset($cambios['menu']['tiempos'])) $todo['menu']['tiempos'] = $cambios['menu']['tiempos'];
    return $todo;
}

/** "2027-01-16" + "18:00" → ISO con la zona horaria de Chile de ese día. */
function iso_chile(string $fecha, string $hora): ?string
{
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha) || !preg_match('/^\d{2}:\d{2}$/', $hora)) {
        return null;
    }
    try {
        return (new DateTimeImmutable("{$fecha} {$hora}:00", new DateTimeZone('America/Santiago')))->format('Y-m-d\TH:i:sP');
    } catch (Throwable) {
        return null;
    }
}

/**
 * Lo de $nuevo que difiere de $base. Los objetos se comparan campo a campo;
 * las listas (programa, menú) se comparan enteras. Los saltos de línea se
 * normalizan: el navegador manda CR+LF y el codigo usa solo LF.
 */
function solo_cambios(array $nuevo, array $base): array
{
    $norm = static fn($v) => is_string($v) ? str_replace("
", "
", $v) : $v;
    $fuera = [];
    foreach ($nuevo as $k => $v) {
        $b = $base[$k] ?? null;
        if (is_array($v) && !array_is_list($v) && is_array($b)) {
            $sub = solo_cambios($v, $b);
            if ($sub) $fuera[$k] = $sub;
        } elseif ((is_array($v) ? json_encode($v) : $norm($v)) !== (is_array($b) ? json_encode($b) : $norm($b))) {
            $fuera[$k] = is_string($v) ? $norm($v) : $v;
        }
    }
    return $fuera;
}
