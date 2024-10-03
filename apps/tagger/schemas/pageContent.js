export default {
  name: 'content',
  title: 'Content',
  type: 'array',
  of: [
    {
      type: 'block',
    },
    {
      type: 'image',
      fields: [
      {
        title: 'Alt Text (description)',
        name: 'alt',
        type: 'string',
        validation: Rule => Rule.required(),
        options: {
          isHighlighted: true,
        },
      }]
    },
  ],
}