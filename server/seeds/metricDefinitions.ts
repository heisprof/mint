import { MetricDefinition, InsertMetricDefinition } from "@shared/schema";
import { db } from "../db";
import { metricDefinitions } from "@shared/schema";

// Default metric definitions for both MySQL and Oracle
const defaultMetrics: Omit<InsertMetricDefinition, "id" | "createdAt">[] = [
  // Performance Metrics
  {
    name: "cpu_usage",
    displayName: "CPU Usage",
    description: "Database server CPU utilization percentage",
    category: "performance",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "%"
  },
  {
    name: "memory_usage",
    displayName: "Memory Usage",
    description: "Database server memory utilization percentage",
    category: "performance", 
    applicableTo: "both",
    defaultEnabled: true,
    unit: "%"
  },
  {
    name: "query_response_time",
    displayName: "Query Response Time",
    description: "Average query execution time",
    category: "performance",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "ms"
  },
  {
    name: "slow_queries",
    displayName: "Slow Queries",
    description: "Number of queries exceeding threshold execution time",
    category: "performance",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "count"
  },
  {
    name: "active_connections",
    displayName: "Active Connections",
    description: "Current number of active database connections",
    category: "performance",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "count"
  },
  {
    name: "connection_wait_time",
    displayName: "Connection Wait Time",
    description: "Average time to establish a new connection",
    category: "performance",
    applicableTo: "both",
    defaultEnabled: false,
    unit: "ms"
  },
  {
    name: "cache_hit_ratio",
    displayName: "Cache Hit Ratio",
    description: "Percentage of requests served from cache",
    category: "performance",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "%"
  },
  {
    name: "transaction_throughput",
    displayName: "Transaction Throughput",
    description: "Number of transactions processed per second",
    category: "performance",
    applicableTo: "both",
    defaultEnabled: false,
    unit: "tps"
  },
  
  // Storage Metrics
  {
    name: "total_database_size",
    displayName: "Total Database Size",
    description: "Total size of the database on disk",
    category: "storage",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "MB"
  },
  {
    name: "tablespace_usage",
    displayName: "Tablespace Usage",
    description: "Percentage of allocated tablespace in use",
    category: "storage",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "%"
  },
  {
    name: "tablespace_growth_rate",
    displayName: "Tablespace Growth Rate",
    description: "Growth rate of tablespace over time",
    category: "storage",
    applicableTo: "both",
    defaultEnabled: false,
    unit: "MB/day"
  },
  {
    name: "index_fragmentation",
    displayName: "Index Fragmentation",
    description: "Fragmentation level of database indexes",
    category: "storage",
    applicableTo: "both",
    defaultEnabled: false,
    unit: "%"
  },
  {
    name: "temp_tablespace_usage",
    displayName: "Temporary Space Usage",
    description: "Usage of temporary tablespace",
    category: "storage",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "MB"
  },
  {
    name: "redo_log_size",
    displayName: "Redo Log Size",
    description: "Size of the redo log files",
    category: "storage",
    applicableTo: "both",
    defaultEnabled: false,
    unit: "MB"
  },
  
  // Availability Metrics
  {
    name: "uptime",
    displayName: "Uptime",
    description: "Time since the database was last started",
    category: "availability",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "hours"
  },
  {
    name: "replication_lag",
    displayName: "Replication Lag",
    description: "Time lag between master and replica databases",
    category: "availability",
    applicableTo: "both",
    defaultEnabled: false,
    unit: "seconds"
  },
  {
    name: "backup_status",
    displayName: "Backup Status",
    description: "Status of the last backup operation",
    category: "availability",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "status"
  },
  {
    name: "last_backup_time",
    displayName: "Last Backup Time",
    description: "Time since the last successful backup",
    category: "availability",
    applicableTo: "both",
    defaultEnabled: true,
    unit: "hours"
  },
  
  // MySQL-Specific Metrics
  {
    name: "innodb_buffer_pool_hit_ratio",
    displayName: "InnoDB Buffer Pool Hit Ratio",
    description: "Percentage of requests served from InnoDB buffer pool",
    category: "performance",
    applicableTo: "mysql",
    defaultEnabled: true,
    unit: "%"
  },
  {
    name: "table_locks",
    displayName: "Table Locks",
    description: "Number of tables locked by active queries",
    category: "performance",
    applicableTo: "mysql",
    defaultEnabled: false,
    unit: "count"
  },
  {
    name: "myisam_key_buffer_usage",
    displayName: "MyISAM Key Buffer Usage",
    description: "Percentage of MyISAM key buffer in use",
    category: "performance",
    applicableTo: "mysql",
    defaultEnabled: false,
    unit: "%"
  },
  {
    name: "query_cache_hit_ratio",
    displayName: "Query Cache Hit Ratio",
    description: "Percentage of queries served from query cache",
    category: "performance",
    applicableTo: "mysql",
    defaultEnabled: false,
    unit: "%"
  },
  {
    name: "binary_log_size",
    displayName: "Binary Log Size",
    description: "Size of binary logs",
    category: "storage",
    applicableTo: "mysql",
    defaultEnabled: false,
    unit: "MB"
  },
  
  // Oracle-Specific Metrics
  {
    name: "sga_usage",
    displayName: "SGA Memory Usage",
    description: "System Global Area memory usage",
    category: "performance",
    applicableTo: "oracle",
    defaultEnabled: true,
    unit: "MB"
  },
  {
    name: "pga_usage",
    displayName: "PGA Memory Usage",
    description: "Program Global Area memory usage",
    category: "performance",
    applicableTo: "oracle",
    defaultEnabled: true,
    unit: "MB"
  },
  {
    name: "asm_disk_group_usage",
    displayName: "ASM Disk Group Usage",
    description: "Automatic Storage Management disk group usage",
    category: "storage",
    applicableTo: "oracle",
    defaultEnabled: false,
    unit: "%"
  },
  {
    name: "rac_interconnect_traffic",
    displayName: "RAC Interconnect Traffic",
    description: "Real Application Clusters interconnect traffic",
    category: "performance",
    applicableTo: "oracle",
    defaultEnabled: false,
    unit: "MB/s"
  },
  {
    name: "rman_backup_status",
    displayName: "RMAN Backup Status",
    description: "Recovery Manager backup status",
    category: "availability",
    applicableTo: "oracle",
    defaultEnabled: true,
    unit: "status"
  },
  {
    name: "listener_status",
    displayName: "Listener Status",
    description: "Status of the Oracle listener",
    category: "availability",
    applicableTo: "oracle",
    defaultEnabled: true,
    unit: "status"
  },
  {
    name: "tablespace_advisor",
    displayName: "Tablespace Advisor",
    description: "Tablespace optimization recommendations",
    category: "storage",
    applicableTo: "oracle",
    defaultEnabled: false,
    unit: "text"
  }
];

export async function seedMetricDefinitions() {
  try {
    // Check if metrics already exist
    const existingMetrics = await db.select().from(metricDefinitions);
    
    if (existingMetrics.length === 0) {
      console.log("Seeding metric definitions...");
      
      for (const metric of defaultMetrics) {
        await db.insert(metricDefinitions).values(metric);
      }
      
      console.log(`Seeded ${defaultMetrics.length} metric definitions.`);
    } else {
      console.log(`Metric definitions already exist (${existingMetrics.length} records).`);
    }
  } catch (error) {
    console.error("Error seeding metric definitions:", error);
  }
}