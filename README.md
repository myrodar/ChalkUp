# Boulderpoint Gatherer

A climbing competition management application built with React, TypeScript, and Supabase.

## Features

- User authentication and profile management
- Boulder tracking and validation with QR codes
- Leaderboard with gender-specific rankings
- Admin dashboard for boulder management
- Super admin capabilities for competition and user management
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel (frontend), Supabase (backend)

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

### Environment Setup

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/boulderpoint-gatherer.git
   cd boulderpoint-gatherer
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   You can get these values from your Supabase project dashboard under Settings > API.

4. Update the Supabase project ID in `supabase/config.toml` with your project ID.

### Database Setup

1. Set up the following tables in your Supabase project:
   - profiles
   - boulders
   - attempts
   - competitions
   - validation_requests

2. Configure Row Level Security (RLS) policies for each table to ensure proper data access control.

### Running the Application

Development mode:
```bash
npm run dev
# or
yarn dev
```

Build for production:
```bash
npm run build
# or
yarn build
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure the environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy using the Vercel dashboard or CLI

### Backend (Supabase)

The backend is already hosted on Supabase. Make sure your RLS policies are properly configured for production use.

## License

[MIT](LICENSE)
