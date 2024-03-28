var pdf2img = require('pdf-img-convert');

export async function GET(request) {
  const url = new URL(request.url)
  const searchParams = new URLSearchParams(url.search)

  const sanityFileId = searchParams.get('sanityFileId')
  const index = parseInt(searchParams.get('index'), 10);

  console.log('sanityFileId', sanityFileId)

  const pdfUrl = `https://cdn.sanity.io/files/3lm68n5v/production/${sanityFileId}.pdf`

  const image = await pdfPageToJpg2000({
    pdfUrl: pdfUrl,
    pageNumber: index,
  })
https://cdn.sanity.io/files/3lm68n5v/production/0e7fab901df482ab46a641a54b487f9c6fea41e2.pdf
  console.log(typeof image)

  const headers = new Headers();
  headers.set('Content-Type', 'image/jpg')

  return new Response(image, { headers })
}

async function pdfPageToJpg2000({pdfUrl, pageNumber}={}) {
  const convertOptions = {
    width: 800, // TODO: hardcoded in BrietBookLoader.js
    height: 1200, // TODO: hardcoded in BrietBookLoader.js
    page_numbers: [pageNumber],
    scale: 2.0,
  };

  const imageArray = await pdf2img.convert(pdfUrl, convertOptions)
  const imageData = imageArray[0]

  return imageData
}
