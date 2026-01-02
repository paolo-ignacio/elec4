-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 02, 2026 at 08:18 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `elec4`
--

-- --------------------------------------------------------

--
-- Table structure for table `cartitems`
--

CREATE TABLE `cartitems` (
  `id` int(11) NOT NULL,
  `cartid` int(11) NOT NULL,
  `productid` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cartitems`
--

INSERT INTO `cartitems` (`id`, `cartid`, `productid`, `quantity`) VALUES
(4, 2, 11, 3),
(5, 2, 21, 1),
(6, 2, 22, 2);

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `carts`
--

INSERT INTO `carts` (`id`, `userid`, `created_at`) VALUES
(1, 2, '2026-01-01 05:17:24'),
(2, 3, '2026-01-01 05:17:24'),
(3, 6, '2026-01-01 09:36:23'),
(4, 8, '2026-01-02 06:42:28');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `createdat` datetime DEFAULT current_timestamp(),
  `updatedat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `image_path`, `createdat`, `updatedat`) VALUES
(1, 'Vitamins & Supplements', 'images/categories/vitamins.jpg', '2026-01-01 13:17:24', '2026-01-01 13:17:24'),
(2, 'First Aid & Emergency', 'images/categories/first-aid.jpg', '2026-01-01 13:17:24', '2026-01-01 13:17:24'),
(3, 'Personal Care', 'images/categories/personal-care.jpg', '2026-01-01 13:17:24', '2026-01-01 13:17:24'),
(4, 'Medical Devices', 'images/categories/medical-devices.jpg', '2026-01-01 13:17:24', '2026-01-01 13:17:24'),
(5, 'Baby & Maternal Care', 'images/categories/baby-care.jpg', '2026-01-01 13:17:24', '2026-01-01 13:17:24'),
(6, 'Pain Relief', 'images/categories/pain-relief.jpg', '2026-01-01 13:17:24', '2026-01-01 13:17:24'),
(7, 'Respiratory Care', 'images/categories/respiratory.jpg', '2026-01-01 13:17:24', '2026-01-01 13:17:24'),
(8, 'Skin Care & Dermatology', 'images/categories/skincare.jpg', '2026-01-01 13:17:24', '2026-01-01 13:17:24');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `message`, `created_at`) VALUES
(1, 'Carlos Mendoza', 'carlos@email.com', 'Hi, I would like to inquire about bulk orders for first aid kits. Do you offer discounts for orders above 50 units?', '2026-01-01 13:17:24'),
(2, 'Lisa Tan', 'lisa.tan@email.com', 'When will the Vitamin D3 be back in stock? I have been waiting for a week now.', '2026-01-01 13:17:24'),
(3, 'Roberto Cruz', 'roberto.cruz@email.com', 'I received a damaged product. Order #1234. Please advise on the return process.', '2026-01-01 13:17:24');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `createdat` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `userid`, `title`, `message`, `type`, `is_read`, `createdat`) VALUES
(1, 2, 'Order Placed Successfully!', 'Your order #000010 has been placed successfully. Total: ₱299.00', 'order', 1, '2026-01-01 07:43:22'),
(2, 2, 'Order Placed Successfully!', 'Your order #000011 has been placed successfully. Total: ₱900.00', 'order', 1, '2026-01-01 08:51:13');

-- --------------------------------------------------------

--
-- Table structure for table `orderitems`
--

CREATE TABLE `orderitems` (
  `id` int(11) NOT NULL,
  `orderid` int(11) NOT NULL,
  `productid` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderitems`
--

INSERT INTO `orderitems` (`id`, `orderid`, `productid`, `quantity`, `price`) VALUES
(17, 11, 2, 2, 450.00),
(18, 12, 2, 2, 450.00),
(19, 12, 7, 2, 180.00),
(20, 13, 12, 1, 85.00),
(21, 14, 1, 1, 299.00),
(22, 15, 5, 3, 250.00),
(23, 16, 5, 2, 250.00),
(24, 16, 16, 1, 1850.00),
(25, 17, 33, 1, 165.00),
(26, 17, 8, 1, 95.00),
(27, 18, 22, 2, 550.00),
(28, 19, 26, 5, 85.00),
(29, 19, 27, 1, 120.00),
(30, 20, 35, 1, 750.00);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `userid` int(11) DEFAULT NULL,
  `totalamount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','shipped','completed','cancelled') DEFAULT 'pending',
  `cancellation_reason` text DEFAULT NULL,
  `shippingaddress` varchar(200) DEFAULT NULL,
  `createdat` datetime DEFAULT current_timestamp(),
  `updatedat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `userid`, `totalamount`, `status`, `cancellation_reason`, `shippingaddress`, `createdat`, `updatedat`) VALUES
(11, 2, 900.00, 'processing', NULL, '456 Rizal Ave, Quezon City, Philippines\nPhone: 09181234567', '2026-01-01 16:51:13', '2026-01-01 16:51:13'),
(12, 2, 1260.00, 'processing', NULL, '456 Rizal Ave, Quezon City, Philippines\nPhone: 09181234567', '2026-01-01 16:57:13', '2026-01-01 16:57:13'),
(13, 2, 85.00, 'processing', NULL, '456 Rizal Ave, Quezon City, Philippinesss\nPhone: 09181234567', '2026-01-01 17:18:56', '2026-01-01 17:18:56'),
(14, 6, 299.00, 'processing', NULL, 'Doon sa malayo\nPhone: 09998558975', '2026-01-01 17:36:38', '2026-01-01 17:36:38'),
(15, 2, 750.00, 'pending', 'qweqwe', '456 Rizal Ave, Quezon City, Philippinesss\nPhone: 09181234567', '2026-01-01 17:47:38', '2026-01-02 13:48:08'),
(16, 2, 2350.00, 'completed', NULL, '123 Main St, Metro Manila, Philippines\nPhone: 09181234567', '2025-12-27 19:23:07', '2025-12-27 19:23:07'),
(17, 3, 300.00, 'shipped', NULL, '456 Oak Avenue, Cebu City, Philippines\nPhone: 09191234567', '2025-12-29 19:23:07', '2025-12-29 19:23:07'),
(18, 4, 1130.00, 'processing', NULL, '789 Pine Road, Davao City, Philippines\nPhone: 09201234567', '2025-12-31 19:23:07', '2025-12-31 19:23:07'),
(19, 5, 545.00, 'cancelled', 'eme', '101 Maple Drive, Baguio City, Philippines\nPhone: 09211234567', '2026-01-01 19:23:07', '2026-01-02 13:34:47'),
(20, 6, 750.00, 'cancelled', 'gaga', '222 Palm Court, Iloilo City, Philippines\nPhone: 09998558975', '2025-12-25 19:23:07', '2026-01-02 13:54:48'),
(21, 2, 150.50, 'completed', NULL, '123 Sample St, City A', '2026-01-01 10:00:00', '2026-01-01 10:00:00'),
(22, 3, 899.00, 'completed', NULL, '456 Sample Ave, City B', '2025-12-28 14:30:00', '2025-12-28 14:30:00'),
(23, 4, 450.00, 'completed', NULL, '789 Sample Rd, City C', '2025-12-20 11:00:00', '2025-12-20 11:00:00'),
(24, 5, 1250.75, 'completed', NULL, '101 Sample Blvd, City D', '2025-12-20 18:45:00', '2025-12-20 18:45:00'),
(25, 2, 320.00, 'completed', NULL, '123 Sample St, City A', '2025-12-05 09:15:00', '2025-12-05 09:15:00'),
(26, 6, 2100.00, 'completed', NULL, '333 Sample Way, City E', '2025-11-25 16:00:00', '2025-11-25 16:00:00'),
(27, 3, 180.25, 'completed', NULL, '456 Sample Ave, City B', '2025-11-08 20:00:00', '2025-11-08 20:00:00'),
(28, 4, 55.50, 'completed', NULL, '789 Sample Rd, City C', '2025-10-30 12:00:00', '2025-10-30 12:00:00'),
(29, 5, 95.00, 'completed', NULL, '101 Sample Blvd, City D', '2025-10-15 13:10:00', '2025-10-15 13:10:00'),
(30, 6, 1340.00, 'completed', NULL, '333 Sample Way, City E', '2025-10-02 22:05:00', '2025-10-02 22:05:00');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `orderid` int(11) NOT NULL,
  `method` enum('GCash','PayPal','Credit Card','Debit Card','Bank Transfer','Cash on Delivery') NOT NULL,
  `status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `reference_no` varchar(100) DEFAULT NULL,
  `proof_image` varchar(255) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `orderid`, `method`, `status`, `reference_no`, `proof_image`, `paid_at`) VALUES
(11, 11, 'GCash', 'pending', 'GCASH-20260101-000011', NULL, NULL),
(12, 12, 'GCash', '', 'GCASH-20260101-000012', 'uploads/e7e9f571b8904adb87564836271ee2b0_Screenshot_20241230-141519.png', NULL),
(13, 13, '', '', 'BANK_TRANSFER-20260101-000013', 'uploads/7c65dcf95e0b481b9ec02e865203d353_Screenshot_20241230-141557.png', NULL),
(14, 14, '', '', 'MAYA-20260101-000014', 'uploads/dd8bdf89d8264a8c9503a95a301925d9_Screenshot_20241230-142122.png', NULL),
(15, 15, 'GCash', '', 'GCASH-20260101-000015', 'uploads/587d4fd238b149bf98e3c7ee0a4445a3_Screenshot_20241230-141701.png', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL,
  `categoryid` int(11) DEFAULT NULL,
  `imagepath` varchar(255) DEFAULT NULL,
  `createdat` datetime DEFAULT current_timestamp(),
  `updatedat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `stock`, `categoryid`, `imagepath`, `createdat`, `updatedat`) VALUES
(1, 'Vitamin C 500mg - 100 Tablets', 'Boost your immune system with high-quality Vitamin C. Helps fight colds and supports overall health.', 299.00, 147, 1, '/static/images/vitamin-c.png', '2026-01-01 13:17:24', '2026-01-01 17:36:38'),
(2, 'Multivitamins for Adults - 60 Capsules', 'Complete daily multivitamin with essential nutrients for adults. Supports energy and vitality.', 450.00, 94, 1, '/static/images/multivitamins.png', '2026-01-01 13:17:24', '2026-01-01 16:57:13'),
(3, 'Vitamin D3 1000IU - 90 Softgels', 'Essential for bone health and immune function. Ideal for those with limited sun exposure.', 380.00, 79, 1, '/static/images/vitamin-d3.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(4, 'Omega-3 Fish Oil - 120 Softgels', 'Premium fish oil for heart and brain health. Rich in EPA and DHA.', 599.00, 60, 1, '/static/images/omega3.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(5, 'Zinc 50mg - 100 Tablets', 'Supports immune function and wound healing. Essential mineral supplement.', 250.00, 117, 1, '/static/images/zinc.png', '2026-01-01 13:17:24', '2026-01-01 17:47:38'),
(6, 'Complete First Aid Kit - 100 Pieces', 'Comprehensive first aid kit for home and travel. Includes bandages, antiseptics, and more.', 850.00, 36, 2, '/static/images/first-aid-kit.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(7, 'Sterile Gauze Pads - 50 Pack', 'Medical-grade sterile gauze for wound care. Highly absorbent and non-stick.', 180.00, 197, 2, '/static/images/gauze-pads.png', '2026-01-01 13:17:24', '2026-01-01 16:57:13'),
(8, 'Elastic Bandage Wrap - 3 inches', 'Reusable elastic bandage for sprains and strains. Provides firm support.', 95.00, 150, 2, '/static/images/elastic-bandage.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(9, 'Antiseptic Solution 120ml', 'Povidone-iodine antiseptic for wound disinfection. Kills germs effectively.', 120.00, 100, 2, '/static/images/antiseptic.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(10, 'Digital Thermometer', 'Fast and accurate digital thermometer. Beeps when reading is complete.', 350.00, 75, 2, '/static/images/thermometer.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(11, 'Hand Sanitizer Gel 500ml', 'Kills 99.9% of germs. Enriched with moisturizers to prevent dry hands.', 150.00, 200, 3, '/static/images/hand-sanitizer.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(12, 'Antibacterial Soap Bar - 3 Pack', 'Gentle cleansing with antibacterial protection. Suitable for daily use.', 85.00, 179, 3, '/static/images/antibacterial-soap.png', '2026-01-01 13:17:24', '2026-01-01 17:18:56'),
(13, 'Oral Care Kit', 'Complete dental hygiene set with toothbrush, toothpaste, and floss.', 220.00, 90, 3, '/static/images/oral-care-kit.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(14, 'Alcohol 70% Isopropyl 500ml', 'Medical-grade isopropyl alcohol for disinfection.', 95.00, 250, 3, '/static/images/alcohol.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(15, 'Cotton Balls - 100 Pack', 'Soft and absorbent cotton balls for various personal care needs.', 65.00, 300, 3, '/static/images/cotton-balls.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(16, 'Digital Blood Pressure Monitor', 'Automatic arm blood pressure monitor with large LCD display. Memory for 60 readings.', 1850.00, 30, 4, '/static/images/bp-monitor.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(17, 'Pulse Oximeter', 'Fingertip pulse oximeter for measuring blood oxygen levels and heart rate.', 650.00, 50, 4, '/static/images/oximeter.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(18, 'Blood Glucose Monitor Kit', 'Complete diabetes monitoring kit with lancets and test strips included.', 1200.00, 40, 4, '/static/images/glucose-monito.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(19, 'Infrared Forehead Thermometer', 'Non-contact thermometer for quick and hygienic temperature readings.', 980.00, 45, 4, '/static/images/infrared-thermometer.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(20, 'Nebulizer Machine', 'Portable nebulizer for respiratory treatments. Quiet operation and easy to use.', 2500.00, 25, 4, '/static/images/nebulizer.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(21, 'Baby Fever Patch - 6 Sheets', 'Cooling gel patches for babies with fever. Provides up to 8 hours of relief.', 120.00, 100, 5, '/static/images/fever-patch.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(22, 'Prenatal Vitamins - 60 Tablets', 'Essential vitamins and minerals for pregnant women. Supports healthy pregnancy.', 550.00, 60, 5, '/static/images/prenatal-vitamins.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(23, 'Baby Nasal Aspirator', 'Gentle nasal suction for congested babies. Safe and easy to clean.', 280.00, 70, 5, '/static/images/nasal-aspirator.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(24, 'Diaper Rash Cream 100g', 'Soothing zinc oxide cream for diaper rash prevention and treatment.', 195.00, 85, 5, '/static/images/diaper-cream.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(25, 'Baby Digital Thermometer', 'Flexible tip thermometer designed for infants. Fast 10-second reading.', 420.00, 55, 5, '/static/images/baby-thermometer.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(26, 'Paracetamol 500mg - 100 Tablets', 'Fast-acting pain relief and fever reducer. Gentle on the stomach.', 85.00, 300, 6, '/static/images/paracetamol.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(27, 'Ibuprofen 200mg - 50 Tablets', 'Anti-inflammatory pain relief for headaches, muscle pain, and arthritis.', 120.00, 200, 6, '/static/images/ibuprofen.png', '2026-01-01 13:17:24', '2026-01-01 16:50:04'),
(28, 'Muscle Pain Relief Cream 50g', 'Topical analgesic for muscle and joint pain. Provides warming relief.', 180.00, 100, 6, '/static/images/muscle-cream.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(29, 'Menthol Pain Relief Patches - 10 Pack', 'Long-lasting patches for back pain and muscle aches.', 150.00, 120, 6, '/static/images/pain-patches.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(30, 'Migraine Relief Tablets - 20 Pack', 'Specialized formula for migraine and severe headache relief.', 220.00, 80, 6, '/static/images/migraine-relief.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(31, 'N95 Face Masks - 20 Pack', 'Medical-grade N95 respirator masks. 95% filtration efficiency.', 450.00, 150, 7, '/static/images/n95-masks.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(32, 'Surgical Face Masks - 50 Pack', '3-ply disposable surgical masks for daily protection.', 180.00, 300, 7, '/static/images/surgical-masks.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(33, 'Cough Syrup 120ml', 'Effective relief from dry and productive coughs. Non-drowsy formula.', 165.00, 100, 7, '/static/images/cough-syrup.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(34, 'Nasal Spray 20ml', 'Decongestant nasal spray for blocked nose relief. Fast-acting.', 195.00, 90, 7, '/static/images/nasal-spray.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(35, 'Steam Inhaler', 'Personal steam inhaler for respiratory relief. Helps clear congestion.', 750.00, 35, 7, '/static/images/steam-inhaler.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(36, 'Hydrocortisone Cream 1% - 15g', 'Anti-itch cream for eczema, rashes, and insect bites.', 145.00, 80, 8, '/static/images/hydrocortisone.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(37, 'Sunscreen SPF 50 - 100ml', 'Broad-spectrum sun protection. Water-resistant formula.', 320.00, 70, 8, '/static/images/sunscreen.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(38, 'Antifungal Cream 30g', 'Effective treatment for athletes foot, ringworm, and fungal infections.', 175.00, 60, 8, '/static/images/antifungal-cream.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(39, 'Wound Healing Ointment 50g', 'Promotes faster healing for cuts, burns, and minor wounds.', 250.00, 75, 8, '/static/images/wound-ointment.png', '2026-01-01 13:17:24', '2026-01-01 16:50:05'),
(40, 'Aloe Vera Gel 250ml', 'Pure aloe vera gel for sunburn relief and skin hydration.', 12.30, 21, 8, '/static/images/aloe-vera.png', '2026-01-01 13:17:24', '2026-01-02 12:24:31');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `passwordhash` varchar(255) NOT NULL,
  `role` enum('admin','customer') DEFAULT 'customer',
  `status` enum('active','deactivated') NOT NULL DEFAULT 'active',
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `createdat` datetime DEFAULT current_timestamp(),
  `updatedat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `passwordhash`, `role`, `status`, `phone`, `address`, `createdat`, `updatedat`) VALUES
(1, 'Admin User', 'admin@healthcare.com', '$2b$12$/Zj5Ox6qRiWG/dILUvaDaOrtm5nBKiY.bPp1NRFd2PDTxbYlgJMJe', 'admin', 'active', '09171234567', '123 Admin Street, Manila, Philippines', '2026-01-01 13:17:24', '2026-01-01 13:28:25'),
(2, 'Juan Dela Cruz', 'juan@email.com', '$2b$12$/Zj5Ox6qRiWG/dILUvaDaOrtm5nBKiY.bPp1NRFd2PDTxbYlgJMJe', 'customer', 'active', '09181234562', '456 Rizal Ave, Quezon City, Philippinesss', '2026-01-01 13:17:24', '2026-01-02 09:39:35'),
(3, 'Maria Santos', 'maria@email.com', '$2b$12$/Zj5Ox6qRiWG/dILUvaDaOrtm5nBKiY.bPp1NRFd2PDTxbYlgJMJe', 'customer', 'active', '09191234567', '789 Mabini St, Makati, Philippines', '2026-01-01 13:17:24', '2026-01-01 13:28:25'),
(4, 'Pedro Reyes', 'pedro@email.com', '$2b$12$/Zj5Ox6qRiWG/dILUvaDaOrtm5nBKiY.bPp1NRFd2PDTxbYlgJMJe', 'customer', 'active', '09201234567', '321 Bonifacio Blvd, Taguig, Philippines', '2026-01-01 13:17:24', '2026-01-01 13:28:25'),
(5, 'Ana Garcia', 'ana@email.com', '$2b$12$/Zj5Ox6qRiWG/dILUvaDaOrtm5nBKiY.bPp1NRFd2PDTxbYlgJMJe', 'customer', 'active', '09211234567', '654 Luna St, Pasig, Philippines', '2026-01-01 13:17:24', '2026-01-01 13:28:25'),
(6, 'Angela', 'angela@gmail.com', '$2b$12$FEwGd05HwPB0XV3vuzkXHu6o8zD0Ak84956mP3P.DUYbpPZ.aGTJS', 'admin', 'active', '09998558981', 'Doon sa malayo', '2026-01-01 17:36:11', '2026-01-02 14:21:48'),
(7, 'paolo', 'paolo@gmail.com', '$2b$12$GkVwx5FSr4He/wVx9t6rn.Oc69IRhYmJKNxO5Su3SGle.Eo95c5xW', 'admin', 'active', '', '', '2026-01-02 14:23:55', '2026-01-02 14:26:49'),
(8, 'eme', 'eme@g.com', '$2b$12$Gaz0oj/giykAsOZPiECFwOzvpJO2vJxf2ShdRu7lQPH9OWd10qrzO', 'customer', 'active', '', '', '2026-01-02 14:36:27', '2026-01-02 14:42:04'),
(9, 'paps', 'paps@g.com', '$2b$12$XYWKYi1o9K2DyPVjw1GCAehhmOZm7vbEAXFvTNqSnaWao4M0TtRv.', 'admin', 'active', '', '', '2026-01-02 14:40:06', '2026-01-02 14:40:44');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `productid` int(11) NOT NULL,
  `createdat` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wishlist`
--

INSERT INTO `wishlist` (`id`, `userid`, `productid`, `createdat`) VALUES
(3, 2, 14, '2026-01-01 09:48:15');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cartitems`
--
ALTER TABLE `cartitems`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cartitems_cart` (`cartid`),
  ADD KEY `fk_cartitems_product` (`productid`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_carts_user` (`userid`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_userid` (`userid`),
  ADD KEY `idx_notifications_createdat` (`createdat`);

--
-- Indexes for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orderitems_order` (`orderid`),
  ADD KEY `fk_orderitems_product` (`productid`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orders_user` (`userid`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payments_order` (`orderid`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_products_category` (`categoryid`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_product` (`userid`,`productid`),
  ADD KEY `fk_wishlist_product` (`productid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cartitems`
--
ALTER TABLE `cartitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `orderitems`
--
ALTER TABLE `orderitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cartitems`
--
ALTER TABLE `cartitems`
  ADD CONSTRAINT `fk_cartitems_cart` FOREIGN KEY (`cartid`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cartitems_product` FOREIGN KEY (`productid`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `fk_carts_user` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD CONSTRAINT `fk_orderitems_order` FOREIGN KEY (`orderid`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_orderitems_product` FOREIGN KEY (`productid`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`orderid`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`categoryid`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`productid`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
