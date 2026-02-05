import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["customer", "rm", "admin"]);
export const propertyTypeEnum = pgEnum("property_type", ["retail", "residential"]);
export const contractStatusEnum = pgEnum("contract_status", ["active", "expired", "terminated", "pending_renewal"]);
export const billStatusEnum = pgEnum("bill_status", ["paid", "unpaid", "overdue", "partial"]);
export const documentCategoryEnum = pgEnum("document_category", [
  "contract_letter", "lease_deed", "lessor_kyc", "noc", "occupancy_certificate",
  "utility_invoice", "rent_invoice", "other"
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "rm_introduction", "lease_expiry", "maintenance", "termination", "general"
]);
export const serviceRequestTypeEnum = pgEnum("service_request_type", [
  "document_request", "billing_clarification", "credit_request", "parking_statement", "maintenance", "other"
]);
export const serviceRequestStatusEnum = pgEnum("service_request_status", ["new", "in_progress", "resolved"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  assignedRmId: varchar("assigned_rm_id"),
});

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: propertyTypeEnum("type").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  description: text("description"),
});

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaseNumber: text("lease_number").notNull().unique(),
  customerId: varchar("customer_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  rmId: varchar("rm_id"),
  sqft: integer("sqft").notNull(),
  rentPerMonth: decimal("rent_per_month", { precision: 12, scale: 2 }).notNull(),
  securityDeposit: decimal("security_deposit", { precision: 12, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  renewalDate: timestamp("renewal_date"),
  rentUpliftPercent: decimal("rent_uplift_percent", { precision: 5, scale: 2 }),
  rentUpliftClause: text("rent_uplift_clause"),
  status: contractStatusEnum("status").notNull().default("active"),
});

export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  amountDue: decimal("amount_due", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date").notNull(),
  status: billStatusEnum("status").notNull().default("unpaid"),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  category: documentCategoryEnum("category").notNull(),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  contractId: varchar("contract_id"),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  type: serviceRequestTypeEnum("type").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  attachmentUrl: text("attachment_url"),
  status: serviceRequestStatusEnum("status").notNull().default("new"),
  rmNote: text("rm_note"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true });
export const insertBillSchema = createInsertSchema(bills).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({ id: true, createdAt: true, updatedAt: true });

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

export type ContractWithDetails = Contract & {
  property: Property;
  rm?: User;
};

export type BillWithContract = Bill & {
  contract: Contract;
  property: Property;
};

export type DocumentWithContract = Document & {
  contract: Contract;
  property: Property;
};

export type NotificationWithContract = Notification & {
  contract?: Contract;
  property?: Property;
};

export type ServiceRequestWithDetails = ServiceRequest & {
  contract: Contract;
  property: Property;
  customer: User;
};
