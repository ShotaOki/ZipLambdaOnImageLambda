import spacy

nlp = spacy.load("ja_ginza")


def lambda_handler(event, context):
    doc = nlp("銀座でランチをご一緒しましょう。")
    for sent in doc.sents:
        for token in sent:
            print(
                token.i,
                token.orth_,
                token.lemma_,
                token.norm_,
                token.morph.get("Reading"),
                token.pos_,
                token.morph.get("Inflection"),
                token.tag_,
                token.dep_,
                token.head.i,
            )
        print("EOS")

    return {"statusCode": 200, "body": "Hello from zip lambda"}
