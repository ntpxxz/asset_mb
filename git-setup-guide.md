# Git Setup and Push Guide

## Prerequisites
You'll need to run these commands in a local environment where Git is available (not in WebContainer).

## Step 1: Initialize Git Repository (if not already done)
```bash
git init
```

## Step 2: Add Git Ignore File
Create or update `.gitignore`:
```bash
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Cache
.cache/
```

## Step 3: Add All Files
```bash
git add .
```

## Step 4: Create Initial Commit
```bash
git commit -m "Initial commit: AssetFlow IT Asset Management System

Features:
- Dashboard with real-time statistics
- Hardware asset management with detailed view pages
- Software license tracking and management
- User management with profile pages
- Asset borrowing system (checkout/checkin)
- Patch management tracking
- Comprehensive reporting and analytics
- Settings and configuration
- Help and support system
- Responsive design with Tailwind CSS
- TypeScript for type safety
- Next.js 13+ with App Router"
```

## Step 5: Add Remote Repository
Replace `<your-username>` and `<your-repo-name>` with your actual GitHub details:
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
```

## Step 6: Push to Remote Repository
```bash
git branch -M main
git push -u origin main
```

## Alternative: Using GitHub CLI
If you have GitHub CLI installed:
```bash
gh repo create <your-repo-name> --public --source=. --remote=origin --push
```

## Project Structure Summary
```
assetflow/
├── app/                    # Next.js App Router pages
│   ├── assets/            # Hardware management
│   ├── borrowing/         # Asset borrowing system
│   ├── help/              # Help and support
│   ├── patches/           # Patch management
│   ├── reports/           # Analytics and reports
│   ├── settings/          # System settings
│   ├── software/          # Software license management
│   ├── users/             # User management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard
├── components/            # Reusable components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and data
│   ├── data-store.ts     # Data management
│   └── utils.ts          # Utilities
└── public/               # Static assets
```

## Environment Setup for Production
Create a `.env.local` file for local development:
```env
# Add your environment variables here
# DATABASE_URL=your_database_url
# NEXTAUTH_SECRET=your_secret
# NEXTAUTH_URL=your_domain
```

## Deployment Options
- **Vercel**: Connect your GitHub repo to Vercel for automatic deployments
- **Netlify**: Build command: `npm run build`, Publish directory: `out`
- **Self-hosted**: Build with `npm run build` and serve the `out` directory

## Next Steps After Pushing
1. Set up a database (PostgreSQL, MongoDB, or Supabase)
2. Implement authentication (NextAuth.js recommended)
3. Add environment variables for production
4. Set up CI/CD pipeline
5. Configure domain and SSL

## Commit Message Conventions
Use conventional commits for better project management:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks