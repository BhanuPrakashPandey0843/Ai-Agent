import { functions, db } from '../config/firebase';
import { logAuditEvent } from '../lib/auditLogger';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import {
  CreatePaymentOrderRequest,
  CreatePaymentOrderResponse,
  Payment,
  PaymentGateway,
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
const PLAN_YEARLY_INDIA_PRICE = parseInt(process.env.PLAN_YEARLY_INDIA_PRICE || '1000'); // ₹10
const PLAN_YEARLY_INTERNATIONAL_PRICE = parseInt(process.env.PLAN_YEARLY_INTERNATIONAL_PRICE || '100'); // $1

/**
 * Create a payment order
 */
export const createPaymentOrder = functions.https.onCall(
  async (data: CreatePaymentOrderRequest, context): Promise<CreatePaymentOrderResponse> => {
    try {
      // Verify user is authenticated
      if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }
      const uid = context.auth.uid;

      // Validate inputs
      const { planId, country } = data;
      if (!planId || !country) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing planId and country are required');
      }

      if (['yearly_india', 'yearly_international'].indexOf(planId) === -1) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid planId');
      }

      // Determine gateway and price
      const isIndia = country === 'IN';
      const gateway: PaymentGateway = isIndia ? 'razorpay' : 'stripe';
      let amount: number;
      let currency: 'INR' | 'USD';
      if (isIndia) {
        if (planId !== 'yearly_india') {
          throw new functions.https.HttpsError('invalid-argument', 'India users must use yearly_india plan');
        }
        amount = PLAN_YEARLY_INDIA_PRICE;
        currency = 'INR';
      } else {
        if (planId !== 'yearly_international') {
          throw new functions.https.HttpsError('invalid-argument', 'International users must use yearly_international plan');
        }
        amount = PLAN_YEARLY_INTERNATIONAL_PRICE;
        currency = 'USD';
      }

      // Verify gateway initialized
      if (gateway === 'razorpay' && !razorpay) {
        throw new functions.https.HttpsError('internal', 'Razorpay not initialized');
      }
      if (gateway === 'stripe' && !stripe) {
        throw new functions.https.HttpsError('internal', 'Stripe not initialized');
      }

      // Create payment document in Firestore
      const paymentRef = db.collection('payments').doc();
      const paymentId = paymentRef.id;

      // Create order with payment gateway
      let orderId: string;
      let gatewayParams: Record<string, unknown> = {};
      if (gateway === 'razorpay') {
        const razorpayOrder = await razorpay!.orders.create({
          amount,
          currency,
          receipt: paymentId,
          notes: {
            uid,
            planId,
          },
        });
        orderId = razorpayOrder.id;
        gatewayParams = {
          key: process.env.RAZORPAY_KEY_ID,
          orderId: razorpayOrder.id,
          amount,
          currency,
          name: 'FaithFrames',
          prefill: {
            email: context.auth.token.email || '',
            name: context.auth.token.name || '',
          },
          theme: {
            color: '#928AFD',
          },
        };
      } else {
          const stripeCustomer = await stripe!.customers.create({
            email: context.auth.token.email || '',
            name: context.auth.token.name || '',
            metadata: { uid },
          });
          const stripePaymentIntent = await stripe!.paymentIntents.create({
            amount,
            currency,
            customer: stripeCustomer.id,
            metadata: {
              uid,
              planId,
              paymentId,
            },
          });
          orderId = stripePaymentIntent.id;
          gatewayParams = {
            clientSecret: stripePaymentIntent.client_secret,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          };
      }

      // Save payment to Firestore
      const payment: Payment = {
        paymentId,
        userId: uid,
        orderId,
        gateway,
        transactionId: undefined,
        amount,
        currency,
        status: 'pending',
        gatewayResponse: undefined,
        refundStatus: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await paymentRef.set(payment);

      // Update user country on user doc if not already set
      const userRef = db.collection('users').doc(uid);
      await userRef.set(
        {
          country,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Log audit event
      await logAuditEvent({
        userId: uid,
        actor: 'user',
        action: 'payment_order_created',
        resourceType: 'payment',
        resourceId: paymentId,
        metadata: {
          planId,
          gateway,
          orderId,
        },
      });

      return {
        success: true,
        orderId,
        gateway,
        gatewayParams,
        paymentId,
      };
    } catch (error) {
      console.error('Error creating payment order:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Error creating payment order');
    }
  }
);
