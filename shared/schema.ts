import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  role: text("role").notNull().default("user"), // admin, user
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Groups table for organizing databases
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
});

// Group memberships for users
export const groupMemberships = pgTable("group_memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  groupId: integer("group_id").notNull().references(() => groups.id),
});

export const insertGroupMembershipSchema = createInsertSchema(groupMemberships).omit({
  id: true,
});

// Database types
export const databaseTypes = pgTable("database_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  defaultPort: integer("default_port"),
});

export const insertDatabaseTypeSchema = createInsertSchema(databaseTypes).omit({
  id: true,
});

// Databases to monitor
export const databases = pgTable("databases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  typeId: integer("type_id").notNull().references(() => databaseTypes.id),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  sid: text("sid"),
  createdBy: integer("created_by").references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  createdAt: timestamp("created_at").defaultNow(),
  lastCheckAt: timestamp("last_check_at"),
  status: text("status").default("unknown"), // healthy, warning, critical, unknown
  connectionTime: integer("connection_time"), // in milliseconds
  monitoringEnabled: boolean("monitoring_enabled").default(true),
});

export const insertDatabaseSchema = createInsertSchema(databases).omit({
  id: true,
  createdAt: true,
  lastCheckAt: true,
  status: true,
  connectionTime: true,
});

// Available metrics definitions
export const metricDefinitions = pgTable("metric_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // performance, storage, availability, etc.
  applicableTo: text("applicable_to").notNull(), // mysql, oracle, both
  defaultEnabled: boolean("default_enabled").default(false),
  queryTemplate: text("query_template"),
  unit: text("unit"), // %, ms, MB, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMetricDefinitionSchema = createInsertSchema(metricDefinitions).omit({
  id: true,
  createdAt: true,
});

// Monitoring templates (groups of metrics)
export const monitoringTemplates = pgTable("monitoring_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMonitoringTemplateSchema = createInsertSchema(monitoringTemplates).omit({
  id: true,
  createdAt: true,
});

// Template metrics (metrics included in a template)
export const templateMetrics = pgTable("template_metrics", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => monitoringTemplates.id),
  metricId: integer("metric_id").notNull().references(() => metricDefinitions.id),
});

export const insertTemplateMetricSchema = createInsertSchema(templateMetrics).omit({
  id: true,
});

// Database metric configurations (which metrics are enabled for a database)
export const databaseMetrics = pgTable("database_metrics", {
  id: serial("id").primaryKey(),
  databaseId: integer("database_id").notNull().references(() => databases.id),
  metricId: integer("metric_id").notNull().references(() => metricDefinitions.id),
  enabled: boolean("enabled").default(true),
  customQuery: text("custom_query"), // Optional custom query overriding the default
  collectInterval: integer("collect_interval"), // Custom collection interval in minutes
});

export const insertDatabaseMetricSchema = createInsertSchema(databaseMetrics).omit({
  id: true,
});

// Thresholds for alerting
export const thresholds = pgTable("thresholds", {
  id: serial("id").primaryKey(),
  databaseId: integer("database_id").references(() => databases.id),
  groupId: integer("group_id").references(() => groups.id), // For group-level thresholds
  metricId: integer("metric_id").references(() => metricDefinitions.id),
  metricName: text("metric_name").notNull(), // For backward compatibility
  warningThreshold: real("warning_threshold"), // Percentage or absolute value
  criticalThreshold: real("critical_threshold"), // Percentage or absolute value
  enabled: boolean("enabled").default(true),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertThresholdSchema = createInsertSchema(thresholds).omit({
  id: true,
});

// File systems to monitor
export const fileSystems = pgTable("file_systems", {
  id: serial("id").primaryKey(),
  databaseId: integer("database_id").notNull().references(() => databases.id),
  path: text("path").notNull(),
  description: text("description"),
  totalSpace: integer("total_space"), // in MB
  usedSpace: integer("used_space"), // in MB
  lastCheckAt: timestamp("last_check_at"),
  status: text("status").default("unknown"), // healthy, warning, critical, unknown
});

export const insertFileSystemSchema = createInsertSchema(fileSystems).omit({
  id: true,
  totalSpace: true,
  usedSpace: true,
  lastCheckAt: true,
  status: true,
});

// Alerts generated from monitoring
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  databaseId: integer("database_id").references(() => databases.id),
  fileSystemId: integer("file_system_id").references(() => fileSystems.id),
  metricName: text("metric_name").notNull(),
  metricValue: real("metric_value"),
  thresholdId: integer("threshold_id").references(() => thresholds.id),
  severity: text("severity").notNull(), // warning, critical
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  ticketId: text("ticket_id"), // Reference to external ITSD ticket
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  acknowledgedBy: true,
  acknowledgedAt: true,
});

// Settings for the application
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
});

// Email templates
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
});

// ITSD integration settings
export const itsdIntegration = pgTable("itsd_integration", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  apiKey: text("api_key"),
  username: text("username"),
  password: text("password"),
  enabled: boolean("enabled").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  settings: jsonb("settings"), // Additional configuration
});

export const insertItsdIntegrationSchema = createInsertSchema(itsdIntegration).omit({
  id: true,
  lastSyncAt: true,
});

// Types export
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMembership = typeof groupMemberships.$inferSelect;
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;

export type DatabaseType = typeof databaseTypes.$inferSelect;
export type InsertDatabaseType = z.infer<typeof insertDatabaseTypeSchema>;

export type Database = typeof databases.$inferSelect;
export type InsertDatabase = z.infer<typeof insertDatabaseSchema>;

export type Threshold = typeof thresholds.$inferSelect;
export type InsertThreshold = z.infer<typeof insertThresholdSchema>;

export type FileSystem = typeof fileSystems.$inferSelect;
export type InsertFileSystem = z.infer<typeof insertFileSystemSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type ItsdIntegration = typeof itsdIntegration.$inferSelect;
export type InsertItsdIntegration = z.infer<typeof insertItsdIntegrationSchema>;

export type MetricDefinition = typeof metricDefinitions.$inferSelect;
export type InsertMetricDefinition = z.infer<typeof insertMetricDefinitionSchema>;

export type MonitoringTemplate = typeof monitoringTemplates.$inferSelect;
export type InsertMonitoringTemplate = z.infer<typeof insertMonitoringTemplateSchema>;

export type TemplateMetric = typeof templateMetrics.$inferSelect;
export type InsertTemplateMetric = z.infer<typeof insertTemplateMetricSchema>;

export type DatabaseMetric = typeof databaseMetrics.$inferSelect;
export type InsertDatabaseMetric = z.infer<typeof insertDatabaseMetricSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
