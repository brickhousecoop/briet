// Shared book-card GROQ projection. pages/search.tsx and the index.tsx members
// projection keep inline copies with the same fields; apps/server has its own variant.
export const bookCardProjection = `{
    _id,
    title,
    cover,
    description,
    authors[]->{ name },
    publisher->{ name },
    price_usd,
  }`
