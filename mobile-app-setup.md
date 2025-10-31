# 📱 Mobile App Setup Guide

## Quick Start - React Native with Expo

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

---

## Step 1: Initialize Expo Project

```bash
# Create new Expo project
npx create-expo-app ai-projecthub-mobile --template blank-typescript

# Navigate to project
cd ai-projecthub-mobile
```

---

## Step 2: Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js expo-secure-store
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-reanimated react-native-gesture-handler react-native-screens

# UI and utilities
npm install @react-native-async-storage/async-storage
npm install expo-av expo-notifications expo-haptics
npm install @tanstack/react-query

# Install peer dependencies
npx expo install react-native-safe-area-context
```

---

## Step 3: Set Up Project Structure

Create this folder structure:

```
ai-projecthub-mobile/
├── shared/              # Shared code from web app
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── data-service.ts
│   │   └── services/
│   └── types/
├── mobile/
│   ├── screens/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Projects/
│   │   ├── Tasks/
│   │   └── Settings/
│   ├── components/
│   ├── navigation/
│   └── hooks/
├── app.json
└── package.json
```

---

## Step 4: Copy Shared Code

From your web app, copy these files:

```bash
# From web app root
cp -r lib/supabase.ts mobile-app/shared/lib/
cp -r lib/data-service.ts mobile-app/shared/lib/
cp -r lib/services/* mobile-app/shared/lib/services/
cp -r types/* mobile-app/shared/types/  # If you have types folder
```

---

## Step 5: Configure Environment

Create `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Step 6: Update Supabase Client for Mobile

Modify `shared/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key)
      },
      setItem: (key: string, value: string) => {
        SecureStore.setItemAsync(key, value)
      },
      removeItem: (key: string) => {
        SecureStore.deleteItemAsync(key)
      },
    },
  },
})
```

---

## Step 7: Set Up Navigation

Create `mobile/navigation/AppNavigator.tsx`:

```typescript
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

---

## Step 8: Run the App

```bash
# Start development server
npm start

# Or run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
```

---

## Step 9: Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Step 10: Submit to App Stores

### iOS (App Store)
```bash
eas submit --platform ios
```

### Android (Google Play)
```bash
eas submit --platform android
```

---

## Next Steps

1. Implement authentication screens
2. Build dashboard screen
3. Add projects and tasks screens
4. Implement recording feature
5. Add push notifications
6. Test on real devices
7. Submit to app stores

---

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Supabase Mobile Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

---

**Ready to start? Run the commands above to set up your mobile app!** 🚀

