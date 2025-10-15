# Datuum Backend (Spring Boot)

This is the backend REST API for Datuum 2.0, built with Spring Boot, secured with Auth0 JWT authentication, and using PostgreSQL for data persistence.

## Prerequisites

- Java 17 or higher
- Maven 3.8+
- PostgreSQL 14+
- Auth0 account with configured API

## Setup

### 1. Database Setup

Create the PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE datuumdb;
\q
```

### 2. Configure Application Properties

Copy the example properties file:

```bash
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Edit `src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/datuumdb
spring.datasource.username=postgres
spring.datasource.password=your_postgres_password

# Auth0 Configuration
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://YOUR_AUTH0_DOMAIN/
auth0.audience=YOUR_AUTH0_API_AUDIENCE
```

**Important:** Replace placeholders with your actual values:
- `YOUR_AUTH0_DOMAIN` - Your Auth0 tenant domain (e.g., `dev-xxxxx.us.auth0.com`)
- `YOUR_AUTH0_API_AUDIENCE` - Your Auth0 API identifier (e.g., `https://datuum.api`)

### 3. Build the Project

```bash
mvn clean install
```

### 4. Run the Application

```bash
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

## Project Structure

```
datuum-backend/
├── src/
│   ├── main/
│   │   ├── java/com/datuum/backend/
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java          # Security & JWT configuration
│   │   │   │   ├── AudienceValidator.java       # Custom JWT audience validator
│   │   │   │   └── CorsConfig.java              # CORS configuration
│   │   │   ├── controller/
│   │   │   │   ├── ItemController.java          # REST endpoints for items
│   │   │   │   └── PublicController.java        # Public endpoints
│   │   │   ├── entity/
│   │   │   │   └── Item.java                    # JPA entity
│   │   │   ├── repository/
│   │   │   │   └── ItemRepository.java          # Data access layer
│   │   │   └── DatuumApplication.java           # Main application class
│   │   └── resources/
│   │       ├── application.properties            # Configuration
│   │       └── application.properties.example    # Configuration template
│   └── test/
└── pom.xml                                       # Maven dependencies
```

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/health` | Health check endpoint |
| GET | `/actuator/health` | Spring Boot actuator health |

### Protected Endpoints (Require JWT Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all items |
| GET | `/api/items/{id}` | Get item by ID |
| POST | `/api/items` | Create new item |
| PUT | `/api/items/{id}` | Update item |
| DELETE | `/api/items/{id}` | Delete item |
| GET | `/api/items/search?name={name}` | Search items by name |

## Authentication

All endpoints under `/api/**` require a valid JWT token from Auth0.

### Request Format

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### JWT Validation

The backend validates:
1. **Signature** - Token is signed by Auth0
2. **Issuer** - Token is issued by your Auth0 tenant
3. **Audience** - Token is intended for this API
4. **Expiration** - Token is not expired

## Testing the API

### Test Public Endpoint

```bash
curl http://localhost:8080/public/health
```

### Test Protected Endpoint (with token)

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/items
```

## Development

### Run Tests

```bash
mvn test
```

### Package for Production

```bash
mvn clean package
```

This creates a JAR file in `target/datuum-backend-2.0.0.jar`

### Run Packaged JAR

```bash
java -jar target/datuum-backend-2.0.0.jar
```

## Database Schema

The application uses Hibernate with `ddl-auto=update` to automatically create and update the schema.

### Items Table

```sql
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## CORS Configuration

By default, CORS is configured to allow requests from:
- `http://localhost:3000` (Next.js frontend)

For production, update `CorsConfig.java` to include your production domain:

```java
.allowedOrigins("http://localhost:3000", "https://yourdomain.com")
```

## Deployment

### Environment Variables for Production

Set these as environment variables instead of using application.properties:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://prod-host:5432/datuumdb
SPRING_DATASOURCE_USERNAME=prod_user
SPRING_DATASOURCE_PASSWORD=secure_password
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=https://your-auth0-domain/
AUTH0_AUDIENCE=https://datuum.api
```

### Deployment Platforms

#### Heroku
```bash
heroku create datuum-backend
heroku addons:create heroku-postgresql
heroku config:set AUTH0_AUDIENCE=https://datuum.api
git push heroku main
```

#### Render
1. Connect GitHub repository
2. Select "Web Service"
3. Set build command: `mvn clean install`
4. Set start command: `java -jar target/datuum-backend-2.0.0.jar`
5. Add environment variables

#### AWS Elastic Beanstalk
```bash
eb init
eb create datuum-backend-prod
eb deploy
```

## Security Considerations

1. **HTTPS Only** - Always use HTTPS in production
2. **Environment Variables** - Never commit credentials to version control
3. **CORS** - Restrict allowed origins to your frontend domain
4. **Rate Limiting** - Consider adding rate limiting for production
5. **SQL Injection** - Use parameterized queries (JPA handles this)
6. **Token Validation** - Ensure Auth0 JWT validation is properly configured

## Troubleshooting

### "Invalid issuer" error
- Check that `spring.security.oauth2.resourceserver.jwt.issuer-uri` matches your Auth0 domain
- Ensure the domain includes the trailing slash

### "Invalid audience" error
- Verify `auth0.audience` matches the identifier in your Auth0 API settings
- Ensure the frontend is requesting tokens with the correct audience

### Database connection errors
- Verify PostgreSQL is running: `pg_isready`
- Check database exists: `psql -l | grep datuumdb`
- Verify credentials in application.properties

### CORS errors
- Check that frontend URL is in `CorsConfig.java` allowed origins
- Ensure credentials are allowed if sending cookies

## Learn More

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security OAuth2](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
- [Auth0 Spring Boot SDK](https://auth0.com/docs/quickstart/backend/java-spring-security5)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)

