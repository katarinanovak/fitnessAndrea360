-- ============================================
-- data.sql - POPUNJAVANJE U ISPRAVNOM REDOSLEDU (POJEDNOSTAVLJENO)
-- ============================================

-- 1. PRVO: ROLE (nezavisna tabela)
INSERT IGNORE INTO roles (id, name) VALUES
    (1, 'ADMIN'),
    (2, 'EMPLOYEE'),
    (3, 'MEMBER');

-- 2. DRUGO: LOCATIONS (nezavisna)
INSERT IGNORE INTO locations (id, name, address) VALUES
    (1, 'Main Gym', 'Main Street 123'),
    (2, 'Fitness Center', 'Park Avenue 456'),
    (3, 'Downtown Fitness', 'Downtown 789');

-- 3. TREĆE: USERS (zavisi od roles)
INSERT IGNORE INTO users (id, email, password, role_id, first_name, last_name, username, phone, is_active, location_id) VALUES
    -- ADMINI
    (1, 'admin@fitness.com', 'admin123', 1, 'Admin', 'Adminović', 'admin', '+381600000001', TRUE, 1),
    -- ZAPOSLENI
    (2, 'employee@fitness.com', 'employee123', 2, 'Marko', 'Marković', 'employee1', '+381641111111', TRUE, 1),
    (3, 'employee2@fitness.com', 'employee2123', 2, 'Ana', 'Anić', 'employee2', '+381642222222', TRUE, 2),
    -- ČLANOVI
    (4, 'member@fitness.com', 'member123', 3, 'Jovan', 'Jovanović', 'member1', '+381643333333', TRUE, 1),
    (5, 'member2@fitness.com', 'member2123', 3, 'Marija', 'Marić', 'member2', '+381644444444', TRUE, 2);

-- 4. ČETVRTO: EMPLOYEES (zavisi od users i locations)
INSERT IGNORE INTO employees (id, user_id, location_id, first_name, last_name, phone) VALUES
    (1, 2, 1, 'Marko', 'Marković', '+381641111111'),
    (2, 3, 2, 'Ana', 'Anić', '+381642222222');

-- 5. PETO: MEMBERS (zavisi od users i locations)
INSERT IGNORE INTO members (id, user_id, location_id, first_name, last_name, email, phone, date_of_birth, gender, address, emergency_contact, emergency_phone, membership_start_date, membership_end_date, membership_status, medical_notes, notes, created_by) VALUES
    (1, 4, 1, 'Jovan', 'Jovanović', 'member@fitness.com', '+381643333333', '1990-05-15', 'MALE', 'Bulevar Kralja Aleksandra 123, Beograd', 'Milena Jovanović', '+381641111111', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ACTIVE', 'Nema alergija, povremeno bolovi u leđima', 'Redovno dolazi na treninge', 1),
    (2, 5, 2, 'Marija', 'Marić', 'member2@fitness.com', '+381644444444', '1992-08-22', 'FEMALE', 'Knez Mihailova 45, Beograd', 'Petar Marić', '+381642222222', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'ACTIVE', 'Povremeno astma, nosi inhaler', 'Dolazi na pilates i yoga', 3);

-- 6. ŠESTO: SERVICES (globalne usluge)
INSERT IGNORE INTO services (id, name, description, price_eur, duration_minutes, max_capacity, is_active, created_by) VALUES
    (1, 'Yoga', 'Opuštajući yoga trening za sve nivoe', 15.00, 60, 20, TRUE, 1), -- created_by = admin (id=1)
    (2, 'CrossFit', 'Intenzivni trening cele tela', 20.00, 60, 15, TRUE, 1),
    (3, 'Pilates', 'Jačanje mišića jezgra', 18.00, 60, 12, TRUE, 1);

-- VEZE između usluga i lokacija
-- Pretpostavimo da imamo 3 lokacije (id: 1, 2, 3)
INSERT IGNORE INTO service_locations (service_id, location_id) VALUES
    -- Yoga dostupna na sve 3 lokacije
    (1, 1),
    (1, 2),
    (1, 3),
    -- CrossFit dostupan na lokacijama 1 i 2
    (2, 1),
    (2, 2),
    -- Pilates dostupan samo na lokaciji 1
    (3, 1);

--- INSERT APPOINTMENTS
INSERT IGNORE INTO appointments (id, service_id, member_id, location_id, max_capacity, current_capacity, created_by, start_time, end_time, status, notes) VALUES
-- Danasnji termini
(1, 1, 1, 1, 15, 5, 1,
 DATE_ADD(NOW(), INTERVAL 1 HOUR),
 DATE_ADD(NOW(), INTERVAL 2 HOUR),
 'SCHEDULED',
 'Prvi yoga trening za novog člana'),

(2, 2, 2, 1, 20, 15, 2,
 DATE_ADD(NOW(), INTERVAL 3 HOUR),
 DATE_ADD(NOW(), INTERVAL 4 HOUR),
 'CONFIRMED',
 'CrossFit grupni trening'),

-- Sutrašnji termini
(3, 3, 3, 2, 10, 0, 1,
 DATE_ADD(NOW(), INTERVAL 25 HOUR),
 DATE_ADD(NOW(), INTERVAL 26 HOUR),
 'SCHEDULED',
 'Pilates za napredne'),

(4, 1, 4, 3, 12, 3, 3,
 DATE_ADD(NOW(), INTERVAL 26 HOUR),
 DATE_ADD(NOW(), INTERVAL 27 HOUR),
 'SCHEDULED',
 'Yoga za opuštanje'),

-- Prethodni (završeni) termini
(5, 2, 1, 1, 20, 20, 1,
 DATE_SUB(NOW(), INTERVAL 2 DAY),
 DATE_SUB(NOW(), INTERVAL 1 DAY),
 'COMPLETED',
 'CrossFit trening - dobra pojava'),

(6, 3, 2, 2, 10, 8, 2,
 DATE_SUB(NOW(), INTERVAL 1 DAY),
 DATE_SUB(NOW(), INTERVAL 23 HOUR),
 'COMPLETED',
 'Pilates trening'),

-- Otkazani termin (kapacitet ostaje 0 jer je otkazan)
(7, 1, 3, 3, 15, 0, 1,
 DATE_SUB(NOW(), INTERVAL 12 HOUR),
 DATE_SUB(NOW(), INTERVAL 11 HOUR),
 'CANCELLED',
 'Član se razboleo'),

-- Termin koji je u toku (skoro pun)
(8, 2, 4, 1, 25, 22, 2,
 NOW(),
 DATE_ADD(NOW(), INTERVAL 1 HOUR),
 'IN_PROGRESS',
 'Trenutno u toku'),

-- Novi termin za testiranje kapaciteta (ima slobodnih mesta)
(9, 1, 1, 1, 10, 7, 1,
 DATE_ADD(NOW(), INTERVAL 5 HOUR),
 DATE_ADD(NOW(), INTERVAL 6 HOUR),
 'SCHEDULED',
 'Yoga večernja sesija'),

-- Termin koji je potpuno pun
(10, 2, 2, 2, 30, 30, 2,
 DATE_ADD(NOW(), INTERVAL 8 HOUR),
 DATE_ADD(NOW(), INTERVAL 9 HOUR),
 'CONFIRMED',
 'CrossFit - SOLD OUT');
-- 8. OSMO: PURCHASES - DODAJ EXPIRY_DATE!
INSERT IGNORE INTO purchases (id, member_id, service_id, quantity, remaining_uses, total_price_eur, purchase_date, expiry_date, status) VALUES
    (1, 1, 1, 10, 10, 150.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 MONTH), 'ACTIVE'),
    (2, 1, 2, 5, 5, 100.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 MONTH), 'ACTIVE'),
    (3, 2, 3, 8, 8, 144.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 'ACTIVE');

-- 9. DEVETO: TRANSACTIONS
INSERT IGNORE INTO transactions (id, purchase_id, stripe_payment_intent_id, amount_eur, currency, status, payment_date) VALUES
    (1, 1, 'pi_yoga_123', 150.00, 'EUR', 'SUCCESS', CURDATE()),
    (2, 2, 'pi_crossfit_456', 100.00, 'EUR', 'SUCCESS', CURDATE()),
    (3, 3, 'pi_pilates_789', 144.00, 'EUR', 'SUCCESS', CURDATE());

-- 10. DESETO: RESERVATIONS
INSERT IGNORE INTO reservations (id, member_id, appointment_id, purchase_id, status, created_at) VALUES
    (1, 1, 1, 1, 'CONFIRMED', NOW()),
    (2, 1, 2, 2, 'CONFIRMED', NOW()),
    (3, 2, 3, 3, 'CONFIRMED', NOW());