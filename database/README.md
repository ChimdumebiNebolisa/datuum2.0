# Database Setup

This directory contains database schema and setup instructions for Datuum 2.0.

## PostgreSQL Installation

### Windows
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Remember your postgres user password
4. Default port: 5432

### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Database Setup

### 1. Create Database

Connect to PostgreSQL:
```bash
psql -U postgres
```

Create the database:
```sql
CREATE DATABASE datuumdb;
```

Create a dedicated user (optional but recommended):
```sql
CREATE USER datuumuser WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE datuumdb TO datuumuser;
```

Exit psql:
```sql
\q
```

### 2. Run Schema

Apply the schema to your database:
```bash
psql -U postgres -d datuumdb -f schema.sql
```

Or if using the dedicated user:
```bash
psql -U datuumuser -d datuumdb -f schema.sql
```

### 3. Verify Setup

Check that tables were created:
```bash
psql -U postgres -d datuumdb -c "\dt"
```

You should see the `items` table listed.

## Database Configuration

Update the backend's `application.properties` with your database credentials:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/datuumdb
spring.datasource.username=postgres
spring.datasource.password=your_password
```

Or use environment variables (recommended for production):
```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/datuumdb
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=your_password
```

## Schema Management

### Auto-Update (Development)

The Spring Boot backend is configured with `spring.jpa.hibernate.ddl-auto=update`, which automatically creates and updates tables based on JPA entities.

This is convenient for development but not recommended for production.

### Manual Migrations (Production)

For production, consider using:

1. **Liquibase** - Add to pom.xml:
```xml
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
</dependency>
```

2. **Flyway** - Add to pom.xml:
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
```

## Common Commands

### Connect to Database
```bash
psql -U postgres -d datuumdb
```

### List Databases
```sql
\l
```

### List Tables
```sql
\dt
```

### Describe Table
```sql
\d items
```

### View Data
```sql
SELECT * FROM items;
```

### Backup Database
```bash
pg_dump -U postgres datuumdb > backup.sql
```

### Restore Database
```bash
psql -U postgres datuumdb < backup.sql
```

### Drop and Recreate (CAUTION: Deletes all data)
```bash
psql -U postgres -c "DROP DATABASE datuumdb;"
psql -U postgres -c "CREATE DATABASE datuumdb;"
psql -U postgres -d datuumdb -f schema.sql
```

## Troubleshooting

### "Connection refused" error
- Check PostgreSQL is running: `pg_isready`
- Start PostgreSQL: `sudo systemctl start postgresql` (Linux) or `brew services start postgresql` (macOS)

### "Database does not exist" error
- Create the database: `createdb -U postgres datuumdb`

### "Password authentication failed" error
- Reset password: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'newpassword';"`

### "Permission denied" error
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE datuumdb TO your_user;`

## Security Best Practices

1. **Never use default passwords** in production
2. **Create dedicated database users** with limited privileges
3. **Use SSL/TLS** for database connections in production
4. **Regular backups** - Automate with cron jobs
5. **Monitor connections** - Set appropriate `max_connections`
6. **Use connection pooling** - Already configured in Spring Boot

## Production Deployment

For production databases, consider:

1. **Managed Database Services**:
   - AWS RDS PostgreSQL
   - Heroku Postgres
   - Google Cloud SQL
   - DigitalOcean Managed Databases

2. **Connection String Format**:
```
postgresql://username:password@host:port/database?sslmode=require
```

3. **Environment Variables**:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/datuumdb?sslmode=require
```

## Schema Version

Current schema version: 1.0.0

### Tables
- `items` - Main items table with auto-timestamps

### Indexes
- `idx_items_name` - Index on item name for search optimization

### Triggers
- `update_items_updated_at` - Auto-updates `updated_at` timestamp on row updates

