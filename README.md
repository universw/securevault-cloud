# SecureVault

> Personal cloud file storage built on AWS — secure, serverless, and scoped per user.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://securevault-cloud.vercel.app/)
[![Frontend](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite-61dafb)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/backend-AWS%20Lambda%20(Python%203.12)-ff9900)](https://aws.amazon.com/lambda/)
[![Auth](https://img.shields.io/badge/auth-AWS%20Cognito-ff9900)](https://aws.amazon.com/cognito/)
[![Storage](https://img.shields.io/badge/storage-Amazon%20S3-569A31)](https://aws.amazon.com/s3/)

**Live demo:** https://securevault-cloud.vercel.app/

---

## Overview

SecureVault is a small, full-stack file-storage app that behaves like a stripped-down Dropbox: register, log in, and your files live in your own private folder in the cloud. It's built as a learning project to practice **serverless architecture, AWS IAM, and DevOps fundamentals** end-to-end.

Each user's files are isolated in S3 under their Cognito user ID, all uploads and downloads happen through short-lived **presigned URLs**, and the entire backend runs on AWS Lambda with no servers to manage.

## Architecture

\`\`\`
┌────────────────┐      ┌──────────────┐     ┌──────────────────┐
│  React + Vite  │ ───▶ │ AWS Cognito  │     │   Amazon S3      │
│   (Vercel)     │      │  User Pool   │     │ securevault-     │
└────────┬───────┘      └──────────────┘     │  files-henry     │
         │                                    └────────▲─────────┘
         │  JWT                                        │
         ▼                                             │ presigned URL
┌────────────────────┐      ┌────────────────────────┐ │
│   API Gateway      │ ───▶ │   Lambda (Python 3.12) │─┘
│  (REST, us-east-1) │      │  4 functions           │
└────────────────────┘      └────────────────────────┘
\`\`\`

**Request flow:**
1. User authenticates with Cognito → receives JWT
2. Frontend calls API Gateway with the JWT
3. Lambda validates the request, generates a presigned S3 URL scoped to \`uploads/{userId}/\`
4. Browser uploads/downloads directly to S3 using the short-lived URL (5 min expiry)

## Features

- 🔐 Email + password auth via AWS Cognito (with confirmation flow)
- 📁 Per-user file isolation (\`uploads/{cognito_user_id}/\`)
- ⬆️ Direct-to-S3 uploads via presigned URLs (no file ever touches the Lambda)
- ⬇️ Time-limited download links
- 🗑️ File deletion
- 🔍 Search and sort in the dashboard
- 🌑 Dark theme UI
- 📏 50 MB upload limit (client-side; server-side validation on the roadmap)

## Tech Stack

**Frontend**
- React 18 + Vite
- React Router (protected routes)
- AWS Amplify Auth SDK (Cognito client)
- Deployed on Vercel with GitHub auto-deploy

**Backend (AWS, \`us-east-1\`)**
- **Cognito** — User Pool for auth
- **API Gateway** — REST API
- **Lambda** — 4 Python 3.12 functions:
  - \`securevaultUploadUrl\` → \`POST /upload-url\`
  - \`securevaultListFiles\` → \`GET /files\`
  - \`securevaultDownloadUrl\` → \`POST /download-url\`
  - \`securevaultDeleteFile\` → \`DELETE /delete\`
- **S3** — Private bucket, CORS-restricted

## Getting Started

### Prerequisites
- Node.js ≥ 18
- An AWS account (free tier is plenty)
- Vercel account (optional, for deployment)

### Clone and run locally

\`\`\`bash
git clone https://github.com/universw/securevault-cloud.git
cd securevault-cloud
npm install
cp .env.example .env.local
# fill in your AWS values (see below)
npm run dev
\`\`\`

### Environment variables

\`\`\`bash
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
\`\`\`

### AWS setup (manual, for now)

The infrastructure is currently provisioned by hand in the AWS Console. Migrating to **Terraform / AWS CDK** is on the roadmap so the whole stack becomes reproducible with one command.

High-level steps:
1. Create a Cognito User Pool + App Client (no client secret)
2. Create an S3 bucket; set CORS to allow your frontend origins
3. Create the 4 Lambdas (Python 3.12) and attach an IAM role with S3 access
4. Wire them to API Gateway routes; configure CORS for both \`localhost\` and your prod origin

## Deployment

- **Frontend** → push to \`main\` → Vercel auto-deploys
- **Backend** → currently deployed manually (CI/CD pipeline planned)

## What I learned

This project was as much a DevOps exercise as a coding one.

- **IAM is the thing.** Half the bugs were CORS or IAM permissions — Lambda invoke policies, S3 bucket policies, API Gateway resource policies. Reading AWS error messages carefully became a real skill.
- **Presigned URLs > proxying files.** Letting the browser talk to S3 directly keeps Lambda fast, cheap, and within the 6 MB payload limit.
- **Per-user folders are simpler than a database.** For a file-only app, scoping S3 keys by \`userId\` removed the need for a metadata DB entirely.
- **CORS is configured in two places.** Both API Gateway *and* S3 need explicit CORS rules — fixing one without the other quietly breaks the app.
- **Free tier teaches discipline.** Staying within free-tier limits forced thoughtful resource sizing and lifecycle decisions.

## Roadmap

**Security**
- [ ] Cognito Authorizer on API Gateway *(critical — currently relies on userId in path)*
- [ ] Server-side file size validation in Lambda
- [ ] API Gateway rate limiting / usage plan

**DevOps**
- [ ] Terraform / AWS CDK for infrastructure as code
- [ ] GitHub Actions CI/CD for Lambda deploys
- [ ] Dev / staging / prod environments
- [ ] CloudWatch alarms + dashboards

**Features**
- [ ] In-browser file preview (images, PDF)
- [ ] Drag-and-drop upload
- [ ] Real upload progress
- [ ] Storage quota per user
- [ ] CloudFront CDN + custom domain
- [ ] AWS WAF

## License

MIT

---

**Author:** [@universw](https://github.com/universw)
