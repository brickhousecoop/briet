import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import sanity, { createSanityClient } from '@repo/sanity-client'
import { formatAmountForStripe, getStripeServerClient } from '../../utils/stripe-helpers'

// Deps are injected in tests so the money path runs against a fake Content Lake
// (via a real @sanity/client) and a param-capturing Stripe stand-in. Production
// callers pass only (req, res), so the `??` fallbacks select the module singleton
// and the env-configured Stripe.
type Deps = { sanity?: ReturnType<typeof createSanityClient>; stripe?: InstanceType<typeof Stripe> }

const singleBookQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    "publisher_name": publisher->name,
    "coverImageUrl": cover.asset->url,
    price_usd,
  }[0]
`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  deps: Deps = {}
) {
  if (req.method === 'POST') {
    // Anyone can POST here with any Origin they like, and Stripe sends the buyer
    // wherever these URLs point once the card clears. Reading them from the
    // request would let a caller land a paying customer on a site they control,
    // holding a session id that redeems this order's code.
    const siteUrl = process.env.SITE_URL
    if (!siteUrl) {
      throw new Error('Missing SITE_URL')
    }

    const stripe = deps.stripe ?? getStripeServerClient()
    const bookId: string = req.body.briet_item_id
    const book = await (deps.sanity ?? sanity).fetch(singleBookQuery, { id: bookId });
    if (!book) {
      res.status(404).json({ error: 'not_found' })
      return
    }
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${siteUrl}/order/{CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/buy/${bookId}`,
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
              minimum: 1,
            },
          },
        ],
        // The order page reads briet_item_id back to mint the redemption code.
        metadata: {
          briet_item_id: bookId,
        },
        payment_intent_data: {
          metadata: {
            briet_payout_to: book.publisher_name,
          },
        },
        customer_creation: 'always',
        consent_collection: {
          terms_of_service: 'required',
        },
        custom_text: {
          submit: {
            message: 'Once your payment clears, the next page shows a redemption code. Enter it in your Lenny library to import this book. Contact help@briet.app with any questions.',
          },
          terms_of_service_acceptance: {
            message: `Briet hereby sells authorized digital copies (“ADC”) of the eBooks [Listed in Schedule 1] to [Name of Library] (“Library”). The sale transfers title in the ADC to Library. Briet intends this sale to provide Library with rights to use the ADC that are substantially equivalent to the rights Library would have in a physical print copy (e.g., a paperback or hard cover book) of the applicable literary work purchased by Library under the first sale doctrine, codified at 17 U.S.C. § 109. ¶ Briet understands that certain incidental copies may be made in the process of effectuating these rights, including without limitation, lending to one reader at a time per ADC, transferring the ADC from one hosting provider or device to another, updating the format of the ADC to interoperate with the storage or reading device of Library’s choice, or performing any other activity that would fall within Sections 107-121 of the US Copyright Act. For the avoidance of doubt, Briet intends the sale to include the right to resell the ADC. ¶ More at market.briet.app/terms-of-sale`
          },
        }
      });
      if (session.url === null) {
        throw Error('Null checkout session URL')
      }
      res.redirect(303, session.url);
    } catch (err) {
      const e = err as { statusCode?: number; message?: string }
      res.status(e.statusCode || 500).json(e.message);
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
