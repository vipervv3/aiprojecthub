# 📱 Mobile App Strategy - iOS & Android

## 🎯 Goal
Transform the AI ProjectHub web app into native iOS and Android mobile apps while maintaining code reusability and a great user experience.

---

## 🚀 Recommended Approach: **React Native with Expo**

### Why Expo?
- ✅ **Write once, run on iOS & Android**
- ✅ **Hot reload** for fast development
- ✅ **Access to native APIs** (camera, notifications, storage)
- ✅ **Easy deployment** to App Store & Play Store
- ✅ **Web app code reuse** (React/TypeScript skills transfer)
- ✅ **Native performance** with JavaScript

---

## 📋 Implementation Plan

### Phase 1: Foundation (Week 1-2)
**Set up React Native + Expo project**

1. **Initialize Expo project**
   ```bash
   npx create-expo-app ai-projecthub-mobile --template
   cd ai-projecthub-mobile
   ```

2. **Install core dependencies**
   ```bash
   npm install @supabase/supabase-js expo-secure-store
   npm install @react-navigation/native @react-navigation/stack
   npm install react-native-reanimated react-native-gesture-handler
   npm install expo-av expo-document-picker  # For recordings
   npm install @react-native-async-storage/async-storage
   ```

3. **Set up shared code structure**
   ```
   ai-projecthub-mobile/
   ├── shared/           # Shared business logic
   │   ├── lib/
   │   │   ├── supabase.ts
   │   │   ├── data-service.ts
   │   │   └── ai-services.ts
   │   └── types/
   ├── mobile/          # Mobile-specific code
   │   ├── screens/
   │   ├── components/
   │   └── navigation/
   └── app.json
   ```

4. **Copy shared business logic from web app**
   - `lib/supabase.ts` → `shared/lib/supabase.ts`
   - `lib/data-service.ts` → `shared/lib/data-service.ts`
   - `lib/services/groq-service.ts` → `shared/lib/services/`
   - All AI services, notification logic, etc.

---

### Phase 2: Authentication & Core Setup (Week 2-3)

1. **Implement authentication screens**
   - Login screen
   - Signup screen
   - Biometric authentication (Touch ID / Face ID)

2. **Set up navigation**
   - Stack navigator for auth
   - Tab navigator for main app
   - Drawer navigator for settings

3. **Configure Supabase for mobile**
   - Use `expo-secure-store` for token storage
   - Handle deep linking for OAuth

---

### Phase 3: Core Features (Week 3-6)

#### Dashboard Screen
- Key metrics cards
- Recent activity feed
- Quick actions

#### Projects Screen
- Project list/grid view
- Project detail screen
- Create/edit project

#### Tasks Screen
- Kanban board (with drag & drop)
- Task filters
- Task detail view

#### Calendar Screen
- Month/week/day views
- Event details
- Create meeting

#### Meetings/Recordings Screen
- Record audio (using `expo-av`)
- View recordings list
- Transcription display
- AI-generated summaries

#### Settings Screen
- User profile
- Theme preferences (dark mode)
- Notification settings
- Logout

---

### Phase 4: Advanced Features (Week 6-8)

1. **Push Notifications**
   - Set up Expo Push Notifications
   - Configure APNs (iOS) and FCM (Android)
   - Integrate with existing notification system

2. **Offline Support**
   - Use React Query for offline-first data
   - Cache data locally
   - Sync when online

3. **Native Features**
   - Camera integration (project photos)
   - File picker (attachments)
   - Biometric authentication
   - Haptic feedback

4. **Performance Optimization**
   - Image optimization
   - List virtualization
   - Code splitting

---

## 🔧 Technical Implementation Details

### Shared Code Strategy

**Option 1: Monorepo (Recommended)**
```
ai-projecthub/
├── packages/
│   ├── web/          # Next.js app
│   ├── mobile/       # React Native/Expo app
│   └── shared/       # Shared TypeScript code
│       ├── lib/
│       ├── types/
│       └── utils/
└── package.json
```

**Option 2: Separate Repos**
- Copy shared code to mobile repo
- Keep them in sync manually or with scripts

### Key Libraries Needed

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "@react-navigation/native": "^6.x",
    "@react-navigation/stack": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "expo": "~49.x",
    "expo-av": "~13.x",
    "expo-secure-store": "~12.x",
    "expo-notifications": "~0.20.x",
    "@tanstack/react-query": "^5.x",
    "react-native-reanimated": "~3.x",
    "react-native-gesture-handler": "~2.x",
    "react-native-screens": "~3.x"
  }
}
```

---

## 📐 Screen Design Guidelines

### Navigation Structure
```
App Stack
├── Auth Stack
│   ├── Login
│   └── Signup
└── Main Stack
    ├── Tab Navigator
    │   ├── Dashboard (tab)
    │   ├── Projects (tab)
    │   ├── Tasks (tab)
    │   ├── Calendar (tab)
    │   └── More (tab) → Settings, Team, etc.
    └── Modals
        ├── Record Meeting
        ├── Create Project
        └── Task Detail
```

### Design Consistency
- Use same color scheme as web app
- Maintain dark mode support
- Responsive layouts for tablets
- Native iOS/Android patterns where appropriate

---

## 🎨 UI/UX Considerations

### Mobile-Specific Enhancements

1. **Pull to Refresh**
   - Add to all list screens
   - Refresh data from server

2. **Swipe Actions**
   - Swipe tasks to complete/delete
   - Swipe projects to archive

3. **Bottom Sheet Modals**
   - Better mobile UX than full-screen modals
   - Use `@gorhom/bottom-sheet`

4. **Haptic Feedback**
   - Add feedback for actions
   - Use `expo-haptics`

5. **Optimistic Updates**
   - Update UI immediately
   - Sync in background

---

## 🔔 Push Notifications Setup

### Expo Push Notifications
```typescript
import * as Notifications from 'expo-notifications';

// Request permissions
const { status } = await Notifications.requestPermissionsAsync();

// Get push token
const token = (await Notifications.getExpoPushTokenAsync()).data;

// Send to your backend to store
await supabase
  .from('user_push_tokens')
  .insert({ user_id: userId, token, platform: Platform.OS });
```

### Backend Integration
- Update notification service to send push notifications
- Use Expo Push Notification service or FCM directly
- Handle notification taps to deep link into app

---

## 📦 App Store Deployment

### iOS (App Store)
1. **Apple Developer Account** ($99/year)
2. **Setup in Expo**
   ```bash
   eas build --platform ios
   eas submit --platform ios
   ```
3. **App Store Connect**
   - Create app listing
   - Add screenshots
   - Submit for review

### Android (Google Play)
1. **Google Play Developer Account** ($25 one-time)
2. **Setup in Expo**
   ```bash
   eas build --platform android
   eas submit --platform android
   ```
3. **Play Console**
   - Create app listing
   - Add screenshots
   - Submit for review

---

## 🚀 Quick Start (After Web App is Ready)

### Step 1: Initialize Expo Project
```bash
npx create-expo-app ai-projecthub-mobile --template blank-typescript
cd ai-projecthub-mobile
```

### Step 2: Install Dependencies
```bash
npm install @supabase/supabase-js expo-secure-store
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-reanimated react-native-gesture-handler react-native-screens
npm install expo-av expo-notifications expo-haptics
npm install @tanstack/react-query
```

### Step 3: Copy Shared Code
```bash
# From web app root
cp -r lib/* mobile-app/shared/lib/
cp -r types/* mobile-app/shared/types/
```

### Step 4: Set Up Environment
```bash
# In mobile app
cp .env.example .env
# Add SUPABASE_URL, SUPABASE_ANON_KEY, etc.
```

### Step 5: Run App
```bash
npm start
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

---

## 📊 Success Metrics

### Development Metrics
- Code reuse percentage (target: 70%+)
- Build time
- Bundle size
- Test coverage

### User Metrics
- App Store ratings
- Daily active users
- Session duration
- Feature adoption rates

---

## 🎯 Next Steps

1. **Complete web app mobile optimization** (current focus)
   - Responsive layouts
   - Touch-friendly interactions
   - Mobile-first design patterns

2. **Plan mobile app architecture**
   - Decide on monorepo vs separate repos
   - Set up shared code structure
   - Design navigation flow

3. **Start with MVP**
   - Authentication
   - Dashboard
   - Projects list
   - Tasks Kanban board

4. **Iterate and enhance**
   - Add remaining features
   - Optimize performance
   - Add native features

---

## 💡 Tips for Success

1. **Start Simple**
   - Build MVP first
   - Add features incrementally
   - Test on real devices early

2. **Reuse Web Code**
   - Business logic is identical
   - API calls are the same
   - Types/interfaces can be shared

3. **Platform-Specific Where Needed**
   - iOS vs Android design patterns
   - Native features
   - Platform-specific UX

4. **Test Regularly**
   - Test on both iOS and Android
   - Test on different screen sizes
   - Test on real devices, not just simulators

5. **Performance First**
   - Optimize images
   - Lazy load screens
   - Use native lists (FlatList)

---

## 📚 Resources

- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **React Native**: https://reactnative.dev
- **Expo Push Notifications**: https://docs.expo.dev/push-notifications/overview/
- **Supabase Mobile**: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native

---

**Ready to start building? Let's optimize the web app first, then move to mobile! 🚀**

