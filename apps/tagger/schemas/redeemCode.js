import { defineType, defineField } from 'sanity'

// A one-time code a library enters in Lenny's importer to pull their BRIET
// books into their Lenny instance. Lenny calls
// GET market.briet.app/api/redeem-lenny/<code> and receives the bundle's
// books (olid + download url + title). `redeemedAt` is set atomically by that
// endpoint on first use, making the code single-use.
export default defineType({
  name: 'redeemCode',
  title: 'Lenny Redeem Codes',
  type: 'document',
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      description: 'The code the library types into Lenny. Uppercase; keep unique.',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'books',
      title: 'Books',
      type: 'array',
      description: 'Books this code unlocks. Each must have an Open Library ID (OLID) and a file.',
      of: [{ type: 'reference', to: [{ type: 'book' }] }],
      validation: Rule => Rule.required().min(1),
    }),
    defineField({
      name: 'stripeSessionId',
      title: 'Stripe Checkout Session ID',
      type: 'string',
      description: 'The Stripe checkout session this code fulfils, for traceability.',
    }),
    defineField({
      name: 'redeemedAt',
      title: 'Redeemed At',
      type: 'datetime',
      readOnly: true,
      description: 'Set automatically on first redemption. Once set, the code is spent.',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'text',
      description: 'Optional internal memo (e.g. which library / order this is for).',
    }),
  ],
  preview: {
    select: {
      title: 'code',
      redeemedAt: 'redeemedAt',
      book0: 'books.0.title',
    },
    prepare(selection) {
      const status = selection.redeemedAt
        ? `redeemed ${new Date(selection.redeemedAt).toLocaleDateString()}`
        : 'unredeemed'
      return {
        title: selection.title,
        subtitle: `${status}${selection.book0 ? ` · ${selection.book0}…` : ''}`,
      }
    },
  },
})
