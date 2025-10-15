# Datuum 2.0 Development Plan

This section outlines the full development plan for **Datuum 2.0**, covering architecture, Auth0 integration, Next.js frontend, Spring Boot backend, and PostgreSQL database setup. It includes exact steps you (the developer) need to complete manually, so that your AI coding assistant (e.g., Cursor) can plan and scaffold code accordingly.

---

## 🧱 Architecture Overview

Datuum 2.0 is a **hybrid web app** built using **Next.js** for the frontend and **Spring Boot (Java)** for the backend API. The app uses **Auth0** for authentication and **PostgreSQL** as the primary database.

**Architecture Summary:**

- **Frontend (Next.js):**
  - Contains a **static landing page** (for marketing/SEO).
  - Includes an **SPA (Single Page Application)** for logged-in users.
  - Handles **Auth0 login**, callback, and logout flows.
  - Sends authenticated requests to the backend API with JWTs.

- **Backend (Spring Boot):**
  - Exposes REST API endpoints for the app.
  - Validates **Auth0-issued JWTs** on every protected route.
  - Communicates with a **PostgreSQL** database using **Spring Data JPA** or **Hibernate**.

- **Database (PostgreSQL):**
  - Stores user-related and application data.
  - Managed via JPA entities or Liquibase migrations.

---

## 🔐 Auth0 Integration Overview

Auth0 will manage login, registration, and issuing JWT tokens. The frontend initiates the login and passes the token to the backend for validation.

### Steps:

1. **Create an Auth0 Tenant**  
   Sign up or log in at [Auth0 Dashboard](https://auth0.com/).

2. **Create a Single Page Application (SPA):**
   - Navigate to **Applications → Create Application**.
   - Select “**Single Page Web Application**.”  
   - Record the **Domain**, **Client ID**, and **Client Secret**.

   Configure Allowed URLs:
   - **Callback URL:** `http://localhost:3000/api/auth/callback`
   - **Logout URL:** `http://localhost:3000`
   - **Allowed Web Origins:** `http://localhost:3000`

3. **Create a Backend API (Resource Server):**
   - Go to **APIs → Create API**.
   - Name it (e.g., `Datuum API`).
   - **Identifier:** something like `https://datuum.api` (this is the `audience`).
   - Use **RS256** signing algorithm.

4. **Link SPA to API:**  
   - Ensure the SPA app can request tokens for the new API.  
   - You’ll pass the `audience` to Auth0 in the frontend config.

You’ll use the following environment variables in both frontend and backend configs:

```
AUTH0_DOMAIN=dev-xxxxx.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://datuum.api
```

---

## 💻 Frontend: Next.js Setup

### 1. Initialize Project
```bash
npx create-next-app datuum-frontend
cd datuum-frontend
npm install @auth0/nextjs-auth0
```

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```
AUTH0_SECRET=LONG_RANDOM_STRING
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://dev-xxxxx.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://datuum.api
```

### 3. Auth Routes Setup

Add `pages/api/auth/[...auth0].js`:

```js
import { handleAuth } from '@auth0/nextjs-auth0';
export default handleAuth();
```

This automatically sets up:
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/callback`

### 4. Protected Pages

Example: `pages/dashboard.js`

```js
import { withPageAuthRequired } from '@auth0/nextjs-auth0';

function Dashboard({ user }) {
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <a href="/api/auth/logout">Logout</a>
    </div>
  );
}

export default withPageAuthRequired(Dashboard);
```

### 5. Calling the Backend API

Use `getAccessToken` in API routes:

```js
// pages/api/data.js
import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function handler(req, res) {
  const { accessToken } = await getAccessToken(req, res);
  const apiRes = await fetch(`${process.env.API_BASE_URL}/api/items`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await apiRes.json();
  res.status(200).json(data);
});
```

### 6. Landing Page Setup

Create a static landing page at `pages/index.js`:
- Describe Datuum’s purpose and features.
- Add a **Login / Sign Up** CTA linking to `/api/auth/login`.

---

## ☕ Backend: Spring Boot Setup

### 1. Generate Project

Go to [start.spring.io](https://start.spring.io) and create a new project with:
- Dependencies: Web, Security, OAuth2 Resource Server, Data JPA, PostgreSQL.

Download and open in your IDE.

### 2. Configure `application.properties`

```properties
server.port=8080

spring.datasource.url=jdbc:postgresql://localhost:5432/datuumdb
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update

spring.security.oauth2.resourceserver.jwt.issuer-uri=https://dev-xxxxx.us.auth0.com/
auth0.audience=https://datuum.api
```

### 3. Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/public/**").permitAll()
        .anyRequest().authenticated()
      )
      .oauth2ResourceServer(oauth2 -> oauth2.jwt());
    return http.build();
  }
}
```

### 4. CORS Configuration

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
      .allowedOrigins("http://localhost:3000")
      .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
      .allowedHeaders("*");
  }
}
```

### 5. REST Controller Example

```java
@RestController
@RequestMapping("/api/items")
public class ItemController {

  @GetMapping
  public List<Item> getItems() {
    return List.of(new Item("Example Item", "Demo Description"));
  }
}
```

### 6. PostgreSQL Integration

**Entity Example:**
```java
@Entity
public class Item {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String name;
  private String description;
}
```

**Repository Example:**
```java
public interface ItemRepository extends JpaRepository<Item, Long> {}
```

---

## ⚙️ Deployment Checklist

| Task | Description |
|------|-------------|
| **Environment Variables** | Set Auth0 keys and DB credentials on the server. |
| **CORS** | Update allowed origins to production domain. |
| **Database Migrations** | Consider Liquibase or Flyway for schema versioning. |
| **HTTPS** | Always use HTTPS in production for JWT security. |
| **Frontend/Backend Deployment** | Host on Vercel (Next.js) and Render/Heroku/AWS (Spring Boot). |

---

## ✅ Developer Actions (Your To-Do)

1. **Set up Auth0 Tenant and API** (see above steps).  
2. **Initialize Next.js Frontend** and test Auth0 login flow.  
3. **Create Spring Boot API** and secure endpoints using JWTs.  
4. **Integrate PostgreSQL**, define models and repositories.  
5. **Connect Frontend to Backend** using access tokens.  
6. **Test full flow:** Login → Fetch Data → Logout.  
7. **Prepare environment configs for deployment.**

---

**End of Dev Section — Datuum 2.0 Development Guide**
