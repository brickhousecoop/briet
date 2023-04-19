import { defineType, defineField } from "sanity";
import { BookIcon } from '@sanity/icons'

export default defineType({
  name: 'book',
  title: 'Books',
  type: 'document',
  icon: BookIcon,
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
      name: 'releaseDate',
      title: 'Release date',
      type: 'datetime',
    }),
    defineField({
      name: 'isbn',
      title: 'ISBN',
      type: 'number',
      description: 'Optional; only add if your book has a unique one'
    }),
    defineField({
      name: 'identifer_ia',
      title: 'Internet Archive Identifier',
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
      name: 'price_usd',
      title: 'Price (USD)',
      description: 'Enter 0 for freely downloadable books',
      type: 'number',
      validation: Rule => [
        Rule.required().positive().precision(2),
        Rule.max(0).warning('Free book! But just double checking—$0 books will be available for immediate download by the public.'),
      ],
    }),
    defineField({
      name: 'isPunctumBook',
      title: 'This is a Punctum book',
      type: 'boolean',
      layout: 'checkbox',
      description: 'Punctum books receive special treatment after download, directing buyers to donate to Punctum',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      authorName0: 'authors.0.name',
      authorName1: 'authors.1.name',
      date: 'releaseDate',
      media: 'poster',
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
