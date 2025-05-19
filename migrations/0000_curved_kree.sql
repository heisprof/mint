CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"database_id" integer,
	"file_system_id" integer,
	"metric_name" text NOT NULL,
	"metric_value" real,
	"threshold_id" integer,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"acknowledged_by" integer,
	"acknowledged_at" timestamp,
	"ticket_id" text
);
--> statement-breakpoint
CREATE TABLE "database_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"database_id" integer NOT NULL,
	"metric_id" integer NOT NULL,
	"enabled" boolean DEFAULT true,
	"custom_query" text,
	"collect_interval" integer
);
--> statement-breakpoint
CREATE TABLE "database_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"default_port" integer,
	CONSTRAINT "database_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "databases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type_id" integer NOT NULL,
	"host" text NOT NULL,
	"port" integer NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"sid" text,
	"created_by" integer,
	"group_id" integer,
	"created_at" timestamp DEFAULT now(),
	"last_check_at" timestamp,
	"status" text DEFAULT 'unknown',
	"connection_time" integer,
	"monitoring_enabled" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_by" integer,
	CONSTRAINT "email_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "file_systems" (
	"id" serial PRIMARY KEY NOT NULL,
	"database_id" integer NOT NULL,
	"path" text NOT NULL,
	"description" text,
	"total_space" integer,
	"used_space" integer,
	"last_check_at" timestamp,
	"status" text DEFAULT 'unknown'
);
--> statement-breakpoint
CREATE TABLE "group_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"group_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" integer,
	CONSTRAINT "groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "itsd_integration" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"api_key" text,
	"username" text,
	"password" text,
	"enabled" boolean DEFAULT false,
	"last_sync_at" timestamp,
	"settings" jsonb
);
--> statement-breakpoint
CREATE TABLE "metric_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"applicable_to" text NOT NULL,
	"default_enabled" boolean DEFAULT false,
	"query_template" text,
	"unit" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "metric_definitions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "monitoring_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "monitoring_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"description" text,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "template_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"metric_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thresholds" (
	"id" serial PRIMARY KEY NOT NULL,
	"database_id" integer,
	"group_id" integer,
	"metric_id" integer,
	"metric_name" text NOT NULL,
	"warning_threshold" real,
	"critical_threshold" real,
	"enabled" boolean DEFAULT true,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_file_system_id_file_systems_id_fk" FOREIGN KEY ("file_system_id") REFERENCES "public"."file_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_threshold_id_thresholds_id_fk" FOREIGN KEY ("threshold_id") REFERENCES "public"."thresholds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_metrics" ADD CONSTRAINT "database_metrics_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_metrics" ADD CONSTRAINT "database_metrics_metric_id_metric_definitions_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metric_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "databases" ADD CONSTRAINT "databases_type_id_database_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."database_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "databases" ADD CONSTRAINT "databases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "databases" ADD CONSTRAINT "databases_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_systems" ADD CONSTRAINT "file_systems_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_templates" ADD CONSTRAINT "monitoring_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_metrics" ADD CONSTRAINT "template_metrics_template_id_monitoring_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."monitoring_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_metrics" ADD CONSTRAINT "template_metrics_metric_id_metric_definitions_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metric_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thresholds" ADD CONSTRAINT "thresholds_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thresholds" ADD CONSTRAINT "thresholds_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thresholds" ADD CONSTRAINT "thresholds_metric_id_metric_definitions_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metric_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thresholds" ADD CONSTRAINT "thresholds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;