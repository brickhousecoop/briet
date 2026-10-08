// Imported via --import before any test module. Importing the app code runs
// @repo/sanity-client's import-time guard, which throws without a project,
// dataset, and token. These dummies satisfy that guard so the modules merely
// load; unit tests then inject real clients pointed at a fake Content Lake
// (test/helpers/fakeSanity.mjs), so the dummy values never touch the network.
process.env.NEXT_PUBLIC_SANITY_PROJECTID ||= 'test-project'
process.env.NEXT_PUBLIC_SANITY_DATASET ||= 'test'
process.env.SANITY_TOKEN ||= 'test-token'
process.env.SANITY_WRITE_TOKEN ||= 'test-write-token'
process.env.STRIPE_SECRET_KEY ||= 'sk_test_fake'
process.env.SITE_URL ||= 'https://market.briet.app'
