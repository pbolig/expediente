-- ######################################################################
-- #                     SCRIPT DE CREACIÓN DE ESQUEMA                  #
-- ######################################################################

-- Establece el juego de caracteres y la intercalación
SET NAMES utf8mb4;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

-- ---------------------------------------------------------------------
--  Base de Datos: expedientes_db
-- ---------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `expedientes_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `expedientes_db`;

-- ---------------------------------------------------------------------
--  Tabla `expedientes`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `expedientes`;
CREATE TABLE `expedientes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `numero_expediente` VARCHAR(20) NOT NULL UNIQUE,
  `fecha_creacion` DATETIME NOT NULL,
  `descripcion` TEXT,
  `tipo_tramite_id` INT NOT NULL,
  `estado` ENUM('en-espera', 'iniciado', 'finalizado') NOT NULL DEFAULT 'en-espera',
  `fecha_modificacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tipo_tramite_id`) REFERENCES `tipos_tramite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Tabla `tipos_tramite`
-- ---------------------------------------------------------------------
-- Esta tabla almacena los tipos de trámite, que son un catálogo
-- que se definirá más adelante, pero lo creamos para tener
-- una relación con la tabla 'expedientes'.
DROP TABLE IF EXISTS `tipos_tramite`;
CREATE TABLE `tipos_tramite` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Tabla `fotos`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `fotos`;
CREATE TABLE `fotos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `expediente_id` INT NOT NULL,
  `acontecimiento_id` INT, -- Nuevo campo para vincular a un acontecimiento
  `nombre_archivo` VARCHAR(255) NOT NULL,
  `ruta_archivo` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`expediente_id`) REFERENCES `expedientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`acontecimiento_id`) REFERENCES `acontecimientos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Tabla `acontecimientos`
-- ---------------------------------------------------------------------
-- Almacena un historial de cambios para cada expediente.
DROP TABLE IF EXISTS `acontecimientos`;
CREATE TABLE `acontecimientos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `expediente_id` INT NOT NULL,
  `fecha_hora` DATETIME NOT NULL,
  `descripcion` TEXT NOT NULL,
  `nuevo_estado` ENUM('en-espera', 'iniciado', 'finalizado'),
  `num_secuencial` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`expediente_id`) REFERENCES `expedientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ######################################################################
-- #                             SEEDS                                  #
-- ######################################################################

-- Inserción de datos iniciales para la tabla `tipos_tramite`.
-- La sentencia ON DUPLICATE KEY UPDATE evita errores si ya existen los registros.
INSERT INTO `tipos_tramite` (`nombre`) VALUES
('Regional / Supervisión'),
('Docente'),
('Estudiante Enfermería'),
('Estudiante Tec. Digitales'),
('Estudiante Hig. Seguridad');

-- ---------------------------------------------------------------------
--  Restaurar configuración de SQL
-- ---------------------------------------------------------------------
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;