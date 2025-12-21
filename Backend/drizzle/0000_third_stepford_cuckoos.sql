CREATE TABLE `attendance` (
	`id` varchar(36) NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`date` datetime NOT NULL,
	`marked_by` varchar(36) NOT NULL,
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendance_unique` UNIQUE(`booking_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`facility_id` varchar(36) NOT NULL,
	`slot_type` enum('MORNING','AFTERNOON','EVENING') NOT NULL,
	`pass_days` int NOT NULL,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`active_days_remaining` int NOT NULL,
	`base_amount` int NOT NULL,
	`platform_fee` int NOT NULL,
	`total_amount` int NOT NULL,
	`status` enum('PENDING','ACCEPTED','ACTIVE','COMPLETED','CANCELLED','DISPUTED') NOT NULL DEFAULT 'PENDING',
	`idempotency_key` varchar(255) NOT NULL,
	`qr_code` varchar(500),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_idempotency_unique` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` varchar(36) NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`facility_id` varchar(36) NOT NULL,
	`reason` enum('ENTRY_DENIED','FACILITY_CLOSED') NOT NULL,
	`description` varchar(1000),
	`evidence_image` varchar(500),
	`user_gps_lat` decimal(10,7),
	`user_gps_lng` decimal(10,7),
	`status` enum('SUBMITTED','UNDER_REVIEW','RESOLVED_REFUND','RESOLVED_REJECTED') NOT NULL DEFAULT 'SUBMITTED',
	`admin_decision` varchar(1000),
	`refund_amount` int,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escrows` (
	`id` varchar(36) NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`amount_held` int NOT NULL,
	`platform_fee` int NOT NULL,
	`status` enum('HELD','RELEASED','PAUSED','REFUNDED') NOT NULL DEFAULT 'HELD',
	`release_date` datetime NOT NULL,
	`released_at` datetime,
	CONSTRAINT `escrows_id` PRIMARY KEY(`id`),
	CONSTRAINT `escrow_booking_unique` UNIQUE(`booking_id`)
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` varchar(36) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`category_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`city` varchar(255) NOT NULL,
	`state` varchar(255) NOT NULL,
	`address` varchar(500) NOT NULL,
	`description` varchar(1000),
	`amenities` json,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`is_published` boolean NOT NULL DEFAULT false,
	`auto_accept` boolean NOT NULL DEFAULT true,
	`rating` decimal(3,2) DEFAULT '0.0',
	`total_reviews` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `facilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facility_images` (
	`id` varchar(36) NOT NULL,
	`facility_id` varchar(36) NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `facility_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facility_slots` (
	`id` varchar(36) NOT NULL,
	`facility_id` varchar(36) NOT NULL,
	`date` datetime NOT NULL,
	`slot_type` enum('MORNING','AFTERNOON','EVENING') NOT NULL,
	`capacity` int NOT NULL,
	`booked` int NOT NULL DEFAULT 0,
	CONSTRAINT `facility_slots_id` PRIMARY KEY(`id`),
	CONSTRAINT `facility_slot_unique` UNIQUE(`facility_id`,`date`,`slot_type`)
);
--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` varchar(36) NOT NULL,
	`facility_id` varchar(36) NOT NULL,
	`date` datetime NOT NULL,
	`reason` varchar(255),
	CONSTRAINT `holidays_id` PRIMARY KEY(`id`),
	CONSTRAINT `holiday_unique` UNIQUE(`facility_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `owner_subscriptions` (
	`id` varchar(36) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `owner_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`facility_id` varchar(36) NOT NULL,
	`booking_id` varchar(36) NOT NULL,
	`rating` int NOT NULL,
	`comment` varchar(1000),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_booking_unique` UNIQUE(`booking_id`)
);
--> statement-breakpoint
CREATE TABLE `slot_templates` (
	`id` varchar(36) NOT NULL,
	`facility_id` varchar(36) NOT NULL,
	`slot_type` enum('MORNING','AFTERNOON','EVENING') NOT NULL,
	`start_time` varchar(10) NOT NULL,
	`end_time` varchar(10) NOT NULL,
	`capacity` int NOT NULL,
	`price_1_day` int NOT NULL,
	`price_3_day` int NOT NULL,
	`price_7_day` int NOT NULL,
	CONSTRAINT `slot_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `slot_template_unique` UNIQUE(`facility_id`,`slot_type`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('ADMIN','USER','OWNER') NOT NULL DEFAULT 'USER',
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`city` varchar(255),
	`trust_score` int NOT NULL DEFAULT 100,
	`account_status` enum('ACTIVE','UNDER_MONITORING','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phone_unique` UNIQUE(`phone`)
);
