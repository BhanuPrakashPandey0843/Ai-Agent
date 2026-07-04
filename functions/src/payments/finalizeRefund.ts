import { functions, db } from '../config/firebase';
import { logAuditEvent } from '../lib/auditLogger';
import { clearSubscriptionClaims } from '../lib/customClaims';
import { Payment } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Finalize a refund (called from Next.js webhook handler)
 */
export const finalizeRefund = functions.https.onCall(
  async (data, context): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verify the function is called from admin SDK or Next.js backend
      if (context.app === undefined) {
        throw new functions.https.HttpsError('permission-denied', 'Must be called from admin or server');
      }

      const { paymentId, gatewayPayload } = data;
      if (!paymentId || !gatewayPayload) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
      }

      // Get payment document
      const paymentRef = db.collection('payments').doc(paymentId);
      const paymentSnap = await paymentRef.get();
      if (!paymentSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Payment not found');
      }
      const payment = paymentSnap.data() as Payment;
      const uid = payment.userId;

      // Update payment document
      await paymentRef.update({
        status: 'refunded',
        refundStatus: 'completed',
        gatewayResponse: FieldValue.arrayUnion(gatewayPayload),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update user document
      const userRef = db.collection('users').doc(uid);
      await userRef.update({
        'subscription.status': 'refunded',
        'auditTrail': FieldValue.arrayUnion({
          action: 'subscription_refunded',
          timestamp: new Date(),
          metadata: { paymentId },
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update subscription document
      const userSnap = await userRef.get();
      const userData = userSnap.data();
      if (userData?.subscription?.subscriptionId) {
        const subscriptionRef = db.collection('subscriptions').doc(userData.subscription.subscriptionId);
        await subscriptionRef.update({
          status: 'refunded',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Revoke access by clearing subscription claims
      await clearSubscriptionClaims(uid);

      // Update analytics
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const dailyStatsRef = db.collection('analytics').doc('dailyStats').collection('days').doc(dateStr);
      await dailyStatsRef.set({
        refundsIssued: FieldValue.increment(1),
        timestamp: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Log audit event
      await logAuditEvent({
        userId: uid,
        actor: 'payment_gateway',
        action: 'refund_completed',
        resourceType: 'payment',
        resourceId: paymentId,
      });

      console.log('Successfully finalized refund for payment:', paymentId);
      return { success: true };

    } catch (error) {
      console.error('Error finalizing refund:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Error finalizing refund');
    }
  }
);
