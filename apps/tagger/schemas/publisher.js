import {CommentIcon} from '@sanity/icons'

export default {
  name: 'publisher',
  title: 'Publishers',
  type: 'document',
  icon: CommentIcon,
  fields: [
    {
      name: 'name',
      title: 'Publisher Name',
      type: 'string',
      validation: Rule => Rule.required(),
      description: 'Collections can be a genre, a publisher, a curated selection: anything that brings books together.',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      validation: Rule => Rule.required(),
      options: {
        source: 'name',
        maxLength: 32,
      },
    },
    {
      name: 'catalog',
      title: 'Catalog',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'book'}],
        title: 'Book'
      }],
      description: 'Books may belong to multiple Publishers',
      options: {
        disableNew: false,
      },
    },
  ],
  preview: {
    select: {
      name: 'name',
      catalog: 'catalog',
    },
    prepare(publisher) {
      const { name, catalog } = publisher
      const bookCount = catalog ? catalog.length : 0
      return {
        title: name,
        subtitle: `${bookCount} ${bookCount === 1 ? 'book' : 'books'}`
      }
    },
  },
}
