# Datuum 2.0 Quick Start Guide

Get Datuum 2.0 up and running in minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ and npm installed
- [ ] Java 17+ installed
- [ ] Maven 3.8+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Auth0 account created

## Step 1: Auth0 Setup (5 minutes)

### Create Auth0 Application

1. Go to [Auth0 Dashboard](https://auth0.com/)
2. Create a **Single Page Application**:
   - Name: `Datuum Frontend`
   - Copy **Domain**, **Client ID**, and **Client Secret**
   - Add callback: `http://localhost:3000/api/auth/callback`
   - Add logout URL: `http://localhost:3000`
   - Add web origin: `http://localhost:3000`

3. Create an **API**:
   - Name: `Datuum API`
   - Identifier: `https://datuum.api`
   - Signing Algorithm: RS256

## Step 2: Database Setup (2 minutes)

```bash
# Start PostgreSQL (if not running)
# Windows: Use Services or pg_ctl
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
psql -U postgres
CREATE DATABASE datuumdb;
\q

# Apply schema (optional - Spring Boot will auto-create tables)
psql -U postgres -d datuumdb -f database/schema.sql
```

## Step 3: Backend Setup (3 minutes)

```bash
cd datuum-backend

# Configure Auth0 and database
# Edit src/main/resources/application.properties:
# - Update spring.security.oauth2.resourceserver.jwt.issuer-uri
# - Update auth0.audience
# - Update database password if needed

# Build and run
mvn clean install
mvn spring-boot:run
```

Backend should start at `http://localhost:8080`

Test it: `curl http://localhost:8080/public/health`

## Step 4: Frontend Setup (3 minutes)

```bash
cd datuum-frontend

# Install dependencies
npm install

# Configure Auth0
# Copy and edit .env.local:
cp .env.local.template .env.local

# Edit .env.local with your Auth0 values:
# - AUTH0_SECRET (generate random 32+ char string)
# - AUTH0_ISSUER_BASE_URL (your Auth0 domain)
# - AUTH0_CLIENT_ID
# - AUTH0_CLIENT_SECRET
# - AUTH0_AUDIENCE

# Run development server
npm run dev
```

Frontend should start at `http://localhost:3000`

## Step 5: Test the Application (2 minutes)

1. Open browser to `http://localhost:3000`
2. Click **Login / Sign Up**
3. Create account or log in via Auth0
4. You should be redirected to the dashboard
5. The dashboard should display items fetched from the backend

## Troubleshooting

### Backend won't start
- Check Java version: `java -version` (should be 17+)
- Check PostgreSQL is running: `pg_isready`
- Check database exists: `psql -l | grep datuumdb`

### Frontend build errors
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (should be 18+)

### Auth0 errors
- Verify all URLs in Auth0 dashboard match exactly (including protocol)
- Check that AUTH0_AUDIENCE matches your API identifier
- Ensure issuer URI ends with trailing slash

### CORS errors
- Ensure backend CORS allows `http://localhost:3000`
- Check browser console for specific error messages

### Database connection errors
- Verify PostgreSQL is running
- Check username/password in application.properties
- Try connecting manually: `psql -U postgres -d datuumdb`

## What's Next?

Now that everything is running:

1. **Explore the Code**:
   - Check out the frontend pages in `datuum-frontend/pages/`
   - Review backend controllers in `datuum-backend/src/main/java/com/datuum/backend/controller/`

2. **Add Features**:
   - Create new REST endpoints in the backend
   - Add new pages to the frontend
   - Extend the Item entity or create new entities

3. **Customize**:
   - Update the landing page with your branding
   - Add more fields to the Item model
   - Implement additional Auth0 features (roles, permissions)

4. **Deploy**:
   - Frontend: Deploy to Vercel
   - Backend: Deploy to Heroku, Render, or AWS
   - Database: Use managed PostgreSQL service

## Useful Commands

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Run linter
```

### Backend
```bash
mvn spring-boot:run  # Run application
mvn test             # Run tests
mvn clean install    # Build project
mvn clean            # Clean build artifacts
```

### Database
```bash
psql -U postgres -d datuumdb           # Connect to database
psql -U postgres -d datuumdb -f file.sql  # Run SQL file
pg_dump -U postgres datuumdb > backup.sql  # Backup database
```

## Support

- Frontend: See `datuum-frontend/README.md`
- Backend: See `datuum-backend/README.md`
- Database: See `database/README.md`
- Architecture: See `Datuum_2.0_Dev_Plan.md`

Happy coding! 🚀

