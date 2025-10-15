<!-- dc6bb5ea-5e43-43c5-a8d0-c1b5009d116c d61090cc-217b-452c-9b8d-e4de807e9830 -->
# Scaffold Complete Datuum 2.0 Project

## Frontend: Next.js Setup

### Project Initialization

- Create `datuum-frontend` directory structure
- Initialize Next.js project with TypeScript support
- Install dependencies: `@auth0/nextjs-auth0`, React, Next.js

### Auth0 Configuration

- Create `.env.local` with placeholder Auth0 credentials:
- AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL
- AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_AUDIENCE
- NEXT_PUBLIC_API_BASE_URL for backend communication
- Create `pages/api/auth/[...auth0].js` for Auth0 routes (login/logout/callback)

### Pages & Components

- **Landing Page** (`pages/index.js`): Static marketing page with login CTA
- **Dashboard** (`pages/dashboard.js`): Protected page using `withPageAuthRequired`
- **API Route** (`pages/api/data.js`): Proxy to backend with access token
- Basic UI components and styling

### Configuration Files

- `package.json` with all dependencies
- `next.config.js` for Next.js configuration
- `README.md` with setup and run instructions

## Backend: Spring Boot Setup

### Project Structure

- Create `datuum-backend` directory with standard Maven/Gradle structure
- Package structure: `com.datuum.backend`
- `config/` - Security and CORS configuration
- `controller/` - REST controllers
- `entity/` - JPA entities
- `repository/` - Data repositories
- `DatuumApplication.java` - Main application class

### Configuration

- `application.properties`:
- Server port (8080)
- PostgreSQL datasource (localhost:5432/datuumdb)
- JPA/Hibernate settings
- Auth0 JWT issuer URI and audience (placeholders)
- `pom.xml` or `build.gradle` with dependencies:
- Spring Web, Security, OAuth2 Resource Server
- Spring Data JPA, PostgreSQL driver

### Security & CORS

- `SecurityConfig.java`: Configure JWT validation and endpoint protection
- `CorsConfig.java`: Allow requests from Next.js frontend (localhost:3000)

### Sample Entity & API

- `Item.java`: JPA entity with id, name, description
- `ItemRepository.java`: JpaRepository interface
- `ItemController.java`: REST controller at `/api/items` with GET endpoint

### Documentation

- `README.md`: Setup instructions, database setup, how to run
- `.env.example` or application properties template

## Database Setup

- Create `database/` directory with:
- `schema.sql`: Initial database schema
- `README.md`: PostgreSQL setup instructions (createdb, user setup)

## Root Documentation

- Root `README.md`: Project overview, architecture, getting started guide
- `.gitignore`: Ignore node_modules, .env files, target/, build/

### To-dos

- [ ] Create root project structure with frontend and backend directories
- [ ] Initialize Next.js frontend with Auth0 integration and placeholder credentials
- [ ] Create landing page, dashboard, and API routes for frontend
- [ ] Initialize Spring Boot backend with Maven/Gradle and required dependencies
- [ ] Configure Spring Security with JWT validation and CORS
- [ ] Create Item entity, repository, and REST controller
- [ ] Create README files for root, frontend, backend, and database setup