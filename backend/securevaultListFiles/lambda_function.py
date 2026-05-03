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

    prefix = f"uploads/{user_id}/"
    try:
        response = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix)
        files = [
            {
                "key": obj["Key"],
                "size": obj["Size"],
                "lastModified": obj["LastModified"].isoformat(),
            }
            for obj in response.get("Contents", [])
            if obj["Key"] != prefix
        ]
        return {"statusCode": 200, "body": json.dumps({"files": files})}
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
