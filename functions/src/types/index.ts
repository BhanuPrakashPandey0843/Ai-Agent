// FaithFrames Premium Subscription System Type Definitions

export type SubscriptionStatus =
  | 'inactive'
  | 'active'
  | 'expired'
  | 'refunded'
  | 'suspended'
  | 'grace_period'
  | 'cancelled'
  | 'renewal_pending';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type RefundStatus = 'none' | 'requested' | 'processing' | 'completed' | 'failed';
export type PaymentGateway = 'razorpay' | 'stripe';

export type PlanId = 'yearly_india' | 'yearly_international';

export interface User {
  uid: string;
  email: string;
  name: string;
  country?: string;
  phoneNumber?: string;
  photoURL?: string;
  isSuspended: boolean;
  subscription?: {
    subscriptionId: string;
    planId: PlanId;
    status: SubscriptionStatus;
    currency: 'INR' | 'USD';
    amount: number;
    startDate: Date;
    expiryDate: Date;
    lastPaymentId: string;
  };
  auditTrail?: Array<{
    action: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  subscriptionId: string;
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currency: 'INR' | 'USD';
  amount: number;
  startDate: Date;
  expiryDate: Date;
  paymentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  paymentId: string;
  userId: string;
  subscriptionId?: string;
  orderId: string;
  gateway: PaymentGateway;
  transactionId?: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: PaymentStatus;
  gatewayResponse?: Record<string, unknown>;
  refundStatus: RefundStatus;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  logId: string;
  userId?: string;
  adminId?: string;
  actor: 'user' | 'admin' | 'system' | 'payment_gateway';
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface DailyStats {
  dateStr: string;
  totalRevenue: number;
  inrRevenue: number;
  usdRevenue: number;
  totalUsers: number;
  activeSubscriptions: number;
  newUsers: number;
  paymentsCompleted: number;
  paymentsFailed: number;
  refundsIssued: number;
  churnRate?: number;
  retentionDay7?: number;
  retentionDay30?: number;
  timestamp: Date;
}

export interface SystemSettings {
  plans: Array<{
    planId: PlanId;
    name: string;
    priceINR: number; // in paise
    priceUSD: number; // in cents
    durationDays: number;
    features: string[];
  }>;
  razorpayKeyId?: string;
  stripePublishableKey?: string;
  maintenanceMode: boolean;
  gracePeriodDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionClaims {
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry: number; // milliseconds since epoch
  planId: PlanId;
  isPremium: boolean;
}

export interface AdminClaims {
  isAdmin: boolean;
  role: 'admin' | 'super_admin' | 'support';
  permissions: Record<string, boolean>;
}

export interface CreatePaymentOrderRequest {
  planId: PlanId;
  country: string;
}

export interface CreatePaymentOrderResponse {
  success: boolean;
  orderId?: string;
  gateway: PaymentGateway;
  gatewayParams?: Record<string, unknown>;
  paymentId: string;
  error?: string;
}

export interface VerifyPaymentRequest {
  paymentId: string;
  gatewayPayload: Record<string, unknown>;
}
