import json
import boto3
import os

s3 = boto3.client("s3")
BUCKET = os.environ.get("BUCKET_NAME", "securevault-files-henry")


def lambda_handler(event, context):
    try:
        user_id = event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]
    except (KeyError, TypeError):
        return {"statusCode": 401, "body": json.dumps({"error": "Unauthorized"})}

    try:
        body = json.loads(event.get("body") or "{}")
        filename = os.path.basename(body.get("filename", "").strip())
        filetype = body.get("filetype", "application/octet-stream")
    except (json.JSONDecodeError, AttributeError):
        return {"statusCode": 400, "body": json.dumps({"error": "Invalid request body"})}

    if not filename:
        return {"statusCode": 400, "body": json.dumps({"error": "filename required"})}

    key = f"uploads/{user_id}/{filename}"
    try:
        url = s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": BUCKET, "Key": key, "ContentType": filetype},
            ExpiresIn=300,
        )
        return {"statusCode": 200, "body": json.dumps({"uploadUrl": url, "key": key})}
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
