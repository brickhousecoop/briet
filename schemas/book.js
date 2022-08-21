import {BookIcon} from '@sanity/icons'

export default {
  name: 'book',
  title: 'Book',
  type: 'document',
  icon: BookIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 100,
      },
    },
    {
      name: 'releaseDate',
      title: 'Release date',
      type: 'datetime',
    },
    {
      name: 'isbn',
      title: 'ISBN',
      type: 'number',
      description: 'Optional; only add if your book has a unique one'
    },
    {
      name: 'cover',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'file',
      title: 'Book File',
      type: 'file',
      description: 'The actual file to be downloaded by buying institutions'
    },
    {
      name: 'authors',
      title: 'Authors',
      description: 'Primary author first',
      type: 'array',
      of: [{type: 'author'}],
    },
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
}
