# Datuum 2.0 Setup Checklist

Use this checklist to ensure proper setup of Datuum 2.0.

## Prerequisites

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Java 17+ installed (`java -version`)
- [ ] Maven 3.8+ installed (`mvn --version`)
- [ ] PostgreSQL 14+ installed (`psql --version`)
- [ ] PostgreSQL service running (`pg_isready`)
- [ ] Auth0 account created
- [ ] Git installed (optional, for version control)

## Auth0 Configuration

### Create Single Page Application (SPA)

- [ ] Logged into Auth0 Dashboard
- [ ] Created new SPA application named "Datuum Frontend"
- [ ] Noted down Domain (e.g., `dev-xxxxx.us.auth0.com`)
- [ ] Noted down Client ID
- [ ] Noted down Client Secret
- [ ] Added Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
- [ ] Added Allowed Logout URLs: `http://localhost:3000`
- [ ] Added Allowed Web Origins: `http://localhost:3000`

### Create API (Resource Server)

- [ ] Created new API named "Datuum API"
- [ ] Set Identifier to: `https://datuum.api`
- [ ] Selected RS256 as Signing Algorithm
- [ ] Noted down API Identifier (audience)

## Database Setup

- [ ] PostgreSQL service is running
- [ ] Created database: `CREATE DATABASE datuumdb;`
- [ ] Verified database exists: `psql -l | grep datuumdb`
- [ ] (Optional) Created dedicated user for the application
- [ ] (Optional) Applied schema: `psql -U postgres -d datuumdb -f database/schema.sql`

## Backend Configuration

- [ ] Navigated to `datuum-backend` directory
- [ ] Opened `src/main/resources/application.properties`
- [ ] Updated `spring.security.oauth2.resourceserver.jwt.issuer-uri` with Auth0 domain
- [ ] Updated `auth0.audience` with Auth0 API identifier
- [ ] Updated `spring.datasource.url` if using different database name
- [ ] Updated `spring.datasource.username` if using different user
- [ ] Updated `spring.datasource.password` with correct password

### Build Backend

- [ ] Ran `mvn clean install` successfully
- [ ] No build errors reported
- [ ] JAR file created in `target/` directory

### Test Backend

- [ ] Started backend: `mvn spring-boot:run`
- [ ] Backend running on port 8080
- [ ] Tested health endpoint: `curl http://localhost:8080/public/health`
- [ ] Health endpoint returns `{"status":"UP"}`
- [ ] No error logs in console

## Frontend Configuration

- [ ] Navigated to `datuum-frontend` directory
- [ ] Ran `npm install` successfully
- [ ] All dependencies installed without errors
- [ ] Copied `.env.local.template` to `.env.local`
- [ ] Opened `.env.local` for editing

### Environment Variables

- [ ] Generated random secret for `AUTH0_SECRET` (32+ characters)
- [ ] Set `AUTH0_BASE_URL=http://localhost:3000`
- [ ] Set `AUTH0_ISSUER_BASE_URL` to your Auth0 domain (with https://)
- [ ] Set `AUTH0_CLIENT_ID` from Auth0 SPA application
- [ ] Set `AUTH0_CLIENT_SECRET` from Auth0 SPA application
- [ ] Set `AUTH0_AUDIENCE=https://datuum.api` (or your API identifier)
- [ ] Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`

### Test Frontend

- [ ] Started frontend: `npm run dev`
- [ ] Frontend running on port 3000
- [ ] Opened browser to `http://localhost:3000`
- [ ] Landing page loads successfully
- [ ] No console errors in browser

## Integration Testing

### Test Authentication Flow

- [ ] Clicked "Login / Sign Up" button on landing page
- [ ] Redirected to Auth0 login page
- [ ] Logged in with Auth0 account (or created new account)
- [ ] Successfully redirected back to application
- [ ] Redirected to dashboard page
- [ ] User name displayed correctly on dashboard
- [ ] No authentication errors

### Test API Communication

- [ ] On dashboard, data loads from backend
- [ ] Items displayed (sample items if database is empty)
- [ ] No CORS errors in browser console
- [ ] No "Unauthorized" errors
- [ ] "Refresh" button works correctly
- [ ] Backend logs show successful JWT validation

### Test Logout

- [ ] Clicked "Logout" button
- [ ] Redirected to landing page
- [ ] Session cleared
- [ ] Accessing dashboard directly redirects to login

## Production Preparation

### Security

- [ ] Never committed `.env.local` to git
- [ ] Never committed `application.properties` with real credentials
- [ ] Used `.env.local.template` and `application.properties.example` for templates
- [ ] Generated secure random strings for secrets
- [ ] Reviewed `.gitignore` files

### Code Quality

- [ ] Frontend code lints without errors: `npm run lint`
- [ ] Backend tests pass: `mvn test`
- [ ] No obvious security vulnerabilities
- [ ] CORS configured appropriately

### Documentation

- [ ] Read `README.md`
- [ ] Read `QUICKSTART.md`
- [ ] Read `PROJECT_STRUCTURE.md`
- [ ] Understand authentication flow
- [ ] Understand API endpoints

## Troubleshooting Checks

If something doesn't work, verify:

### Backend Issues

- [ ] PostgreSQL is running: `pg_isready`
- [ ] Database exists: `psql -l | grep datuumdb`
- [ ] Can connect to database: `psql -U postgres -d datuumdb`
- [ ] Auth0 issuer URI is correct and ends with `/`
- [ ] Auth0 audience matches API identifier exactly
- [ ] Java version is 17 or higher
- [ ] Port 8080 is not already in use

### Frontend Issues

- [ ] Backend is running and accessible
- [ ] Node version is 18 or higher
- [ ] `.env.local` file exists and has all variables
- [ ] `AUTH0_SECRET` is at least 32 characters
- [ ] Auth0 callback URLs are configured correctly
- [ ] Port 3000 is not already in use
- [ ] `node_modules` folder exists (run `npm install`)

### Auth0 Issues

- [ ] Application type is "Single Page Application"
- [ ] Callback URLs include protocol (http://)
- [ ] No typos in callback URLs
- [ ] API audience matches between frontend and backend
- [ ] Issuer URI matches Auth0 domain
- [ ] Application is not disabled in Auth0

### CORS Issues

- [ ] Backend CORS allows `http://localhost:3000`
- [ ] Backend is actually running
- [ ] No browser extensions blocking requests
- [ ] Using correct URLs (localhost, not 127.0.0.1)

## Optional Enhancements

- [ ] Set up version control with git
- [ ] Initialize git repository: `git init`
- [ ] Make initial commit
- [ ] Set up CI/CD pipeline
- [ ] Configure logging and monitoring
- [ ] Add additional tests
- [ ] Set up development/staging/production environments
- [ ] Configure SSL/TLS for local development
- [ ] Set up database migrations (Liquibase/Flyway)
- [ ] Add API documentation (Swagger/OpenAPI)

## Deployment Checklist

When ready to deploy:

- [ ] Choose hosting platforms (Vercel for frontend, Heroku/Render for backend)
- [ ] Set up production PostgreSQL database
- [ ] Configure Auth0 for production URLs
- [ ] Set environment variables on hosting platforms
- [ ] Update CORS to allow production frontend URL
- [ ] Enable HTTPS (required for Auth0)
- [ ] Test production deployment
- [ ] Set up monitoring and logging
- [ ] Configure database backups
- [ ] Set up domain name and DNS

## Sign-Off

- [ ] All tests passing
- [ ] Authentication working end-to-end
- [ ] API calls working correctly
- [ ] No console errors
- [ ] Documentation reviewed
- [ ] Ready to start development or deploy

---

**Date Completed:** _______________

**Completed By:** _______________

**Notes:** _______________________________________________________________

________________________________________________________________________

