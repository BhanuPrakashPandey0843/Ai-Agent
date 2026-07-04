import { db } from '../config/firebase';
import { AuditLog } from '../types';
import * as admin from 'firebase-admin';

/**
 * Log an audit event to Firestore
 */
export async function logAuditEvent(params: {
  userId?: string;
  adminId?: string;
  actor: AuditLog['actor'];
  action: AuditLog['action'];
  resourceType: AuditLog['resourceType'];
  resourceId: AuditLog['resourceId'];
  metadata?: AuditLog['metadata'];
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const logRef = db.collection('auditLogs').doc();
    const auditLog: AuditLog = {
      logId: logRef.id,
      userId: params.userId,
      adminId: params.adminId,
      actor: params.actor,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: new Date(),
    };
    await logRef.set(auditLog);
    console.log('Audit log created:', auditLog.logId);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't fail the main function because of audit log failure
  }
}
