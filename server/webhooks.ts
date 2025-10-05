import crypto from 'crypto';

export function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
}

export function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    stripe.webhooks.constructEvent(body, signature, secret);
    return true;
  } catch (error) {
    return false;
  }
}
