// Run this script to add a sample premium user to Firestore for testing!
// Note: Make sure you have Firebase Admin SDK configured!
const admin = require('firebase-admin');
const serviceAccount = null; // Replace with your service account key file path OR use environment variables!

// Try to initialize from environment variables first!
try {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJson))
    });
    console.log('✅ Firebase Admin initialized from environment variables!');
  } else if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized from service account file!');
  } else {
    console.error('❌ No Firebase service account configured!');
    process.exit(1);
  }
} catch (e) {
  console.error('❌ Error initializing Firebase Admin:', e.message);
  process.exit(1);
}

const db = admin.firestore();

// Sample user data
const sampleUserId = 'test-premium-user-123'; // You can use your own user ID here!
const sampleUser = {
  name: 'John Premium',
  email: 'john.premium@example.com',
  country: 'US',
  isPremium: true,
  subscription: {
    subscriptionId: 'sub-test-123',
    planId: 'yearly_international',
    status: 'active',
    currency: 'USD',
    amount: 100, // in cents
    startDate: admin.firestore.Timestamp.fromDate(new Date()),
    expiryDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year from now
    lastPaymentId: 'pay-test-456'
  },
  lastScore: 250,
  createdAt: admin.firestore.Timestamp.fromDate(new Date()),
  updatedAt: admin.firestore.Timestamp.fromDate(new Date())
};

// Add sample user to Firestore!
async function addSampleUser() {
  try {
    console.log('🟢 Adding sample premium user to Firestore...');
    await db.collection('users').doc(sampleUserId).set(sampleUser);
    console.log('✅ Added sample user document');
    
    // Also add a corresponding subscription document!
    const subscriptionData = {
      subscriptionId: sampleUser.subscription.subscriptionId,
      userId: sampleUserId,
      ...sampleUser.subscription,
      paymentIds: ['pay-test-456'],
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date())
    };
    await db.collection('subscriptions').doc(sampleUser.subscription.subscriptionId).set(subscriptionData);
    console.log('✅ Added subscription document');
    
    // Add a payment document too!
    const paymentData = {
      paymentId: 'pay-test-456',
      userId: sampleUserId,
      subscriptionId: sampleUser.subscription.subscriptionId,
      orderId: 'order-test-789',
      gateway: 'stripe',
      transactionId: 'tx-test-000',
      amount: 100,
      currency: 'USD',
      status: 'completed',
      refundStatus: 'none',
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date())
    };
    await db.collection('payments').doc('pay-test-456').set(paymentData);
    console.log('✅ Added payment document');
    
    // Also set custom claims on the user! (If you have a real user ID!)
    if (sampleUserId !== 'test-premium-user-123') {
      await admin.auth().setCustomUserClaims(sampleUserId, {
        subscriptionStatus: 'active',
        subscriptionExpiry: sampleUser.subscription.expiryDate.toDate().getTime(),
        planId: sampleUser.subscription.planId,
        isPremium: true
      });
      console.log('✅ Set custom user claims!');
    }
    
    console.log('🎉 All done! Now you can see this user in the admin panel!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample premium user:', error);
    process.exit(1);
  }
}

addSampleUser();
