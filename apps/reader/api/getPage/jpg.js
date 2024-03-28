var pdf2img = require('pdf-img-convert');

export default async (request, response) => {
  const { sanityFileId, index } = request.query

  const pdfUrl = `https://cdn.sanity.io/files/3lm68n5v/production/${sanityFileId}.pdf`

  const image = await pdfPageToJpg2000({
    pdfUrl: pdfUrl,
    pageNumber: index,
  })

  response.setHeader('Content-Type', 'image/jpeg');
  response.send(image)
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
