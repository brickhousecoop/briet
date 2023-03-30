import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import book from './schemas/book'
import author from './schemas/author'

export default defineConfig({
  'title': 'BRIET Marketplace',
  'projectId': '3lm68n5v',
  'dataset': 'production',
  'plugins': [
    deskTool(),
  ],
  'schema': {
    'types': [
      book,
      author,
    ],
  },
  'env': {
    'development': {
      'plugins': [
        '@sanity/vision',
      ]
    }
  }
})
