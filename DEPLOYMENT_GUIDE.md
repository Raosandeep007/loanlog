# LoanLog - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Mobile App Deployment](#mobile-app-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14 or higher
- **Git**: Latest version
- **Docker** (optional): For containerized deployment

### Required Accounts
- AWS account (for S3 storage)
- Twilio account (for SMS notifications)
- SendGrid/Gmail (for email notifications)
- Apple Developer account (for iOS)
- Google Play Console account (for Android)

---

## Backend Deployment

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/loanlog.git
cd loanlog/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**
```bash
# Create database
createdb loanlog_dev

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed
```

5. **Start development server**
```bash
npm run dev
```

Server will run on `http://localhost:3000`

### Production Deployment

#### Option 1: Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login and create app**
```bash
heroku login
heroku create loanlog-api
```

3. **Add PostgreSQL**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

4. **Set environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
heroku config:set AWS_ACCESS_KEY_ID=your-key
heroku config:set AWS_SECRET_ACCESS_KEY=your-secret
# Add all other environment variables
```

5. **Deploy**
```bash
git push heroku main
```

6. **Run migrations**
```bash
heroku run npm run migrate
```

#### Option 2: AWS EC2

1. **Launch EC2 instance**
   - Instance type: t3.medium or higher
   - OS: Ubuntu 22.04 LTS
   - Security groups: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Connect to instance**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

4. **Install PostgreSQL**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE DATABASE loanlog_prod;"
sudo -u postgres psql -c "CREATE USER loanlog WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE loanlog_prod TO loanlog;"
```

5. **Clone and setup application**
```bash
git clone https://github.com/yourusername/loanlog.git
cd loanlog/backend
npm install --production
```

6. **Configure environment**
```bash
nano .env
# Add production configuration
```

7. **Run migrations**
```bash
npm run migrate
```

8. **Start with PM2**
```bash
pm2 start src/app.js --name loanlog-api
pm2 save
pm2 startup
```

9. **Setup Nginx reverse proxy**
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/loanlog
```

Add configuration:
```nginx
server {
    listen 80;
    server_name api.loanlog.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/loanlog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

10. **Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.loanlog.app
```

#### Option 3: Docker

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
```

2. **Create docker-compose.yml**
```yaml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=loanlog
      - DB_USER=postgres
      - DB_PASSWORD=postgres
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=loanlog
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

3. **Build and run**
```bash
docker-compose up -d
```

---

## Mobile App Deployment

### React Native Setup

1. **Navigate to mobile directory**
```bash
cd loanlog/mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Set API_URL to your backend URL
```

### iOS Deployment

1. **Install dependencies**
```bash
cd ios
pod install
cd ..
```

2. **Open in Xcode**
```bash
open ios/LoanLog.xcworkspace
```

3. **Configure signing**
   - Select your development team
   - Configure bundle identifier
   - Enable automatic signing

4. **Archive and upload**
   - Product → Archive
   - Upload to App Store Connect
   - Submit for review

5. **TestFlight**
   - Add testers in App Store Connect
   - Distribute build to testers

### Android Deployment

1. **Generate signing key**
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore loanlog.keystore -alias loanlog -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure Gradle**
Edit `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('loanlog.keystore')
            storePassword 'your-password'
            keyAlias 'loanlog'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

3. **Build release APK**
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

4. **Build App Bundle (for Play Store)**
```bash
./gradlew bundleRelease
```

Bundle location: `android/app/build/outputs/bundle/release/app-release.aab`

5. **Upload to Play Console**
   - Go to Google Play Console
   - Create new release
   - Upload AAB file
   - Complete store listing
   - Submit for review

---

## Database Setup

### PostgreSQL Configuration

1. **Install PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

2. **Create database and user**
```sql
CREATE DATABASE loanlog_prod;
CREATE USER loanlog WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE loanlog_prod TO loanlog;
```

3. **Configure connection**
```bash
# Edit postgresql.conf
listen_addresses = '*'

# Edit pg_hba.conf
host    loanlog_prod    loanlog    0.0.0.0/0    md5
```

4. **Restart PostgreSQL**
```bash
sudo systemctl restart postgresql
```

### Database Migrations

```bash
# Create migration
npm run migrate:create -- --name add-new-feature

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:undo

# Rollback all migrations
npm run migrate:undo:all
```

### Database Backup

1. **Manual backup**
```bash
pg_dump -U loanlog -h localhost loanlog_prod > backup.sql
```

2. **Automated backup script**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U loanlog loanlog_prod | gzip > /backups/loanlog_$DATE.sql.gz

# Keep only last 7 days
find /backups -name "loanlog_*.sql.gz" -mtime +7 -delete
```

3. **Schedule with cron**
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

---

## Environment Configuration

### Backend Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=loanlog_prod
DB_USER=loanlog
DB_PASSWORD=secure-password

# JWT
JWT_SECRET=very-long-random-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=loanlog-attachments

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@loanlog.app

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=true
```

### Mobile Environment Variables

```bash
# API Configuration
REACT_APP_API_URL=https://api.loanlog.app/v1
REACT_APP_ENV=production

# Analytics
REACT_APP_MIXPANEL_TOKEN=your-token
REACT_APP_SENTRY_DSN=your-dsn

# Feature Flags
REACT_APP_ENABLE_BIOMETRIC=true
REACT_APP_ENABLE_DARK_MODE=true
```

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy LoanLog

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "loanlog-api"
          heroku_email: "your@email.com"

  deploy-mobile:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - name: Build iOS
        run: |
          cd ios
          pod install
          xcodebuild -workspace LoanLog.xcworkspace -scheme LoanLog archive
```

---

## Monitoring & Maintenance

### Health Checks

1. **Setup health check endpoint** (already implemented at `/health`)

2. **Monitor with Pingdom/UptimeRobot**
   - Add endpoint: `https://api.loanlog.app/health`
   - Check interval: 5 minutes
   - Alert on failure

### Error Tracking

1. **Sentry Setup**
```bash
npm install @sentry/node
```

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV
});
```

### Performance Monitoring

1. **New Relic Setup**
```bash
npm install newrelic
```

2. **Add to app.js**
```javascript
require('newrelic');
```

### Log Management

1. **Winston for logging** (already configured)

2. **Send logs to ELK Stack**
```javascript
const winston = require('winston');
const ElasticsearchTransport = require('winston-elasticsearch');

const logger = winston.createLogger({
  transports: [
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: 'http://localhost:9200' }
    })
  ]
});
```

### Backup Strategy

1. **Database**: Daily automated backups
2. **Attachments**: S3 versioning enabled
3. **Code**: Git repository with tags
4. **Configuration**: Encrypted secrets in vault

### Security Updates

1. **Regular dependency updates**
```bash
npm audit
npm audit fix
```

2. **Automated security scanning**
```bash
npm install -g snyk
snyk test
```

3. **SSL certificate renewal**
```bash
certbot renew --dry-run
```

---

## Troubleshooting

### Common Issues

**Database connection failed**
- Check DATABASE_URL environment variable
- Verify PostgreSQL is running
- Check firewall rules

**API not responding**
- Check server logs: `pm2 logs`
- Verify environment variables
- Check Nginx configuration

**Mobile app can't connect**
- Verify API_URL in mobile .env
- Check CORS settings in backend
- Ensure API is accessible from internet

### Support

For issues:
- GitHub Issues: https://github.com/yourusername/loanlog/issues
- Email: support@loanlog.app
- Documentation: https://docs.loanlog.app
