import { db } from "../db";
import { teams } from "@shared/schema";
import { log } from "../vite";

export async function seedTeams(): Promise<void> {
  // Check if teams already exist
  const existingTeams = await db.select().from(teams);
  
  if (existingTeams.length > 0) {
    log("Teams already exist, skipping seed");
    return;
  }
  
  // Seed initial teams
  const seedData = [
    { name: "Database Administrators", description: "Team responsible for database administration" },
    { name: "Systems Operations", description: "Team responsible for system operations" },
    { name: "Development Team", description: "Application development team" },
    { name: "Support", description: "Technical support team" },
    { name: "Security", description: "Security monitoring team" }
  ];
  
  await db.insert(teams).values(seedData);
  log(`Seeded ${seedData.length} teams`);
}