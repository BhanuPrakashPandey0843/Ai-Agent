import { functions, db } from '../config/firebase';
import { logAuditEvent } from '../lib/auditLogger';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import { Payment } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize payment gateways
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
  : null;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  })
  : null;

/**
 * Initiate a refund (called by admin only)
 */
export const initiateRefund = functions.https.onCall(
  async (data, context): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verify user is an admin
      if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }
      if (!context.auth.token.isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'User is not an admin');
      }

      const { paymentId, refundAmount } = data;
      if (!paymentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Payment ID is required');
      }

      // Get payment document
      const paymentRef = db.collection('payments').doc(paymentId);
      const paymentSnap = await paymentRef.get();
      if (!paymentSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Payment not found');
      }
      const payment = paymentSnap.data() as Payment;
      const uid = payment.userId;

      // Check payment status
      if (payment.status !== 'completed') {
        throw new functions.https.HttpsError('failed-precondition', 'Cannot refund a non-completed payment');
      }

      if (payment.refundStatus !== 'none' && payment.refundStatus !== 'failed') {
        throw new functions.https.HttpsError('failed-precondition', 'Refund already processed or in progress');
      }

      const amountToRefund = refundAmount || payment.amount; // Default to full refund

      // Update payment status to processing
      await paymentRef.update({
        refundStatus: 'processing',
        refundAmount: amountToRefund,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Initiate refund with payment gateway
      let gatewayRefundId;
      if (payment.gateway === 'razorpay') {
        if (!razorpay) {
          throw new functions.https.HttpsError('internal', 'Razorpay not initialized');
        }
        const refund = await razorpay.payments.refund(payment.transactionId!, {
          amount: amountToRefund,
          notes: {
            paymentId,
            adminId: context.auth.uid,
          },
        });
        gatewayRefundId = refund.id;
      } else {
        if (!stripe) {
          throw new functions.https.HttpsError('internal', 'Stripe not initialized');
        }
        const refund = await stripe.refunds.create({
          payment_intent: payment.transactionId!,
          amount: amountToRefund,
          metadata: {
            paymentId,
            adminId: context.auth.uid,
          },
        });
        gatewayRefundId = refund.id;
      }

      // Log audit event
      await logAuditEvent({
        userId: uid,
        adminId: context.auth.uid,
        actor: 'admin',
        action: 'refund_initiated',
        resourceType: 'payment',
        resourceId: paymentId,
        metadata: {
          refundAmount: amountToRefund,
          gatewayRefundId,
        },
      });

      console.log('Refund initiated for payment:', paymentId);
      return { success: true };

    } catch (error) {
      console.error('Error initiating refund:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Error initiating refund');
    }
  }
);
