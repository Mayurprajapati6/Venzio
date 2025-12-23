ALTER TABLE `slot_templates` ADD `valid_from` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `slot_templates` ADD `valid_till` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `slot_templates` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `slot_templates` ADD `created_at` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL;