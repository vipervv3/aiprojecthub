# 🔧 Complete Vercel Environment Variables Setup Guide

## 📋 All Required Environment Variables

Add these environment variables to your Vercel project:

### **Step 1: Go to Vercel Environment Variables**
1. Navigate to: https://vercel.com/vipervv3/aiprojecthub/settings/environment-variables
2. Click **"Add New"** for each variable below
3. **IMPORTANT**: Set each variable for **ALL environments** (Production, Preview, Development)

---

## 🔑 Required Environment Variables

### **1. Supabase Configuration**

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://xekyfsnxrnfkdvrcsiye.supabase.co`
- **Type**: Public (visible in client)
- **Environments**: All (Production, Preview, Development)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw`
- **Type**: Public (visible in client)
- **Environments**: All (Production, Preview, Development)

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w`
- **Type**: Secret (server-only)
- **Environments**: All (Production, Preview, Development)
- **⚠️ CRITICAL**: This is your service role key - keep it secret!

---

### **2. AI Services Configuration**

#### `GROQ_API_KEY`
- **Value**: Your Groq API key (starts with `gsk_`)
- **Get it from**: https://console.groq.com/keys
- **Type**: Secret (server-only)
- **Environments**: All (Production, Preview, Development)
- **⚠️ CRITICAL**: Required for task extraction and intelligent titles

#### `ASSEMBLYAI_API_KEY`
- **Value**: Your AssemblyAI API key
- **Get it from**: https://www.assemblyai.com/app/account/api-keys
- **Type**: Secret (server-only)
- **Environments**: All (Production, Preview, Development)
- **⚠️ CRITICAL**: Required for audio transcription

#### `OPENAI_API_KEY` (Optional - Fallback)
- **Value**: Your OpenAI API key (if you have one)
- **Type**: Secret (server-only)
- **Environments**: All (Production, Preview, Development)
- **Note**: Used as fallback if Groq fails

---

### **3. Application Configuration**

#### `NEXT_PUBLIC_APP_URL`
- **Value**: `https://aiprojecthub.vercel.app`
- **Type**: Public (visible in client)
- **Environments**: All (Production, Preview, Development)
- **⚠️ CRITICAL**: Must match your Vercel deployment URL
- **Note**: After first deploy, update this to your actual Vercel URL

---

### **4. Email Services (Optional)**

#### `RESEND_API_KEY`
- **Value**: Your Resend API key (if using email notifications)
- **Type**: Secret (server-only)
- **Environments**: All (Production, Preview, Development)
- **Note**: Only needed if you want email notifications

---

### **5. Push Notifications (Optional)**

#### `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **Value**: Your VAPID public key (if using push notifications)
- **Type**: Public (visible in client)
- **Environments**: All (Production, Preview, Development)

#### `VAPID_PRIVATE_KEY`
- **Value**: Your VAPID private key (if using push notifications)
- **Type**: Secret (server-only)
- **Environments**: All (Production, Preview, Development)

#### `VAPID_SUBJECT`
- **Value**: `mailto:admin@aiprojecthub.com` (or your email)
- **Type**: Public
- **Environments**: All (Production, Preview, Development)

---

### **6. Cron Jobs (Optional)**

#### `CRON_SECRET` or `VERCEL_CRON_SECRET`
- **Value**: A random secret string (e.g., generate with: `openssl rand -hex 32`)
- **Type**: Secret (server-only)
- **Environments**: All (Production, Preview, Development)
- **Note**: Only needed if you're using custom cron endpoints

#### `NOTIFICATION_CRON_SCHEDULE`
- **Value**: `0 8 * * *` (8 AM daily, or your preferred schedule)
- **Type**: Public
- **Environments**: All (Production, Preview, Development)
- **Note**: Cron expression for notification scheduling

---

## 📝 Quick Setup Checklist

Copy and paste this checklist as you add each variable:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GROQ_API_KEY` ⚠️ **CRITICAL**
- [ ] `ASSEMBLYAI_API_KEY` ⚠️ **CRITICAL**
- [ ] `NEXT_PUBLIC_APP_URL` ⚠️ **CRITICAL**
- [ ] `OPENAI_API_KEY` (optional)
- [ ] `RESEND_API_KEY` (optional)
- [ ] `CRON_SECRET` (optional)

---

## 🚀 After Adding Variables

1. **Redeploy your application**:
   - Go to: https://vercel.com/vipervv3/aiprojecthub/deployments
   - Click **"..."** on the latest deployment
   - Click **"Redeploy"**
   - ⚠️ **IMPORTANT**: Uncheck **"Use existing Build Cache"** to ensure new env vars are loaded

2. **Verify the deployment**:
   - Wait 2-3 minutes for deployment to complete
   - Check deployment logs for any errors

3. **Test the application**:
   - Record a new meeting
   - Check Vercel logs for Groq API calls
   - Verify tasks are extracted and linked to projects

---

## 🔍 Verification Steps

After deployment, you can verify environment variables are set by visiting:
- **Debug endpoint**: `https://aiprojecthub.vercel.app/api/debug-env`
- This will show which variables are set (without exposing secrets)

---

## ⚠️ Important Notes

1. **All variables must be set for ALL environments** (Production, Preview, Development)
2. **After adding variables, you MUST redeploy** for them to take effect
3. **NEXT_PUBLIC_APP_URL** should be your actual Vercel deployment URL
4. **Never commit** `.env.local` or `.env` files to git (they should be in `.gitignore`)
5. **Service role keys** are sensitive - keep them secret!

---

## 🆘 Troubleshooting

### If tasks aren't being extracted:
- Check Vercel logs for: `❌ GROQ_API_KEY is not set!`
- Verify `GROQ_API_KEY` is set for all environments
- Redeploy after adding the variable

### If transcription fails:
- Check Vercel logs for AssemblyAI errors
- Verify `ASSEMBLYAI_API_KEY` is set correctly
- Check AssemblyAI dashboard for API status

### If you see "Invalid time value" errors:
- This is now fixed in the latest code
- Make sure you've deployed the latest version

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Visit the debug endpoint: `/api/debug-env`
3. Share the logs so we can diagnose the issue

