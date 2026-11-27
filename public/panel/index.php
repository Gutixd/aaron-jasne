<?php
/**
 * Panel de Aaron & Jasne — /panel/
 * Quién confirmó, cuántas personas vienen, restricciones de comida.
 */

declare(strict_types=1);

require __DIR__ . '/_sesion.php';

$error = null;
$aviso = null;

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
            header('Location: ./?borrado=1');
            exit;
        }
    }
}

if (isset($_GET['borrado'])) {
    $aviso = 'Respuesta eliminada.';
}

// ── Datos ───────────────────────────────────────────────────────────────
$filas = [];
$filtro = $_GET['f'] ?? 'todos';
$busca  = trim((string) ($_GET['q'] ?? ''));
$total = ['respuestas' => 0, 'si' => 0, 'no' => 0, 'personas' => 0, 'acompanantes' => 0];
$repetidos = [];
$dietas = [];

if (sesion_activa()) {
    $todas = db()->query('SELECT * FROM confirmaciones ORDER BY creado DESC')->fetchAll();

    // Nombres normalizados que aparecen más de una vez: posible respuesta doble.
    $norm = static fn(string $n): string =>
        mb_strtolower(preg_replace('/\s+/u', ' ', trim($n)) ?? '');
    $cuenta = [];
    foreach ($todas as $f) {
        $cuenta[$norm($f['nombre'])] = ($cuenta[$norm($f['nombre'])] ?? 0) + 1;

        $total['respuestas']++;
        if ((int) $f['asiste'] === 1) {
            $total['si']++;
            $total['acompanantes'] += (int) $f['acompanantes'];
            if (!empty($f['alimentacion'])) {
                $dietas[] = $f;
            }
        } else {
            $total['no']++;
        }
    }
    $total['personas'] = $total['si'] + $total['acompanantes'];
    $repetidos = array_keys(array_filter($cuenta, static fn($c) => $c > 1));

    $filas = array_values(array_filter($todas, static function ($f) use ($filtro, $busca) {
        if ($filtro === 'si' && (int) $f['asiste'] !== 1) return false;
        if ($filtro === 'no' && (int) $f['asiste'] !== 0) return false;
        if ($busca !== '' && mb_stripos($f['nombre'], $busca) === false) return false;
        return true;
    }));
    $esRepetido = static fn(array $f): bool => in_array($norm($f['nombre']), $repetidos, true);
}

$fecha = static fn(string $s): string => (new DateTimeImmutable($s))->format('d-m-Y H:i');
$wa = static fn(string $tel): string => 'https://wa.me/' . preg_replace('/\D/', '', $tel);
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
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root { --noche:#0e1116; --hueso:#f4f0e8; --hondo:#eae4d9; --tinta:#191b1f; --suave:#6c6862; --rosa:#9c5a54; --piedra:#cec5b7; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--hueso); color:var(--tinta); font:300 15px/1.6 "Jost",system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
  h1,h2,.cifra b { font-family:"Instrument Serif",Georgia,serif; font-weight:400; }
  .eyebrow { font-size:.62rem; letter-spacing:.28em; text-transform:uppercase; }
  a { color:inherit; }
  .envoltura { max-width:1100px; margin:0 auto; padding:0 20px; }
  header { border-bottom:1px solid var(--piedra); background:var(--hueso); position:sticky; top:0; z-index:5; }
  header .envoltura { display:flex; align-items:center; justify-content:space-between; gap:16px; padding-top:14px; padding-bottom:14px; }
  header h1 { margin:0; font-size:1.35rem; } header h1 span { color:var(--rosa); }
  button, .boton { font:inherit; cursor:pointer; border:1px solid var(--piedra); background:transparent; color:var(--tinta); padding:9px 16px; text-decoration:none; font-size:.62rem; letter-spacing:.24em; text-transform:uppercase; display:inline-block; transition:.3s; }
  button:hover, .boton:hover { border-color:var(--rosa); color:var(--rosa); }
  .principal { background:var(--noche); color:var(--hueso); border-color:var(--noche); }
  .principal:hover { background:var(--rosa); border-color:var(--rosa); color:var(--hueso); }
  main { padding:36px 0 80px; }
  h2 { font-size:2.2rem; margin:0 0 6px; line-height:1; }
  .cifras { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--piedra); border:1px solid var(--piedra); margin:28px 0 40px; }
  .cifra { background:var(--hueso); padding:22px 12px; text-align:center; }
  .cifra b { display:block; font-size:2.4rem; line-height:1; }
  .cifra span { display:block; margin-top:8px; color:var(--suave); }
  .cifra.destacada { background:var(--noche); color:var(--hueso); } .cifra.destacada span { color:#f4f0e899; }
  .barra { display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .filtros a { text-decoration:none; padding:8px 12px; border-bottom:2px solid transparent; color:var(--suave); }
  .filtros a.activo { color:var(--rosa); border-color:var(--rosa); }
  input[type=search], input[type=password] { font:inherit; border:0; border-bottom:1px solid var(--piedra); background:transparent; padding:8px 2px; outline:none; color:var(--tinta); }
  input:focus { border-color:var(--rosa); }
  table { width:100%; border-collapse:collapse; border:1px solid var(--piedra); }
  th { text-align:left; background:var(--hondo); color:var(--suave); font-weight:400; padding:12px; }
  td { padding:12px; border-top:1px solid #cec5b766; vertical-align:top; }
  .si { color:var(--rosa); } .no { color:var(--suave); }
  .marca { font-size:.55rem; letter-spacing:.18em; text-transform:uppercase; border:1px solid var(--piedra); padding:2px 6px; color:var(--suave); margin-left:6px; white-space:nowrap; }
  .mensaje { color:var(--suave); font-style:italic; max-width:280px; }
  .vacio { border:1px dashed var(--piedra); padding:50px 20px; text-align:center; color:var(--suave); }
  .aviso { border-left:2px solid var(--rosa); padding:8px 14px; margin-bottom:20px; }
  .dietas { margin-top:44px; } .dietas li { margin:6px 0; }
  form.inline { display:inline; } td button { padding:5px 10px; font-size:.55rem; }
  .login { min-height:100svh; display:flex; align-items:center; justify-content:center; padding:20px; }
  .login form { width:100%; max-width:300px; text-align:center; }
  .login input { width:100%; margin:26px 0 22px; text-align:center; }
  .login button { width:100%; padding:14px; }
  .error { color:var(--rosa); font-size:.9rem; }
  @media (max-width:720px) {
    .cifras { grid-template-columns:repeat(2,1fr); }
    table, thead, tbody, tr, td { display:block; } thead { display:none; }
    tr { border-top:1px solid var(--piedra); padding:12px 0; } td { border:0; padding:3px 12px; }
    td[data-t]::before { content:attr(data-t) " · "; color:var(--suave); font-size:.62rem; letter-spacing:.2em; text-transform:uppercase; }
  }
</style>
</head>
<body>
<?php if (!sesion_activa()): ?>
  <div class="login">
    <form method="post" autocomplete="off">
      <h1 style="font-size:2.4rem;margin:0">A <span style="color:var(--rosa)">&amp;</span> J</h1>
      <p class="eyebrow" style="color:var(--suave)">Panel de confirmaciones</p>
      <input type="hidden" name="accion" value="entrar">
      <input type="password" name="clave" placeholder="Clave" required autofocus aria-label="Clave">
      <?php if ($error): ?><p class="error"><?= e($error) ?></p><?php endif; ?>
      <button class="principal" type="submit">Entrar</button>
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
    <h2>Confirmaciones</h2>
    <p style="color:var(--suave);margin:0">Lo que respondieron los invitados desde la invitación.</p>

    <section class="cifras">
      <div class="cifra destacada"><b><?= $total['personas'] ?></b><span class="eyebrow">Personas vienen</span></div>
      <div class="cifra"><b><?= $total['si'] ?></b><span class="eyebrow">Dijeron que sí</span></div>
      <div class="cifra"><b><?= $total['acompanantes'] ?></b><span class="eyebrow">Acompañantes</span></div>
      <div class="cifra"><b><?= $total['no'] ?></b><span class="eyebrow">No asistirán</span></div>
    </section>

    <?php if ($aviso): ?><p class="aviso"><?= e($aviso) ?></p><?php endif; ?>
    <?php if ($error): ?><p class="aviso error"><?= e($error) ?></p><?php endif; ?>

    <div class="barra">
      <nav class="filtros eyebrow">
        <?php foreach (['todos' => 'Todos', 'si' => 'Asisten', 'no' => 'No asisten'] as $k => $t): ?>
          <a class="<?= $filtro === $k ? 'activo' : '' ?>" href="?f=<?= $k ?><?= $busca !== '' ? '&q=' . urlencode($busca) : '' ?>"><?= $t ?></a>
        <?php endforeach; ?>
      </nav>
      <form method="get">
        <input type="hidden" name="f" value="<?= e($filtro) ?>">
        <input type="search" name="q" value="<?= e($busca) ?>" placeholder="Buscar por nombre…" aria-label="Buscar">
      </form>
    </div>

    <?php if ($total['respuestas'] === 0): ?>
      <div class="vacio">
        <h2 style="font-size:1.6rem">Todavía no hay respuestas</h2>
        <p>En cuanto alguien confirme desde la invitación, aparecerá aquí.</p>
      </div>
    <?php elseif (!$filas): ?>
      <div class="vacio">Nada coincide con ese filtro.</div>
    <?php else: ?>
      <table>
        <thead>
          <tr class="eyebrow"><th>Nombre</th><th>Responde</th><th>Acomp.</th><th>Alimentación</th><th>Teléfono</th><th>Mensaje</th><th>Fecha</th><th></th></tr>
        </thead>
        <tbody>
        <?php foreach ($filas as $f): $si = (int) $f['asiste'] === 1; ?>
          <tr>
            <td><?= e($f['nombre']) ?><?php if ($esRepetido($f)): ?><span class="marca" title="Hay otra respuesta con este nombre">Repetido</span><?php endif; ?></td>
            <td data-t="Responde" class="<?= $si ? 'si' : 'no' ?>"><?= $si ? 'Asiste' : 'No asiste' ?></td>
            <td data-t="Acompañantes"><?= $si ? (int) $f['acompanantes'] : '—' ?></td>
            <td data-t="Alimentación"><?= e($f['alimentacion'] ?: '—') ?></td>
            <td data-t="Teléfono"><?php if ($f['telefono']): ?><a href="<?= e($wa($f['telefono'])) ?>" target="_blank" rel="noopener"><?= e($f['telefono']) ?></a><?php else: ?>—<?php endif; ?></td>
            <td data-t="Mensaje" class="mensaje"><?= e($f['mensaje'] ?: '—') ?></td>
            <td data-t="Fecha" style="white-space:nowrap;color:var(--suave)"><?= e($fecha($f['creado'])) ?></td>
            <td>
              <form method="post" class="inline" onsubmit="return confirm(<?= e(json_encode('¿Eliminar la respuesta de ' . $f['nombre'] . '? No se puede deshacer.', JSON_UNESCAPED_UNICODE)) ?>)">
                <input type="hidden" name="accion" value="borrar">
                <input type="hidden" name="id" value="<?= (int) $f['id'] ?>">
                <input type="hidden" name="csrf" value="<?= e(token_csrf()) ?>">
                <button type="submit">Eliminar</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>

    <?php if ($dietas): ?>
      <section class="dietas">
        <p class="eyebrow" style="color:var(--suave)">Restricciones alimentarias (<?= count($dietas) ?>)</p>
        <ul>
          <?php foreach ($dietas as $f): ?>
            <li><?= e($f['nombre']) ?> <span style="color:var(--suave)">— <?= e($f['alimentacion']) ?></span></li>
          <?php endforeach; ?>
        </ul>
      </section>
    <?php endif; ?>
  </main>
<?php endif; ?>
</body>
</html>
