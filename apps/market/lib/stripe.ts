import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function getOrdersForEmail(email: string) {
  const customers = await stripe.customers.list({ email });
  if (customers.data.length === 0) return [];

  const customerId = customers.data[0].id;
  const charges = await stripe.charges.list({ customer: customerId });

  return charges.data;
}
