# 🔍 Vercel GROQ_API_KEY Verification Checklist

## ✅ **Confirmed Working Locally:**
- Groq API key is valid (56 chars, starts with `gsk_Mei8b9...`)
- Groq API calls work perfectly
- Model name is correct (`llama-3.1-8b-instant`)
- Code is correct

## ❌ **Issue on Vercel:**
- AI processing fails with "AI analysis unavailable"
- This means `process.env.GROQ_API_KEY` is undefined on Vercel

---

## 🔧 **VERIFICATION STEPS:**

### **Step 1: Verify GROQ_API_KEY Exists on Vercel**

1. Go to: https://vercel.com/vipervv3/aiprojecthub/settings/environment-variables
2. Search for: `GROQ_API_KEY`
3. Check:
   - ✅ Does it exist?
   - ✅ Is it set for **ALL environments** (Production, Preview, Development)?
   - ✅ Is the value correct? (Should start with `gsk_`)

### **Step 2: Check Variable Name**

Make sure it's exactly: `GROQ_API_KEY` (not `GROQ_API_KEY_` or `GROQ_API_KEY_PROD` or any variation)

### **Step 3: Force Redeploy**

Sometimes Vercel caches old deployments. To force a fresh deployment:

1. Go to: https://vercel.com/vipervv3/aiprojecthub/deployments
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"** = **OFF**
5. Click **"Redeploy"**

### **Step 4: Verify After Deployment**

After redeployment (wait 2 minutes), run:
```bash
node scripts/test-vercel-live.js
```

Or check the debug endpoint:
```
https://aiprojecthub.vercel.app/api/debug-env
```

---

## 🚨 **Common Issues:**

### **Issue 1: Variable Only Set for Production**
- **Symptom:** Works in production but not in preview
- **Fix:** Set for ALL environments (Production, Preview, Development)

### **Issue 2: Typo in Variable Name**
- **Symptom:** Variable exists but code can't find it
- **Fix:** Verify exact spelling: `GROQ_API_KEY` (case-sensitive)

### **Issue 3: Old Deployment Still Running**
- **Symptom:** Variable is set but old code is cached
- **Fix:** Force redeploy with cache disabled

### **Issue 4: Variable Value is Empty**
- **Symptom:** Variable exists but value is blank
- **Fix:** Delete and recreate the variable

---

## 📊 **After Fixing:**

Once verified, the cron job will automatically:
- ✅ Process all completed transcriptions
- ✅ Extract tasks to projects
- ✅ Generate intelligent titles
- ✅ Create summaries and action items

---

## 🎯 **Quick Test:**

After fixing, test with:
```bash
node scripts/test-ai-processing-direct.js
```

You should see:
- ✅ Status: 200
- ✅ Meeting created
- ✅ Tasks extracted

