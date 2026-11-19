-- FleetControl - estrutura do banco de dados
-- O administrador inicial é criado pela API somente quando ADMIN_EMAIL e
-- ADMIN_PASSWORD estão configurados em api/.env. A senha é armazenada em bcrypt.

CREATE DATABASE IF NOT EXISTS fleetcontrol
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fleetcontrol;

CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    usuario VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('administrador', 'gestor', 'tecnico') NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS viatura (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identificacao VARCHAR(30) NOT NULL UNIQUE,
    placa VARCHAR(10) NOT NULL UNIQUE,
    marca VARCHAR(60) NOT NULL,
    modelo VARCHAR(60) NOT NULL,
    ano INT NOT NULL,
    quilometragem INT NOT NULL DEFAULT 0,
    setor VARCHAR(80) NOT NULL,
    status ENUM('Disponível', 'Em manutenção', 'Indisponível') NOT NULL DEFAULT 'Disponível',
    ativa TINYINT(1) NOT NULL DEFAULT 1,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipo_manutencao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    intervalo_km INT NULL,
    intervalo_dias INT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    descricao VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS manutencao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    viatura_id INT NOT NULL,
    tipo_id INT NOT NULL,
    responsavel_id INT NULL,
    natureza ENUM('preventiva', 'corretiva') NOT NULL,
    data DATETIME NOT NULL,
    data_conclusao DATETIME NULL,
    quilometragem INT NOT NULL,
    servico TEXT NULL,
    problema TEXT NULL,
    pecas TEXT NULL,
    status ENUM('Agendada', 'Em andamento', 'Concluída', 'Cancelada') NOT NULL DEFAULT 'Agendada',
    observacoes TEXT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_manutencao_viatura
        FOREIGN KEY (viatura_id) REFERENCES viatura (id),
    CONSTRAINT fk_manutencao_tipo
        FOREIGN KEY (tipo_id) REFERENCES tipo_manutencao (id),
    CONSTRAINT fk_manutencao_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES usuario (id)
);

INSERT IGNORE INTO tipo_manutencao (nome, intervalo_km, intervalo_dias, ativo, descricao) VALUES
    ('Troca de óleo', 10000, 180, 1, 'Troca de óleo do motor e filtro.'),
    ('Revisão periódica', 20000, 365, 1, 'Revisão geral conforme o fabricante.'),
    ('Revisão de freios', 15000, 365, 1, 'Inspeção de pastilhas, discos e fluido.'),
    ('Alinhamento e balanceamento', 10000, 180, 1, 'Alinhamento da direção e balanceamento das rodas.'),
    ('Manutenção do sistema elétrico', NULL, NULL, 1, 'Manutenção corretiva do sistema elétrico.');
