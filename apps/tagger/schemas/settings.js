import { defineField } from 'sanity'
import { CogIcon } from '@sanity/icons'

export default {
  name: 'pageSettings',
  title: 'Settings',
  type: 'document',
  icon:  CogIcon ,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'featuredCollections',
      title: 'Featured Collections',
      description: 'Visible on Market homepage',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            // {type: 'publisher'}, // need to write fetcher
            {type: 'collection'},
          ]
        }
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
}
