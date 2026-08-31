import sanity from '@repo/sanity-client'
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
  })).slice(0, 10); // sample 10 paths to prerender mostly just to learn getStaticPaths

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps = async ({ params }) => {
  const book = await sanity.fetch(singleBookQuery, { id: params.id });

  if (!book) {
    return {
      notFound: true,
      revalidate: 5,
    };
  }

  // authors is optional on the book schema and a dangling author reference
  // dereferences to null, so drop null elements before mapping.
  const authors = (book.authors ?? []).filter(author => author?.name);

  const authorFields = authors.map(author => {
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

  const titleSubfields = [{
    code: 'a',
    value: book.title
  }]
  // 245$c is omitted entirely for authorless books rather than emitted empty:
  // an empty subfield is rejected or mis-ingested by library ILS importers.
  if (authors.length > 0) {
    titleSubfields.push({
      code: 'c',
      value: authors.map(author => author.name).join(', ')
    })
  }

  const titleFields = [{
    tag: '245',
    subfields: titleSubfields
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

  return {
    props: { marcString },
    revalidate: 5,
  };
};

export default MarcRecordPage
