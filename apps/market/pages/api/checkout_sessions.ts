import { NextApiRequest, NextApiResponse } from 'next'
import { formatAmountForStripe } from '../../utils/stripe-helpers'
import { readOnlyClient as sanity } from 'sanity-client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

const singleBookQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    "coverImageUrl": cover.asset->url,
    price_usd,
  }[0]
`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const bookId: string = req.body.briet_item_id
    const book = await sanity.fetch(singleBookQuery, { id: bookId });
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: formatAmountForStripe(book.price_usd, 'usd'),
              product_data: {
                name: book.title,
                description: 'copies for controlled digital lending by your institution, each copy to one patron at a time',
                images: [book.coverImageUrl],
              }
            },
            quantity: 1,
            adjustable_quantity: {
              enabled: true,
              minimum: 1
            }
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/?success=true`, // TODO: download
        // TODO: is there a pending_url?
        cancel_url: `${req.headers.origin}/?canceled=true`,
        custom_text: {
          submit: {
            message: 'We will email you within 24 hours with your file. Contact help@briet.app with any questions.',
          }
        }
      });
      res.redirect(303, session.url);
    } catch (err) {
      res.status(err.statusCode || 500).json(err.message);
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
