import { TagIcon } from '@sanity/icons'

export default {
  name: 'collection',
  title: 'Collections',
  type: 'document',
  icon: TagIcon,
  fields: [
    {
      name: 'name',
      title: 'Collection Title',
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
      name: 'members',
      title: 'Included Books',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'book'}],
        title: 'Book'
      }],
      description: 'Books may belong to multiple Collections',
      options: {
        disableNew: true,
      },
    },
  ],
  preview: {
    select: {
      name: 'name',
      slug: 'slug'
    },
    prepare(collection) {
      const { name, slug } = collection
      return {
        title: name,
        subtitle: `market.briet.app#${slug.current}`
      }
    },
  },
}
