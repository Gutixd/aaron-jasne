<?php
/**
 * Sesión del panel: login, salida y token anti-CSRF.
 * La incluyen index.php y exportar.php; no se pide directamente.
 */

declare(strict_types=1);

require __DIR__ . '/../api/_base.php';

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

session_name('aj_panel');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/panel',
    'secure'   => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

function sesion_activa(): bool
{
    return !empty($_SESSION['admin']);
}

function token_csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_valido(?string $t): bool
{
    return is_string($t) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $t);
}

/** Devuelve un mensaje de error, o null si entró. */
function intentar_login(string $clave): ?string
{
    $hash = config()['panel_clave_hash'] ?? '';
    if ($hash === '') {
        return 'El panel no tiene clave configurada.';
    }
    // 6 intentos cada 15 minutos por IP: frena a quien pruebe claves.
    if (!dentro_del_limite('login', 6, 15)) {
        return 'Demasiados intentos. Espera 15 minutos.';
    }
    if (!password_verify($clave, $hash)) {
        usleep(400000);
        return 'Clave incorrecta.';
    }
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    return null;
}

function e(?string $t): string
{
    return htmlspecialchars((string) $t, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
