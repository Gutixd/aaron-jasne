-- ═══════════════════════════════════════════════════════════════════
--  Aaron & Jasne — base de datos (MySQL / MariaDB de Hostinger)
--  hPanel › Bases de datos › phpMyAdmin › pestaña SQL › pegar y ejecutar.
-- ═══════════════════════════════════════════════════════════════════

-- Una fila por respuesta enviada desde el formulario de la invitación.
CREATE TABLE IF NOT EXISTS confirmaciones (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  telefono      VARCHAR(40)  NULL,
  asiste        TINYINT(1)   NOT NULL,
  acompanantes  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  alimentacion  VARCHAR(300) NULL,
  mensaje       VARCHAR(800) NULL,
  creado        DATETIME     NOT NULL,
  INDEX idx_creado (creado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registro de envíos por IP (hasheada) para frenar abusos del formulario.
-- No guarda la IP real: solo un hash con sal, y se limpia solo.
CREATE TABLE IF NOT EXISTS intentos (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip_hash  CHAR(64) NOT NULL,
  creado   DATETIME NOT NULL,
  INDEX idx_ip (ip_hash, creado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
