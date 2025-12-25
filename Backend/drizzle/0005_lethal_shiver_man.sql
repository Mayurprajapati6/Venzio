ALTER TABLE `attendance` ADD `facility_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` ADD `created_at` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` DROP COLUMN `marked_by`;