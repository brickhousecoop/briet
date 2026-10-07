// Shared book-card GROQ projection; the other two call sites inline the same fields with different whitespace to stay byte-identical.
export const bookCardProjection = `{
    _id,
    title,
    cover,
    description,
    authors[]->{ name },
    publisher->{ name },
    price_usd,
  }`
