# Datuum Frontend (Next.js)

This is the frontend application for Datuum 2.0, built with Next.js and Auth0 for authentication.

## Prerequisites

- Node.js 18+ and npm
- Auth0 account with configured SPA and API

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Auth0 credentials:

```env
AUTH0_SECRET=generate_a_long_random_string_here
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://datuum.api
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

**Note:** Generate a secure random string for `AUTH0_SECRET` using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
datuum-frontend/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...auth0].js    # Auth0 authentication routes
│   │   └── data.js               # API proxy for backend calls
│   ├── _app.js                   # App wrapper with UserProvider
│   ├── index.js                  # Landing page
│   └── dashboard.js              # Protected dashboard page
├── styles/
│   ├── globals.css               # Global styles
│   ├── Home.module.css           # Landing page styles
│   └── Dashboard.module.css      # Dashboard styles
├── .env.local.example            # Environment variables template
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Features

### Landing Page (`/`)
- Public landing page with marketing content
- Login/Sign Up CTA
- Responsive design

### Dashboard (`/dashboard`)
- Protected route (requires authentication)
- Displays user information
- Fetches and displays items from backend API
- Logout functionality

### API Routes
- `/api/auth/login` - Initiates Auth0 login
- `/api/auth/logout` - Logs user out
- `/api/auth/callback` - Auth0 callback handler
- `/api/data` - Protected route that fetches data from backend

## Authentication Flow

1. User clicks "Login" button
2. Redirected to Auth0 login page
3. After authentication, redirected back to `/api/auth/callback`
4. Access token stored in session
5. Protected pages use `withPageAuthRequired` HOC
6. API routes use `withApiAuthRequired` and `getAccessToken` to call backend

## Calling Backend API

The frontend communicates with the backend through authenticated API routes. Example:

```javascript
// In a React component
const response = await fetch('/api/data');
const data = await response.json();
```

The `/api/data` route automatically:
- Validates user session
- Retrieves access token
- Forwards request to backend with Authorization header
- Returns response to frontend

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically

Update Auth0 settings for production:
- Add production URLs to Allowed Callback URLs
- Add production URLs to Allowed Logout URLs
- Add production URLs to Allowed Web Origins

### Environment Variables for Production

- `AUTH0_SECRET` - New random string for production
- `AUTH0_BASE_URL` - Your production domain (https://yourdomain.com)
- `AUTH0_ISSUER_BASE_URL` - Your Auth0 domain
- `AUTH0_CLIENT_ID` - Auth0 Client ID
- `AUTH0_CLIENT_SECRET` - Auth0 Client Secret
- `AUTH0_AUDIENCE` - Your Auth0 API identifier
- `NEXT_PUBLIC_API_BASE_URL` - Production backend URL

## Troubleshooting

### "Backend API returned 500"
- Ensure backend server is running at `http://localhost:8080`
- Check backend logs for errors
- Verify Auth0 JWT validation is configured correctly in backend

### "Unauthorized" errors
- Check that Auth0 credentials match between frontend and backend
- Ensure `AUTH0_AUDIENCE` matches in both applications
- Verify JWT token is being sent in Authorization header

### Auth0 login redirects fail
- Check that callback URLs are configured correctly in Auth0 dashboard
- Ensure `AUTH0_BASE_URL` matches your current environment
- Verify Auth0 application is properly set up

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Auth0 Next.js SDK](https://github.com/auth0/nextjs-auth0)
- [Auth0 Documentation](https://auth0.com/docs)

