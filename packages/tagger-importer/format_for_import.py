import csv
import json
import re
from bs4 import BeautifulSoup

from slugify import slugify

data_path = "./Metadata.csv"
data = csv.DictReader(open(data_path))

import_data = []
all_authors = []
all_books = []

for i in data:
    author_list = [a for a in [i["Contributor 1 Full Name"], i["Contributor 2 Full Name"], i["Contributor 3 Full Name"], i["Contributor 4 Full Name"], i["Contributor 5 Full Name"], i["Contributor 6 Full Name"], i["Contributor 7 Full Name"]] if a != ""]
    authors = []
    authors_refs = []

    for a in author_list:
        author_slug = slugify(a)
        author_id = author_slug + "-viapmpressimport"
        authors.append({
            "_type": "author",
            "_id": author_id,
            "slug": {"current": author_slug},
            "name": a
        })
        authors_refs.append({
            "_type": "reference",
            "_ref": author_id
        })

    for a in authors:
        all_authors.append(a)

    soup_descriptionhtml = BeautifulSoup(i['Main Description'], "html.parser")
    description_plaintext = soup_descriptionhtml.get_text()

    if (i["Subtitle"]):
        fulltitle = i["Title"] + ": " + i["Subtitle"]
    else:
        fulltitle = i["Title"]

    doc = {"_type": "book",
            "slug": {"current": slugify(fulltitle)},
            "authors": authors_refs,
            "cover": {"_type": "image",
                      "_sanityAsset": "image@file:///Users/jacob/pmassets/covers/" + i["File Name"][:-18] + ".jpg",
                     },
           "description": description_plaintext,
           "file": {"_type": "file",
                    "_sanityAsset": "file@file:///Users/jacob/pmassets/books/" + i["File Name"],
                   },
           "isbn": int(i["eBook ISBN"]),
           "isbnPrint": int(i["Print ISBN"]),
           "price_usd": float(i["Price"]),
           "title": fulltitle}
    all_books.append(doc)

all_authors = [i for n, i in enumerate(all_authors) if i not in all_authors[:n]]

import_data.extend(all_authors)
import_data.extend(all_books)

with open("import_data.ndjson", "w") as out_file:
    for i in import_data:
        json.dump(i, out_file)
        out_file.write("\n")



