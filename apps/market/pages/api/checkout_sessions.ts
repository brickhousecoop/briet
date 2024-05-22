import { NextApiRequest, NextApiResponse } from 'next'
import { formatAmountForStripe } from '../../utils/stripe-helpers'
import { readOnlyClient as sanity } from 'sanity-client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const singleBookQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    "publisher_name": publisher->{ name },
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
        mode: 'payment',
        success_url: `${req.headers.origin}/order/{CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/order/{CHECKOUT_SESSION_ID}`,
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
        metadata: {
          briet_payout_to: book.publisher_name
        },
        customer_creation: 'always',
        consent_collection: {
          terms_of_service: 'required',
        },
        custom_text: {
          submit: {
            message: 'We will email you within 24 hours with your file. Contact help@briet.app with any questions.',
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
      res.status(err.statusCode || 500).json(err.message);
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
