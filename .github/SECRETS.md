# GitHub Actions Secrets Configuration

This document outlines the secrets that need to be configured in your GitHub repository for the CI/CD pipeline to work.

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed below

---

## Required Secrets

### Vercel Deployment Secrets

#### `VERCEL_TOKEN`

- **Description**: Vercel authentication token for deployments
- **How to obtain**:
  1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
  2. Create a new token with appropriate scope
  3. Copy the token value

#### `VERCEL_ORG_ID`

- **Description**: Your Vercel organization/team ID
- **How to obtain**:
  1. Run `vercel` in your frontend directory locally
  2. Check `.vercel/project.json` for `orgId`
  3. Or find it in Vercel dashboard URL

#### `VERCEL_PROJECT_ID`

- **Description**: Your Vercel project ID
- **How to obtain**:
  1. Run `vercel` in your frontend directory locally
  2. Check `.vercel/project.json` for `projectId`
  3. Or go to Project Settings in Vercel dashboard

---

### Render Deployment Secrets

#### `RENDER_API_KEY`

- **Description**: Render API key for backend deployments
- **How to obtain**:
  1. Go to [Render Dashboard](https://dashboard.render.com/)
  2. Navigate to **Account Settings** → **API Keys**
  3. Create a new API key
  4. Copy the key value

#### `RENDER_SERVICE_ID`

- **Description**: Your Render service ID for the backend
- **How to obtain**:
  1. Go to your service in Render dashboard
  2. The service ID is in the URL: `https://dashboard.render.com/web/srv-XXXXXXXXXX`
  3. Copy the `srv-XXXXXXXXXX` part

---

### Application Environment Variables

#### `GEMINI_API_KEY`

- **Description**: Gemini API key for LLM service
- **How to obtain**:
  1. Get your Gemini API key
  2. Copy the key value

---

## Environment Variables for Deployment

These secrets should also be configured in your deployment platforms (Vercel/Render):

### Backend Environment Variables (Render/Railway)

```
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production
GEMINI_API_KEY=your-gemini-api-key
PORT=10000
```

**Note**: The application uses SQLite database, which will be created automatically. No DATABASE_URL needed.

### Frontend Environment Variables (Vercel)

```
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_AUTH_URL=https://your-backend.onrender.com/auth
REACT_APP_LLM_URL=https://your-backend.onrender.com/llm
```

---

## Testing the Pipeline

After adding all secrets:

1. Push to the `main` branch
2. Check the Actions tab in GitHub
3. Monitor the deployment workflow
4. Verify deployments in Vercel and Render dashboards

---

## Security Best Practices

- ✅ Never commit secrets to the repository
- ✅ Rotate API keys regularly
- ✅ Use separate keys for staging and production
- ✅ Set appropriate token permissions (least privilege)
- ✅ Monitor secret usage in deployment logs
- ✅ Revoke unused or compromised tokens immediately

---

## Troubleshooting

### Vercel Deployment Fails

- Verify `VERCEL_TOKEN` has not expired
- Check that `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` match your project
- Ensure build commands in `package.json` are correct

### Render Deployment Fails

- Verify `RENDER_API_KEY` is valid
- Check that `RENDER_SERVICE_ID` matches your service
- Review Render service logs for errors

### Tests Pass But Deployment Skipped

- Ensure you're pushing to the `main` branch
- Check that all tests passed successfully
- Verify the workflow condition: `if: success() && github.ref == 'refs/heads/main'`
