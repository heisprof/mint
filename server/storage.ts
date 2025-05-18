import { 
  users, type User, type InsertUser,
  groups, type Group, type InsertGroup,
  groupMemberships, type GroupMembership, type InsertGroupMembership,
  databaseTypes, type DatabaseType, type InsertDatabaseType,
  databases, type Database, type InsertDatabase,
  thresholds, type Threshold, type InsertThreshold,
  fileSystems, type FileSystem, type InsertFileSystem,
  alerts, type Alert, type InsertAlert,
  settings, type Setting, type InsertSetting,
  emailTemplates, type EmailTemplate, type InsertEmailTemplate,
  itsdIntegration, type ItsdIntegration, type InsertItsdIntegration
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";

// Storage interface for the application
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Group operations
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  listGroups(): Promise<Group[]>;
  updateGroup(id: number, updates: Partial<InsertGroup>): Promise<Group | undefined>;
  
  // Group membership operations
  addUserToGroup(membership: InsertGroupMembership): Promise<GroupMembership>;
  removeUserFromGroup(userId: number, groupId: number): Promise<boolean>;
  getUserGroups(userId: number): Promise<Group[]>;
  
  // Database type operations
  createDatabaseType(type: InsertDatabaseType): Promise<DatabaseType>;
  listDatabaseTypes(): Promise<DatabaseType[]>;
  getDatabaseType(id: number): Promise<DatabaseType | undefined>;
  
  // Database operations
  createDatabase(database: InsertDatabase): Promise<Database>;
  getDatabase(id: number): Promise<Database | undefined>;
  listDatabases(): Promise<Database[]>;
  listDatabasesByGroup(groupId: number): Promise<Database[]>;
  updateDatabase(id: number, updates: Partial<InsertDatabase>): Promise<Database | undefined>;
  updateDatabaseStatus(id: number, status: string, connectionTime?: number): Promise<Database | undefined>;
  
  // Threshold operations
  createThreshold(threshold: InsertThreshold): Promise<Threshold>;
  getThreshold(id: number): Promise<Threshold | undefined>;
  listThresholds(): Promise<Threshold[]>;
  getThresholdsForDatabase(databaseId: number): Promise<Threshold[]>;
  getThresholdsForGroup(groupId: number): Promise<Threshold[]>;
  updateThreshold(id: number, updates: Partial<InsertThreshold>): Promise<Threshold | undefined>;
  
  // Filesystem operations
  createFileSystem(fileSystem: InsertFileSystem): Promise<FileSystem>;
  getFileSystem(id: number): Promise<FileSystem | undefined>;
  listFileSystems(): Promise<FileSystem[]>;
  getFileSystemsForDatabase(databaseId: number): Promise<FileSystem[]>;
  updateFileSystemStatus(id: number, totalSpace: number, usedSpace: number, status: string): Promise<FileSystem | undefined>;
  
  // Alert operations
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlert(id: number): Promise<Alert | undefined>;
  listAlerts(limit?: number): Promise<Alert[]>;
  listActiveAlerts(): Promise<Alert[]>;
  acknowledgeAlert(id: number, userId: number): Promise<Alert | undefined>;
  updateAlertTicket(id: number, ticketId: string): Promise<Alert | undefined>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;
  
  // Email template operations
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined>;
  listEmailTemplates(): Promise<EmailTemplate[]>;
  
  // ITSD integration operations
  getItsdIntegration(): Promise<ItsdIntegration | undefined>;
  updateItsdIntegration(updates: Partial<InsertItsdIntegration>): Promise<ItsdIntegration>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Group operations
  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async listGroups(): Promise<Group[]> {
    return db.select().from(groups);
  }

  async updateGroup(id: number, updates: Partial<InsertGroup>): Promise<Group | undefined> {
    const [updatedGroup] = await db
      .update(groups)
      .set(updates)
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup;
  }

  // Group membership operations
  async addUserToGroup(membership: InsertGroupMembership): Promise<GroupMembership> {
    const [newMembership] = await db.insert(groupMemberships).values(membership).returning();
    return newMembership;
  }

  async removeUserFromGroup(userId: number, groupId: number): Promise<boolean> {
    const result = await db
      .delete(groupMemberships)
      .where(
        and(
          eq(groupMemberships.userId, userId),
          eq(groupMemberships.groupId, groupId)
        )
      );
    return true;
  }

  async getUserGroups(userId: number): Promise<Group[]> {
    const memberships = await db
      .select({
        groupId: groupMemberships.groupId,
      })
      .from(groupMemberships)
      .where(eq(groupMemberships.userId, userId));
    
    if (memberships.length === 0) return [];
    
    const groupIds = memberships.map(m => m.groupId);
    return db
      .select()
      .from(groups)
      .where(
        groupIds.map(id => eq(groups.id, id)).reduce((prev, curr) => prev || curr)
      );
  }

  // Database type operations
  async createDatabaseType(type: InsertDatabaseType): Promise<DatabaseType> {
    const [newType] = await db.insert(databaseTypes).values(type).returning();
    return newType;
  }

  async listDatabaseTypes(): Promise<DatabaseType[]> {
    return db.select().from(databaseTypes);
  }

  async getDatabaseType(id: number): Promise<DatabaseType | undefined> {
    const [type] = await db.select().from(databaseTypes).where(eq(databaseTypes.id, id));
    return type;
  }

  // Database operations
  async createDatabase(database: InsertDatabase): Promise<Database> {
    const [newDatabase] = await db.insert(databases).values(database).returning();
    return newDatabase;
  }

  async getDatabase(id: number): Promise<Database | undefined> {
    const [database] = await db.select().from(databases).where(eq(databases.id, id));
    return database;
  }

  async listDatabases(): Promise<Database[]> {
    return db.select().from(databases);
  }

  async listDatabasesByGroup(groupId: number): Promise<Database[]> {
    return db.select().from(databases).where(eq(databases.groupId, groupId));
  }

  async updateDatabase(id: number, updates: Partial<InsertDatabase>): Promise<Database | undefined> {
    const [updatedDatabase] = await db
      .update(databases)
      .set(updates)
      .where(eq(databases.id, id))
      .returning();
    return updatedDatabase;
  }

  async updateDatabaseStatus(id: number, status: string, connectionTime?: number): Promise<Database | undefined> {
    const [updatedDatabase] = await db
      .update(databases)
      .set({
        status,
        connectionTime,
        lastCheckAt: new Date()
      })
      .where(eq(databases.id, id))
      .returning();
    return updatedDatabase;
  }

  // Threshold operations
  async createThreshold(threshold: InsertThreshold): Promise<Threshold> {
    const [newThreshold] = await db.insert(thresholds).values(threshold).returning();
    return newThreshold;
  }

  async getThreshold(id: number): Promise<Threshold | undefined> {
    const [threshold] = await db.select().from(thresholds).where(eq(thresholds.id, id));
    return threshold;
  }

  async listThresholds(): Promise<Threshold[]> {
    return db.select().from(thresholds);
  }

  async getThresholdsForDatabase(databaseId: number): Promise<Threshold[]> {
    return db.select().from(thresholds).where(
      and(
        eq(thresholds.databaseId, databaseId),
        eq(thresholds.enabled, true)
      )
    );
  }

  async getThresholdsForGroup(groupId: number): Promise<Threshold[]> {
    return db.select().from(thresholds).where(
      and(
        eq(thresholds.groupId, groupId),
        eq(thresholds.enabled, true)
      )
    );
  }

  async updateThreshold(id: number, updates: Partial<InsertThreshold>): Promise<Threshold | undefined> {
    const [updatedThreshold] = await db
      .update(thresholds)
      .set(updates)
      .where(eq(thresholds.id, id))
      .returning();
    return updatedThreshold;
  }

  // Filesystem operations
  async createFileSystem(fileSystem: InsertFileSystem): Promise<FileSystem> {
    const [newFileSystem] = await db.insert(fileSystems).values(fileSystem).returning();
    return newFileSystem;
  }

  async getFileSystem(id: number): Promise<FileSystem | undefined> {
    const [fileSystem] = await db.select().from(fileSystems).where(eq(fileSystems.id, id));
    return fileSystem;
  }

  async listFileSystems(): Promise<FileSystem[]> {
    return db.select().from(fileSystems);
  }

  async getFileSystemsForDatabase(databaseId: number): Promise<FileSystem[]> {
    return db.select().from(fileSystems).where(eq(fileSystems.databaseId, databaseId));
  }

  async updateFileSystemStatus(id: number, totalSpace: number, usedSpace: number, status: string): Promise<FileSystem | undefined> {
    const [updatedFileSystem] = await db
      .update(fileSystems)
      .set({
        totalSpace,
        usedSpace,
        status,
        lastCheckAt: new Date()
      })
      .where(eq(fileSystems.id, id))
      .returning();
    return updatedFileSystem;
  }

  // Alert operations
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }

  async listAlerts(limit: number = 100): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(limit);
  }

  async listActiveAlerts(): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(isNull(alerts.acknowledgedAt))
      .orderBy(desc(alerts.createdAt));
  }

  async acknowledgeAlert(id: number, userId: number): Promise<Alert | undefined> {
    const [acknowledgedAlert] = await db
      .update(alerts)
      .set({
        acknowledgedBy: userId,
        acknowledgedAt: new Date()
      })
      .where(eq(alerts.id, id))
      .returning();
    return acknowledgedAlert;
  }

  async updateAlertTicket(id: number, ticketId: string): Promise<Alert | undefined> {
    const [updatedAlert] = await db
      .update(alerts)
      .set({ ticketId })
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert;
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    // Try to update first
    const [existingSetting] = await db
      .update(settings)
      .set({ value })
      .where(eq(settings.key, key))
      .returning();
    
    if (existingSetting) return existingSetting;
    
    // Insert if not exists
    const [newSetting] = await db
      .insert(settings)
      .values({ key, value })
      .returning();
    
    return newSetting;
  }

  // Email template operations
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name));
    return template;
  }

  async listEmailTemplates(): Promise<EmailTemplate[]> {
    return db.select().from(emailTemplates);
  }

  // ITSD integration operations
  async getItsdIntegration(): Promise<ItsdIntegration | undefined> {
    const [integration] = await db.select().from(itsdIntegration);
    return integration;
  }

  async updateItsdIntegration(updates: Partial<InsertItsdIntegration>): Promise<ItsdIntegration> {
    const [existingIntegration] = await db.select().from(itsdIntegration);
    
    if (existingIntegration) {
      const [updatedIntegration] = await db
        .update(itsdIntegration)
        .set(updates)
        .where(eq(itsdIntegration.id, existingIntegration.id))
        .returning();
      return updatedIntegration;
    }
    
    // Insert if no record exists - ensure required fields are present
    const integrationData = {
      endpoint: updates.endpoint || 'https://api.itsd.example.com',
      username: updates.username,
      password: updates.password,
      enabled: updates.enabled !== undefined ? updates.enabled : false,
      apiKey: updates.apiKey,
      settings: updates.settings
    };
    
    const [newIntegration] = await db
      .insert(itsdIntegration)
      .values(integrationData)
      .returning();
    
    return newIntegration;
  }
}

export const storage = new DatabaseStorage();
