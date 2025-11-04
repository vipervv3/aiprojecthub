# 📱 Mobile Recording Guide

## ✅ Yes, You Can Record on Mobile!

Your recordings are now protected from loss with multiple safety features.

## 🛡️ Protection Features Added

### 1. **Unsaved Recording Warning**
- Amber banner appears after recording stops
- Shows: "⚠️ Unsaved Recording - Please upload before closing!"
- Visible until you upload

### 2. **Browser Exit Protection**
- If you try to close the tab/app with unsaved recording
- Browser shows: "You have an unsaved recording. Are you sure you want to leave?"
- Works on both mobile and desktop browsers

### 3. **Mobile-Optimized Recording**
- Auto-detects mobile devices
- Requests audio data every 10 seconds (more reliable on mobile)
- Shows 📱 emoji when recording on mobile

### 4. **Recovery Metadata**
- Saves recording time and date to localStorage
- Can be used for debugging if issues occur

## 📱 Supported Mobile Browsers

### ✅ Fully Supported:
- **Chrome (Android)** - Best experience
- **Samsung Internet** - Works great
- **Firefox (Android)** - Full support
- **Edge (Mobile)** - Full support

### ⚠️ Limited Support:
- **Safari (iPhone/iPad)** - Works but has some limitations:
  - May stop recording if app goes to background
  - Requires iOS 14.3+ for best experience
  - Keep app in foreground while recording

### ❌ Not Supported:
- Older browsers without MediaRecorder API
- Browsers with disabled microphone access

## 🎯 How to Record on Mobile

### Step 1: Open App
1. Go to your app URL on mobile browser
2. Log in to your account
3. Navigate to **Meetings** page

### Step 2: Start Recording
1. Tap "Start Recording" button
2. **Allow microphone access** when prompted
3. You'll see "Recording started 📱"
4. Recording timer starts

### Step 3: Record Your Meeting
- Keep the app in **foreground** (don't switch apps)
- Keep the tab **active** (don't open other tabs)
- Your recording is automatically chunked every 10 seconds

**💡 TIP:** If on iPhone, lock screen rotation and keep app visible

### Step 4: Stop Recording
1. Tap "Stop Recording"
2. **⚠️ Unsaved Recording banner appears**
3. Give your recording a title
4. **IMPORTANT:** Tap "Upload" immediately

### Step 5: Upload (Critical!)
1. Tap "Upload" button
2. Wait for upload to complete (usually 5-10 seconds)
3. ✅ Success message appears
4. Recording is now SAFE in cloud storage

## ⚠️ How to NOT Lose Your Recording

### DO:
✅ Upload immediately after stopping
✅ Keep app in foreground while recording
✅ Ensure stable internet connection
✅ Wait for "✅ Recording uploaded successfully!" message
✅ Keep phone charged (recording uses battery)

### DON'T:
❌ Close tab before uploading
❌ Switch to another app while recording
❌ Let phone screen turn off during recording
❌ Close browser before upload completes
❌ Try to record with low battery

## 🔋 Battery & Performance Tips

### For Long Recordings (>10 minutes):

1. **Before Recording:**
   - Charge phone to at least 50%
   - Close other apps
   - Disable battery saver mode
   - Connect to WiFi (not cellular)

2. **During Recording:**
   - Keep screen on
   - Keep app in foreground
   - Don't receive calls (use airplane mode + WiFi)
   - Keep phone cool (don't overheat)

3. **After Recording:**
   - Upload on WiFi for faster upload
   - Don't close app until upload completes
   - Check for ✅ success message

## 📊 What Happens After Upload

### Automatic Processing:

1. **Upload** (5-10 seconds)
   - File uploaded to cloud storage
   - Saved to database

2. **Transcription** (1-3 minutes)
   - AssemblyAI converts audio to text
   - Status shows "processing"

3. **AI Processing** (10-30 seconds)
   - Groq extracts tasks
   - Generates summary
   - Creates meaningful title

4. **Results** (appear automatically)
   - Meeting shows in "Past Meetings"
   - Tasks appear on task board
   - Fully searchable and organized

## 🐛 Troubleshooting

### "Microphone Permission Denied"

**On Android:**
1. Go to Settings > Apps > Your Browser > Permissions
2. Enable "Microphone"
3. Reload the page

**On iPhone/iPad:**
1. Go to Settings > Safari > Microphone
2. Allow for your website
3. Or: Settings > [Your Browser] > Microphone

### "Recording Stops After Switching Apps"

**Solution:**
- This is a browser limitation (especially Safari)
- Keep app in foreground during recording
- Don't switch to other apps
- Consider using Android Chrome for better multitasking

### "Upload Fails"

**Check:**
1. Internet connection (use WiFi)
2. File size (should be under 50MB)
3. Browser console for errors
4. Try again - recording is still in memory

**If still fails:**
1. Check Vercel logs for server errors
2. Verify storage bucket is accessible
3. Check environment variables

### "Recording Audio is Too Quiet"

**Solutions:**
1. Get closer to microphone
2. Speak louder
3. Check phone microphone isn't blocked
4. Try external microphone if available
5. Check phone volume settings

### "Recording is Choppy/Skips"

**Causes:**
- Low phone performance
- Too many apps running
- Low memory

**Solutions:**
1. Close other apps
2. Restart phone
3. Clear browser cache
4. Use Chrome (better performance)

## 📱 Best Practices

### For Daily Meetings:

```
1. Open app at start of meeting
2. Tap "Start Recording"
3. Place phone on table (mic facing up)
4. Run entire meeting
5. Tap "Stop" at end
6. Give descriptive title (e.g., "Team standup 11/4")
7. Tap "Upload" immediately
8. Wait for ✅ confirmation
9. Close modal
10. Check "Past Meetings" after 3-4 minutes
```

### For One-on-One Calls:

```
1. Use speakerphone mode
2. Place phone between you and other person
3. Start recording before call
4. Let it run entire conversation
5. Upload immediately after
```

### For Note-Taking:

```
1. Quick voice notes to self
2. Record action items verbally
3. AI extracts them automatically
4. No manual typing needed
```

## 🎉 Example Workflow

**Scenario:** Team standup on mobile

```
08:55 AM - Open app on phone (Chrome Android)
09:00 AM - Tap "Start Recording" 
          Allow microphone ✓
          See "Recording started 📱"
09:00-09:15 - Meeting happens (phone on table)
09:15 AM - Tap "Stop Recording"
          See ⚠️ Unsaved Recording warning
          Type title: "Daily Standup 11/4"
          Tap "Upload"
          See "Uploading..." spinner
          Wait 8 seconds
          See "✅ Recording uploaded successfully!"
09:16 AM - Close modal, continue with day
09:19 AM - Check Meetings page
          See "Daily Standup Planning" (AI-generated title)
          Expand to see:
          - Summary: "Team discussed sprint progress..."
          - Task 1: "Complete user authentication" (high)
          - Task 2: "Review API documentation" (medium)
          - Task 3: "Schedule demo for Friday" (medium)
09:20 AM - Check Tasks page
          All 3 tasks appear with proper priorities
          Ready to work on them!
```

**Result:** 15-minute meeting → Organized notes + tasks in 4 minutes (all automatic)

## 💾 Data Usage

Typical recording sizes:
- **1 minute:** ~100 KB
- **5 minutes:** ~500 KB
- **15 minutes:** ~1.5 MB
- **30 minutes:** ~3 MB
- **1 hour:** ~6 MB

**Recommendation:** Upload on WiFi to save cellular data

## 🚀 Future Improvements

Planned features:
- [ ] Offline recording support
- [ ] Auto-upload when connection restored
- [ ] Background recording (Android)
- [ ] Audio quality selection
- [ ] Pause and resume support
- [ ] Recording drafts saved to device

---

**Status:** ✅ Mobile Recording Fully Functional
**Last Updated:** November 4, 2025
**Protection Level:** High (Multiple safety features active)

🎯 **You can now safely record on mobile without losing your recordings!**

