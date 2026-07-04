import { functions, db } from '../config/firebase';
import { logAuditEvent } from '../lib/auditLogger';
import { clearSubscriptionClaims } from '../lib/customClaims';
import { FieldValue } from 'firebase-admin/firestore';

const GRACE_PERIOD_DAYS = parseInt(process.env.GRACE_PERIOD_DAYS || '3');

/**
 * Scheduled function to process daily expirations
 */
export const processDailyExpirations = functions.schedule
  .timeZone('UTC')
  .every('1 days')
  .onRun(async () => {
    try {
      console.log('Starting processDailyExpirations...');
      const now = new Date();

      // Step 1: Move expired grace period subscriptions to expired
      const gracePeriodStart = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      const gracePeriodSubscriptions = await db
        .collection('subscriptions')
        .where('status', '==', 'grace_period')
        .where('expiryDate', '<=', gracePeriodStart)
        .get();

      for (const doc of gracePeriodSubscriptions.docs) {
        const subscription = doc.data();
        const userId = subscription.userId;

        console.log('Expiring subscription:', doc.id);
        await doc.ref.update({
          status: 'expired',
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Update user document
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          'subscription.status': 'expired',
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Clear subscription claims
        await clearSubscriptionClaims(userId);

        // Log audit event
        await logAuditEvent({
          userId,
          actor: 'system',
          action: 'subscription_expired',
          resourceType: 'subscription',
          resourceId: doc.id,
        });
      }

      // Step 2: Move active subscriptions to grace period when expired
      const expiredSubscriptions = await db
        .collection('subscriptions')
        .where('status', '==', 'active')
        .where('expiryDate', '<=', now)
        .get();

      for (const doc of expiredSubscriptions.docs) {
        const subscription = doc.data();
        const userId = subscription.userId;

        console.log('Moving subscription to grace period:', doc.id);
        await doc.ref.update({
          status: 'grace_period',
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Update user document
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          'subscription.status': 'grace_period',
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Log audit event
        await logAuditEvent({
          userId,
          actor: 'system',
          action: 'subscription_entered_grace_period',
          resourceType: 'subscription',
          resourceId: doc.id,
        });
      }

      console.log('processDailyExpirations completed!');
      return null;

    } catch (error) {
      console.error('Error running processDailyExpirations:', error);
      throw error;
    }
  });
