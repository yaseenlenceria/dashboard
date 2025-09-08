# SleepCycle Dashboard

A content management system for the SleepCycle blog. This dashboard allows you to create, edit, and manage blog posts and images that are stored directly in your GitHub repository.

## Features

- 🔐 **Secure GitHub OAuth Authentication** - Only authorized users can access
- ✍️ **Rich Post Editor** - Create and edit blog posts with Markdown support
- 🖼️ **Image Management** - Upload and manage images with drag & drop
- 📝 **SEO Optimization** - Built-in SEO metadata fields
- 🔄 **Direct GitHub Integration** - All content is committed directly to your repo
- 🚀 **Auto-deployment** - Netlify automatically rebuilds when content changes

## Architecture

```
Dashboard (this app) → GitHub Repository → Netlify Site
```

1. You create/edit posts in this dashboard
2. Changes are committed directly to your GitHub repository
3. Netlify detects the changes and automatically rebuilds your site

## Prerequisites

1. **GitHub App** - You'll need to create a GitHub App for secure API access
2. **GitHub Repository** - Your SleepCycle blog repository
3. **Netlify Account** - For automatic deployments (already set up)

## Setup Instructions

### 1. Create a GitHub App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "GitHub Apps" → "New GitHub App"
3. Fill in the details:
   - **App Name**: `SleepCycle Dashboard`
   - **Homepage URL**: `https://your-dashboard-domain.com`
   - **Callback URL**: `https://your-dashboard-domain.com/api/auth/callback/github`
   - **Webhook Active**: Uncheck this (we don't need webhooks)

4. Set **Permissions** (Repository level):
   - **Contents**: Read & write
   - **Metadata**: Read

5. Click "Create GitHub App"
6. **Generate a Private Key** - download the `.pem` file
7. Note down the **App ID** and **Client ID**
8. Create a **Client Secret**

### 2. Install the GitHub App

1. On your GitHub App page, click "Install App"
2. Select your account/organization
3. Choose "Only select repositories" and select `yaseenlenceria/SleepCycle`
4. Complete the installation
5. Note the **Installation ID** from the URL (the number after `/installations/`)

### 3. Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables:

   ```env
   # From your GitHub App
   GITHUB_APP_ID=123456
   GITHUB_APP_CLIENT_ID=Iv1.abc123def456
   GITHUB_APP_CLIENT_SECRET=your_client_secret
   GITHUB_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----"
   
   # From the installation
   GITHUB_INSTALLATION_ID=987654321
   
   # Repository details
   GITHUB_REPO_OWNER=yaseenlenceria
   GITHUB_REPO_NAME=SleepCycle
   GITHUB_BRANCH=main
   
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000  # Change for production
   NEXTAUTH_SECRET=generate_a_long_random_string
   
   # Access control
   ALLOWED_EMAILS=your-email@example.com,team@example.com
   ```

   **Note**: For the private key, replace newlines with `\n` in the environment variable.

### 4. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

### 5. Production Deployment

#### Option A: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in the Vercel dashboard

#### Option B: Netlify

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy the `.next` folder to Netlify
3. Set up environment variables in Netlify dashboard

#### Option C: Custom Server

1. Build the app:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Usage

### Creating Posts

1. Navigate to the "Create Post" tab
2. Fill in the post details:
   - **Title**: The post title
   - **Slug**: URL-friendly identifier (auto-generated from title)
   - **Excerpt**: Brief description for previews
   - **Category**: Choose from predefined categories
   - **Cover Image**: Upload or specify an image path
   - **Content**: Write your post in Markdown

3. Optionally configure SEO settings
4. Click "Create Post"

The post will be committed to your repository as `content/posts/YYYY-MM-DD-slug.mdx`.

### Managing Images

1. Go to the "Images" tab
2. Drag and drop images or click "browse to upload"
3. Images are saved to `public/blog-images/` in your repository
4. Use the copy buttons to get the correct Markdown syntax for your posts

### Editing Posts

1. Go to "All Posts" tab
2. Click "Edit" next to any post
3. Make your changes
4. Click "Update Post"

## File Structure

Your repository will have this structure:

```
SleepCycle/
├── content/
│   └── posts/
│       ├── 2023-12-01-sleep-optimization-tips.mdx
│       └── 2023-12-02-baby-sleep-guide.mdx
└── public/
    └── blog-images/
        ├── sleep-tips-hero.jpg
        └── baby-sleeping.png
```

## Content Format

Posts are stored as MDX files with this format:

```mdx
export const frontmatter = {
  "title": "Your Post Title",
  "date": "2023-12-01T10:00:00.000Z",
  "readMinutes": 8,
  "category": "Sleep Optimization",
  "cover": "/blog-images/hero-image.jpg",
  "excerpt": "Brief description of your post...",
  "seo": {
    "metaTitle": "SEO Title",
    "metaDescription": "SEO description...",
    "keywords": "sleep, optimization, tips",
    "ogImage": "/blog-images/hero-image.jpg",
    "canonical": "https://sleepcycle.io/blog/your-post-slug"
  }
}

## Your Post Content

Write your content here using Markdown syntax...
```

## Security

- Only users with email addresses in `ALLOWED_EMAILS` can access the dashboard
- All API operations require authentication
- GitHub App uses time-limited installation tokens (more secure than personal access tokens)
- All commits are made with proper attribution

## Troubleshooting

### "Unauthorized" errors
- Check that your email is in the `ALLOWED_EMAILS` environment variable
- Verify your GitHub App is properly configured and installed

### "Failed to create installation token"
- Verify your `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, and `GITHUB_INSTALLATION_ID`
- Make sure the private key format is correct (replace newlines with `\n`)

### "Failed to commit"
- Check repository permissions on your GitHub App
- Verify `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` are correct

### Build errors
- Run `npm run build` locally to check for TypeScript errors
- Check that all environment variables are set in production

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are correctly set
3. Test the GitHub App permissions and installation
4. Check the server logs for detailed error information

## Development

To contribute or modify the dashboard:

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```