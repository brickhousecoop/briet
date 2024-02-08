import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import book from './schemas/book'
import author from './schemas/author'
import collection from './schemas/collection'

export default defineConfig({
  'title': 'BRIET Marketplace',
  'projectId': process.env.SANITY_STUDIO_PROJECTID,
  'dataset': process.env.SANITY_STUDIO_DATASET,
  'plugins': [
    deskTool(),
    visionTool(),
  ],
  'schema': {
    'types': [
      book,
      author,
      collection,
    ],
  },
})
