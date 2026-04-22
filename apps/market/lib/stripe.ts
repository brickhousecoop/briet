import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export { stripe };

// An order counts as "available for download" when (a) the customer has paid
// and (b) an admin has explicitly set briet_approved=true on the Stripe
// Checkout Session metadata. Approval is manual so the BRIET team can vet
// each buyer's CDL readiness before turning on downloads.
export function isOrderApproved(session: Stripe.Checkout.Session): boolean {
  return (
    session.payment_status === 'paid' &&
    session.metadata?.briet_approved === 'true'
  );
}

type MetadataKey =
  | 'briet_clerk_org_id'
  | 'briet_clerk_user_id'
  | 'briet_book_id';

async function searchPaymentIntents(
  key: MetadataKey,
  value: string
): Promise<Stripe.PaymentIntent[]> {
  const query = `metadata["${key}"]:"${value.replace(/"/g, '\\"')}"`;
  const out: Stripe.PaymentIntent[] = [];
  let page: string | undefined = undefined;
  let hasMore = true;
  while (hasMore) {
    const res: Stripe.ApiSearchResult<Stripe.PaymentIntent> = await stripe.paymentIntents.search({
      query,
      limit: 100,
      ...(page ? { page } : {}),
    });
    out.push(...res.data);
    hasMore = Boolean(res.has_more && res.next_page);
    page = res.next_page ?? undefined;
  }
  return out;
}

async function sessionsForPaymentIntents(
  intents: Stripe.PaymentIntent[]
): Promise<Stripe.Checkout.Session[]> {
  const results = await Promise.all(
    intents.map(async pi => {
      const list = await stripe.checkout.sessions.list({
        payment_intent: pi.id,
        limit: 1,
      });
      return list.data[0] ?? null;
    })
  );
  return results.filter((s): s is Stripe.Checkout.Session => s !== null);
}

async function sessionsByMetadata(key: MetadataKey, value: string): Promise<Stripe.Checkout.Session[]> {
  const intents = await searchPaymentIntents(key, value);
  return sessionsForPaymentIntents(intents);
}

export async function getOrdersForOrg(orgId: string): Promise<Stripe.Checkout.Session[]> {
  return sessionsByMetadata('briet_clerk_org_id', orgId);
}

export async function getOrdersForUser(userId: string): Promise<Stripe.Checkout.Session[]> {
  return sessionsByMetadata('briet_clerk_user_id', userId);
}

export async function findApprovedOrderForBook({
  orgId,
  userId,
  bookId,
}: {
  orgId?: string | null;
  userId?: string | null;
  bookId: string;
}): Promise<Stripe.Checkout.Session | null> {
  const sessions: Stripe.Checkout.Session[] = [];
  if (orgId) sessions.push(...(await getOrdersForOrg(orgId)));
  if (userId) sessions.push(...(await getOrdersForUser(userId)));
  return (
    sessions.find(
      s => s.metadata?.briet_book_id === bookId && isOrderApproved(s)
    ) ?? null
  );
}

// Legacy lookup: for orders placed before Clerk was integrated, fall back to
// matching by the primary email on the Stripe Customer.
export async function getOrdersForEmail(email: string): Promise<Stripe.Checkout.Session[]> {
  const customers = await stripe.customers.list({ email, limit: 100 });
  if (customers.data.length === 0) return [];
  const sessions: Stripe.Checkout.Session[] = [];
  for (const customer of customers.data) {
    const list = await stripe.checkout.sessions.list({ customer: customer.id, limit: 100 });
    sessions.push(...list.data);
  }
  return sessions;
}
