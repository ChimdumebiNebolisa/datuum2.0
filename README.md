# Datuum 2.0

A modern full-stack web application built with Next.js frontend and Spring Boot backend, featuring Auth0 authentication and PostgreSQL database.

## Architecture Overview

Datuum 2.0 is a hybrid web application with:

- **Frontend**: Next.js (React) with Auth0 authentication
- **Backend**: Spring Boot (Java) REST API with JWT validation
- **Database**: PostgreSQL
- **Authentication**: Auth0

## Project Structure

```
datuum2.0/
├── datuum-frontend/       # Next.js frontend application
├── datuum-backend/        # Spring Boot backend API
├── database/              # Database setup and migrations
└── README.md              # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) and npm
- **Java** (JDK 17 or higher)
- **Maven** (v3.8 or higher) or **Gradle**
- **PostgreSQL** (v14 or higher)
- **Auth0 Account** (free tier available at [auth0.com](https://auth0.com))

## Quick Start

### 1. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE datuumdb;
\q

# Optionally run schema
psql -U postgres -d datuumdb -f database/schema.sql
```

### 2. Backend Setup

```bash
cd datuum-backend
# Copy and configure application.properties with your Auth0 and DB credentials
cp src/main/resources/application.properties.example src/main/resources/application.properties

# Build and run
mvn clean install
mvn spring-boot:run
```

Backend will run at `http://localhost:8080`

### 3. Frontend Setup

```bash
cd datuum-frontend
npm install

# Copy and configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Auth0 credentials

# Run development server
npm run dev
```

Frontend will run at `http://localhost:3000`

## Auth0 Configuration

### Required Auth0 Setup:

1. **Create Auth0 Tenant** at [Auth0 Dashboard](https://auth0.com/)

2. **Create Single Page Application (SPA)**:
   - Navigate to Applications → Create Application
   - Select "Single Page Web Application"
   - Configure URLs:
     - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
     - Allowed Logout URLs: `http://localhost:3000`
     - Allowed Web Origins: `http://localhost:3000`

3. **Create API (Resource Server)**:
   - Navigate to APIs → Create API
   - Name: `Datuum API`
   - Identifier: `https://datuum.api` (use as audience)
   - Signing Algorithm: RS256

4. **Configure Environment Variables**:
   - Copy Domain, Client ID, and Client Secret to frontend `.env.local`
   - Copy Issuer URI and Audience to backend `application.properties`

## Development

### Frontend Development

```bash
cd datuum-frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
```

### Backend Development

```bash
cd datuum-backend
mvn spring-boot:run  # Run application
mvn test             # Run tests
mvn clean install    # Build project
```

## Testing the Application

1. Start PostgreSQL database
2. Start the backend server (port 8080)
3. Start the frontend dev server (port 3000)
4. Navigate to `http://localhost:3000`
5. Click "Login" to authenticate via Auth0
6. Access the dashboard to see authenticated content
7. The dashboard fetches data from the backend API using JWT tokens

## API Endpoints

### Public Endpoints
- `GET /public/health` - Health check

### Protected Endpoints (Require Authentication)
- `GET /api/items` - Get all items

## Deployment

### Frontend Deployment (Vercel)
- Connect GitHub repository to Vercel
- Configure Auth0 environment variables in Vercel dashboard
- Deploy automatically on push

### Backend Deployment (Heroku/Render/AWS)
- Configure database connection string
- Set Auth0 environment variables
- Update CORS settings for production domain
- Enable HTTPS (required for JWT security)

## Security Notes

- Always use HTTPS in production
- Keep Auth0 credentials secure and never commit to version control
- Rotate Auth0 secrets periodically
- Use environment variables for all sensitive configuration
- Enable CORS only for trusted domains in production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the GitHub repository.

