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
        key = body.get("key", "").strip()
    except (json.JSONDecodeError, AttributeError):
        return {"statusCode": 400, "body": json.dumps({"error": "Invalid request body"})}

    if not key:
        return {"statusCode": 400, "body": json.dumps({"error": "key required"})}

    # Ownership check — same gap as delete, now closed.
    if not key.startswith(f"uploads/{user_id}/"):
        return {"statusCode": 403, "body": json.dumps({"error": "Forbidden"})}

    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET, "Key": key},
            ExpiresIn=300,
        )
        return {"statusCode": 200, "body": json.dumps({"downloadUrl": url})}
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
