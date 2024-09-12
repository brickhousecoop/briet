import { readOnlyClient as sanity } from '@repo/sanity-client'
import { MarcRecord } from '@natlibfi/marc-record';

const allBookIdsQuery = `
  *[_type == "book"] { _id }
`
const singleBookQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    authors[] -> { _id, name, uri },
    isbn,
  }[0]
`

const MarcRecordPage = ({ marcString }) => {
  return <pre>{ marcString }</pre>
}

export const getStaticPaths = async () => {
  const books = await sanity.fetch(allBookIdsQuery);

  const paths = books.map(book => ({
    params: { id: book._id }
  }));

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: false };
};

export const getStaticProps = async ({ params }) => {
  const book = await sanity.fetch(singleBookQuery, { id: params.id });

  const authorFields = book.authors.map(author => {
    return {
      tag: '100',
      subfields: [
        {
          code: 'a',
          value: author.name
        }
      ]
    }
  })

  const titleFields = [{
    tag: '245',
    subfields: [
      {
        code: 'a',
        value: book.title
      },
      {
        code: 'c',
        value: book.authors.map(author => author.name).join(', ')
      }
    ]
  }]

  const fields = []

  const marcRecord = new MarcRecord({
    leader: '', // TODO
    fields: fields.concat(
      authorFields,
      titleFields
    )
  })

  const marcString = marcRecord.toString()

  return { props: { marcString } };
};

export default MarcRecordPage
