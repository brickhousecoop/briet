import { createClient } from '@sanity/client'

// two options, optimized according to permissions
// https://www.sanity.io/help/js-client-usecdn-token

const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECTID
                     || process.env.SANITY_STUDIO_SANITY_PROJECTID
                     || process.env.SANITY_PROJECTID;

const sanityDataset   = process.env.NEXT_PUBLIC_SANITY_DATASET
                     || process.env.SANITY_STUDIO_SANITY_DATASET
                     || process.env.SANITY_DATASET;

const sanityToken = process.env.SANITY_TOKEN;

export default createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  token: sanityToken,
  perspective: 'published',
  apiVersion: '2025-11-18',
  useCdn: true,
})
