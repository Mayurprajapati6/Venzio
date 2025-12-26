CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`razorpay_order_id` varchar(255) NOT NULL,
	`razorpay_payment_id` varchar(255),
	`entity_type` enum('BOOKING','SUBSCRIPTION') NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'INR',
	`status` enum('PENDING','CAPTURED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`payment_method` varchar(50),
	`metadata` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_razorpay_order_unique` UNIQUE(`razorpay_order_id`)
);
