# AssetFlow - IT Asset Management System

A comprehensive IT Asset Management system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📊 **Real-time Dashboard** - Overview of assets, users, and system health
- 💻 **Hardware Management** - Track laptops, desktops, and IT equipment
- 🛡️ **Software Licensing** - Manage licenses and compliance
- 👥 **User Management** - Handle user accounts and assignments
- 🔄 **Borrowing System** - Asset checkout/checkin workflow
- 🔧 **Patch Management** - Monitor system updates
- 📈 **Reports & Analytics** - Comprehensive insights
- ⚙️ **Settings** - System configuration

## Tech Stack

- **Next.js 13+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Lucide React** for icons
- **Recharts** for data visualization

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Database Setup

This project is configured to use a PostgreSQL database running in a Docker container for development.

1.  **Prerequisites**: Make sure you have [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your system.

2.  **Start the Database**: Run the following command to start the PostgreSQL container in the background:
    ```bash
    docker-compose up -d
    ```

3.  **Create the Database Schema**: Before running the application for the first time, you need to create the database schema. The `schema.sql` file in the root of the repository contains the necessary SQL statements. You can execute this script using a tool like `psql`:
    ```bash
    psql -h localhost -p 5432 -U user -d asset_management -f schema.sql
    ```
    You will be prompted for the password, which is `password` (as defined in `.env.local`).

4.  **Run the Application**: The application is now ready to connect to the database. Run the development server:
    ```bash
    npm run dev
    ```

5.  **Database Connection Details**: The connection details for the database are stored in the `.env.local` file. The default values are:
    - Host: `localhost`
    - Port: `5432`
    - User: `user`
    - Password: `password`
    - Database: `asset_management`

6.  **Stop the Database**: To stop the PostgreSQL container, run:
    ```bash
    docker-compose down
    ```

## Deployment

This project is configured for static export and can be deployed to:
- Vercel (recommended)
- Netlify
- Any static hosting service

## Project Structure

```
├── app/                 # Next.js pages
├── components/          # Reusable components
├── lib/                # Utilities and data
└── public/             # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.