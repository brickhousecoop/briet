import sanityClient from '@sanity/client'

// two options, optimized according to permissions
// https://www.sanity.io/help/js-client-usecdn-token

const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECTID
                     || process.env.SANITY_STUDIO_SANITY_PROJECTID
                     || process.env.SANITY_PROJECTID;

const sanityDataset   = process.env.NEXT_PUBLIC_SANITY_DATASET
                     || process.env.SANITY_STUDIO_SANITY_DATASET
                     || process.env.SANITY_DATASET;

export default sanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECTID || process.env.SANITY_STUDIO_SANITY_PROJECTID || process.env.SANITY_PROJECTID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET,
  token: process.env.SANITY_TOKEN,
  apiVersion: '2022-08-21', // known good UTC date https://www.sanity.io/docs/api-versioning#228b7a6a8148
  useCdn: false
})

export const readOnlyClient = sanityClient({
  // dataset MUST be public
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECTID || process.env.SANITY_PROJECTID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET,
  apiVersion: '2022-08-21',
  useCdn: true
})
