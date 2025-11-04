# 🔍 Recording Debug Checklist

**Your recording isn't showing up. Let's find out why.**

---

## Step 1: Check Browser Console (MOST IMPORTANT)

### Open Browser DevTools:
- Press **F12** on your keyboard
- Or right-click → "Inspect" → Click "Console" tab

### Try Recording Again:

1. Click the red microphone button (bottom-right)
2. Select a project
3. Click "Start Recording"
4. **Watch the Console tab**

### What to Look For:

**✅ Good signs (should see these):**
```
✅ Chunk 0 uploaded successfully
✅ Chunk 1 uploaded successfully
Supabase client created successfully
```

**❌ Bad signs (errors to report):**
```
❌ Error uploading chunk
❌ Supabase client not initialized
❌ Storage bucket not found
❌ Failed to create recording session
❌ Project ID is undefined
```

---

## Step 2: Check If Floating Button Exists

**On your app page, do you see:**
- A red/blue microphone button on the bottom-right?

**If NO:**
- You might not be logged in
- Check if user object exists

**If YES:**
- Button exists, proceed to Step 3

---

## Step 3: Check What Happens When You Click

### When you click "Start Recording":

**Does it:**
- ✅ Ask for microphone permission? (Good!)
- ✅ Show recording timer counting up? (Good!)
- ❌ Nothing happens? (Check console for errors)
- ❌ Error message appears? (What does it say?)

### After 10 seconds of recording:

**Do you see:**
- ✅ Green box with "• 1 chunks saved to cloud"? (Working!)
- ❌ No green box? (Upload failing - check console)

---

## Step 4: Check Microphone Permission

### In your browser:

**Chrome:**
1. Click lock icon in address bar
2. Check "Microphone" permission
3. Should be "Allow"

**If Blocked:**
1. Change to "Allow"
2. Refresh page
3. Try recording again

---

## Step 5: Specific Checks

### A) Is Project Selected?

Before clicking "Start Recording", verify:
- ✅ Project dropdown shows a project name (not "Choose a project...")
- ❌ If empty, select a project first!

### B) What Happens When You Click "Upload & Process"?

**Does it:**
- ✅ Show "Uploading... 100%"? (Good!)
- ✅ Show "Transcribing audio..."? (Good!)
- ❌ Show an error? (What's the exact message?)
- ❌ Nothing happens? (Check console)

### C) Check for JavaScript Errors

**In Console tab, look for:**
```
❌ Uncaught TypeError
❌ Cannot read property
❌ is not defined
❌ Failed to fetch
```

Copy any errors you see!

---

## Step 6: Manual Database Check

**Tell me to run this check:**
"Check Supabase for my recording session"

I'll verify if anything was saved.

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot upload chunk - supabase is null"
**Solution:** Supabase client not initialized
- Check .env.local file exists
- Verify NEXT_PUBLIC_SUPABASE_URL is set
- Restart dev server

### Issue: "Project ID is undefined"
**Solution:** Project not selected properly
- Make sure to click a project in dropdown
- Don't click "Start Recording" until project shows

### Issue: "Microphone permission denied"
**Solution:**
- Browser blocked microphone
- Click lock icon → Allow microphone
- Refresh page

### Issue: "Storage bucket not found"
**Solution:**
- Go to Supabase Dashboard → Storage
- Verify "meeting-recordings" bucket exists
- If not, create it

---

## 🎯 What I Need From You

**Please check and tell me:**

1. **Browser Console Errors:**
   - Open F12
   - Try recording
   - Copy any red error messages

2. **What You See:**
   - Does timer count up?
   - Do you see green "chunks saved" box?
   - Any error toasts appear?

3. **At What Step It Fails:**
   - Can't start recording?
   - Recording works but upload fails?
   - Upload works but doesn't appear on page?

---

## 📸 Screenshot Checklist

If possible, take screenshots of:
1. The recording modal when you click "Start Recording"
2. Browser console (F12) showing any errors
3. What happens after you click "Upload & Process"

---

**Once you tell me what errors you see, I can fix the exact issue!** 🔧

Most likely it's one of these:
- Console has a specific error
- Microphone permission issue
- Project not selected properly
- EnhancedRecordingModal has a bug

**Check the console first - that will tell us everything!** 🔍




