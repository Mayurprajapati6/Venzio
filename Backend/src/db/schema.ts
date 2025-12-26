import {
  mysqlTable,
  varchar,
  int,
  boolean,
  datetime,
  decimal,
  json,
  mysqlEnum,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/* =======================
   ENUMS (INLINE USE)
======================= */

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),

  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),

  role: mysqlEnum("role", ["ADMIN", "USER", "OWNER"])
    .default("USER")
    .notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  city: varchar("city", { length: 255 }),

  trustScore: int("trust_score").default(100).notNull(),

  accountStatus: mysqlEnum("account_status", [
    "ACTIVE",
    "UNDER_MONITORING",
    "SUSPENDED",
  ])
    .default("ACTIVE")
    .notNull(),

  createdAt: datetime("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (t) => ({
  emailUnique: uniqueIndex("users_email_unique").on(t.email),
  phoneUnique: uniqueIndex("users_phone_unique").on(t.phone),
}));

/* =======================
   CATEGORY
======================= */

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
}, (t) => ({
  nameUnique: uniqueIndex("categories_name_unique").on(t.name),
  slugUnique: uniqueIndex("categories_slug_unique").on(t.slug),
}));


/* =======================
   FACILITY
======================= */

export const facilities = mysqlTable("facilities", {
  id: varchar("id", { length: 36 }).primaryKey(),

  ownerId: varchar("owner_id", { length: 36 }).notNull(),
  categoryId: int("category_id").notNull(),
  categorySlug: varchar("category_slug", { length: 50 }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  description: varchar("description", { length: 1000 }),

  amenities: json("amenities"),

  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),

  approvalStatus: mysqlEnum("approval_status", [
    "DRAFT",
    "PENDING",
    "APPROVED",
    "REJECTED",
  ])
    .default("DRAFT")
    .notNull(),

  approvedAt: datetime("approved_at"),
  rejectionReason: varchar("rejection_reason", { length: 500 }),

  isPublished: boolean("is_published").default(false).notNull(),

  autoAccept: boolean("auto_accept").default(true).notNull(),

  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.0"),
  totalReviews: int("total_reviews").default(0).notNull(),

  createdAt: datetime("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});


/* =======================
   FACILITY IMAGE
======================= */

export const facilityImages = mysqlTable("facility_images", {
  id: varchar("id", { length: 36 })
    .primaryKey(),

  facilityId: varchar("facility_id", { length: 36 }).notNull().references(() => facilities.id, { onDelete: "cascade" }),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

/* =======================
   SLOT TEMPLATE
======================= */

export const slotTemplates = mysqlTable(
  "slot_templates",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    facilityId: varchar("facility_id", { length: 36 }).notNull(),

    slotType: mysqlEnum("slot_type", [
      "MORNING",
      "AFTERNOON",
      "EVENING",
    ]).notNull(),

    startTime: varchar("start_time", { length: 10 }).notNull(),
    endTime: varchar("end_time", { length: 10 }).notNull(),

    capacity: int("capacity").notNull(),

    price1Day: int("price_1_day"),
    price3Day: int("price_3_day"),
    price7Day: int("price_7_day"),

    validFrom: datetime("valid_from").notNull(),
    validTill: datetime("valid_till").notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => ({
    uniqueFacilitySlot: uniqueIndex("slot_template_unique").on(
      t.facilityId,
      t.slotType
    ),
  })
);


/* =======================
   FACILITY SLOT
======================= */

export const facilitySlots = mysqlTable("facility_slots", {
  id: varchar("id", { length: 36 })
    .primaryKey(),

  facilityId: varchar("facility_id", { length: 36 }).notNull(),

  date: datetime("date").notNull(),

  slotType: mysqlEnum("slot_type", [
    "MORNING",
    "AFTERNOON",
    "EVENING",
  ]).notNull(),

  capacity: int("capacity").notNull(),
  booked: int("booked").default(0).notNull(),
}, (t) => ({
  uniqueSlot: uniqueIndex("facility_slot_unique")
    .on(t.facilityId, t.date, t.slotType),
}));

/* =======================
   BOOKING
======================= */

export const bookings = mysqlTable("bookings", {
  id: varchar("id", { length: 36 })
    .primaryKey(),

  userId: varchar("user_id", { length: 36 }).notNull(),
  facilityId: varchar("facility_id", { length: 36 }).notNull(),

  slotType: mysqlEnum("slot_type", [
    "MORNING",
    "AFTERNOON",
    "EVENING",
  ]).notNull(),

  passDays: int("pass_days").notNull(),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date").notNull(),
  activeDaysRemaining: int("active_days_remaining").notNull(),

  baseAmount: int("base_amount").notNull(),
  platformFee: int("platform_fee").notNull(),
  totalAmount: int("total_amount").notNull(),

  status: mysqlEnum("status", [
    "PENDING",
    "ACCEPTED",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
    "DISPUTED",
  ])
    .default("PENDING")
    .notNull(),

  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
  qrCode: varchar("qr_code", { length: 500 }),

  createdAt: datetime("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (t) => ({
  idempotencyUnique: uniqueIndex("booking_idempotency_unique")
    .on(t.idempotencyKey),
}));

/* =======================
   ATTENDANCE
======================= */

export const attendance = mysqlTable("attendance", {
  id: varchar("id", { length: 36 }).primaryKey(),

  bookingId: varchar("booking_id", { length: 36 }).notNull(),
  facilityId: varchar("facility_id", { length: 36 }).notNull(),

  date: datetime("date").notNull(),

  createdAt: datetime("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (t) => ({
  uniqueDailyAttendance: uniqueIndex("attendance_unique")
    .on(t.bookingId, t.date),
}));


/* =======================
   ESCROW
======================= */

export const escrows = mysqlTable("escrows", {
  id: varchar("id", { length: 36 })
    .primaryKey(),

  bookingId: varchar("booking_id", { length: 36 }).notNull(),
  ownerId: varchar("owner_id", { length: 36 }).notNull(),

  amountHeld: int("amount_held").notNull(),
  platformFee: int("platform_fee").notNull(),

  status: mysqlEnum("status", [
    "HELD",
    "RELEASED",
    "PAUSED",
    "REFUNDED",
  ])
    .default("HELD")
    .notNull(),

  releaseDate: datetime("release_date").notNull(),
  releasedAt: datetime("released_at"),
}, (t) => ({
  bookingUnique: uniqueIndex("escrow_booking_unique")
    .on(t.bookingId),
}));

/* =======================
   REVIEW
======================= */

export const reviews = mysqlTable("reviews", {
  id: varchar("id", { length: 36 })
    .primaryKey(),

  userId: varchar("user_id", { length: 36 }).notNull(),
  facilityId: varchar("facility_id", { length: 36 }).notNull(),
  bookingId: varchar("booking_id", { length: 36 }).notNull(),

  rating: int("rating").notNull(),
  comment: varchar("comment", { length: 1000 }),

  createdAt: datetime("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (t) => ({
  bookingUnique: uniqueIndex("review_booking_unique")
    .on(t.bookingId),
}));

/* =======================
   HOLIDAY
======================= */

export const holidays = mysqlTable(
  "holidays",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    facilityId: varchar("facility_id", { length: 36 }).notNull(),

    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),

    reason: varchar("reason", { length: 255 }),

    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => ({
    uniqueHolidayRange: uniqueIndex("holiday_unique").on(
      t.facilityId,
      t.startDate,
      t.endDate
    ),
  })
);

/* =======================
   DISPUTE
======================= */

export const disputes = mysqlTable("disputes", {
  id: varchar("id", { length: 36 })
    .primaryKey(),

  bookingId: varchar("booking_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  ownerId: varchar("owner_id", { length: 36 }).notNull(),
  facilityId: varchar("facility_id", { length: 36 }).notNull(),

  reason: mysqlEnum("reason", [
    "ENTRY_DENIED",
    "FACILITY_CLOSED",
  ]).notNull(),

  description: varchar("description", { length: 1000 }),
  evidenceImage: varchar("evidence_image", { length: 500 }),

  userGpsLat: decimal("user_gps_lat", { precision: 10, scale: 7 }),
  userGpsLng: decimal("user_gps_lng", { precision: 10, scale: 7 }),

  status: mysqlEnum("status", [
    "SUBMITTED",
    "UNDER_REVIEW",
    "RESOLVED_REFUND",
    "RESOLVED_REJECTED",
  ])
    .default("SUBMITTED")
    .notNull(),

  adminDecision: varchar("admin_decision", { length: 1000 }),
  refundAmount: int("refund_amount"),

  createdAt: datetime("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),

  updatedAt: datetime("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

/* =======================
   OWNER SUBSCRIPTION
======================= */

export const ownerSubscriptions = mysqlTable("owner_subscriptions", {
  id: varchar("id", { length: 36 })
    .primaryKey(),

  ownerId: varchar("owner_id", { length: 36 }).notNull(),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date").notNull(),

  isActive: boolean("is_active").default(true).notNull(),
});

/* =======================
   PAYMENT
======================= */

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),

  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }).notNull(),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),

  entityType: mysqlEnum("entity_type", ["BOOKING", "SUBSCRIPTION"]).notNull(),
  entityId: varchar("entity_id", { length: 36 }).notNull(),

  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),

  status: mysqlEnum("status", [
    "PENDING",
    "CAPTURED",
    "FAILED",
    "REFUNDED",
  ])
    .default("PENDING")
    .notNull(),

  paymentMethod: varchar("payment_method", { length: 50 }),

  metadata: json("metadata"),

  createdAt: datetime("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),

  updatedAt: datetime("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (t) => ({
  razorpayOrderUnique: uniqueIndex("payment_razorpay_order_unique")
    .on(t.razorpayOrderId),
}));