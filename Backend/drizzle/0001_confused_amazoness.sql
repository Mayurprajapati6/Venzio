ALTER TABLE `facilities` ADD `is_approved` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `facilities` ADD `admin_note` varchar(500);