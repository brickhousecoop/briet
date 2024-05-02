import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import book from './schemas/book'
import author from './schemas/author'
import publisher from './schemas/publisher'
import collection from './schemas/collection'

export default defineConfig({
  'title': 'BRIET Marketplace',
  'projectId': process.env.SANITY_STUDIO_PROJECTID,
  'dataset': process.env.SANITY_STUDIO_DATASET,
  'plugins': [
    structureTool(),
    visionTool(),
  ],
  'schema': {
    'types': [
      book,
      author,
      publisher,
      collection,
    ],
  },
})
