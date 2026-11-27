<?php
/**
 * Panel de Aaron & Jasne — /panel/
 *
 * Invitados: la lista que cargan los novios, con cupos y estado de cada uno.
 * Respuestas: todo lo que llegó desde la invitación, canciones y comida.
 */

declare(strict_types=1);

require __DIR__ . '/_sesion.php';

$error = null;
$aviso = null;
$vista = in_array($_GET['v'] ?? '', ['respuestas', 'fotos', 'regalos', 'contenido'], true) ? $_GET['v'] : 'invitados';
const FOTOS_POR_PAGINA = 60;
const FOTOS_POR_ZIP = 150;

/** Cupos válidos: 1 a 11 (el formulario admite hasta 10 acompañantes). */
$leerCupos = static function (mixed $v): ?int {
    $n = filter_var($v, FILTER_VALIDATE_INT);
    return ($n !== false && $n >= 1 && $n <= 11) ? $n : null;
};

$agregar = static function (string $nombre, string $busqueda, int $cupos, ?string $tel): void {
    db()->prepare('INSERT INTO invitados (nombre, busqueda, cupos, telefono, codigo, creado) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$nombre, $busqueda, $cupos, $tel, nuevo_codigo(), ahora()]);
};

// ── Acciones (todas por POST y con token anti-CSRF) ─────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $accion = $_POST['accion'] ?? '';

    if ($accion === 'entrar') {
        $error = intentar_login((string) ($_POST['clave'] ?? ''));
        if ($error === null) {
            header('Location: ./');
            exit;
        }
    } elseif (!sesion_activa() || !csrf_valido($_POST['csrf'] ?? null)) {
        http_response_code(403);
        $error = 'La sesión expiró. Vuelve a cargar la página.';
    } elseif ($accion === 'salir') {
        $_SESSION = [];
        session_destroy();
        header('Location: ./');
        exit;
    } elseif ($accion === 'borrar') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id) {
            db()->prepare('DELETE FROM confirmaciones WHERE id = ?')->execute([$id]);
            header('Location: ./?v=respuestas&ok=borrada');
            exit;
        }
    } elseif ($accion === 'agregar') {
        $nombre = limpiar_texto($_POST['nombre'] ?? null, 120);
        $cupos  = $leerCupos($_POST['cupos'] ?? null);
        if ($nombre === null || $cupos === null) {
            $error = 'Falta el nombre, o los cupos no están entre 1 y 11.';
        } else {
            $agregar($nombre, limpiar_texto($_POST['busqueda'] ?? null, 600) ?? '', $cupos,
                     limpiar_texto($_POST['telefono'] ?? null, 40));
            header('Location: ./?ok=agregado');
            exit;
        }
    } elseif ($accion === 'importar') {
        // Una línea por invitado:  Nombre | nombres para buscar | cupos | teléfono
        $lineas = preg_split('/\r?\n/', (string) ($_POST['lista'] ?? '')) ?: [];
        $hechos = 0;
        $malas  = [];
        foreach ($lineas as $n => $linea) {
            if (trim($linea) === '') continue;
            $p = array_map('trim', explode('|', $linea));
            $nombre = limpiar_texto($p[0] ?? null, 120);
            $cupos  = $leerCupos(($p[2] ?? '') === '' ? 1 : $p[2]);
            if ($nombre === null || $cupos === null) {
                $malas[] = $n + 1;
                continue;
            }
            $agregar($nombre, limpiar_texto($p[1] ?? null, 600) ?? '', $cupos, limpiar_texto($p[3] ?? null, 40));
            $hechos++;
        }
        $aviso = "Se agregaron {$hechos} invitados.";
        if ($malas) {
            $error = 'No se entendieron las líneas ' . implode(', ', $malas) . ' (revisa nombre y cupos).';
        }
    } elseif ($accion === 'cupos') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        $cupos = $leerCupos($_POST['cupos'] ?? null);
        if ($id && $cupos !== null) {
            db()->prepare('UPDATE invitados SET cupos = ? WHERE id = ?')->execute([$cupos, $id]);
            header('Location: ./?ok=cupos');
            exit;
        }
    } elseif ($accion === 'borrar_foto') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        $q = db()->prepare('SELECT archivo FROM fotos WHERE id = ?');
        $q->execute([$id ?: 0]);
        if ($archivo = $q->fetchColumn()) {
            @unlink(carpeta_fotos() . '/' . basename((string) $archivo));
            db()->prepare('DELETE FROM fotos WHERE id = ?')->execute([$id]);
        }
        header('Location: ./?v=fotos&ok=foto');
        exit;
    } elseif ($accion === 'contenido') {
        // Todo el formulario de "Contenido" de una vez. Si algo no está bien,
        // no se guarda nada y se explica qué corregir.
        $P = static fn(string $k, int $max = 300): string => trim(mb_substr((string) ($_POST[$k] ?? ''), 0, $max));
        $errores = [];
        $c = [];

        $iso = iso_chile($P('fecha_dia', 10), $P('fecha_hora', 5));
        if ($iso) {
            $c['fecha'] = ['iso' => $iso, 'confirmada' => isset($_POST['fecha_confirmada'])];
        } else {
            $errores[] = 'La fecha o la hora no son válidas.';
        }

        $c['textos'] = ['anuncio' => $P('anuncio', 600)];

        $maps = $P('lugar_maps', 600);
        if ($maps !== '' && !preg_match('#^https://#', $maps)) $errores[] = 'El link del mapa debe empezar con https://';
        $c['lugar'] = ['nombre' => $P('lugar_nombre', 120), 'direccion' => $P('lugar_direccion', 200),
                       'ciudad' => $P('lugar_ciudad', 120), 'mapsUrl' => $maps];

        $wa = preg_replace('/\D/', '', $P('whatsapp', 30)) ?? '';
        if ($wa !== '' && (strlen($wa) < 8 || strlen($wa) > 15)) $errores[] = 'El WhatsApp debe ir con código de país, ej. 56912345678.';
        $c['whatsapp'] = ['numero' => $wa];

        $iconos = ['copas', 'anillos', 'arco', 'camara', 'cubiertos', 'torta', 'musica', 'destello'];
        $c['programa'] = [];
        foreach (preg_split('/\r?\n/', $P('programa', 3000)) ?: [] as $n => $l) {
            if (trim($l) === '') continue;
            $x = array_map('trim', explode('|', $l));
            // La "hora" puede ser una hora (16:00) o un texto corto ("Luego").
            if (($x[0] ?? '') === '' || ($x[1] ?? '') === '') {
                $errores[] = 'Programa, línea ' . ($n + 1) . ': falta la hora (ej. 16:00 o "Luego") o el título.';
                continue;
            }
            $item = ['hora' => mb_substr($x[0], 0, 14), 'titulo' => mb_substr($x[1], 0, 60),
                     'icono' => in_array($x[3] ?? '', $iconos, true) ? $x[3] : 'destello'];
            if (($x[2] ?? '') !== '') $item['detalle'] = mb_substr($x[2], 0, 60);
            $c['programa'][] = $item;
        }

        $tiempos = [];
        foreach (preg_split('/\r?\n/', $P('menu', 3000)) ?: [] as $n => $l) {
            if (trim($l) === '') continue;
            $x = array_map('trim', explode('|', $l));
            if (($x[0] ?? '') === '' || ($x[1] ?? '') === '') {
                $errores[] = 'Menú, línea ' . ($n + 1) . ': falta el tiempo o el plato.';
                continue;
            }
            $t = ['tiempo' => mb_substr($x[0], 0, 40), 'plato' => mb_substr($x[1], 0, 160)];
            if (($x[2] ?? '') !== '') $t['opciones'] = mb_substr($x[2], 0, 160);
            $tiempos[] = $t;
        }
        $c['menu'] = ['nota' => $P('menu_nota', 300), 'tiempos' => $tiempos];

        $c['vestimenta'] = ['nota' => $P('vestimenta', 800)];

        $tr = [];
        foreach (['titular', 'rut', 'banco', 'tipoCuenta', 'numero', 'correo'] as $k) {
            $tr[$k] = $P('tr_' . $k, 120) ?: 'PENDIENTE';
        }
        $c['regalo'] = ['texto' => $P('regalo_texto', 600), 'transferencia' => $tr];

        $cierre = iso_chile($P('rsvp_cierre', 10), '23:59');
        if ($cierre) {
            $c['rsvp'] = ['cierreIso' => $cierre];
        } else {
            $errores[] = 'La fecha límite para confirmar no es válida.';
        }

        // Ventana de la subida de fotos (datetime-local: 2027-01-16T12:00).
        $fv = static function (string $v): ?string {
            return preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $v) ? str_replace('T', ' ', $v) . ':00' : null;
        };
        $fotosVentana = ['desde' => $fv($P('fotos_desde', 16)), 'hasta' => $fv($P('fotos_hasta', 16))];
        if ($fotosVentana['desde'] && $fotosVentana['hasta'] && $fotosVentana['desde'] >= $fotosVentana['hasta']) {
            $errores[] = 'Fotos: el cierre de la subida debe ser después de la apertura.';
        }

        if ($errores) {
            $error = implode(' ', $errores);
        } else {
            // Solo se guarda lo que difiere del código: si se guardara todo,
            // lo no tocado quedaría congelado y taparía las actualizaciones
            // que vengan después desde el código (pasó con fecha y programa).
            $base = json_decode((string) @file_get_contents(__DIR__ . '/../api/contenido-base.json'), true) ?: [];
            guardar_ajuste('contenido', solo_cambios($c, $base));
            guardar_ajuste('fotos', array_filter($fotosVentana));
            header('Location: ./?v=contenido&ok=contenido');
            exit;
        }
    } elseif ($accion === 'agradecido') {
        // Marca (o desmarca) que ya se agradeció el regalo.
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id) {
            db()->prepare('UPDATE regalos SET agradecido = 1 - agradecido WHERE id = ?')->execute([$id]);
        }
        header('Location: ./?v=regalos');
        exit;
    } elseif ($accion === 'borrar_regalo') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id) {
            db()->prepare('DELETE FROM regalos WHERE id = ?')->execute([$id]);
        }
        header('Location: ./?v=regalos&ok=regalo');
        exit;
    } elseif ($accion === 'editar') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        $nombre = limpiar_texto($_POST['nombre'] ?? null, 120);
        $cupos = $leerCupos($_POST['cupos'] ?? null);
        if (!$id || $nombre === null || $cupos === null) {
            $error = 'Falta el saludo, o los cupos no están entre 1 y 11.';
        } else {
            db()->prepare('UPDATE invitados SET nombre = ?, busqueda = ?, telefono = ?, cupos = ? WHERE id = ?')
                ->execute([$nombre, limpiar_texto($_POST['busqueda'] ?? null, 600) ?? '', limpiar_texto($_POST['telefono'] ?? null, 40), $cupos, $id]);
            header('Location: ./?ok=editado#inv-' . $id);
            exit;
        }
    } elseif ($accion === 'anotar') {
        // Respuesta que llegó por teléfono o en persona: queda igual que una
        // de la invitación (reemplaza la anterior), marcada como anotada.
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        $q = db()->prepare('SELECT * FROM invitados WHERE id = ?');
        $q->execute([$id ?: 0]);
        if ($inv = $q->fetch()) {
            $asiste = ($_POST['asiste'] ?? '') === 'si';
            $personas = max(1, min((int) $inv['cupos'], (int) ($_POST['personas'] ?? 1)));
            $pdo = db();
            $pdo->beginTransaction();
            $pdo->prepare('DELETE FROM confirmaciones WHERE invitado_id = ?')->execute([$id]);
            $pdo->prepare('INSERT INTO confirmaciones (invitado_id, nombre, asiste, acompanantes, mensaje, creado) VALUES (?, ?, ?, ?, ?, ?)')
                ->execute([$id, $inv['nombre'], $asiste ? 1 : 0, $asiste ? $personas - 1 : 0, '[anotado en el panel]', ahora()]);
            $pdo->commit();
            header('Location: ./?ok=anotado#inv-' . $id);
            exit;
        }
    } elseif ($accion === 'enviado') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id) {
            db()->prepare('UPDATE invitados SET enviado = 1 - enviado WHERE id = ?')->execute([$id]);
        }
        header('Location: ./?' . http_build_query(['f' => $_GET['f'] ?? 'todos']) . '#inv-' . $id);
        exit;
    } elseif ($accion === 'quitar') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id) {
            // Su respuesta queda en "Respuestas", solo pierde el vínculo.
            db()->prepare('UPDATE confirmaciones SET invitado_id = NULL WHERE invitado_id = ?')->execute([$id]);
            db()->prepare('DELETE FROM invitados WHERE id = ?')->execute([$id]);
            header('Location: ./?ok=quitado');
            exit;
        }
    }
}

$avisos = ['borrada' => 'Respuesta eliminada.', 'agregado' => 'Invitado agregado.',
           'cupos' => 'Cupos actualizados.', 'quitado' => 'Invitado quitado de la lista.', 'foto' => 'Foto eliminada.', 'regalo' => 'Aviso de regalo eliminado.',
           'contenido' => 'Contenido guardado. La invitación ya lo muestra.',
           'editado' => 'Invitado actualizado.', 'anotado' => 'Respuesta anotada.'];
$aviso ??= $avisos[$_GET['ok'] ?? ''] ?? null;

// ── Datos ───────────────────────────────────────────────────────────────
$filtro = (string) ($_GET['f'] ?? 'todos');
$busca  = trim((string) ($_GET['q'] ?? ''));
$coincide = static fn(string $texto): bool => $busca === '' || mb_stripos($texto, $busca) !== false;

if (sesion_activa()) {
    $respuestas = db()->query('SELECT * FROM confirmaciones ORDER BY creado DESC')->fetchAll();
    $invitados  = db()->query('SELECT * FROM invitados ORDER BY nombre')->fetchAll();

    $porInvitado = [];
    foreach ($respuestas as $r) {
        if ($r['invitado_id'] !== null && !isset($porInvitado[(int) $r['invitado_id']])) {
            $porInvitado[(int) $r['invitado_id']] = $r;
        }
    }

    // Totales que importan para organizar la fiesta.
    $t = ['invitados' => count($invitados), 'cupos' => 0, 'vienen' => 0, 'no' => 0, 'pendientes' => 0, 'cuposPendientes' => 0];
    foreach ($invitados as $i) {
        $t['cupos'] += (int) $i['cupos'];
        $r = $porInvitado[(int) $i['id']] ?? null;
        if ($r === null) {
            $t['pendientes']++;
            $t['cuposPendientes'] += (int) $i['cupos'];
        } elseif ((int) $r['asiste'] !== 1) {
            $t['no']++;
        }
    }
    $personas = 0;
    $canciones = [];
    $dietas = [];
    foreach ($respuestas as $r) {
        if ((int) $r['asiste'] === 1) {
            $personas += 1 + (int) $r['acompanantes'];
            if (!empty($r['alimentacion'])) $dietas[] = $r;
        }
        if (!empty($r['canciones'])) $canciones[] = $r;
    }
    $t['vienen'] = $personas;

    $estadoDe = static function (array $i) use ($porInvitado): string {
        $r = $porInvitado[(int) $i['id']] ?? null;
        return $r === null ? 'pendiente' : ((int) $r['asiste'] === 1 ? 'si' : 'no');
    };

    $listaInvitados = array_values(array_filter($invitados, static function ($i) use ($filtro, $coincide, $estadoDe) {
        if ($filtro === 'sin_enviar') {
            if ((int) $i['enviado']) return false;
        } elseif ($filtro !== 'todos' && $estadoDe($i) !== $filtro) {
            return false;
        }
        return $coincide($i['nombre'] . ' ' . $i['busqueda']);
    }));
    $listaRespuestas = array_values(array_filter($respuestas, static function ($r) use ($filtro, $coincide) {
        if ($filtro === 'si' && (int) $r['asiste'] !== 1) return false;
        if ($filtro === 'no' && (int) $r['asiste'] !== 0) return false;
        return $coincide($r['nombre']);
    }));
    // Respuestas de gente que no está en la lista (antes de cargarla, o quitada).
    $sueltas = count(array_filter($respuestas, static fn($r) => $r['invitado_id'] === null));

    $regalos = db()->query('SELECT * FROM regalos ORDER BY creado DESC')->fetchAll();
    $regalosTotal = array_sum(array_map(static fn($g) => (int) $g['monto'], $regalos));

    $fotosTot = db()->query('SELECT COUNT(*) AS n, COALESCE(SUM(bytes), 0) AS b FROM fotos')->fetch();
    $porAlbum = ['general' => 0, 'favoritas' => 0];
    foreach (db()->query('SELECT album, COUNT(*) AS n FROM fotos GROUP BY album')->fetchAll() as $fa) {
        $porAlbum[$fa['album']] = (int) $fa['n'];
    }
    $albumVer = in_array($_GET['album'] ?? '', ['general', 'favoritas'], true) ? $_GET['album'] : null;
    $fotosN = (int) $fotosTot['n'];
    $pagina = max(1, (int) ($_GET['p'] ?? 1));
    $fotos = [];
    if ($vista === 'fotos') {
        $q = db()->prepare('SELECT * FROM fotos' . ($albumVer ? ' WHERE album = ?' : '')
            . ' ORDER BY creado DESC LIMIT ' . FOTOS_POR_PAGINA . ' OFFSET ?');
        $q->execute($albumVer ? [$albumVer, ($pagina - 1) * FOTOS_POR_PAGINA] : [($pagina - 1) * FOTOS_POR_PAGINA]);
        $fotos = $q->fetchAll();
    }
}

$fecha = static fn(string $s): string => (new DateTimeImmutable($s))->format('d-m-Y H:i');
$soloDigitos = static fn(string $tel): string => preg_replace('/\D/', '', $tel) ?? '';

// Dirección pública de la invitación, para el mensaje de WhatsApp.
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
$sitio = ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/';
$linkDe = static fn(array $i): string => $sitio . '?i=' . rawurlencode((string) $i['codigo']);
// El mismo texto sirve para WhatsApp y para "Copiar mensaje" (Instagram, grupos…).
$mensajeDe = static fn(array $i): string =>
    "¡Hola {$i['nombre']}! Con mucha alegría te invitamos a nuestro matrimonio 💍\n\n"
    . "Esta es tu invitación personal, con todos los detalles y para confirmar asistencia:\n{$linkDe($i)}\n\n"
    . ((int) $i['cupos'] > 1 ? "Reservamos {$i['cupos']} lugares para ustedes.\n\n" : '')
    . "Con cariño, Aaron & Jasne";
$invitarPorWa = static fn(array $i): string =>
    'https://wa.me/' . $soloDigitos((string) $i['telefono']) . '?text=' . rawurlencode($mensajeDe($i));

$url = static fn(array $cambios): string => '?' . http_build_query(array_merge(
    ['v' => $GLOBALS['vista'], 'f' => $GLOBALS['filtro'], 'q' => $GLOBALS['busca']], $cambios));
?>
<!doctype html>
<html lang="es-CL">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Panel · Aaron &amp; Jasne</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
  :root { --oliva:#4a4d36; --hondo:#383b2a; --papel:#eee9df; --claro:#f5f2eb; --tinta:#3a3b2f; --suave:#6f705f; --dorado:#b39558; --linea:#c3bca9; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--papel); color:var(--tinta); font:400 17px/1.5 "Cormorant Garamond",Georgia,serif; -webkit-font-smoothing:antialiased; }
  h1,h2 { font-weight:600; letter-spacing:.04em; }
  .eyebrow { font-size:.7rem; letter-spacing:.22em; text-transform:uppercase; font-weight:600; }
  a { color:inherit; }
  .envoltura { max-width:1100px; margin:0 auto; padding:0 16px; }
  header { background:var(--oliva); color:var(--claro); position:sticky; top:0; z-index:5; }
  header .envoltura { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:12px; padding-bottom:12px; }
  header h1 { margin:0; font-size:1.3rem; text-transform:uppercase; } header h1 span { color:var(--dorado); }
  header .boton, header button { border-color:#f5f2eb55; color:var(--claro); }
  button, .boton { font:inherit; font-size:.68rem; letter-spacing:.18em; text-transform:uppercase; font-weight:600; cursor:pointer; border:1px solid var(--linea); background:transparent; color:var(--tinta); padding:8px 14px; text-decoration:none; display:inline-block; border-radius:3px; }
  button:hover, .boton:hover { border-color:var(--dorado); }
  .principal { background:var(--oliva); color:var(--claro); border-color:var(--oliva); }
  .principal:hover { background:var(--hondo); }
  .wa { background:#2f6b4a; color:#fff; border-color:#2f6b4a; }
  main { padding:24px 0 80px; }
  h2 { font-size:1.9rem; margin:0; }
  /* En el celular no caben las 5 pestañas: se deslizan de lado. */
  .pestanas { display:flex; gap:4px; border-bottom:1px solid var(--linea); margin-bottom:22px; overflow-x:auto; scrollbar-width:none; }
  .pestanas a { white-space:nowrap; flex-shrink:0; }
  .pestanas a { text-decoration:none; padding:10px 14px; border-bottom:2px solid transparent; color:var(--suave); }
  .pestanas a.activo { color:var(--oliva); border-color:var(--oliva); }
  .cifras { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:18px 0 26px; }
  .cifra { background:var(--claro); border:1px solid var(--linea); padding:16px 10px; text-align:center; border-radius:4px; }
  .cifra b { display:block; font-size:2.2rem; line-height:1; font-weight:600; }
  .cifra span { display:block; margin-top:6px; color:var(--suave); }
  .cifra small { display:block; color:var(--suave); font-style:italic; }
  .cifra.destacada { background:var(--oliva); color:var(--claro); border-color:var(--oliva); } .cifra.destacada span { color:#f5f2ebaa; }
  .barra { display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .filtros a { text-decoration:none; padding:6px 10px; border-bottom:2px solid transparent; color:var(--suave); }
  .filtros a.activo { color:var(--oliva); border-color:var(--dorado); }
  input, textarea { font:inherit; border:1px solid var(--linea); background:var(--claro); padding:8px 10px; outline:none; color:var(--tinta); border-radius:3px; width:100%; }
  input:focus, textarea:focus { border-color:var(--oliva); }
  input[type=search] { width:220px; }
  table { width:100%; border-collapse:collapse; background:var(--claro); border:1px solid var(--linea); }
  th { text-align:left; background:#e4ded1; color:var(--suave); padding:10px 12px; }
  td { padding:10px 12px; border-top:1px solid #c3bca966; vertical-align:top; }
  .estado { font-size:.66rem; letter-spacing:.16em; text-transform:uppercase; font-weight:600; padding:3px 8px; border-radius:20px; white-space:nowrap; }
  .e-si { background:#4a4d36; color:#f5f2eb; } .e-no { background:#ddd5c6; color:#6f705f; } .e-pendiente { border:1px dashed var(--dorado); color:#8a6f3a; }
  .sub { color:var(--suave); font-style:italic; font-size:.9rem; }
  .vacio { border:1px dashed var(--linea); padding:40px 20px; text-align:center; color:var(--suave); background:var(--claro); }
  .aviso { border-left:3px solid var(--dorado); padding:8px 14px; margin-bottom:16px; background:var(--claro); }
  .error { color:#8b3a2e; }
  .cargar { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:28px; }
  .tarjeta { background:var(--claro); border:1px solid var(--linea); padding:16px; border-radius:4px; }
  .tarjeta h3 { margin:0 0 10px; font-size:1.2rem; }
  .fila { display:grid; grid-template-columns:2fr 1fr; gap:8px; margin-bottom:8px; }
  label.e { display:block; font-size:.66rem; letter-spacing:.16em; text-transform:uppercase; font-weight:600; color:var(--suave); margin:8px 0 3px; }
  form.inline { display:inline; } td button, td .boton { padding:5px 9px; font-size:.6rem; }
  details.editar summary { cursor:pointer; font-size:.68rem; letter-spacing:.18em; text-transform:uppercase; font-weight:600; border:1px solid var(--linea); padding:5px 9px; border-radius:3px; display:inline-block; }
  details.editar[open] { background:var(--claro); border:1px solid var(--linea); border-radius:4px; padding:10px; min-width:240px; }
  details.editar[open] summary { margin-bottom:6px; }
  select { font:inherit; border:1px solid var(--linea); background:var(--claro); padding:8px 10px; border-radius:3px; width:100%; color:var(--tinta); }
  tr:target { outline:2px solid var(--dorado); }
  .lista-simple li { margin:6px 0; }
  form.contenido { display:grid; gap:14px; max-width:760px; }
  .fila3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
  .fila > div, .fila3 > div { min-width:0; }
  .check { display:flex; gap:8px; align-items:baseline; margin-top:12px; } .check input { width:auto; }
  textarea.mono { font:15px/1.6 ui-monospace,Consolas,monospace; }
  .guardar { position:sticky; bottom:0; margin:0; padding:12px 0; background:linear-gradient(transparent, var(--papel) 35%); }
  .guardar button { width:100%; padding:14px; }
  input, textarea { font-variant-numeric:lining-nums; }
  .galeria { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; }
  .galeria figure { margin:0; background:var(--claro); border:1px solid var(--linea); border-radius:4px; overflow:hidden; }
  .galeria img { display:block; width:100%; aspect-ratio:1; object-fit:cover; background:#e4ded1; }
  .galeria figcaption { display:flex; justify-content:space-between; align-items:center; gap:4px; padding:4px 6px; font-size:.85rem; color:var(--suave); }
  .galeria figcaption button { padding:2px 7px; }
  details summary { cursor:pointer; color:var(--oliva); font-weight:600; }
  .login { min-height:100svh; display:flex; align-items:center; justify-content:center; padding:20px; background:var(--oliva); color:var(--claro); }
  .login form { width:100%; max-width:300px; text-align:center; }
  .login input { margin:24px 0 18px; text-align:center; }
  .login button { width:100%; padding:13px; background:var(--claro); color:var(--oliva); }
  @media (max-width:760px) {
    .cifras { grid-template-columns:repeat(2,1fr); } .cargar { grid-template-columns:1fr; }
    .fila, .fila3 { grid-template-columns:1fr; }
    input[type=search] { width:100%; }
    table, thead, tbody, tr, td { display:block; } thead { display:none; } table { border:0; background:none; }
    tr { background:var(--claro); border:1px solid var(--linea); margin-bottom:8px; padding:8px 0; border-radius:4px; } td { border:0; padding:3px 12px; }
    td[data-t]::before { content:attr(data-t) " · "; color:var(--suave); font-size:.66rem; letter-spacing:.16em; text-transform:uppercase; }
  }
</style>
</head>
<body>
<?php if (!sesion_activa()): ?>
  <div class="login">
    <form method="post" autocomplete="off">
      <h1 style="font-size:2.4rem;margin:0">A <span style="color:var(--dorado)">&amp;</span> J</h1>
      <p class="eyebrow" style="opacity:.75">Panel de invitados</p>
      <input type="hidden" name="accion" value="entrar">
      <input type="password" name="clave" placeholder="Clave" required autofocus aria-label="Clave">
      <?php if ($error): ?><p style="color:#f0c9a8"><?= e($error) ?></p><?php endif; ?>
      <button type="submit">Entrar</button>
    </form>
  </div>
<?php else: ?>
  <header>
    <div class="envoltura">
      <h1>Aaron <span>&amp;</span> Jasne</h1>
      <div style="display:flex;gap:8px">
        <a class="boton" href="exportar.php">Excel</a>
        <form method="post" class="inline">
          <input type="hidden" name="accion" value="salir">
          <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
          <button type="submit">Salir</button>
        </form>
      </div>
    </div>
  </header>

  <main class="envoltura">
    <nav class="pestanas eyebrow">
      <a class="<?= $vista === 'invitados' ? 'activo' : '' ?>" href="?v=invitados">Invitados (<?= $t['invitados'] ?>)</a>
      <a class="<?= $vista === 'respuestas' ? 'activo' : '' ?>" href="?v=respuestas">Respuestas (<?= count($respuestas) ?>)</a>
      <a class="<?= $vista === 'fotos' ? 'activo' : '' ?>" href="?v=fotos">Fotos (<?= $fotosN ?>)</a>
      <a class="<?= $vista === 'regalos' ? 'activo' : '' ?>" href="?v=regalos">Regalos (<?= count($regalos) ?>)</a>
      <a class="<?= $vista === 'contenido' ? 'activo' : '' ?>" href="?v=contenido">Contenido</a>
    </nav>

    <section class="cifras">
      <div class="cifra destacada"><b><?= $t['vienen'] ?></b><span class="eyebrow">Personas vienen</span></div>
      <div class="cifra"><b><?= $t['pendientes'] ?></b><span class="eyebrow">Sin responder</span><?php if ($t['pendientes']): ?><small><?= $t['cuposPendientes'] ?> cupos en espera</small><?php endif; ?></div>
      <div class="cifra"><b><?= $t['no'] ?></b><span class="eyebrow">No asistirán</span></div>
      <div class="cifra"><b><?= $t['cupos'] ?></b><span class="eyebrow">Cupos invitados</span><small><?= $t['invitados'] ?> invitaciones</small></div>
    </section>

    <?php if ($aviso): ?><p class="aviso"><?= e($aviso) ?></p><?php endif; ?>
    <?php if ($error): ?><p class="aviso error"><?= e($error) ?></p><?php endif; ?>

  <?php if ($vista === 'invitados'): ?>

    <details <?= $t['invitados'] === 0 ? 'open' : '' ?> style="margin-bottom:22px">
      <summary>+ Agregar invitados</summary>
      <div class="cargar" style="margin-top:14px">
        <form method="post" class="tarjeta">
          <h3>Uno por uno</h3>
          <input type="hidden" name="accion" value="agregar">
          <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
          <div class="fila">
            <div><label class="e" for="n">Cómo se le saluda</label><input id="n" name="nombre" required maxlength="120" placeholder="Familia Pérez Soto"></div>
            <div><label class="e" for="c">Cupos</label><input id="c" name="cupos" type="number" min="1" max="11" value="1" required></div>
          </div>
          <label class="e" for="b">Nombres para buscarlo <span class="sub" style="text-transform:none;letter-spacing:0">(separados por coma)</span></label>
          <input id="b" name="busqueda" maxlength="600" placeholder="Juan Pérez, María Soto">
          <label class="e" for="tel">Teléfono <span class="sub" style="text-transform:none;letter-spacing:0">(para mandarle la invitación por WhatsApp)</span></label>
          <input id="tel" name="telefono" maxlength="40" placeholder="+56 9 1234 5678">
          <p style="margin:14px 0 0"><button class="principal" type="submit">Agregar</button></p>
        </form>

        <form method="post" class="tarjeta">
          <h3>Pegar una lista</h3>
          <input type="hidden" name="accion" value="importar">
          <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
          <p class="sub" style="margin:0 0 8px">Una línea por invitación: <b>saludo | nombres para buscar | cupos | teléfono</b>. Solo el saludo es obligatorio.</p>
          <textarea name="lista" rows="6" placeholder="Familia Pérez Soto | Juan Pérez, María Soto | 4 | +56912345678&#10;Camila Rojas | | 2&#10;Tío Pedro Muñoz"></textarea>
          <p style="margin:10px 0 0"><button class="principal" type="submit">Agregar la lista</button></p>
        </form>
      </div>
      <p class="sub">Cómo busca: el invitado escribe su nombre y apellido en la invitación, y se le encuentra si esas palabras están en el saludo o en alguno de los nombres para buscar (sin importar tildes, mayúsculas ni el orden). "Juan Pérez" encuentra a "Juan Carlos Pérez Soto".</p>
    </details>

    <?php if ($t['invitados'] === 0): ?>
      <div class="vacio">
        <h2 style="font-size:1.5rem">La lista está vacía</h2>
        <p>Mientras no haya invitados cargados, cualquiera puede confirmar escribiendo su nombre.<br>Desde el primer invitado, solo podrán confirmar quienes estén en la lista.</p>
      </div>
    <?php else: ?>
      <div class="barra">
        <nav class="filtros eyebrow">
          <?php foreach (['todos' => 'Todos', 'si' => 'Asisten', 'no' => 'No asisten', 'pendiente' => 'Sin responder', 'sin_enviar' => 'Sin enviar'] as $k => $txt): ?>
            <a class="<?= $filtro === $k ? 'activo' : '' ?>" href="<?= e($url(['f' => $k])) ?>"><?= $txt ?></a>
          <?php endforeach; ?>
        </nav>
        <form method="get"><input type="hidden" name="v" value="invitados"><input type="hidden" name="f" value="<?= e($filtro) ?>">
          <input type="search" name="q" value="<?= e($busca) ?>" placeholder="Buscar invitado…" aria-label="Buscar"></form>
      </div>

      <?php if (!$listaInvitados): ?>
        <div class="vacio">Nadie coincide con ese filtro.</div>
      <?php else: ?>
      <table>
        <thead><tr class="eyebrow"><th>Invitado</th><th>Estado</th><th>Vienen</th><th>Invitación</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($listaInvitados as $i): $est = $estadoDe($i); $r = $porInvitado[(int) $i['id']] ?? null; $id = (int) $i['id']; $tk = e(token_csrf()); ?>
          <tr id="inv-<?= $id ?>">
            <td><b><?= e($i['nombre']) ?></b>
              <?php if ($i['busqueda'] !== ''): ?><div class="sub"><?= e($i['busqueda']) ?></div><?php endif; ?>
              <?php if ($i['telefono']): ?><div class="sub"><?= e($i['telefono']) ?></div><?php endif; ?></td>
            <td data-t="Estado"><span class="estado e-<?= $est ?>"><?= ['si' => 'Asiste', 'no' => 'No asiste', 'pendiente' => 'Sin responder'][$est] ?></span>
              <?php if ($r): ?><div class="sub"><?= e($fecha($r['creado'])) ?><?= str_contains((string) $r['mensaje'], '[anotado en el panel]') ? ' · anotado a mano' : '' ?></div><?php endif; ?></td>
            <td data-t="Vienen"><?= $est === 'si' ? (1 + (int) $r['acompanantes']) . ' de ' . (int) $i['cupos'] : '— de ' . (int) $i['cupos'] ?></td>
            <td data-t="Invitación">
              <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                <?php if ($i['telefono']): ?>
                  <a class="boton wa" href="<?= e($invitarPorWa($i)) ?>" target="_blank" rel="noopener">WhatsApp</a>
                <?php endif; ?>
                <button type="button" data-copiar="<?= e($mensajeDe($i)) ?>" data-texto="Copiar mensaje">Copiar mensaje</button>
                <button type="button" data-copiar="<?= e($linkDe($i)) ?>" data-texto="Copiar link">Copiar link</button>
                <form method="post" class="inline">
                  <input type="hidden" name="accion" value="enviado"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="csrf" value="<?= $tk ?>">
                  <button type="submit" class="<?= (int) $i['enviado'] ? 'principal' : '' ?>" title="Marcar si ya le mandaste la invitación"><?= (int) $i['enviado'] ? '✓ Enviada' : 'Marcar enviada' ?></button>
                </form>
              </div>
            </td>
            <td>
              <details class="editar">
                <summary>Editar</summary>
                <form method="post">
                  <input type="hidden" name="accion" value="editar"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="csrf" value="<?= $tk ?>">
                  <label class="e">Saludo</label><input name="nombre" required maxlength="120" value="<?= e($i['nombre']) ?>">
                  <label class="e">Nombres para buscarlo <span class="sub">(coma entre cada uno)</span></label><input name="busqueda" maxlength="600" value="<?= e($i['busqueda']) ?>" placeholder="Nombre real y apellido">
                  <div class="fila">
                    <div><label class="e">Teléfono</label><input name="telefono" maxlength="40" value="<?= e((string) $i['telefono']) ?>" placeholder="+56 9…"></div>
                    <div><label class="e">Cupos</label><input name="cupos" type="number" min="1" max="11" value="<?= (int) $i['cupos'] ?>"></div>
                  </div>
                  <p style="margin:10px 0 0"><button class="principal" type="submit">Guardar</button></p>
                </form>
                <form method="post" style="margin-top:14px;border-top:1px solid var(--linea);padding-top:10px">
                  <input type="hidden" name="accion" value="anotar"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="csrf" value="<?= $tk ?>">
                  <label class="e">Anotar su respuesta <span class="sub">(si te avisó por teléfono o en persona)</span></label>
                  <div class="fila">
                    <div><select name="asiste"><option value="si">Asiste</option><option value="no">No asiste</option></select></div>
                    <div><input name="personas" type="number" min="1" max="<?= (int) $i['cupos'] ?>" value="<?= $r && (int) $r['asiste'] === 1 ? 1 + (int) $r['acompanantes'] : (int) $i['cupos'] ?>" aria-label="Personas que asisten"></div>
                  </div>
                  <p style="margin:10px 0 0"><button type="submit">Anotar</button></p>
                </form>
                <form method="post" style="margin-top:14px" onsubmit="return confirm(<?= e(json_encode('¿Quitar a ' . $i['nombre'] . ' de la lista?', JSON_UNESCAPED_UNICODE)) ?>)">
                  <input type="hidden" name="accion" value="quitar"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="csrf" value="<?= $tk ?>">
                  <button type="submit">Quitar de la lista</button>
                </form>
              </details>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
      <?php endif; ?>
      <?php if ($sueltas): ?><p class="sub" style="margin-top:14px"><?= $sueltas ?> respuesta(s) son de personas fuera de la lista: están en la pestaña Respuestas.</p><?php endif; ?>
    <?php endif; ?>

  <?php elseif ($vista === 'contenido'): ?>

    <?php
      // Si hubo un error, se muestra lo que se escribió (no lo guardado).
      $v = static fn(string $k, string $actual): string => e(isset($_POST[$k]) ? (string) $_POST[$k] : $actual);
      $c = contenido();
      $fechaDt = new DateTimeImmutable($c['fecha']['iso']);
      $fechaDt = $fechaDt->setTimezone(new DateTimeZone('America/Santiago'));
      $cierreDt = (new DateTimeImmutable($c['rsvp']['cierreIso']))->setTimezone(new DateTimeZone('America/Santiago'));
      $lineasPrograma = implode("\n", array_map(static fn($p) => "{$p['hora']} | {$p['titulo']} | " . ($p['detalle'] ?? '') . " | {$p['icono']}", $c['programa']));
      $lineasMenu = implode("\n", array_map(static fn($t) => "{$t['tiempo']} | {$t['plato']}" . (!empty($t['opciones']) ? " | {$t['opciones']}" : ''), $c['menu']['tiempos']));
      $rf = reglas_fotos();
      $dtl = static fn(?string $s): string => $s ? str_replace(' ', 'T', substr($s, 0, 16)) : '';
      $tr = $c['regalo']['transferencia'];
      $pend = static fn(string $x): string => $x === 'PENDIENTE' ? '' : $x;
    ?>
    <p class="sub" style="margin:0 0 16px">Lo que cambies aquí se ve en la invitación al tiro, sin tocar código.</p>

    <form method="post" class="contenido">
      <input type="hidden" name="accion" value="contenido">
      <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">

      <section class="tarjeta">
        <h3>Fecha</h3>
        <div class="fila3">
          <div><label class="e" for="fd">Día</label><input id="fd" type="date" name="fecha_dia" value="<?= $v('fecha_dia', $fechaDt->format('Y-m-d')) ?>" required></div>
          <div><label class="e" for="fh">Hora</label><input id="fh" type="time" name="fecha_hora" value="<?= $v('fecha_hora', $fechaDt->format('H:i')) ?>" required></div>
          <div><label class="e" for="rc">Confirmar hasta</label><input id="rc" type="date" name="rsvp_cierre" value="<?= $v('rsvp_cierre', $cierreDt->format('Y-m-d')) ?>" required></div>
        </div>
        <label class="check"><input type="checkbox" name="fecha_confirmada" <?= ($_POST ? isset($_POST['fecha_confirmada']) : $c['fecha']['confirmada']) ? 'checked' : '' ?>> El día ya está confirmado <span class="sub">(si no, la invitación dice "fecha estimada")</span></label>
        <p class="sub" style="margin:6px 0 0">Pasada la fecha "Confirmar hasta", el formulario se cierra solo.</p>
      </section>

      <section class="tarjeta">
        <h3>Lugar</h3>
        <div class="fila">
          <div><label class="e" for="ln">Nombre</label><input id="ln" name="lugar_nombre" value="<?= $v('lugar_nombre', $c['lugar']['nombre']) ?>"></div>
          <div><label class="e" for="lc">Ciudad / comuna</label><input id="lc" name="lugar_ciudad" value="<?= $v('lugar_ciudad', $c['lugar']['ciudad']) ?>"></div>
        </div>
        <label class="e" for="ld">Dirección</label><input id="ld" name="lugar_direccion" value="<?= $v('lugar_direccion', $c['lugar']['direccion']) ?>">
        <label class="e" for="lm">Link de Google Maps <span class="sub" style="text-transform:none;letter-spacing:0">(en Maps: Compartir › Copiar vínculo)</span></label>
        <input id="lm" name="lugar_maps" value="<?= $v('lugar_maps', $c['lugar']['mapsUrl']) ?>" placeholder="https://maps.app.goo.gl/…">
      </section>

      <section class="tarjeta">
        <h3>Textos</h3>
        <label class="e" for="an">Invitación (bajo "Nos casamos")</label>
        <textarea id="an" name="anuncio" rows="3"><?= $v('anuncio', $c['textos']['anuncio']) ?></textarea>
        <label class="e" for="ve">Dress code</label>
        <textarea id="ve" name="vestimenta" rows="4"><?= $v('vestimenta', $c['vestimenta']['nota']) ?></textarea>
        <p class="sub" style="margin:4px 0 0">Un párrafo por línea. El primero se ve grande (ej. "Formal.").</p>
        <label class="e" for="wa">WhatsApp de los novios <span class="sub" style="text-transform:none;letter-spacing:0">(con 56 adelante, sin +)</span></label>
        <input id="wa" name="whatsapp" inputmode="numeric" value="<?= $v('whatsapp', $c['whatsapp']['numero']) ?>">
      </section>

      <section class="tarjeta">
        <h3>Programa</h3>
        <p class="sub" style="margin:0 0 6px">Una línea por momento: <b>hora | título | detalle | ícono</b> (la hora puede ser un texto, ej. "Luego"). Íconos: copas, anillos, arco, camara, cubiertos, torta, musica, destello.</p>
        <textarea name="programa" rows="8" class="mono"><?= $v('programa', $lineasPrograma) ?></textarea>
      </section>

      <section class="tarjeta">
        <h3>Menú</h3>
        <p class="sub" style="margin:0 0 6px">Una línea por tiempo: <b>tiempo | plato | opción</b> (la opción es opcional, ej. "Vegetariana: …").</p>
        <textarea name="menu" rows="6" class="mono"><?= $v('menu', $lineasMenu) ?></textarea>
        <label class="e" for="mn">Nota al pie del menú</label>
        <input id="mn" name="menu_nota" value="<?= $v('menu_nota', $c['menu']['nota']) ?>">
      </section>

      <section class="tarjeta">
        <h3>Regalo</h3>
        <label class="e" for="rt">Texto</label>
        <textarea id="rt" name="regalo_texto" rows="3"><?= $v('regalo_texto', $c['regalo']['texto']) ?></textarea>
        <p class="sub" style="margin:10px 0 0">Datos para transferir. Mientras falte alguno, la invitación dice "estarán aquí muy pronto".</p>
        <div class="fila">
          <div><label class="e" for="t1">Titular</label><input id="t1" name="tr_titular" value="<?= $v('tr_titular', $pend($tr['titular'])) ?>"></div>
          <div><label class="e" for="t2">RUT</label><input id="t2" name="tr_rut" value="<?= $v('tr_rut', $pend($tr['rut'])) ?>" placeholder="12.345.678-9"></div>
        </div>
        <div class="fila">
          <div><label class="e" for="t3">Banco</label><input id="t3" name="tr_banco" value="<?= $v('tr_banco', $pend($tr['banco'])) ?>"></div>
          <div><label class="e" for="t4">Tipo de cuenta</label><input id="t4" name="tr_tipoCuenta" value="<?= $v('tr_tipoCuenta', $pend($tr['tipoCuenta'])) ?>" placeholder="Cuenta corriente / vista / RUT"></div>
        </div>
        <div class="fila">
          <div><label class="e" for="t5">N° de cuenta</label><input id="t5" name="tr_numero" value="<?= $v('tr_numero', $pend($tr['numero'])) ?>"></div>
          <div><label class="e" for="t6">Correo</label><input id="t6" name="tr_correo" value="<?= $v('tr_correo', $pend($tr['correo'])) ?>"></div>
        </div>
      </section>

      <section class="tarjeta">
        <h3>Subida de fotos</h3>
        <div class="fila">
          <div><label class="e" for="fa">Se abre</label><input id="fa" type="datetime-local" name="fotos_desde" value="<?= $v('fotos_desde', $dtl($rf['desde'])) ?>"></div>
          <div><label class="e" for="fc">Se cierra</label><input id="fc" type="datetime-local" name="fotos_hasta" value="<?= $v('fotos_hasta', $dtl($rf['hasta'])) ?>"></div>
        </div>
        <p class="sub" style="margin:6px 0 0">Hora de Chile. Fuera de ese rango la sección "Comparte tus fotos" avisa que se abrirá o que ya cerró.</p>
      </section>

      <p class="guardar"><button class="principal" type="submit">Guardar cambios</button></p>
    </form>

  <?php elseif ($vista === 'regalos'): ?>

    <?php $pesos = static fn(int $n): string => '$' . number_format($n, 0, ',', '.'); $porAgradecer = count(array_filter($regalos, static fn($g) => !(int) $g['agradecido'])); ?>
    <p class="sub" style="margin:0 0 14px">Avisos que dejan los invitados después de transferir. <b>Confirma cada monto en tu banco</b>: el aviso lo escribe el invitado y la página no revisa transferencias.</p>
    <?php if (!$regalos): ?>
      <div class="vacio">Aún no hay avisos de regalo.</div>
    <?php else: ?>
      <section class="cifras" style="grid-template-columns:repeat(3,1fr)">
        <div class="cifra destacada"><b><?= count($regalos) ?></b><span class="eyebrow">Avisos</span></div>
        <div class="cifra"><b style="font-size:1.7rem"><?= $pesos($regalosTotal) ?></b><span class="eyebrow">Montos avisados</span></div>
        <div class="cifra"><b><?= $porAgradecer ?></b><span class="eyebrow">Por agradecer</span></div>
      </section>
      <table>
        <thead><tr class="eyebrow"><th>Nombre</th><th>Monto</th><th>Mensaje</th><th>Fecha</th><th>Agradecido</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($regalos as $g): ?>
          <tr>
            <td><b><?= e($g['nombre']) ?></b><?= $g['invitado_id'] !== null ? '<div class="sub">desde su link personal</div>' : '' ?></td>
            <td data-t="Monto"><?= $g['monto'] !== null ? e($pesos((int) $g['monto'])) : '—' ?></td>
            <td data-t="Mensaje" class="sub"><?= e($g['mensaje'] ?: '—') ?></td>
            <td data-t="Fecha" class="sub"><?= e($fecha($g['creado'])) ?></td>
            <td data-t="Agradecido">
              <form method="post" class="inline">
                <input type="hidden" name="accion" value="agradecido"><input type="hidden" name="id" value="<?= (int) $g['id'] ?>">
                <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
                <button type="submit" class="<?= (int) $g['agradecido'] ? 'principal' : '' ?>"><?= (int) $g['agradecido'] ? '✓ Agradecido' : 'Marcar' ?></button>
              </form>
            </td>
            <td>
              <form method="post" class="inline" onsubmit="return confirm('¿Eliminar este aviso? No se puede deshacer.')">
                <input type="hidden" name="accion" value="borrar_regalo"><input type="hidden" name="id" value="<?= (int) $g['id'] ?>">
                <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
                <button type="submit">Eliminar</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>

  <?php elseif ($vista === 'fotos'): ?>

    <?php $rf = reglas_fotos(); $est = estado_fotos(); $mb = static fn(int $b): string => number_format($b / 1048576, 0, ',', '.') . ' MB'; ?>
    <div class="cargar">
      <section class="tarjeta">
        <h3>Subida de fotos: <?= ['antes' => 'todavía cerrada', 'abierto' => 'ABIERTA', 'cerrado' => 'terminada'][$est] ?></h3>
        <?php if ($rf['desde']): ?>
          <p class="sub" style="margin:0">Abierta desde el <?= e($fecha($rf['desde'])) ?> hasta el <?= e($fecha($rf['hasta'])) ?>.</p>
        <?php else: ?>
          <p class="sub" style="margin:0">Sin fechas configuradas (config.php › fotos › desde / hasta).</p>
        <?php endif; ?>
        <p style="margin:10px 0 0"><?= $fotosN ?> de <?= $rf['max_fotos'] ?> fotos · <?= $mb((int) $fotosTot['b']) ?> de <?= $mb($rf['max_total_mb'] * 1048576) ?></p>
        <p class="sub" style="margin:4px 0 0">Máximo <?= $rf['max_mb'] ?> MB por foto y <?= $rf['por_hora'] ?> fotos por persona cada hora.</p>
      </section>
      <section class="tarjeta" style="text-align:center">
        <h3>QR para las mesas</h3>
        <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap">
          <div><div id="qr-general" style="display:inline-block;background:#fff;padding:8px"></div><p class="sub" style="margin:4px 0">Todas las fotos</p></div>
          <div><div id="qr-favoritas" style="display:inline-block;background:#fff;padding:8px"></div><p class="sub" style="margin:4px 0">Favoritas</p></div>
        </div>
        <p class="sub" style="margin:6px 0"><?= e($sitio) ?>#fotos · <?= e($sitio) ?>#favoritas</p>
        <button type="button" onclick="imprimirQr()">Imprimir los dos</button>
      </section>
    </div>

    <?php if ($fotosN): ?>
      <nav class="filtros eyebrow" style="margin-bottom:12px">
        <?php foreach ([null => "Todas ({$fotosN})", 'general' => "General ({$porAlbum['general']})", 'favoritas' => "Favoritas ({$porAlbum['favoritas']})"] as $k => $txt): ?>
          <a class="<?= $albumVer === ($k ?: null) ? 'activo' : '' ?>" href="?v=fotos<?= $k ? '&album=' . $k : '' ?>"><?= e($txt) ?></a>
        <?php endforeach; ?>
      </nav>
      <?php $nZip = $albumVer ? $porAlbum[$albumVer] : $fotosN; ?>
      <p style="margin:0 0 14px">Descargar <?= $albumVer ? e($albumVer) : 'todas' ?> en ZIP:
        <?php for ($n = 1, $partes = max(1, (int) ceil($nZip / FOTOS_POR_ZIP)); $n <= $partes; $n++): ?>
          <a class="boton" href="fotos-zip.php?parte=<?= $n ?><?= $albumVer ? '&album=' . $albumVer : '' ?>"><?= $partes > 1 ? "Parte {$n}" : 'Descargar' ?></a>
        <?php endfor; ?>
        <?php if ($fotosN > FOTOS_POR_ZIP): ?><span class="sub">(en partes de <?= FOTOS_POR_ZIP ?>, para que el hosting no se corte)</span><?php endif; ?>
      </p>
      <div class="galeria">
        <?php foreach ($fotos as $f): ?>
          <figure>
            <a href="foto.php?id=<?= (int) $f['id'] ?>" target="_blank" rel="noopener">
              <img src="foto.php?id=<?= (int) $f['id'] ?>" loading="lazy" alt="Foto de <?= e($f['autor'] ?: 'un invitado') ?>">
            </a>
            <figcaption>
              <span><?= $f['album'] === 'favoritas' ? '★ ' : '' ?><?= e($f['autor'] ?: 'Anónimo') ?> · <?= e((new DateTimeImmutable($f['creado']))->format('H:i')) ?></span>
              <form method="post" class="inline" onsubmit="return confirm('¿Eliminar esta foto? No se puede deshacer.')">
                <input type="hidden" name="accion" value="borrar_foto"><input type="hidden" name="id" value="<?= (int) $f['id'] ?>">
                <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
                <button type="submit" title="Eliminar">✕</button>
              </form>
            </figcaption>
          </figure>
        <?php endforeach; ?>
      </div>
      <?php if ($fotosN > FOTOS_POR_PAGINA): ?>
        <p class="filtros eyebrow" style="margin-top:16px">
          <?php for ($n = 1; $n <= (int) ceil($fotosN / FOTOS_POR_PAGINA); $n++): ?>
            <a class="<?= $n === $pagina ? 'activo' : '' ?>" href="?v=fotos&p=<?= $n ?>"><?= $n ?></a>
          <?php endfor; ?>
        </p>
      <?php endif; ?>
    <?php else: ?>
      <div class="vacio">Aún no hay fotos. El día de la boda aparecerán aquí a medida que los invitados las suban.</div>
    <?php endif; ?>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script>
      const qrSitio = <?= json_encode($sitio) ?>;
      new QRCode(document.getElementById('qr-general'), { text: qrSitio + '#fotos', width: 150, height: 150, colorDark: '#383b2a' });
      new QRCode(document.getElementById('qr-favoritas'), { text: qrSitio + '#favoritas', width: 150, height: 150, colorDark: '#383b2a' });
      function imprimirQr() {
        const src = (id) => { const c = document.querySelector('#' + id + ' canvas'); return c ? c.toDataURL() : document.querySelector('#' + id + ' img').src; };
        const bloque = (id, titulo, texto) => '<div style="display:inline-block;margin:0 30px;vertical-align:top">'
          + '<p style="font-size:22px;font-style:italic;margin:0">' + titulo + '</p>'
          + '<img src="' + src(id) + '" style="width:230px;margin:16px auto;display:block">'
          + '<p style="margin:0;max-width:240px">' + texto + '</p></div>';
        const w = window.open('', '_blank');
        w.document.write('<body style="font-family:Georgia,serif;text-align:center;padding:40px;color:#383b2a">'
          + '<h1 style="font-weight:400;letter-spacing:.1em">AARON &amp; JASNE</h1>'
          + bloque('qr-general', 'Comparte tus fotos', 'Todas las fotos de hoy')
          + bloque('qr-favoritas', 'Tus favoritas', 'Solo las más lindas ❤')
          + '<p style="margin-top:30px">Escanea con la cámara de tu celular</p></body>');
        w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
      }
    </script>

  <?php else: /* ─── respuestas ─── */ ?>

    <div class="barra">
      <nav class="filtros eyebrow">
        <?php foreach (['todos' => 'Todos', 'si' => 'Asisten', 'no' => 'No asisten'] as $k => $txt): ?>
          <a class="<?= $filtro === $k ? 'activo' : '' ?>" href="<?= e($url(['f' => $k])) ?>"><?= $txt ?></a>
        <?php endforeach; ?>
      </nav>
      <form method="get"><input type="hidden" name="v" value="respuestas"><input type="hidden" name="f" value="<?= e($filtro) ?>">
        <input type="search" name="q" value="<?= e($busca) ?>" placeholder="Buscar por nombre…" aria-label="Buscar"></form>
    </div>

    <?php if (!$respuestas): ?>
      <div class="vacio"><h2 style="font-size:1.5rem">Todavía no hay respuestas</h2><p>En cuanto alguien confirme desde la invitación, aparecerá aquí.</p></div>
    <?php elseif (!$listaRespuestas): ?>
      <div class="vacio">Nada coincide con ese filtro.</div>
    <?php else: ?>
      <table>
        <thead><tr class="eyebrow"><th>Nombre</th><th>Responde</th><th>Personas</th><th>Alimentación</th><th>Canciones</th><th>Teléfono</th><th>Mensaje</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($listaRespuestas as $f): $si = (int) $f['asiste'] === 1; ?>
          <tr>
            <td><b><?= e($f['nombre']) ?></b><div class="sub"><?= e($fecha($f['creado'])) ?><?= $f['invitado_id'] === null && $t['invitados'] > 0 ? ' · fuera de la lista' : '' ?></div></td>
            <td data-t="Responde"><span class="estado e-<?= $si ? 'si' : 'no' ?>"><?= $si ? 'Asiste' : 'No asiste' ?></span></td>
            <td data-t="Personas"><?= $si ? 1 + (int) $f['acompanantes'] : '—' ?></td>
            <td data-t="Alimentación"><?= e($f['alimentacion'] ?: '—') ?></td>
            <td data-t="Canciones"><?= e($f['canciones'] ?: '—') ?></td>
            <td data-t="Teléfono"><?php if ($f['telefono']): ?><a href="https://wa.me/<?= e($soloDigitos($f['telefono'])) ?>" target="_blank" rel="noopener"><?= e($f['telefono']) ?></a><?php else: ?>—<?php endif; ?></td>
            <td data-t="Mensaje" class="sub"><?= e($f['mensaje'] ?: '—') ?></td>
            <td>
              <form method="post" class="inline" onsubmit="return confirm(<?= e(json_encode('¿Eliminar la respuesta de ' . $f['nombre'] . '? No se puede deshacer.', JSON_UNESCAPED_UNICODE)) ?>)">
                <input type="hidden" name="accion" value="borrar"><input type="hidden" name="id" value="<?= (int) $f['id'] ?>">
                <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
                <button type="submit">Eliminar</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>

    <div class="cargar" style="margin-top:28px">
      <section class="tarjeta">
        <h3>Canciones sugeridas (<?= count($canciones) ?>)</h3>
        <?php if (!$canciones): ?><p class="sub">Aún nadie sugiere canciones.</p><?php else: ?>
        <ul class="lista-simple"><?php foreach ($canciones as $f): ?><li><?= e($f['canciones']) ?> <span class="sub">— <?= e($f['nombre']) ?></span></li><?php endforeach; ?></ul>
        <?php endif; ?>
      </section>
      <section class="tarjeta">
        <h3>Restricciones alimentarias (<?= count($dietas) ?>)</h3>
        <?php if (!$dietas): ?><p class="sub">Nadie ha indicado restricciones.</p><?php else: ?>
        <ul class="lista-simple"><?php foreach ($dietas as $f): ?><li><?= e($f['nombre']) ?> <span class="sub">— <?= e($f['alimentacion']) ?></span></li><?php endforeach; ?></ul>
        <?php endif; ?>
      </section>
    </div>
  <?php endif; ?>
  </main>
<?php endif; ?>
<script>
  // "Copiar link": deja el link personal listo para pegar donde quieran.
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copiar]');
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copiar); b.textContent = '¡Copiado!'; }
    catch { prompt('Copia este link:', b.dataset.copiar); }
    setTimeout(() => (b.textContent = b.dataset.texto || 'Copiar link'), 1800);
  });
</script>
</body>
</html>
