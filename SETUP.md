# LoanLog - Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **npm** (v9 or higher)
   ```bash
   npm --version
   ```

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

4. **Expo Go App** (for testing on physical device)
   - Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Raosandeep007/loanlog.git
cd loanlog
```

### 2. Install Dependencies

```bash
# Install root workspace dependencies
npm install

# Install app dependencies
cd app
npm install
```

### 3. Initialize Database

```bash
# Generate Drizzle migrations
npm run db:generate
```

### 4. Start Development Server

```bash
# From app directory
npm start

# Or from root directory
npm run app
```

This will start the Expo development server and show a QR code.

### 5. Run on Device/Emulator

**Option A: Physical Device**
1. Install Expo Go app on your phone
2. Scan the QR code from the terminal
3. App will load on your device

**Option B: iOS Simulator** (Mac only)
```bash
npm run app:ios
```

**Option C: Android Emulator**
```bash
npm run app:android
```

**Option D: Web Browser**
```bash
npm run app:web
```

## Project Structure

```
loanlog/
├── app/                       # Expo application
│   ├── app/                  # Screens (Expo Router)
│   │   ├── _layout.tsx      # Root layout
│   │   ├── index.tsx        # Dashboard
│   │   └── loans/           # Loan screens
│   ├── components/          # Reusable components
│   ├── src/                 # Business logic
│   │   ├── db/             # Database & schema
│   │   ├── services/       # Business services
│   │   └── utils/          # Utilities
│   ├── global.css          # NativeWind styles
│   └── package.json        # Dependencies
└── package.json            # Root config
```

## Database

### Schema Overview

The app uses SQLite with Drizzle ORM. Database file is stored locally on the device.

**Main Tables:**
- `users` - User accounts
- `loans` - Loan records
- `payments` - Payment transactions
- `attachments` - File attachments
- `reminders` - Scheduled reminders
- `interest_log` - Interest accrual tracking

### Database Operations

```bash
# Generate migrations (after schema changes)
cd app
npm run db:generate

# View database in Drizzle Studio
npm run db:studio
```

## Customization

### Change Theme Colors

Edit `app/global.css`:

```css
:root {
  --primary: #0152cb;  /* Change primary color */
  --background: #edf0f9; /* Change background */
  /* ... other colors */
}
```

### Modify Database Schema

1. Edit `app/src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Restart app

### Add New Screen

1. Create file in `app/app/` directory
2. Expo Router automatically creates route
3. Example: `app/app/settings.tsx` → `/settings` route

## Debugging

### Enable Debug Mode

```typescript
// In app/_layout.tsx
import { setLogLevel } from 'expo-sqlite/next';
setLogLevel('debug');
```

### View Logs

```bash
# React Native logs
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

### Common Issues

**Issue: "Cannot find module"**
```bash
# Clear cache and reinstall
cd app
rm -rf node_modules
npm install
npm start --clear
```

**Issue: "Database is locked"**
```bash
# Close app and restart
# Delete app from device/simulator
# Reinstall
```

**Issue: "NativeWind styles not working"**
```bash
# Make sure global.css is imported in _layout.tsx
import '../global.css';
```

## Development Workflow

### 1. Make Changes

Edit files in `app/` directory. Hot reload will update automatically.

### 2. Test Features

Use the app on your device/simulator to test functionality.

### 3. Check Types

```bash
npm run type-check
```

### 4. Lint Code

```bash
npm run lint
```

### 5. Build for Production

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Environment Variables

Create `app/.env`:

```env
# Optional configurations
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

Access in code:
```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

## Testing

### Manual Testing Checklist

- [ ] Create a new loan
- [ ] View loans list
- [ ] Filter loans (all/lent/borrowed)
- [ ] View dashboard summary
- [ ] Record a payment
- [ ] View amortization schedule
- [ ] Test dark/light mode
- [ ] Test offline functionality

## Next Steps

1. **Add Authentication**: Implement user login/signup
2. **Create Loan Form**: Build comprehensive loan entry form
3. **Payment Recording**: Add payment recording functionality
4. **Notifications**: Set up local notifications
5. **Export Data**: Implement PDF/Excel export
6. **Backup**: Add data backup/restore

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Expo Router Documentation](https://expo.github.io/router/docs/)

## Support

- **Issues**: [GitHub Issues](https://github.com/Raosandeep007/loanlog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Raosandeep007/loanlog/discussions)

## License

MIT License - see LICENSE file for details.
