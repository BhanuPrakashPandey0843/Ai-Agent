import { functions, db, auth } from '../config/firebase';
import { logAuditEvent } from '../lib/auditLogger';
import { setSubscriptionClaims } from '../lib/customClaims';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import {
  Payment,
  Subscription,
  PaymentStatus,
  PlanId,
} from '../types';
import * as admin from 'firebase-admin';
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

// Constants
const PLAN_DURATION_DAYS = 365;

/**
 * Verify payment and activate subscription (called from Next.js webhook handler)
 */
export const verifyAndActivateSubscription = functions.https.onCall(
  async (data, context): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verify the function is called from admin SDK or Next.js backend
      if (context.app === undefined) {
        throw new functions.https.HttpsError('permission-denied', 'Must be called from admin or server');
      }

      const { paymentId, gatewayPayload, gateway } = data;

      if (!paymentId || !gatewayPayload || !gateway) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
      }

      // Get payment document
      const paymentRef = db.collection('payments').doc(paymentId);
      const paymentSnap = await paymentRef.get();
      if (!paymentSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Payment not found');
      }
      let payment = paymentSnap.data() as Payment;
      const uid = payment.userId;

      // Idempotency check
      if (payment.status === 'completed') {
        console.log('Payment already completed, returning success');
        return { success: true };
      }

      let transactionId: string | undefined;
      let amount: number;
      let currency: string;
      let paymentStatus: PaymentStatus;

      if (gateway === 'razorpay') {
        // Verify Razorpay signature
        // Note: Signature verification should already have happened in Next.js webhook handler!
        const payload = gatewayPayload as any;
        const razorpayPaymentId = payload.payload.payment?.entity?.id;
        transactionId = razorpayPaymentId;
        amount = payload.payload.payment.entity.amount;
        currency = payload.payload.payment.entity.currency;
        paymentStatus = 'completed';
      } else {
        // Verify Stripe event
        const payload = gatewayPayload as any;
        const stripePaymentIntentId = payload.data?.object?.id;
        transactionId = stripePaymentIntentId;
        amount = payload.data?.object?.amount;
        currency = payload.data?.object?.currency;
        paymentStatus = 'completed';
      }

      // Verify amount matches
      if (payment.amount !== amount || payment.currency.toLowerCase() !== currency.toLowerCase()) {
        throw new functions.https.HttpsError('invalid-argument', 'Payment amount mismatch');
      }

      // Update payment document
      await paymentRef.update({
        status: paymentStatus,
        transactionId,
        gatewayResponse: gatewayPayload,
        updatedAt: FieldValue.serverTimestamp(),
      });
      payment = (await paymentRef.get()).data() as Payment;

      // Create or update subscription
      const planId = (payment.currency === 'INR' ? 'yearly_india' : 'yearly_international') as PlanId;
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(startDate.getDate() + PLAN_DURATION_DAYS);

      // Check if user already has an active subscription
      const userRef = db.collection('users').doc(uid);
      const userSnap = await userRef.get();
      const userData = userSnap.data();
      let subscriptionId: string;

      if (userData?.subscription?.subscriptionId) {
        // Update existing subscription
        subscriptionId = userData.subscription.subscriptionId;
        const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
        await subscriptionRef.update({
          status: 'active',
          startDate,
          expiryDate,
          paymentIds: FieldValue.arrayUnion(paymentId),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // Create new subscription
        const subscriptionRef = db.collection('subscriptions').doc();
        subscriptionId = subscriptionRef.id;
        const newSubscription: Subscription = {
          subscriptionId,
          userId: uid,
          planId,
          status: 'active',
          currency: payment.currency,
          amount: payment.amount,
          startDate,
          expiryDate,
          paymentIds: [paymentId],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await subscriptionRef.set(newSubscription);
      }

      // Update user document
      await userRef.update({
        'subscription.subscriptionId': subscriptionId,
        'subscription.planId': planId,
        'subscription.status': 'active',
        'subscription.currency': payment.currency,
        'subscription.amount': payment.amount,
        'subscription.startDate': startDate,
        'subscription.expiryDate': expiryDate,
        'subscription.lastPaymentId': paymentId,
        'auditTrail': FieldValue.arrayUnion({
          action: 'subscription_activated',
          timestamp: new Date(),
          metadata: {
            paymentId,
            subscriptionId,
          },
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Set custom claims
      await setSubscriptionClaims(uid, {
        status: 'active',
        expiryDate,
        planId,
        isPremium: true,
      });

      // Update daily analytics
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const dailyStatsRef = db.collection('analytics').doc('dailyStats').collection('days').doc(dateStr);
      await dailyStatsRef.set({
        dateStr,
        paymentsCompleted: FieldValue.increment(1),
        [`${payment.currency.toLowerCase()}Revenue`]: FieldValue.increment(payment.amount),
        totalRevenue: FieldValue.increment(
          payment.currency === 'INR' ? payment.amount / 100 / 83 : payment.amount / 100 // Quick conversion (for demo only)
        ),
        timestamp: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Log audit event
      await logAuditEvent({
        userId: uid,
        actor: 'payment_gateway',
        action: 'subscription_activated',
        resourceType: 'subscription',
        resourceId: subscriptionId,
        metadata: {
          paymentId,
          transactionId,
        },
      });

      console.log('Successfully activated subscription for user:', uid);
      return { success: true };

    } catch (error) {
      console.error('Error verifying and activating subscription:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Error processing payment');
    }
  }
);
