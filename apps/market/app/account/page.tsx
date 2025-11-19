import { auth } from '@clerk/nextjs/server';

export default async function OrderHistoryPage() {
  const { userId } = auth();
  if (!userId) return <p>You must be signed in to view this page.</p>;

  return (
    <div>
      <h1>Order History Not Yet Implemented</h1>
    </div>
  );
}