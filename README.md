# Restaurant Pre-Order App (Georgian cuisine)

A restaurant pre-order application with a .NET backend on AWS Lambda/API Gateway, an Angular frontend, and DynamoDB storage. Seeded with three Georgian restaurants and Georgian dishes.

## Deployed endpoints

- **Backend API:** `https://7ehp5go8nd.execute-api.us-west-2.amazonaws.com/dev`
- **Frontend (S3 website):** `http://restaurant-frontend-339520604701.s3-website.us-west-2.amazonaws.com`

## Seed data

The DynamoDB `Locations` and `Dishes` tables are pre-seeded with:

**3 Georgian restaurants:**
- Khachapuri House — Tbilisi, Rustaveli Ave 15
- Satsivi & Co — Batumi, seaside boulevard
- Georgian Garden — Kutaisi, old town square

**7 Georgian dishes:** Adjarian Khachapuri, Khinkali, Lobio, Satsivi, Badrijani Nigvzit, Churchkhela, Ajapsandali (prices 8–22 GEL).

Re-seed anytime:

```bash
cd backend/restaurant-backend-app
node scripts/seed-dynamodb.mjs
```

## Deployment

This repo uses three deployment tracks:

- **Terraform** for shared AWS infrastructure under `infra/terraform`
- **AWS Syndicate** for the backend under `backend/restaurant-backend-app`
- **Angular build synced to S3** for the frontend under `frontend/restaurant-frontend-app`

### Prerequisites

- AWS CLI configured (`aws configure`) for the target AWS account
- Terraform 1.10+
- Python 3.10–3.11
- .NET 10 SDK
- AWS Syndicate (`pip install aws-syndicate`)
- Node.js 22.x with npm

### Deployment order

1. Deploy Terraform infrastructure (`infra/terraform`)
2. Deploy the backend using Syndicate
3. Build the frontend with `BACKEND_URL` and sync to S3

### Backend (Syndicate)

From `backend/restaurant-backend-app`:

```bash
python3 -m venv syndicate_venv
source syndicate_venv/bin/activate
pip install aws-syndicate
export SDCT_CONF="$(pwd)/.syndicate-config-restaurant-backend-app"
syndicate create-deploy-target-bucket
syndicate build
syndicate deploy --replace-output
```

If the modification lock is active, set `is_locked: false` in `.syndicate-config-restaurant-backend-app/.syndicate` before deploying.

### Frontend

```bash
cd frontend/restaurant-frontend-app
npm ci
BACKEND_URL=<api-url> npm run build
aws s3 sync dist/restaurant-frontend-app/browser s3://restaurant-frontend-<ACCOUNT_ID>/ --delete
```

CloudFront invalidation (if using CloudFront):

```bash
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

## Validation

```bash
curl <api-url>/locations
curl <api-url>/dishes
curl -I <frontend-url>
```

## What to never commit

- `environment.production.ts` (generated from `BACKEND_URL`)
- `.env`, `*.tfstate`, `node_modules/`, `dist/`, `syndicate_venv/`
