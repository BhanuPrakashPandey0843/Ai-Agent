import { auth } from '../config/firebase';
import { SubscriptionClaims, AdminClaims, SubscriptionStatus, PlanId } from '../types';

/**
 * Set subscription custom claims on a user
 */
export async function setSubscriptionClaims(
  uid: string,
  params: {
    status: SubscriptionStatus;
    expiryDate: Date;
    planId: PlanId;
    isPremium: boolean;
  }
): Promise<void> {
  const claims: SubscriptionClaims = {
    subscriptionStatus: params.status,
    subscriptionExpiry: params.expiryDate.getTime(),
    planId: params.planId,
    isPremium: params.isPremium,
  };
  await auth.setCustomUserClaims(uid, claims);
  console.log('Set subscription claims for user:', uid, claims);
}

/**
 * Clear subscription custom claims on a user
 */
export async function clearSubscriptionClaims(uid: string): Promise<void> {
  await auth.setCustomUserClaims(uid, {
    subscriptionStatus: 'inactive',
    subscriptionExpiry: 0,
    planId: null,
    isPremium: false,
  });
  console.log('Cleared subscription claims for user:', uid);
}

/**
 * Set admin custom claims on a user
 */
export async function setAdminClaims(
  uid: string,
  params: {
    isAdmin: boolean;
    role: AdminClaims['role'];
    permissions: Record<string, boolean>;
  }
): Promise<void> {
  const claims: AdminClaims = {
    isAdmin: params.isAdmin,
    role: params.role,
    permissions: params.permissions,
  };
  await auth.setCustomUserClaims(uid, claims);
  console.log('Set admin claims for user:', uid);
}
