# AssetFlow - IT Asset Management System

## Deployment Guide

This is a complete IT Asset Management system built with Next.js, TypeScript, and Tailwind CSS.

### Features
- **Dashboard**: Real-time overview of assets, users, and system health
- **Hardware Management**: Track laptops, desktops, and other IT equipment
- **Software Licensing**: Manage software licenses and usage
- **User Management**: Handle user accounts and asset assignments
- **Borrowing System**: Check-in/check-out assets for temporary use
- **Patch Management**: Monitor system updates and security patches
- **Reports & Analytics**: Comprehensive reporting and insights
- **Settings & Configuration**: System administration tools

### Tech Stack
- **Frontend**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **TypeScript**: Full type safety
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Data**: In-memory storage (ready for database integration)

### Getting Started

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd assetflow
   npm install
   ```

2. **Development**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

### Deployment Options

#### Vercel (Recommended)
1. Push to GitHub/GitLab
2. Connect to Vercel
3. Deploy automatically

#### Netlify
1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify

#### Self-hosted
1. Build: `npm run build`
2. Serve the `out` folder with any static file server

### Database Integration

The current version uses in-memory storage. To integrate with a real database:

1. **Replace the data store** (`lib/data-store.ts`) with your preferred solution:
   - PostgreSQL with Prisma
   - MongoDB with Mongoose
   - Supabase
   - Firebase

2. **Update the service functions** to use async/await patterns

3. **Add environment variables** for database connections

### Environment Variables

Create a `.env.local` file:
```
# Database (when implemented)
DATABASE_URL=your_database_url

# Authentication (when implemented)
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=your_domain

# Email (for notifications)
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── assets/            # Hardware assets page
│   ├── borrowing/         # Asset borrowing system
│   ├── help/              # Help and support
│   ├── patches/           # Patch management
│   ├── reports/           # Analytics and reports
│   ├── settings/          # System settings
│   ├── software/          # Software license management
│   ├── users/             # User management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard
├── components/
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── data-store.ts      # Data management
│   └── utils.ts           # Utilities
└── public/                # Static assets
```

### Key Components

- **Dashboard**: Real-time metrics and quick actions
- **Asset Management**: Complete CRUD for hardware assets
- **Software Licensing**: License tracking and compliance
- **User Directory**: User management with role-based access
- **Borrowing System**: Asset checkout/checkin workflow
- **Patch Management**: Security update tracking
- **Reports**: Data visualization and export capabilities

### Next Steps for Production

1. **Authentication**: Implement user authentication (NextAuth.js recommended)
2. **Database**: Replace in-memory storage with persistent database
3. **File Uploads**: Add support for asset images and documents
4. **Email Notifications**: Implement email alerts for important events
5. **API Integration**: Connect with existing IT systems
6. **Mobile App**: Consider React Native companion app
7. **Advanced Reporting**: Add more sophisticated analytics

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### License

This project is licensed under the MIT License.