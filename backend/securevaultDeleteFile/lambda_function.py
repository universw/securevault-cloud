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

    # Ownership check — old code only verified startswith("uploads/"), allowing
    # any user to delete another user's file.
    if not key.startswith(f"uploads/{user_id}/"):
        return {"statusCode": 403, "body": json.dumps({"error": "Forbidden"})}

    try:
        s3.delete_object(Bucket=BUCKET, Key=key)
        return {"statusCode": 200, "body": json.dumps({"message": "deleted", "key": key})}
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
