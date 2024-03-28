var pdf2img = require('pdf-img-convert');

export async function GET(request) {
  const { sanityFileId, index } = request.query

  const pdfUrl = `https://cdn.sanity.io/files/3lm68n5v/production/${fileId}.pdf`

  const image = await pdfPageToJpg2000({
    pdfUrl: pdfUrl,
    pageNumber: index,
  })

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
