import { db } from "../db";
import { users, teams } from "@shared/schema";
import { log } from "../vite";
import { hashPassword } from "../auth";

export async function seedUsers(): Promise<void> {
  // First check if we need to seed teams
  const existingTeams = await db.select().from(teams);
  
  if (existingTeams.length === 0) {
    // Seed initial teams
    const teamData = [
      { name: "Database Administrators", description: "Team responsible for database administration" },
      { name: "Systems Operations", description: "Team responsible for system operations" },
      { name: "Development Team", description: "Application development team" },
      { name: "Support", description: "Technical support team" },
      { name: "Security", description: "Security monitoring team" }
    ];
    
    await db.insert(teams).values(teamData);
    log(`Seeded ${teamData.length} teams`);
  }

  // Check if admin user already exists
  const adminUser = await db.select().from(users).where(eq(users.username, "admin"));
  
  if (adminUser.length > 0) {
    log("Admin user already exists, skipping seed");
    return;
  }
  
  // Get the first team ID for the admin
  const firstTeam = await db.select().from(teams).limit(1);
  const teamId = firstTeam.length > 0 ? firstTeam[0].id : null;
  
  // Create admin user with pre-hashed password
  const hashedPassword = await hashPassword("admin123");
  
  await db.insert(users).values({
    username: "admin",
    password: hashedPassword,
    email: "admin@mint.local",
    fullName: "Administrator",
    role: "admin",
    status: "approved",
    teamId: teamId
  });
  
  log("Created admin user (username: admin, password: admin123)");
}