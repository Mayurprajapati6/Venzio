ALTER TABLE `facilities` ADD `approval_status` enum('DRAFT','PENDING','APPROVED','REJECTED') DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE `facilities` ADD `approved_at` datetime;--> statement-breakpoint
ALTER TABLE `facilities` ADD `rejection_reason` varchar(500);--> statement-breakpoint
ALTER TABLE `facilities` DROP COLUMN `is_approved`;--> statement-breakpoint
ALTER TABLE `facilities` DROP COLUMN `admin_note`;