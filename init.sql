CREATE DATABASE IF NOT EXISTS taskdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taskdb;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('user', 'premium', 'admin') DEFAULT 'user',
    isPremium BOOLEAN DEFAULT FALSE,
    subscriptionExpiry DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- Tasks table
CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    ownerId VARCHAR(36) NOT NULL,
    assignedTo VARCHAR(36),
    isPublic BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_owner (ownerId),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    token TEXT NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Idempotency keys
CREATE TABLE idempotency_keys (
    idempotencyKey VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    requestBody TEXT NOT NULL,
    responseStatus INT NOT NULL,
    responseBody TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Blacklisted tokens
CREATE TABLE blacklisted_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token TEXT NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert test users (password: admin123, premium123, user123)
INSERT INTO users (id, email, password, name, role, isPremium, subscriptionExpiry) VALUES
(UUID(), 'admin@test.com', '$2b$10$YQ3b7Z5Z5Z5Z5Z5Z5Z5Z5uN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Admin User', 'admin', TRUE, DATE_ADD(NOW(), INTERVAL 1 YEAR)),
(UUID(), 'premium@test.com', '$2b$10$YQ3b7Z5Z5Z5Z5Z5Z5Z5Z5uN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Premium User', 'premium', TRUE, DATE_ADD(NOW(), INTERVAL 6 MONTH)),
(UUID(), 'user@test.com', '$2b$10$YQ3b7Z5Z5Z5Z5Z5Z5Z5Z5uN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Regular User', 'user', FALSE, NULL);