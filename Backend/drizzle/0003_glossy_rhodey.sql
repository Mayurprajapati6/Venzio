ALTER TABLE `holidays` RENAME COLUMN `date` TO `start_date`;--> statement-breakpoint
ALTER TABLE `holidays` DROP INDEX `holiday_unique`;--> statement-breakpoint
ALTER TABLE `holidays` ADD `end_date` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `holidays` ADD `created_at` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `holidays` ADD CONSTRAINT `holiday_unique` UNIQUE(`facility_id`,`start_date`,`end_date`);