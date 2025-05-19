import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import { 
  insertUserSchema, 
  insertGroupSchema, 
  insertGroupMembershipSchema,
  insertDatabaseSchema,
  insertThresholdSchema,
  insertFileSystemSchema,
  insertEmailTemplateSchema,
  insertItsdIntegrationSchema,
  insertMetricDefinitionSchema,
  insertMonitoringTemplateSchema,
  insertTemplateMetricSchema,
  insertDatabaseMetricSchema
} from "@shared/schema";
import { oracleMonitor } from "./services/oracleMonitor";
import { filesystemMonitor } from "./services/filesystemMonitor";
import { emailService } from "./services/emailService";
import { itsdService } from "./services/itsdService";

function handleError(res: Response, error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: fromZodError(error).message
    });
  }
  
  if (error instanceof Error) {
    return res.status(500).json({ message: error.message });
  }
  
  return res.status(500).json({ message: 'An unexpected error occurred' });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Check authentication middleware for protected endpoints
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };
  
  // Check admin role middleware
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }
    next();
  };
  // User routes
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Group routes
  app.get('/api/groups', async (req: Request, res: Response) => {
    try {
      const groups = await storage.listGroups();
      res.json(groups);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get('/api/groups/:id', async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      res.json(group);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/groups', async (req: Request, res: Response) => {
    try {
      const groupData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Group membership routes
  app.post('/api/groups/:groupId/members', async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const membership = await storage.addUserToGroup({ 
        userId: parseInt(userId), 
        groupId 
      });
      
      res.status(201).json(membership);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.delete('/api/groups/:groupId/members/:userId', async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const userId = parseInt(req.params.userId);
      
      await storage.removeUserFromGroup(userId, groupId);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Database routes
  app.get('/api/databases', async (req: Request, res: Response) => {
    try {
      const databases = await storage.listDatabases();
      res.json(databases);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get('/api/databases/:id', async (req: Request, res: Response) => {
    try {
      const databaseId = parseInt(req.params.id);
      const database = await storage.getDatabase(databaseId);
      
      if (!database) {
        return res.status(404).json({ message: 'Database not found' });
      }
      
      res.json(database);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/databases', async (req: Request, res: Response) => {
    try {
      const databaseData = insertDatabaseSchema.parse(req.body);
      const database = await storage.createDatabase(databaseData);
      res.status(201).json(database);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.put('/api/databases/:id', async (req: Request, res: Response) => {
    try {
      const databaseId = parseInt(req.params.id);
      const databaseData = insertDatabaseSchema.partial().parse(req.body);
      
      const database = await storage.updateDatabase(databaseId, databaseData);
      
      if (!database) {
        return res.status(404).json({ message: 'Database not found' });
      }
      
      res.json(database);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/databases/:id/check', async (req: Request, res: Response) => {
    try {
      const databaseId = parseInt(req.params.id);
      const database = await storage.getDatabase(databaseId);
      
      if (!database) {
        return res.status(404).json({ message: 'Database not found' });
      }
      
      const metrics = await oracleMonitor.checkDatabase(database);
      res.json({ metrics });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Threshold routes
  app.get('/api/thresholds', async (req: Request, res: Response) => {
    try {
      const thresholds = await storage.listThresholds();
      res.json(thresholds);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get('/api/databases/:id/thresholds', async (req: Request, res: Response) => {
    try {
      const databaseId = parseInt(req.params.id);
      const thresholds = await storage.getThresholdsForDatabase(databaseId);
      res.json(thresholds);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/thresholds', async (req: Request, res: Response) => {
    try {
      const thresholdData = insertThresholdSchema.parse(req.body);
      const threshold = await storage.createThreshold(thresholdData);
      res.status(201).json(threshold);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.put('/api/thresholds/:id', async (req: Request, res: Response) => {
    try {
      const thresholdId = parseInt(req.params.id);
      const thresholdData = insertThresholdSchema.partial().parse(req.body);
      
      const threshold = await storage.updateThreshold(thresholdId, thresholdData);
      
      if (!threshold) {
        return res.status(404).json({ message: 'Threshold not found' });
      }
      
      res.json(threshold);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Filesystem routes
  app.get('/api/filesystems', async (req: Request, res: Response) => {
    try {
      const filesystems = await storage.listFileSystems();
      res.json(filesystems);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get('/api/databases/:id/filesystems', async (req: Request, res: Response) => {
    try {
      const databaseId = parseInt(req.params.id);
      const filesystems = await storage.getFileSystemsForDatabase(databaseId);
      res.json(filesystems);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/filesystems', async (req: Request, res: Response) => {
    try {
      const filesystemData = insertFileSystemSchema.parse(req.body);
      const filesystem = await storage.createFileSystem(filesystemData);
      res.status(201).json(filesystem);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/filesystems/:id/check', async (req: Request, res: Response) => {
    try {
      const filesystemId = parseInt(req.params.id);
      const filesystem = await storage.getFileSystem(filesystemId);
      
      if (!filesystem) {
        return res.status(404).json({ message: 'Filesystem not found' });
      }
      
      const metrics = await filesystemMonitor.checkFileSystem(filesystem);
      res.json({ metrics });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Alert routes
  app.get('/api/alerts', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const alerts = await storage.listAlerts(limit);
      res.json(alerts);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get('/api/alerts/active', async (req: Request, res: Response) => {
    try {
      const alerts = await storage.listActiveAlerts();
      res.json(alerts);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/alerts/:id/acknowledge', async (req: Request, res: Response) => {
    try {
      const alertId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const alert = await storage.acknowledgeAlert(alertId, parseInt(userId));
      
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      res.json(alert);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Email template routes
  app.get('/api/email-templates', async (req: Request, res: Response) => {
    try {
      const templates = await storage.listEmailTemplates();
      res.json(templates);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/email-templates', async (req: Request, res: Response) => {
    try {
      const templateData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // ITSD integration routes
  app.get('/api/itsd-integration', async (req: Request, res: Response) => {
    try {
      const integration = await storage.getItsdIntegration();
      res.json(integration || {});
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/itsd-integration', async (req: Request, res: Response) => {
    try {
      const integrationData = insertItsdIntegrationSchema.parse(req.body);
      const integration = await storage.updateItsdIntegration(integrationData);
      res.status(200).json(integration);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Settings routes
  app.get('/api/settings/:key', async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      
      res.json(setting);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/settings/:key', async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({ message: 'Value is required' });
      }
      
      const setting = await storage.updateSetting(key, value);
      res.json(setting);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Monitor all databases (for testing)
  app.post('/api/monitor-all', async (req: Request, res: Response) => {
    try {
      // Start monitoring in the background
      oracleMonitor.monitorAllDatabases().catch(error => {
        console.error('Error monitoring databases:', error);
      });
      
      filesystemMonitor.monitorAllFilesystems().catch(error => {
        console.error('Error monitoring filesystems:', error);
      });
      
      res.json({ message: 'Monitoring started in the background' });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Metric definition routes
  app.get('/api/metric-definitions', async (req: Request, res: Response) => {
    try {
      const metrics = await storage.listMetricDefinitions();
      res.json(metrics);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get('/api/metric-definitions/:id', async (req: Request, res: Response) => {
    try {
      const metricId = parseInt(req.params.id);
      const metric = await storage.getMetricDefinition(metricId);
      
      if (!metric) {
        return res.status(404).json({ message: 'Metric definition not found' });
      }
      
      res.json(metric);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/metric-definitions', async (req: Request, res: Response) => {
    try {
      const metricData = insertMetricDefinitionSchema.parse(req.body);
      const metric = await storage.createMetricDefinition(metricData);
      res.status(201).json(metric);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Monitoring template routes
  app.get('/api/monitoring-templates', async (req: Request, res: Response) => {
    try {
      const templates = await storage.listMonitoringTemplates();
      res.json(templates);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.get('/api/monitoring-templates/:id', async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getMonitoringTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: 'Monitoring template not found' });
      }
      
      // Get metrics associated with this template
      const templateMetrics = await storage.getTemplateMetrics(templateId);
      
      res.json({
        ...template,
        metrics: templateMetrics
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/monitoring-templates', async (req: Request, res: Response) => {
    try {
      const { metricIds, ...templateData } = req.body;
      const parsedData = insertMonitoringTemplateSchema.parse(templateData);
      
      // Create the template
      const template = await storage.createMonitoringTemplate(parsedData);
      
      // Associate metrics with the template
      if (metricIds && Array.isArray(metricIds)) {
        for (const metricId of metricIds) {
          await storage.addMetricToTemplate({
            templateId: template.id,
            metricId
          });
        }
      }
      
      res.status(201).json(template);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Database metrics routes
  app.get('/api/databases/:id/metrics', async (req: Request, res: Response) => {
    try {
      const databaseId = parseInt(req.params.id);
      const metrics = await storage.getDatabaseMetrics(databaseId);
      res.json(metrics);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post('/api/databases/:id/metrics', async (req: Request, res: Response) => {
    try {
      const databaseId = parseInt(req.params.id);
      const { metrics } = req.body;
      
      if (!metrics || !Array.isArray(metrics)) {
        return res.status(400).json({ message: 'Invalid metrics data' });
      }
      
      // Get existing metrics for this database
      const existingMetrics = await storage.getDatabaseMetrics(databaseId);
      
      // Process each metric
      for (const metric of metrics) {
        const { metricId, enabled, customQuery, collectInterval } = metric;
        
        const existing = existingMetrics.find(m => m.metricId === metricId);
        
        if (existing) {
          // Update existing metric
          await storage.updateDatabaseMetric(existing.id, {
            enabled,
            customQuery,
            collectInterval
          });
        } else {
          // Create new metric
          await storage.createDatabaseMetric({
            databaseId,
            metricId,
            enabled,
            customQuery,
            collectInterval
          });
        }
      }
      
      // Get updated metrics
      const updatedMetrics = await storage.getDatabaseMetrics(databaseId);
      res.json(updatedMetrics);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Apply monitoring template to databases
  app.post('/api/apply-template', async (req: Request, res: Response) => {
    try {
      const { templateId, databaseIds } = req.body;
      
      if (!templateId || !databaseIds || !Array.isArray(databaseIds)) {
        return res.status(400).json({ message: 'Invalid request data' });
      }
      
      // Get template metrics
      const templateMetrics = await storage.getTemplateMetrics(parseInt(templateId));
      
      if (templateMetrics.length === 0) {
        return res.status(404).json({ message: 'No metrics found for this template' });
      }
      
      // Apply template to each database
      for (const databaseId of databaseIds) {
        // Get existing metrics for this database
        const existingMetrics = await storage.getDatabaseMetrics(databaseId);
        
        // Process each metric from the template
        for (const templateMetric of templateMetrics) {
          const existing = existingMetrics.find(m => m.metricId === templateMetric.metricId);
          
          if (existing) {
            // Update existing metric
            await storage.updateDatabaseMetric(existing.id, {
              enabled: true
            });
          } else {
            // Create new metric
            await storage.createDatabaseMetric({
              databaseId,
              metricId: templateMetric.metricId,
              enabled: true
            });
          }
        }
      }
      
      res.json({ success: true, message: 'Template applied successfully' });
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
