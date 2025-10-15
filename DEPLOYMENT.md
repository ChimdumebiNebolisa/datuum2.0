# Datuum 2.0 Deployment Guide

This guide covers deploying Datuum 2.0 to production.

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] Auth0 production application created
- [ ] Production database provisioned
- [ ] HTTPS/SSL certificates ready
- [ ] Domain name configured (optional)

## Deployment Architecture

```
Internet → Frontend (Vercel) → Backend (Render/Heroku) → Database (Managed PostgreSQL)
            ↓
          Auth0
```

## Option 1: Vercel (Frontend) + Render (Backend)

### Step 1: Deploy Backend to Render

1. **Sign up for Render** at [render.com](https://render.com)

2. **Create PostgreSQL Database:**
   - Click "New +"
   - Select "PostgreSQL"
   - Choose a name: `datuum-db`
   - Select region close to your users
   - Choose instance type (free tier available)
   - Note the **Internal Database URL**

3. **Create Web Service:**
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `datuum-backend`
     - **Environment:** `Java`
     - **Build Command:** `mvn clean install`
     - **Start Command:** `java -jar target/datuum-backend-2.0.0.jar`
     - **Instance Type:** Free or Starter

4. **Set Environment Variables:**
   ```
   SPRING_DATASOURCE_URL=<Internal_Database_URL>
   SPRING_DATASOURCE_USERNAME=<from Render>
   SPRING_DATASOURCE_PASSWORD=<from Render>
   SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=https://YOUR_AUTH0_DOMAIN/
   AUTH0_AUDIENCE=https://datuum.api
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for build to complete
   - Note your backend URL: `https://datuum-backend.onrender.com`

### Step 2: Configure Auth0 for Production

1. **Create Production Auth0 Application:**
   - Go to Auth0 Dashboard
   - Create new "Single Page Application"
   - Name: `Datuum Production`

2. **Configure URLs (will update after Vercel deployment):**
   - Allowed Callback URLs: `https://yourdomain.com/api/auth/callback`
   - Allowed Logout URLs: `https://yourdomain.com`
   - Allowed Web Origins: `https://yourdomain.com`

3. **Note credentials:**
   - Domain
   - Client ID
   - Client Secret

### Step 3: Deploy Frontend to Vercel

1. **Sign up for Vercel** at [vercel.com](https://vercel.com)

2. **Import Project:**
   - Click "New Project"
   - Import your Git repository
   - Root Directory: `datuum-frontend`
   - Framework Preset: Next.js

3. **Configure Environment Variables:**
   ```
   AUTH0_SECRET=<generate_new_random_string>
   AUTH0_BASE_URL=https://yourdomain.vercel.app
   AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN
   AUTH0_CLIENT_ID=<production_client_id>
   AUTH0_CLIENT_SECRET=<production_client_secret>
   AUTH0_AUDIENCE=https://datuum.api
   NEXT_PUBLIC_API_BASE_URL=https://datuum-backend.onrender.com
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Note your frontend URL: `https://yourdomain.vercel.app`

5. **Update Auth0 URLs:**
   - Go back to Auth0 dashboard
   - Update callback/logout/origin URLs with your Vercel domain

### Step 4: Update Backend CORS

1. **Update CorsConfig.java:**
   ```java
   .allowedOrigins(
       "http://localhost:3000",
       "https://yourdomain.vercel.app"
   )
   ```

2. **Commit and push changes** - Render will auto-deploy

### Step 5: Test Production Deployment

- [ ] Visit production frontend URL
- [ ] Test login flow
- [ ] Verify dashboard loads
- [ ] Test API calls
- [ ] Check for console errors
- [ ] Test logout

## Option 2: Vercel (Frontend) + Heroku (Backend)

### Deploy Backend to Heroku

1. **Install Heroku CLI:**
   ```bash
   # Windows
   winget install Heroku.HerokuCLI
   
   # macOS
   brew tap heroku/brew && brew install heroku
   ```

2. **Login to Heroku:**
   ```bash
   heroku login
   ```

3. **Create Heroku App:**
   ```bash
   cd datuum-backend
   heroku create datuum-backend
   ```

4. **Add PostgreSQL:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

5. **Configure Environment Variables:**
   ```bash
   heroku config:set SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=https://YOUR_AUTH0_DOMAIN/
   heroku config:set AUTH0_AUDIENCE=https://datuum.api
   ```

6. **Deploy:**
   ```bash
   git push heroku main
   ```

7. **Note backend URL:**
   ```
   https://datuum-backend.herokuapp.com
   ```

Continue with Steps 2-5 from Option 1 (configure Auth0, deploy frontend, update CORS, test).

## Option 3: AWS Deployment

### Backend on AWS Elastic Beanstalk

1. **Install EB CLI:**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB:**
   ```bash
   cd datuum-backend
   eb init
   ```

3. **Create Environment:**
   ```bash
   eb create datuum-backend-prod
   ```

4. **Configure RDS:**
   - Add PostgreSQL RDS instance through AWS Console
   - Configure security groups
   - Set environment variables in EB

5. **Deploy:**
   ```bash
   eb deploy
   ```

### Frontend on AWS Amplify

1. Connect GitHub repository
2. Select `datuum-frontend` as root
3. Configure build settings
4. Add environment variables
5. Deploy

## Database Migration

If you have existing data:

1. **Export from local:**
   ```bash
   pg_dump -U postgres datuumdb > backup.sql
   ```

2. **Import to production:**
   ```bash
   # Render
   psql <DATABASE_URL> < backup.sql
   
   # Heroku
   heroku pg:psql < backup.sql
   ```

## Post-Deployment Configuration

### 1. Enable Logging

**Backend (Spring Boot):**
- Configure log aggregation (Papertrail, Loggly)
- Set log levels appropriately
- Monitor application logs

**Frontend (Vercel):**
- Enable Vercel Analytics
- Configure error tracking (Sentry)

### 2. Set Up Monitoring

- Enable health check endpoints
- Configure uptime monitoring (UptimeRobot, Pingdom)
- Set up alerting for downtime

### 3. Configure Backups

**Database:**
- Enable automated backups
- Test restore procedures
- Set retention policy

**Code:**
- Ensure Git repository is backed up
- Tag releases

### 4. Security Hardening

- [ ] Enable HTTPS everywhere
- [ ] Configure CSP headers
- [ ] Enable rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular security updates
- [ ] Rotate Auth0 secrets periodically

### 5. Performance Optimization

**Frontend:**
- Enable Vercel Edge Network
- Optimize images
- Enable code splitting
- Configure caching headers

**Backend:**
- Enable database connection pooling
- Configure caching (Redis)
- Optimize database queries
- Enable compression

### 6. Domain Configuration

If using custom domain:

**Frontend (Vercel):**
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed

**Backend (Render/Heroku):**
1. Add custom domain in settings
2. Configure DNS CNAME record

**Update Auth0:**
- Update all URLs to use custom domain

## Environment Variables Reference

### Frontend (Production)

| Variable | Example | Description |
|----------|---------|-------------|
| `AUTH0_SECRET` | Random 32+ chars | Session encryption key |
| `AUTH0_BASE_URL` | `https://datuum.com` | Production frontend URL |
| `AUTH0_ISSUER_BASE_URL` | `https://prod.auth0.com` | Auth0 production domain |
| `AUTH0_CLIENT_ID` | From Auth0 | Production SPA client ID |
| `AUTH0_CLIENT_SECRET` | From Auth0 | Production client secret |
| `AUTH0_AUDIENCE` | `https://datuum.api` | Auth0 API identifier |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.datuum.com` | Production backend URL |

### Backend (Production)

| Variable | Example | Description |
|----------|---------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://...` | Database connection URL |
| `SPRING_DATASOURCE_USERNAME` | `dbuser` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | `secure_password` | Database password |
| `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI` | `https://prod.auth0.com/` | Auth0 issuer URI |
| `AUTH0_AUDIENCE` | `https://datuum.api` | Auth0 API audience |
| `SERVER_PORT` | `8080` | Application port |

## Rollback Procedure

If deployment fails:

### Vercel
1. Go to Deployments
2. Select previous working deployment
3. Click "Promote to Production"

### Render
1. Go to deployment history
2. Select previous version
3. Click "Redeploy"

### Heroku
```bash
heroku rollback
```

## Monitoring and Maintenance

### Daily
- [ ] Check application logs for errors
- [ ] Monitor uptime
- [ ] Review Auth0 logs for suspicious activity

### Weekly
- [ ] Review performance metrics
- [ ] Check database size/growth
- [ ] Review error rates

### Monthly
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Test backup restore procedure
- [ ] Review and optimize costs

## Cost Estimates

### Free Tier (Development/Small Projects)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | $0 |
| Render | Free | $0 |
| PostgreSQL (Render) | Free | $0 |
| Auth0 | Free | $0 |
| **Total** | | **$0/month** |

**Limitations:**
- 100 GB bandwidth/month (Vercel)
- 400 build minutes/month (Vercel)
- Apps sleep after inactivity (Render)
- 7,000 monthly active users (Auth0)

### Production (Paid Tier)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Render | Starter | $7/month |
| PostgreSQL (Render) | Standard | $25/month |
| Auth0 | Essentials | $35/month |
| **Total** | | **$87/month** |

### Enterprise

| Service | Plan | Estimated Cost |
|---------|------|----------------|
| AWS EC2 | t3.medium | $30/month |
| AWS RDS | db.t3.small | $50/month |
| AWS Route 53 | DNS | $5/month |
| Auth0 | Professional | $240/month |
| **Total** | | **$325/month** |

## Troubleshooting Production Issues

### 502 Bad Gateway
- Backend not responding
- Check backend logs
- Verify database connection
- Check environment variables

### Auth0 Errors
- Verify callback URLs
- Check Auth0 logs
- Ensure audience matches
- Verify issuer URI

### Database Connection Errors
- Check connection string
- Verify credentials
- Check security group rules
- Ensure database is running

### CORS Errors
- Update CORS configuration
- Include production domain
- Check HTTP vs HTTPS

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Heroku Documentation](https://devcenter.heroku.com)
- [Auth0 Documentation](https://auth0.com/docs)
- [Spring Boot Production Ready](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)

---

**Last Updated:** October 2025

