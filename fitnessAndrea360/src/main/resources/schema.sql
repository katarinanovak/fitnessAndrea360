-- ============================================
-- schema.sql - KOMPLETNA ŠEMA TABELA
-- ============================================

-- 1. ROLE TABLE
CREATE TABLE IF NOT EXISTS roles (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 2. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS locations (
                                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    opening_hours VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    location_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
    );

-- 4. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
                                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         user_id BIGINT NOT NULL UNIQUE,
                                         location_id BIGINT NOT NULL,
                                         first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(50),
    hire_date DATE,
    salary_eur DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    );

-- 5. MEMBERS TABLE (PROŠIRENA VERZIJA)
CREATE TABLE IF NOT EXISTS members (
                                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                       user_id BIGINT NOT NULL UNIQUE,
                                       location_id BIGINT NOT NULL,
                                       first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    address VARCHAR(500),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    membership_start_date DATE,
    membership_end_date DATE,
    membership_status VARCHAR(20) DEFAULT 'ACTIVE',
    medical_notes TEXT,
    notes TEXT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

-- 6. SERVICES TABLE (globalne usluge)
CREATE TABLE IF NOT EXISTS services (
                                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        name VARCHAR(100) NOT NULL,
    description TEXT,
    price_eur DECIMAL(10,2) NOT NULL,
    duration_minutes INT DEFAULT 60,
    max_capacity INT DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NULL, -- DODAJEMO created_by
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

-- JOIN TABLE za many-to-many vezu services <-> locations
CREATE TABLE IF NOT EXISTS service_locations (
                                                 service_id BIGINT NOT NULL,
                                                 location_id BIGINT NOT NULL,
                                                 PRIMARY KEY (service_id, location_id),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    );
-- APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
                                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                            service_id BIGINT NOT NULL,
                                            member_id BIGINT NOT NULL,
                                            location_id BIGINT NOT NULL,
                                            max_capacity INT NOT NULL DEFAULT 10,
                                            current_capacity INT NOT NULL DEFAULT 0,
                                            created_by BIGINT NULL,
                                            start_time DATETIME NOT NULL,
                                            end_time DATETIME NOT NULL,
                                            status VARCHAR(50) DEFAULT 'SCHEDULED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_start_time (start_time),
    INDEX idx_member_service (member_id, service_id),
    INDEX idx_location_time (location_id, start_time),
    INDEX idx_capacity (current_capacity, max_capacity),
    CHECK (current_capacity <= max_capacity)
    );

-- 8. PURCHASES TABLE
CREATE TABLE IF NOT EXISTS purchases (
                                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         member_id BIGINT NOT NULL,
                                         service_id BIGINT NOT NULL,
                                         quantity INT NOT NULL DEFAULT 1,
                                         remaining_uses INT NOT NULL DEFAULT 0,
                                         total_price_eur DECIMAL(10,2) NOT NULL,
    purchase_date DATE NOT NULL,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_purchases_member (member_id),
    INDEX idx_purchases_service (service_id)
    );

-- 9. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
                                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                            purchase_id BIGINT  NULL UNIQUE,
                                            stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount_eur DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(50),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    INDEX idx_transactions_purchase (purchase_id),
    INDEX idx_transactions_stripe (stripe_payment_intent_id)
    );

-- 10. RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS reservations (
                                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                            member_id BIGINT NOT NULL,
                                            appointment_id BIGINT NOT NULL,
                                            purchase_id BIGINT NOT NULL,
                                            status VARCHAR(20) DEFAULT 'CONFIRMED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member_appointment (member_id, appointment_id),
    INDEX idx_reservations_member (member_id),
    INDEX idx_reservations_appointment (appointment_id)
    );

-- ============================================
-- KREIRANJE INDEKSA ZA BRŽE PRETRAGE
-- ============================================

-- Users indeksi
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_location ON users(location_id);

-- Members indeksi
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_location ON members(location_id);
CREATE INDEX idx_members_status ON members(membership_status);
CREATE INDEX idx_members_created_by ON members(created_by);

-- Appointments indeksi
CREATE INDEX idx_appointments_datetime ON appointments(start_time, end_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Reservations indeksi
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_created ON reservations(created_at);

-- ============================================
-- KOMENTARI ZA KOLONE (OPTIONALNO)
-- ============================================

ALTER TABLE members
    COMMENT 'Tabela za članove fitness centra';

ALTER TABLE appointments
    COMMENT 'Tabela za termine treninga';

ALTER TABLE reservations
    COMMENT 'Tabela za rezervacije termina';

ALTER TABLE purchases
    COMMENT 'Tabela za kupovine paketa';

ALTER TABLE transactions
    COMMENT 'Tabela za transakcije plaćanja';

-- ============================================
-- PODESAVANJE AUTO_INCREMENT VRIJEDNOSTI
-- ============================================

ALTER TABLE roles AUTO_INCREMENT = 1;
ALTER TABLE locations AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE employees AUTO_INCREMENT = 1;
ALTER TABLE members AUTO_INCREMENT = 1;
ALTER TABLE services AUTO_INCREMENT = 1;
ALTER TABLE appointments AUTO_INCREMENT = 1;
ALTER TABLE purchases AUTO_INCREMENT = 1;
ALTER TABLE transactions AUTO_INCREMENT = 1;
ALTER TABLE reservations AUTO_INCREMENT = 1;