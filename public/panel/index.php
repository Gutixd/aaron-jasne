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
$vista = in_array($_GET['v'] ?? '', ['respuestas', 'fotos', 'regalos'], true) ? $_GET['v'] : 'invitados';
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
           'cupos' => 'Cupos actualizados.', 'quitado' => 'Invitado quitado de la lista.', 'foto' => 'Foto eliminada.', 'regalo' => 'Aviso de regalo eliminado.'];
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
        if ($filtro !== 'todos' && $estadoDe($i) !== $filtro) return false;
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
    $fotosN = (int) $fotosTot['n'];
    $pagina = max(1, (int) ($_GET['p'] ?? 1));
    $fotos = [];
    if ($vista === 'fotos') {
        $q = db()->prepare('SELECT * FROM fotos ORDER BY creado DESC LIMIT ' . FOTOS_POR_PAGINA . ' OFFSET ?');
        $q->execute([($pagina - 1) * FOTOS_POR_PAGINA]);
        $fotos = $q->fetchAll();
    }
}

$fecha = static fn(string $s): string => (new DateTimeImmutable($s))->format('d-m-Y H:i');
$soloDigitos = static fn(string $tel): string => preg_replace('/\D/', '', $tel) ?? '';

// Dirección pública de la invitación, para el mensaje de WhatsApp.
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
$sitio = ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/';
$linkDe = static fn(array $i): string => $sitio . '?i=' . rawurlencode((string) $i['codigo']);
$invitarPorWa = static function (array $i) use ($linkDe, $soloDigitos): string {
    $txt = "¡Hola {$i['nombre']}! Con mucha alegría te invitamos a nuestro matrimonio 💍\n\n"
         . "Esta es tu invitación personal, con todos los detalles y para confirmar asistencia:\n{$linkDe($i)}\n\n"
         . ((int) $i['cupos'] > 1 ? "Reservamos {$i['cupos']} lugares para ustedes.\n\n" : '')
         . "Con cariño, Aaron & Jasne";
    return 'https://wa.me/' . $soloDigitos((string) $i['telefono']) . '?text=' . rawurlencode($txt);
};

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
  .pestanas { display:flex; gap:4px; border-bottom:1px solid var(--linea); margin-bottom:22px; }
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
  .cupos { display:flex; gap:4px; align-items:center; } .cupos input { width:56px; padding:4px 6px; }
  .lista-simple li { margin:6px 0; }
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
          <?php foreach (['todos' => 'Todos', 'si' => 'Asisten', 'no' => 'No asisten', 'pendiente' => 'Sin responder'] as $k => $txt): ?>
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
        <thead><tr class="eyebrow"><th>Invitado</th><th>Estado</th><th>Vienen</th><th>Cupos</th><th>Invitación</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($listaInvitados as $i): $est = $estadoDe($i); $r = $porInvitado[(int) $i['id']] ?? null; ?>
          <tr>
            <td><b><?= e($i['nombre']) ?></b><?php if ($i['busqueda'] !== ''): ?><div class="sub"><?= e($i['busqueda']) ?></div><?php endif; ?></td>
            <td data-t="Estado"><span class="estado e-<?= $est ?>"><?= ['si' => 'Asiste', 'no' => 'No asiste', 'pendiente' => 'Sin responder'][$est] ?></span>
              <?php if ($r): ?><div class="sub"><?= e($fecha($r['creado'])) ?></div><?php endif; ?></td>
            <td data-t="Vienen"><?= $est === 'si' ? (1 + (int) $r['acompanantes']) . ' de ' . (int) $i['cupos'] : '—' ?></td>
            <td data-t="Cupos">
              <form method="post" class="cupos">
                <input type="hidden" name="accion" value="cupos"><input type="hidden" name="id" value="<?= (int) $i['id'] ?>">
                <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
                <input type="number" name="cupos" min="1" max="11" value="<?= (int) $i['cupos'] ?>" aria-label="Cupos">
                <button type="submit">Guardar</button>
              </form>
            </td>
            <td data-t="Invitación">
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <?php if ($i['telefono']): ?>
                  <a class="boton wa" href="<?= e($invitarPorWa($i)) ?>" target="_blank" rel="noopener">WhatsApp</a>
                <?php endif; ?>
                <button type="button" data-copiar="<?= e($linkDe($i)) ?>">Copiar link</button>
              </div>
            </td>
            <td>
              <form method="post" class="inline" onsubmit="return confirm(<?= e(json_encode('¿Quitar a ' . $i['nombre'] . ' de la lista?', JSON_UNESCAPED_UNICODE)) ?>)">
                <input type="hidden" name="accion" value="quitar"><input type="hidden" name="id" value="<?= (int) $i['id'] ?>">
                <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
                <button type="submit">Quitar</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
      <?php endif; ?>
      <?php if ($sueltas): ?><p class="sub" style="margin-top:14px"><?= $sueltas ?> respuesta(s) son de personas fuera de la lista: están en la pestaña Respuestas.</p><?php endif; ?>
    <?php endif; ?>

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
        <div id="qr" style="display:inline-block;background:#fff;padding:10px"></div>
        <p class="sub" style="margin:6px 0"><?= e($sitio) ?>#fotos</p>
        <button type="button" onclick="imprimirQr()">Imprimir</button>
      </section>
    </div>

    <?php if ($fotosN): ?>
      <p style="margin:0 0 14px">Descargar todas en ZIP:
        <?php for ($n = 1, $partes = (int) ceil($fotosN / FOTOS_POR_ZIP); $n <= $partes; $n++): ?>
          <a class="boton" href="fotos-zip.php?parte=<?= $n ?>"><?= $partes > 1 ? "Parte {$n}" : 'Descargar' ?></a>
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
              <span><?= e($f['autor'] ?: 'Anónimo') ?> · <?= e((new DateTimeImmutable($f['creado']))->format('H:i')) ?></span>
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
      new QRCode(document.getElementById('qr'), { text: <?= json_encode($sitio . '#fotos') ?>, width: 168, height: 168, colorDark: '#383b2a' });
      function imprimirQr() {
        const img = document.querySelector('#qr canvas') || document.querySelector('#qr img');
        const src = img.tagName === 'CANVAS' ? img.toDataURL() : img.src;
        const w = window.open('', '_blank');
        w.document.write('<body style="font-family:Georgia,serif;text-align:center;padding:40px;color:#383b2a">'
          + '<h1 style="font-weight:400;letter-spacing:.1em">AARON &amp; JASNE</h1>'
          + '<p style="font-size:22px;font-style:italic">Comparte tus fotos de hoy</p>'
          + '<img src="' + src + '" style="width:260px;margin:20px auto;display:block">'
          + '<p>Escanea con la cámara de tu celular</p></body>');
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
    setTimeout(() => (b.textContent = 'Copiar link'), 1800);
  });
</script>
</body>
</html>
