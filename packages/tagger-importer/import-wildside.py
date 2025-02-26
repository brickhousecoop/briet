import csv
import json
import re
from bs4 import BeautifulSoup

from slugify import slugify

data_path = "./Wildside_Press_Metadata_20240915073548.csv"
data = csv.DictReader(open(data_path))

import_data = []
all_authors = []
all_books = []

for i in data:
    author_list = [a for a in [i["Contributor 1"], i["Contributor 2"], i["Contributor 3"]] if a != ""]
    authors = []
    authors_refs = []

    for a in author_list:
        author_firstlast_list = a.split(", ")[::-1]
        author_firstlast = " ".join(author_firstlast_list)
        author_slug = slugify(author_firstlast)
        author_id = author_slug + "-viawildsideimport"
        if not any(auth for auth in authors if auth['_id'] == author_id):
            authors.append({
                "_type": "author",
                "_id": author_id,
                "slug": {"current": author_slug},
                "name": author_firstlast
            })
        else:
            print('Author already in catalog', author_id)

        authors_refs.append({
            "_type": "reference",
            "_ref": author_id
        })

    for a in authors:
        all_authors.append(a)

    soup_descriptionhtml = BeautifulSoup(i['Content Description'], "html.parser")
    description_plaintext = soup_descriptionhtml.get_text()

    if (i["Subtitle"]):
        fulltitle = i["Title"] + ": " + i["Subtitle"]
    else:
        fulltitle = i["Title"]

    doc = {"_type": "book",
            "slug": {"current": slugify(fulltitle)},
            "authors": authors_refs,
            "publisher": {"_type":"reference",
                          "_ref": "f5d444a2-a1f4-4842-8765-9cc821b453ae", # Wildside Press
                         },
            "cover": {"_type": "image",
                      "_sanityAsset": "image@file:///Users/jacob/wildsideassets/covers/" + i["eISBN13"] + ".jpg",
                     },
           "description": description_plaintext,
           "file": {"_type": "file",
                    "_sanityAsset": "file@file:///Users/jacob/wildsideassets/books/" + i["eISBN13"] + '.epub',
                   },
           "isbn": int(i["eISBN13"]),
           "isbnPrint": int(i["Print ISBN13"]) if i["Print ISBN13"] != '' else None,
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



