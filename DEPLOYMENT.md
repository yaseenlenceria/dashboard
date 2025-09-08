# Deployment Guide

This guide covers deploying the SleepCycle Dashboard to various platforms.

## Prerequisites

1. GitHub App created and installed (see main README.md)
2. Environment variables ready
3. Built and tested locally

## Deployment Options

### 1. Vercel (Recommended)

Vercel is the easiest and most optimized platform for Next.js applications.

#### Steps:

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Connect GitHub Repository**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "New Project" and import your dashboard repository
   - Configure build settings (auto-detected for Next.js)

3. **Set Environment Variables**:
   In Vercel dashboard → Project → Settings → Environment Variables:

   ```
   GITHUB_APP_ID=123456
   GITHUB_APP_CLIENT_ID=Iv1.abc123def456
   GITHUB_APP_CLIENT_SECRET=your_client_secret
   GITHUB_APP_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----
   GITHUB_INSTALLATION_ID=987654321
   GITHUB_REPO_OWNER=yaseenlenceria
   GITHUB_REPO_NAME=SleepCycle
   GITHUB_BRANCH=main
   NEXTAUTH_URL=https://your-dashboard.vercel.app
   NEXTAUTH_SECRET=your_long_random_secret
   ALLOWED_EMAILS=your-email@example.com
   ```

4. **Deploy**:
   - Push to main branch = automatic deployment
   - Or use CLI: `vercel --prod`

#### Custom Domain:
- Go to Vercel dashboard → Project → Settings → Domains
- Add your custom domain (e.g., `dashboard.sleepcycle.io`)
- Update `NEXTAUTH_URL` environment variable

### 2. Netlify

#### Steps:

1. **Connect Repository**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git" → GitHub
   - Select your dashboard repository

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Install `@netlify/plugin-nextjs` plugin

3. **Environment Variables**:
   In Netlify dashboard → Site → Site settings → Environment variables:
   (Same variables as Vercel)

4. **Deploy**:
   - Push to main branch for automatic deployment

### 3. Railway

Railway offers simple deployment with PostgreSQL if you need a database later.

#### Steps:

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your repository

2. **Environment Variables**:
   Add in Railway dashboard → Project → Variables
   (Same variables as above)

3. **Custom Domain**:
   - Go to Railway dashboard → Settings → Networking
   - Add custom domain

### 4. Docker (Self-hosted)

#### Build and Run:

```bash
# Build the image
docker build -t sleepcycle-dashboard .

# Run with environment file
docker run -p 3000:3000 --env-file .env sleepcycle-dashboard
```

#### Docker Compose:

```yaml
version: '3.8'
services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GITHUB_APP_ID=${GITHUB_APP_ID}
      - GITHUB_APP_CLIENT_ID=${GITHUB_APP_CLIENT_ID}
      - GITHUB_APP_CLIENT_SECRET=${GITHUB_APP_CLIENT_SECRET}
      - GITHUB_APP_PRIVATE_KEY=${GITHUB_APP_PRIVATE_KEY}
      - GITHUB_INSTALLATION_ID=${GITHUB_INSTALLATION_ID}
      - GITHUB_REPO_OWNER=${GITHUB_REPO_OWNER}
      - GITHUB_REPO_NAME=${GITHUB_REPO_NAME}
      - GITHUB_BRANCH=${GITHUB_BRANCH}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - ALLOWED_EMAILS=${ALLOWED_EMAILS}
    restart: unless-stopped
```

### 5. VPS/Dedicated Server

#### Using PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "sleepcycle-dashboard" -- start

# Save PM2 config
pm2 save
pm2 startup
```

#### Nginx Configuration:

```nginx
server {
    listen 80;
    server_name dashboard.sleepcycle.io;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Post-Deployment Setup

### 1. Update GitHub App Callback URL

Update your GitHub App settings with the new domain:
- Homepage URL: `https://your-dashboard-domain.com`
- Callback URL: `https://your-dashboard-domain.com/api/auth/callback/github`

### 2. Update Environment Variables

Make sure `NEXTAUTH_URL` matches your deployed domain.

### 3. Test Authentication

1. Visit your deployed dashboard
2. Try signing in with GitHub
3. Verify you can create/edit posts
4. Check that commits appear in your repository

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_APP_ID` | Your GitHub App ID | `123456` |
| `GITHUB_APP_CLIENT_ID` | GitHub App Client ID | `Iv1.abc123def456` |
| `GITHUB_APP_CLIENT_SECRET` | GitHub App Client Secret | `secret_here` |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App Private Key | `-----BEGIN PRIVATE KEY-----\n...` |
| `GITHUB_INSTALLATION_ID` | Installation ID | `987654321` |
| `GITHUB_REPO_OWNER` | Repository owner | `yaseenlenceria` |
| `GITHUB_REPO_NAME` | Repository name | `SleepCycle` |
| `GITHUB_BRANCH` | Target branch | `main` |
| `NEXTAUTH_URL` | Dashboard URL | `https://dashboard.sleepcycle.io` |
| `NEXTAUTH_SECRET` | Random secret string | `your_random_secret_here` |
| `ALLOWED_EMAILS` | Comma-separated emails | `you@example.com,team@example.com` |

## Troubleshooting Deployment

### Build Failures
- Check TypeScript errors: `npm run build` locally
- Verify all dependencies are in `package.json`
- Check Node.js version compatibility

### Authentication Issues
- Verify callback URL matches deployment domain
- Check that `NEXTAUTH_URL` environment variable is correct
- Ensure `NEXTAUTH_SECRET` is set and is a long random string

### GitHub API Errors
- Verify all GitHub environment variables are correct
- Check that GitHub App has correct permissions
- Ensure private key format is correct (use `\n` for newlines in env vars)

### Runtime Errors
- Check platform-specific logs (Vercel Functions, Netlify Functions, etc.)
- Verify environment variables are set in production
- Check that all API routes are properly configured

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Always use HTTPS in production
3. **Access Control**: Keep `ALLOWED_EMAILS` up to date
4. **Secrets**: Use platform secret management when possible
5. **Rate Limiting**: Consider adding rate limiting for API endpoints

## Monitoring

### Vercel
- Built-in analytics and function logs
- Real User Monitoring available

### Netlify
- Analytics dashboard
- Function logs in dashboard

### Self-hosted
- Use PM2 monitoring: `pm2 monit`
- Set up log aggregation (ELK stack, etc.)
- Consider uptime monitoring (Uptime Robot, etc.)

## Backup Strategy

Since all content is stored in GitHub:
- Repository serves as backup
- Consider enabling GitHub repository backup
- Export important configuration settings
- Keep environment variable backup in secure location