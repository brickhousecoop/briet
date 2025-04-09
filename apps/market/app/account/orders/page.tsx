import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrdersForEmail } from '@lib/stripe';

export default async function OrderHistoryPage() {
  const { userId } = await auth();
  if (!userId) return <p>You must be signed in to view this page.</p>;

  const user = await currentUser();
  const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
  if (!email) return <p>Unable to determine your primary email address.</p>;

  const orders = await getOrdersForEmail(email);

  return (
    <div>
      <h1>Order History</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul>
          {orders.map(order => (
            <li key={order.id}>
              <p>Order ID: {order.id}</p>
              <p>Amount: {order.amount / 100} {order.currency.toUpperCase()}</p>
              <p>Date: {new Date(order.created * 1000).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}