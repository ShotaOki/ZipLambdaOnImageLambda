def lambda_handler(event, context):
    print("called zip-lambda")
    return {"statusCode": 200, "body": "Hello from zip lambda"}
