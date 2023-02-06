import { NextApiRequest, NextApiResponse } from 'next'
import { formatAmountForStripe } from '../../utils/stripe-helpers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

const CONFIG = {
  MIN_AMOUNT: 0.00,
  MAX_AMOUNT: 1000,
  CURRENCY: 'usd'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const bookTitle: string = req.body.bookTitle
    const bookPrice: number = req.body.bookPrice
    const { MIN_AMOUNT, MAX_AMOUNT } = CONFIG
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // TODO: pass actual book
            name: `Digital book for CDL: ${bookTitle}`,
            amount: formatAmountForStripe(bookPrice, CONFIG.CURRENCY),
            currency: CONFIG.CURRENCY,
            quantity: 1,
            adjustable_quantity: {
              enabled: true,
              minimum: 1
            }
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/?success=true`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
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
