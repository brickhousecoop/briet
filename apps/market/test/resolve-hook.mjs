import { registerHooks } from 'node:module'

// The app is written for bundler module resolution (extensionless relative
// imports, e.g. `../../utils/stripe-helpers`). Raw `node --test` uses Node's
// ESM resolver, which requires explicit extensions. Retry a failed relative
// import once with a `.ts` extension so app code loads unchanged under tests.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      if (err?.code === 'ERR_MODULE_NOT_FOUND' && /^\.{1,2}\//.test(specifier)) {
        return nextResolve(specifier + '.ts', context)
      }
      throw err
    }
  },
})
