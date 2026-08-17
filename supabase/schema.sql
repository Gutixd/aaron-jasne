-- ═══════════════════════════════════════════════════════════════════
--  Aaron & Jasne — esquema
--  Pegar completo en el SQL Editor de Supabase y ejecutar.
-- ═══════════════════════════════════════════════════════════════════
--
--  MODELO DE SEGURIDAD
--
--  Esta es una aplicación de una sola página: la anon key viaja en el
--  bundle y es pública por diseño. Por lo tanto la seguridad NO puede
--  apoyarse en esconderla — vive entera en las políticas de aquí abajo.
--
--  La regla que las gobierna todas:
--    · cualquiera puede ESCRIBIR una confirmación (insert en guests)
--    · nadie puede LEER la lista de invitados sin sesión de admin
--    · el contenido público (cronograma, galería, settings) se lee libre
--      y solo lo modifica un admin
--
--  Es decir: un curioso con la anon key puede confirmar asistencia —igual
--  que desde el formulario— pero no puede sacar la lista de invitados,
--  sus teléfonos ni sus mensajes.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────── admin_users
-- Quién puede entrar al panel. Se llena a mano con el id de auth.users.
create table if not exists public.admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

/** Helper: ¿el usuario de esta sesión es administrador? */
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

-- ──────────────────────────────────────────────────────────────── guests
-- Una fila por confirmación recibida desde el formulario público.
create table if not exists public.guests (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null check (char_length(trim(nombre)) between 2 and 120),
  telefono      text check (telefono is null or char_length(telefono) <= 40),
  asistencia    boolean not null,
  acompanantes  int not null default 0 check (acompanantes between 0 and 10),
  alimentacion  text check (alimentacion is null or char_length(alimentacion) <= 300),
  mensaje       text check (mensaje is null or char_length(mensaje) <= 800),
  -- Los novios pueden anotar cosas que el invitado no ve.
  nota_interna  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.tocar_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists guests_updated_at on public.guests;
create trigger guests_updated_at
  before update on public.guests
  for each row execute function public.tocar_updated_at();

-- ────────────────────────────────────────────────────────────── timeline
create table if not exists public.timeline (
  id          uuid primary key default gen_random_uuid(),
  hora        text not null,
  titulo      text not null,
  descripcion text,
  icono       text not null default 'copa',
  orden       int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────── gallery
create table if not exists public.gallery (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  caption    text,
  peso       int not null default 1 check (peso between 1 and 3),
  orden      int not null default 0,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────── settings
-- Clave/valor: evita migraciones cada vez que se agrega un campo editable.
create table if not exists public.settings (
  clave      text primary key,
  valor      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────── messages
-- Plantillas de mensajes y bitácora de lo que se preparó para enviar.
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  cuerpo     text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_guests_created  on public.guests(created_at desc);
create index if not exists idx_guests_asist    on public.guests(asistencia);
create index if not exists idx_timeline_orden  on public.timeline(orden);
create index if not exists idx_gallery_orden   on public.gallery(orden);

-- ═══════════════════════════════════════════════════════ RLS y políticas

alter table public.admin_users enable row level security;
alter table public.guests      enable row level security;
alter table public.timeline    enable row level security;
alter table public.gallery     enable row level security;
alter table public.settings    enable row level security;
alter table public.messages    enable row level security;

-- admin_users: solo un admin ve la tabla de admins. Nadie la edita desde
-- el cliente; se administra desde el panel de Supabase.
drop policy if exists admins_leen_admins on public.admin_users;
create policy admins_leen_admins on public.admin_users
  for select using (public.es_admin());

-- guests --------------------------------------------------------------
-- Cualquiera confirma. WITH CHECK repite los límites por si alguien
-- llamara a la API directamente en vez de usar el formulario.
drop policy if exists publico_confirma on public.guests;
create policy publico_confirma on public.guests
  for insert to anon, authenticated
  with check (
    char_length(trim(nombre)) between 2 and 120
    and acompanantes between 0 and 10
    and (mensaje is null or char_length(mensaje) <= 800)
    and nota_interna is null
  );

-- Leer, editar y borrar: solo administradores.
drop policy if exists admin_lee_guests on public.guests;
create policy admin_lee_guests on public.guests
  for select using (public.es_admin());

drop policy if exists admin_edita_guests on public.guests;
create policy admin_edita_guests on public.guests
  for update using (public.es_admin()) with check (public.es_admin());

drop policy if exists admin_borra_guests on public.guests;
create policy admin_borra_guests on public.guests
  for delete using (public.es_admin());

-- Contenido público: lectura libre, escritura de admin ------------------
do $$
declare t text;
begin
  foreach t in array array['timeline', 'gallery', 'settings'] loop
    execute format('drop policy if exists publico_lee_%1$s on public.%1$s', t);
    execute format(
      'create policy publico_lee_%1$s on public.%1$s for select using (true)', t);

    execute format('drop policy if exists admin_escribe_%1$s on public.%1$s', t);
    execute format(
      'create policy admin_escribe_%1$s on public.%1$s for all
         using (public.es_admin()) with check (public.es_admin())', t);
  end loop;
end $$;

-- messages: privado de punta a punta.
drop policy if exists admin_messages on public.messages;
create policy admin_messages on public.messages
  for all using (public.es_admin()) with check (public.es_admin());

-- ═══════════════════════════════════════════════ contenido inicial

insert into public.timeline (hora, titulo, icono, orden) values
  ('18:00', 'Recepción',   'copa',    1),
  ('18:30', 'Ceremonia',   'anillos', 2),
  ('20:00', 'Cena',        'cena',    3),
  ('21:30', 'Celebración', 'brindis', 4),
  ('23:00', 'Fiesta',      'musica',  5)
on conflict do nothing;

insert into public.messages (nombre, cuerpo) values
  ('Recordatorio del evento',
   'Hola {{nombre}}, queremos recordarte que ya falta poco para el gran día de Aaron & Jasne ❤️ Te esperamos el {{fecha}} en {{lugar}} a las {{hora}}.'),
  ('Confirmación pendiente',
   'Hola {{nombre}} 💍 Todavía no tenemos tu confirmación para la celebración de Aaron & Jasne. ¿Nos cuentas si podrás acompañarnos?'),
  ('Cambio de horario',
   'Hola {{nombre}}, te avisamos que la hora de la celebración de Aaron & Jasne cambió: ahora comenzamos a las {{hora}}. ¡Nos vemos!'),
  ('Cambio de ubicación',
   'Hola {{nombre}}, cambiamos el lugar de la celebración. Ahora será en {{lugar}}. Te reenviamos la invitación con el mapa actualizado.')
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════
--  ÚLTIMO PASO — dar acceso al panel
--
--  1. Authentication › Users › Add user  (correo + contraseña)
--  2. Copiar el UID y ejecutar:
--
--     insert into public.admin_users (id, email)
--     values ('PEGA-AQUI-EL-UID', 'correo@ejemplo.cl');
--
--  Sin este paso nadie entra a /admin, aunque tenga cuenta.
-- ═══════════════════════════════════════════════════════════════════
