# Railway Deployment Guide

## Prerequisites
- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))

## Quick Deploy

### 1. Deploy to Railway

Click the button below or follow manual steps:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### 2. Manual Deployment Steps

#### A. Deploy ArangoDB Service

1. Go to [railway.app](https://railway.app)
2. Create new project → "Empty Project"
3. Click "New" → "Database" → "Add Docker Image"
4. Enter image: `arangodb/arangodb:3.12`
5. Add environment variables:
   - `ARANGO_ROOT_PASSWORD`: (choose a secure password)
6. Deploy and wait for it to start
7. Note the internal URL: `arangodb.railway.internal:8529`

#### B. Deploy Web Application

1. In the same project, click "New" → "GitHub Repo"
2. Select `picsumvision` repository
3. Add environment variables:
   ```
   ARANGO_DB_URL=http://arangodb.railway.internal:8529
   ARANGO_USER=root
   ARANGO_PASS=<your-password-from-step-A>
   ARANGO_DB_NAME=picsumvision
   FLASK_APP=server.server
   FLASK_ENV=production
   ```
4. Railway will auto-detect the `Procfile` and deploy
5. Once deployed, click on the web service → "Settings" → "Generate Domain"

#### C. Initialize Database

After first deployment:

1. Open Railway CLI or use the web terminal
2. Run database initialization:
   ```bash
   railway run python scripts/onboard.py
   ```

3. Import data (choose one):
   ```bash
   # Option A: Restore from backup
   railway run python scripts/restore.py
   
   # Option B: Populate fresh data (requires Google Vision API)
   railway run python scripts/populate.py
   ```

## Environment Variables

### Required:
- `ARANGO_DB_URL`: Internal Railway URL to ArangoDB
- `ARANGO_USER`: ArangoDB username (default: `root`)
- `ARANGO_PASS`: ArangoDB password
- `ARANGO_DB_NAME`: Database name (default: `picsumvision`)
- `FLASK_APP`: `server.server`

### Optional:
- `FLASK_ENV`: `production` (recommended)
- `GOOGLE_APPLICATION_CREDENTIALS`: Only needed for `yarn db:populate`

## Build Configuration

The project uses a **multi-stage Dockerfile** for building on Railway. Key files:

- **`Dockerfile`**: Multi-stage build that compiles both backend (Python) and frontend (React)
- **`railway.json`**: Railway service configuration
- **`.dockerignore`**: Optimizes build by excluding unnecessary files
- **`wsgi.py`**: WSGI entry point for Gunicorn

**Build Process**:
1. **Stage 1**: Installs Python dependencies and builds the backend
2. **Stage 2**: Builds the React frontend with Node.js
3. **Stage 3**: Creates final slim image with both backend and built frontend

**Note**: The multi-stage build keeps the final image size small while ensuring both Python and Node.js dependencies are properly handled.

## Architecture

```
┌─────────────────────┐
│   Railway Project   │
├─────────────────────┤
│                     │
│  ┌───────────────┐  │
│  │  Web Service  │  │  (Your App)
│  │  Port: $PORT  │  │
│  └───────┬───────┘  │
│          │          │
│          │ Internal │
│          │ Network  │
│          │          │
│  ┌───────▼───────┐  │
│  │   ArangoDB    │  │  (Database)
│  │   Port: 8529  │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

## Cost Estimate

Railway provides **$5 in free credits per month**:
- Web Service: ~$2-3/month
- ArangoDB: ~$2/month
- **Total: ~$4-5/month** (within free tier)

## Troubleshooting

### Database Connection Issues
- Verify ArangoDB service is running
- Check environment variables are set correctly
- Ensure internal URL uses `arangodb.railway.internal`

### Build Failures
- Check Railway logs: `railway logs`
- Verify all dependencies in `pyproject.toml`
- Ensure Node.js and Python versions are compatible

### App Not Starting
- Check the Procfile syntax
- Verify `wsgi.py` is present
- Review start command in `railway.json`

## CLI Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# View logs
railway logs

# Run commands
railway run <command>

# Open dashboard
railway open
```

## Monitoring

- View logs in Railway dashboard
- Monitor usage to stay within free tier
- Set up alerts in Railway settings

## Updating

```bash
# Push to main branch
git push origin main

# Railway will automatically deploy
```

## Local Development

See main [README.md](./README.md) for local setup instructions.
