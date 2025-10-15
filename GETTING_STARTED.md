# Getting Started with Datuum 2.0

Welcome to Datuum 2.0! This guide will help you get started with your new full-stack application.

## What Has Been Created

Your Datuum 2.0 project is now fully scaffolded with:

### ✅ Frontend (Next.js)
- Modern React-based web application
- Auth0 authentication integration
- Landing page and protected dashboard
- API routes for secure backend communication
- Responsive CSS styling
- Full TypeScript support

### ✅ Backend (Spring Boot)
- RESTful API with JWT authentication
- PostgreSQL database integration
- CRUD operations for items
- Security configuration with Auth0
- CORS configuration for frontend
- Unit and integration tests

### ✅ Database Setup
- PostgreSQL schema definition
- Auto-updating timestamps
- Indexed fields for performance
- Setup scripts and documentation

### ✅ Documentation
- Comprehensive README files
- Quick start guide
- Project structure documentation
- Setup checklist
- Deployment guide

## Your Next Steps

Follow these steps in order:

### 1. Set Up Auth0 (10 minutes)

**Why:** Auth0 handles user authentication securely

**Steps:**
1. Go to [auth0.com](https://auth0.com) and sign up
2. Create a Single Page Application
3. Create an API
4. Copy your credentials

📄 **Detailed instructions:** See `QUICKSTART.md` → "Step 1: Auth0 Setup"

### 2. Set Up Database (5 minutes)

**Why:** Your application needs a database to store data

**Steps:**
```bash
# Start PostgreSQL
# Windows: Check Services or use pg_ctl
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
psql -U postgres
CREATE DATABASE datuumdb;
\q
```

📄 **Detailed instructions:** See `database/README.md`

### 3. Configure Backend (5 minutes)

**Why:** Backend needs to know about your database and Auth0

**Steps:**
```bash
cd datuum-backend

# Edit src/main/resources/application.properties
# Update these lines:
# - spring.security.oauth2.resourceserver.jwt.issuer-uri=https://YOUR_AUTH0_DOMAIN/
# - auth0.audience=YOUR_AUTH0_API_IDENTIFIER
# - spring.datasource.password=YOUR_POSTGRES_PASSWORD
```

📄 **Detailed instructions:** See `datuum-backend/README.md`

### 4. Start Backend (2 minutes)

**Why:** The API server needs to be running

**Steps:**
```bash
cd datuum-backend
mvn clean install
mvn spring-boot:run
```

**Verify:** Open `http://localhost:8080/public/health` - should return `{"status":"UP"}`

### 5. Configure Frontend (5 minutes)

**Why:** Frontend needs Auth0 credentials to authenticate users

**Steps:**
```bash
cd datuum-frontend

# Copy environment template
cp .env.local.template .env.local

# Edit .env.local and fill in:
# - AUTH0_SECRET (generate random 32+ character string)
# - AUTH0_ISSUER_BASE_URL (your Auth0 domain)
# - AUTH0_CLIENT_ID (from Auth0 dashboard)
# - AUTH0_CLIENT_SECRET (from Auth0 dashboard)
# - AUTH0_AUDIENCE (your Auth0 API identifier)
```

📄 **Detailed instructions:** See `datuum-frontend/README.md`

### 6. Start Frontend (2 minutes)

**Why:** This is your user-facing application

**Steps:**
```bash
cd datuum-frontend
npm install
npm run dev
```

**Verify:** Open `http://localhost:3000` - should see landing page

### 7. Test the Application (5 minutes)

**Steps:**
1. Open `http://localhost:3000` in browser
2. Click "Login / Sign Up"
3. Create account or log in
4. View dashboard with items from backend
5. Test logout

✅ **If everything works:** You're ready to start developing!

❌ **If something fails:** See troubleshooting section below

## Key Files to Know

### Frontend
- `datuum-frontend/pages/index.js` - Landing page
- `datuum-frontend/pages/dashboard.js` - Protected dashboard
- `datuum-frontend/pages/api/data.js` - Backend communication
- `datuum-frontend/.env.local` - Your Auth0 credentials (don't commit!)

### Backend
- `datuum-backend/src/main/java/com/datuum/backend/controller/ItemController.java` - API endpoints
- `datuum-backend/src/main/java/com/datuum/backend/entity/Item.java` - Database model
- `datuum-backend/src/main/resources/application.properties` - Configuration

### Documentation
- `README.md` - Project overview
- `QUICKSTART.md` - Fast setup guide
- `PROJECT_STRUCTURE.md` - Complete project structure
- `SETUP_CHECKLIST.md` - Detailed checklist
- `DEPLOYMENT.md` - Production deployment guide

## Quick Troubleshooting

### Backend won't start
```bash
# Check Java version
java -version  # Should be 17+

# Check PostgreSQL
pg_isready

# Check if database exists
psql -l | grep datuumdb

# View backend logs for specific error
```

### Frontend won't start
```bash
# Check Node version
node -v  # Should be 18+

# Reinstall dependencies
rm -rf node_modules
npm install

# Check .env.local exists
ls .env.local
```

### Login fails
- Verify Auth0 callback URLs are exactly: `http://localhost:3000/api/auth/callback`
- Check that AUTH0_AUDIENCE matches between frontend and backend
- Ensure AUTH0_SECRET is at least 32 characters

### API calls fail
- Verify backend is running: `curl http://localhost:8080/public/health`
- Check browser console for CORS errors
- Verify NEXT_PUBLIC_API_BASE_URL is `http://localhost:8080`

📄 **More troubleshooting:** See individual README files or `SETUP_CHECKLIST.md`

## Learning the Codebase

### Understand the Authentication Flow

```
User → Frontend → Auth0 → Frontend (with token) → Backend (validates token) → Database
```

1. User clicks "Login" on landing page
2. Redirected to Auth0 login
3. After login, Auth0 redirects back with token
4. Frontend stores token in encrypted session
5. Frontend API routes extract token and send to backend
6. Backend validates token using Auth0 public key
7. If valid, backend processes request and returns data

### Understand the API Flow

**Frontend:**
```javascript
// In dashboard.js
fetch('/api/data')  // Calls Next.js API route
```

**Next.js API Route:**
```javascript
// pages/api/data.js
const { accessToken } = await getAccessToken(req, res);
fetch('http://localhost:8080/api/items', {
  headers: { Authorization: `Bearer ${accessToken}` }
})
```

**Backend:**
```java
// ItemController.java
@GetMapping("/api/items")  // Protected by Spring Security
public ResponseEntity<List<Item>> getAllItems() {
  // JWT already validated by SecurityConfig
  return itemRepository.findAll();
}
```

### Key Concepts

**JWT (JSON Web Token):**
- Issued by Auth0 after login
- Contains user information
- Cryptographically signed
- Backend validates signature

**Protected Routes:**
- Frontend: Uses `withPageAuthRequired()` HOC
- Backend: Uses Spring Security with JWT validation

**CORS (Cross-Origin Resource Sharing):**
- Allows frontend (port 3000) to call backend (port 8080)
- Configured in `CorsConfig.java`

## Customization Ideas

### Add New Entity
1. Create JPA entity in `backend/entity/`
2. Create repository interface
3. Create controller with endpoints
4. Create frontend page to display data

### Add New Page
1. Create new file in `datuum-frontend/pages/`
2. Use `withPageAuthRequired()` if it needs auth
3. Add navigation link from dashboard

### Customize Styling
- Edit CSS files in `datuum-frontend/styles/`
- Modify component styles as needed

### Add User Roles
1. Configure roles in Auth0
2. Add role claims to JWT
3. Check roles in backend controllers
4. Show/hide UI based on roles

## Development Workflow

```bash
# Terminal 1: Backend
cd datuum-backend
mvn spring-boot:run

# Terminal 2: Frontend  
cd datuum-frontend
npm run dev

# Terminal 3: Database
psql -U postgres -d datuumdb

# Make changes, test, commit
```

## Testing

### Backend Tests
```bash
cd datuum-backend
mvn test
```

### Frontend Tests
```bash
cd datuum-frontend
npm test  # (Add tests as you develop)
```

### Manual Testing
- Test login/logout flow
- Test all API endpoints
- Test with different users
- Test error cases

## Common Tasks

### Add New API Endpoint

**Backend:**
```java
@GetMapping("/api/items/featured")
public ResponseEntity<List<Item>> getFeaturedItems() {
    // Your logic
}
```

**Frontend:**
```javascript
const response = await fetch('/api/data');  // Already proxied
```

### Change Database Schema

1. Update entity class
2. Spring Boot auto-updates database (in development)
3. For production, use Liquibase/Flyway migrations

### Update Environment Variables

**Development:**
- Edit `.env.local` (frontend)
- Edit `application.properties` (backend)
- Restart applications

**Production:**
- Update in hosting platform dashboard

## Resources

### Official Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [Auth0 Docs](https://auth0.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Project Documentation
- `README.md` - Overview and setup
- `QUICKSTART.md` - Fast setup guide
- `PROJECT_STRUCTURE.md` - Architecture details
- `SETUP_CHECKLIST.md` - Complete checklist
- `DEPLOYMENT.md` - Production deployment
- `datuum-frontend/README.md` - Frontend details
- `datuum-backend/README.md` - Backend details
- `database/README.md` - Database details

## Need Help?

1. **Check documentation** in this repository
2. **Review Auth0 logs** at auth0.com dashboard
3. **Check application logs** in terminal
4. **Check browser console** for frontend errors
5. **Review the original dev plan** in `Datuum_2.0_Dev_Plan.md`

## Ready to Deploy?

When you're ready to go to production:

📄 **See:** `DEPLOYMENT.md` for complete deployment guide

Quick options:
- **Frontend:** Vercel (recommended, one-click deploy)
- **Backend:** Render or Heroku (easy setup)
- **Database:** Render PostgreSQL or Heroku Postgres

## What's Next?

Now that you have a working application:

1. ✅ **Test everything locally** - Make sure it all works
2. 🎨 **Customize the UI** - Add your branding and styling
3. 🔧 **Add your features** - Build what makes your app unique
4. 🧪 **Add tests** - Ensure quality
5. 🚀 **Deploy to production** - Share with users

**Happy coding! 🎉**

---

**Quick Links:**
- [Quick Start](QUICKSTART.md)
- [Setup Checklist](SETUP_CHECKLIST.md)
- [Project Structure](PROJECT_STRUCTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Frontend README](datuum-frontend/README.md)
- [Backend README](datuum-backend/README.md)
- [Database README](database/README.md)

