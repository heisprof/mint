import nodemailer from 'nodemailer';
import { storage } from '../storage';
import { Alert, Database, FileSystem, EmailTemplate } from '@shared/schema';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  
  constructor() {
    this.initTransporter();
  }
  
  private async initTransporter() {
    const host = await storage.getSetting('email_host');
    const port = await storage.getSetting('email_port');
    const user = await storage.getSetting('email_user');
    const pass = await storage.getSetting('email_password');
    const fromAddress = await storage.getSetting('email_from');
    
    if (!host?.value || !port?.value || !user?.value || !pass?.value) {
      console.warn('Email settings not configured completely, email service disabled');
      return;
    }
    
    this.transporter = nodemailer.createTransport({
      host: host.value,
      port: parseInt(port.value),
      secure: port.value === '465',
      auth: {
        user: user.value,
        pass: pass.value,
      },
    });
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      await this.initTransporter();
      if (!this.transporter) {
        console.error('Email service not configured properly');
        return false;
      }
    }
    
    const fromAddress = await storage.getSetting('email_from');
    
    try {
      await this.transporter.sendMail({
        from: fromAddress?.value || '"OracleWatch" <noreply@example.com>',
        ...options
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
  
  async sendAlertEmail(alert: Alert, database?: Database, fileSystem?: FileSystem): Promise<boolean> {
    try {
      // Get recipients
      const recipientsSetting = await storage.getSetting('alert_recipients');
      if (!recipientsSetting?.value) {
        console.warn('No alert recipients configured');
        return false;
      }
      
      // Get the alert template
      let template: EmailTemplate | undefined;
      if (alert.severity === 'critical') {
        template = await storage.getEmailTemplateByName('critical_alert');
      } else {
        template = await storage.getEmailTemplateByName('warning_alert');
      }
      
      if (!template) {
        console.warn(`Email template not found for ${alert.severity} alert`);
        return false;
      }
      
      // Build the email content
      const dbName = database ? database.name : 'Unknown Database';
      const subject = template.subject.replace('{database}', dbName).replace('{metric}', alert.metricName);
      
      let html = template.body
        .replace('{database}', dbName)
        .replace('{metric}', alert.metricName)
        .replace('{value}', String(alert.metricValue || 'N/A'))
        .replace('{message}', alert.message)
        .replace('{time}', new Date(alert.createdAt || Date.now()).toLocaleString())
        .replace('{severity}', alert.severity.toUpperCase());
      
      if (fileSystem) {
        html = html.replace('{filesystem}', fileSystem.path);
      }
      
      if (alert.ticketId) {
        html = html.replace('{ticket_id}', alert.ticketId);
      } else {
        html = html.replace('{ticket_id}', 'No ticket created yet');
      }
      
      // Send the email
      return this.sendEmail({
        to: recipientsSetting.value,
        subject,
        html
      });
    } catch (error) {
      console.error('Error preparing alert email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
