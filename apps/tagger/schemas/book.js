import { defineType, defineField } from "sanity";
import { BookIcon } from '@sanity/icons'

export default defineType({
  name: 'book',
  title: 'Books',
  type: 'document',
  icon: BookIcon,
  groups: [
    {
      name: 'identfiers',
      title: 'Identifiers',
    },
  ],
  fieldsets: [
    {
      name: 'isbns',
      title: 'ISBNs',
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 100,
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      rows: 5,
      type: 'text',
      validation: Rule => Rule.max(1000),
    }),
    defineField({
      name: 'releaseDate',
      title: 'Release date',
      type: 'datetime',
    }),
    defineField({
      name: 'isbn', // TODO: migrate to isbnEbook
      title: 'Ebook ISBN',
      group: 'identfiers',
      fieldset: 'isbns',
      type: 'number',
      description: 'Optional; leave blank if unsure'
    }),
    defineField({
      name: 'isbnPrint',
      title: 'Print ISBN',
      group: 'identfiers',
      fieldset: 'isbns',
      type: 'number',
      description: 'Optional; leave blank if unsure'
    }),
    defineField({
      name: 'identifer_ia',
      title: 'Internet Archive Identifier',
      group: 'identfiers',
      type: 'string',
      description: 'Add if uploaded to Internet Archive, for inclusion in Open Library: archive.org/details/[identifer]'
    }),
    defineField({
      name: 'cover',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'file',
      title: 'Book File',
      type: 'file',
      description: 'The actual file to be downloaded by buying institutions',
      storeOriginalFilename: false,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'authors',
      title: 'Authors',
      description: 'Primary author first',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            {type: 'author'},
          ]
        }
      ],
    }),
    defineField({
      name: 'publisher',
      title: 'Publisher',
      type: 'reference',
      to: [
        {type: 'publisher'},
      ]
    }),
    defineField({
      name: 'price_usd',
      title: 'Price (USD)',
      description: 'Enter 0 for freely downloadable books',
      type: 'number',
      validation: Rule => [
        Rule.required().positive().precision(2),
        Rule.custom(price => price === 0 ? 'Just double checking you meant to make this book free! $0 books will be available for immediate download by the public.' : true).warning(),
      ],
    }),
    defineField({
      name: 'isPunctumBook',
      title: 'This is a punctum book',
      type: 'boolean',
      layout: 'checkbox',
      description: 'punctum books receive special treatment after download, directing buyers to donate to punctum',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      authorName0: 'authors.0.name',
      authorName1: 'authors.1.name',
      date: 'releaseDate',
      media: 'cover',
    },
    prepare(selection) {
      const year = selection.date && selection.date.split('-')[0]
      const authorsPreview = [selection.authorName0, selection.authorName1].filter(Boolean).join(', ')

      return {
        title: `${selection.title} ${year ? `(${year})` : ''}`,
        date: selection.date,
        subtitle: authorsPreview,
        media: selection.media,
      }
    },
  },
})
