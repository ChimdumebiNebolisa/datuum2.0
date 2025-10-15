# Datuum 2.0 Project Structure

This document provides a complete overview of the project structure.

## Root Directory

```
datuum2.0/
├── datuum-frontend/          # Next.js frontend application
├── datuum-backend/           # Spring Boot backend API
├── database/                 # Database schemas and setup
├── .gitignore               # Git ignore rules
├── README.md                # Main project documentation
├── QUICKSTART.md            # Quick start guide
├── PROJECT_STRUCTURE.md     # This file
└── Datuum_2.0_Dev_Plan.md  # Original development plan
```

## Frontend Structure (Next.js)

```
datuum-frontend/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...auth0].js      # Auth0 authentication routes
│   │   └── data.js                # API proxy to backend
│   ├── _app.js                    # App wrapper with Auth0 provider
│   ├── index.js                   # Landing page
│   └── dashboard.js               # Protected dashboard page
├── styles/
│   ├── globals.css                # Global styles
│   ├── Home.module.css            # Landing page styles
│   └── Dashboard.module.css       # Dashboard styles
├── public/
│   └── favicon.ico                # Favicon
├── .env.local.template            # Environment variables template
├── .gitignore                     # Frontend-specific ignores
├── next.config.js                 # Next.js configuration
├── package.json                   # Node dependencies
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Frontend documentation
```

### Key Frontend Files

| File | Purpose |
|------|---------|
| `pages/index.js` | Public landing page with Auth0 login |
| `pages/dashboard.js` | Protected page requiring authentication |
| `pages/api/auth/[...auth0].js` | Handles Auth0 login/logout/callback |
| `pages/api/data.js` | Server-side API route that calls backend |
| `pages/_app.js` | Wraps app with Auth0 UserProvider |

## Backend Structure (Spring Boot)

```
datuum-backend/
├── src/
│   ├── main/
│   │   ├── java/com/datuum/backend/
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java      # Spring Security & JWT
│   │   │   │   ├── AudienceValidator.java   # Custom JWT validator
│   │   │   │   └── CorsConfig.java          # CORS configuration
│   │   │   ├── controller/
│   │   │   │   ├── ItemController.java      # REST API for items
│   │   │   │   └── PublicController.java    # Public endpoints
│   │   │   ├── entity/
│   │   │   │   └── Item.java                # JPA entity
│   │   │   ├── repository/
│   │   │   │   └── ItemRepository.java      # Data access layer
│   │   │   └── DatuumApplication.java       # Main Spring Boot class
│   │   └── resources/
│   │       ├── application.properties        # Configuration
│   │       └── application.properties.example # Config template
│   └── test/
│       └── java/com/datuum/backend/
│           ├── DatuumApplicationTests.java
│           └── controller/
│               ├── ItemControllerTest.java
│               └── PublicControllerTest.java
├── .gitignore                    # Backend-specific ignores
├── mvnw                          # Maven wrapper (Unix)
├── mvnw.cmd                      # Maven wrapper (Windows)
├── pom.xml                       # Maven dependencies
└── README.md                     # Backend documentation
```

### Key Backend Files

| File | Purpose |
|------|---------|
| `DatuumApplication.java` | Main Spring Boot application entry point |
| `SecurityConfig.java` | Configures JWT validation and endpoint security |
| `AudienceValidator.java` | Validates Auth0 JWT audience claim |
| `CorsConfig.java` | Allows frontend to call backend APIs |
| `Item.java` | JPA entity representing database table |
| `ItemRepository.java` | Spring Data JPA repository interface |
| `ItemController.java` | REST controller with CRUD operations |
| `application.properties` | Database and Auth0 configuration |

## Database Structure

```
database/
├── schema.sql          # PostgreSQL schema definition
└── README.md          # Database setup instructions
```

### Database Schema

**Tables:**
- `items` - Main items table with CRUD operations
  - `id` (BIGSERIAL, PRIMARY KEY)
  - `name` (VARCHAR(255), NOT NULL)
  - `description` (VARCHAR(1000))
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_items_name` - For efficient name searches

**Triggers:**
- `update_items_updated_at` - Auto-updates timestamp on modification

## API Endpoints

### Frontend Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Landing page |
| `/dashboard` | Protected | User dashboard |
| `/api/auth/login` | Auth | Initiates Auth0 login |
| `/api/auth/logout` | Auth | Logs user out |
| `/api/auth/callback` | Auth | Auth0 callback handler |
| `/api/data` | Protected | Proxy to backend API |

### Backend API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/public/health` | No | Health check |
| GET | `/api/items` | Yes | Get all items |
| GET | `/api/items/{id}` | Yes | Get item by ID |
| POST | `/api/items` | Yes | Create item |
| PUT | `/api/items/{id}` | Yes | Update item |
| DELETE | `/api/items/{id}` | Yes | Delete item |
| GET | `/api/items/search?name={name}` | Yes | Search items |

## Authentication Flow

```
1. User clicks "Login" on landing page
   ↓
2. Redirected to Auth0 login page
   ↓
3. User authenticates with Auth0
   ↓
4. Auth0 redirects to /api/auth/callback with code
   ↓
5. Frontend exchanges code for tokens (ID + Access)
   ↓
6. Tokens stored in encrypted session cookie
   ↓
7. User accesses protected pages (e.g., /dashboard)
   ↓
8. Frontend API routes retrieve access token from session
   ↓
9. Access token sent to backend in Authorization header
   ↓
10. Backend validates JWT and processes request
```

## Data Flow

```
Frontend (Browser)
    ↓ HTTP Request with JWT
Frontend API Route (/api/data)
    ↓ Extract token from session
    ↓ Forward request with Authorization header
Backend API (/api/items)
    ↓ Validate JWT (signature, issuer, audience)
    ↓ Spring Security authorizes request
Controller (ItemController)
    ↓ Business logic
Repository (ItemRepository)
    ↓ JPA/Hibernate
PostgreSQL Database
    ↓ Query results
    ↑ Response flows back through layers
```

## Configuration Files

### Frontend Environment Variables
```
AUTH0_SECRET                    # Random secret for session encryption
AUTH0_BASE_URL                  # Frontend URL (http://localhost:3000)
AUTH0_ISSUER_BASE_URL          # Auth0 domain
AUTH0_CLIENT_ID                # Auth0 SPA Client ID
AUTH0_CLIENT_SECRET            # Auth0 SPA Client Secret
AUTH0_AUDIENCE                 # Auth0 API audience
NEXT_PUBLIC_API_BASE_URL       # Backend URL (http://localhost:8080)
```

### Backend Configuration
```properties
server.port                                           # 8080
spring.datasource.url                                 # PostgreSQL URL
spring.datasource.username                            # Database user
spring.datasource.password                            # Database password
spring.security.oauth2.resourceserver.jwt.issuer-uri  # Auth0 domain
auth0.audience                                        # Auth0 API identifier
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: JavaScript/React
- **Auth**: @auth0/nextjs-auth0
- **Styling**: CSS Modules

### Backend
- **Framework**: Spring Boot 3.2
- **Language**: Java 17
- **Security**: Spring Security + OAuth2 Resource Server
- **Database Access**: Spring Data JPA
- **Server**: Embedded Tomcat

### Database
- **RDBMS**: PostgreSQL 14+
- **ORM**: Hibernate (via Spring Data JPA)

### Authentication
- **Provider**: Auth0
- **Protocol**: OAuth2 / OpenID Connect
- **Token Type**: JWT (RS256)

## Development Workflow

1. **Start PostgreSQL** - Ensure database is running
2. **Start Backend** - Run Spring Boot application (port 8080)
3. **Start Frontend** - Run Next.js dev server (port 3000)
4. **Make Changes** - Edit code in respective directories
5. **Test** - Use browser and API testing tools
6. **Commit** - Git commit changes

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              Production Environment              │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────┐    ┌──────────────────┐  │
│  │   Vercel/CDN     │    │  Heroku/Render   │  │
│  │  (Next.js App)   │◄───┤  (Spring Boot)   │  │
│  └──────────────────┘    └──────────────────┘  │
│          │                        │             │
│          │                        │             │
│          ▼                        ▼             │
│  ┌──────────────────┐    ┌──────────────────┐  │
│  │     Auth0        │    │   PostgreSQL     │  │
│  │  (Authentication)│    │   (Managed DB)   │  │
│  └──────────────────┘    └──────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

## File Naming Conventions

- **Frontend**: 
  - Pages: `kebab-case.js` (e.g., `dashboard.js`)
  - Components: `PascalCase.js` (e.g., `UserProfile.js`)
  - Styles: `*.module.css`

- **Backend**:
  - Classes: `PascalCase.java` (e.g., `ItemController.java`)
  - Packages: `lowercase` (e.g., `com.datuum.backend.controller`)

## Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use TypeScript** - For better type safety (frontend)
3. **Write tests** - Unit and integration tests
4. **Follow REST conventions** - Use proper HTTP methods
5. **Validate input** - Both frontend and backend
6. **Handle errors gracefully** - User-friendly error messages
7. **Use HTTPS in production** - Always encrypt in transit
8. **Keep dependencies updated** - Regular security updates

## Next Steps

After scaffolding, you should:

1. Configure Auth0 with your actual credentials
2. Test the full authentication flow
3. Add your custom business logic
4. Implement additional entities and endpoints
5. Add comprehensive tests
6. Prepare for deployment

---

For more details, see individual README files in each directory.

