# Pasal Sathi (पसल साथी) - Deployment Guide

## Quick Deploy Instructions

### Prerequisites
- GitHub account
- MongoDB Atlas account (free)
- Render account (free)
- Vercel account (free)

---

## Step 1: Setup MongoDB Atlas (5 mins)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up / Login
3. Create a **FREE** shared cluster (M0)
4. Choose region: **Mumbai (ap-south-1)** - closest to Nepal
5. Create Database User:
   - Username: `pasalsathi_user`
   - Password: (save this!)
6. Network Access → Add IP: `0.0.0.0/0` (allow all)
7. Get Connection String:
   - Click "Connect" → "Connect your application"
   - Copy: `mongodb+srv://pasalsathi_user:<password>@cluster0.xxxxx.mongodb.net/pasalsathi`
   - Replace `<password>` with your password

---

## Step 2: Deploy Backend on Render (5 mins)

1. Push code to GitHub (if not already)
2. Go to [Render](https://render.com) → Sign up with GitHub
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repo
5. Render will detect `render.yaml` automatically
6. Set Environment Variables in Render Dashboard:
   ```
   MONGO_URL = mongodb+srv://pasalsathi_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pasalsathi
   CORS_ORIGINS = https://your-app.vercel.app
   OPENAI_API_KEY = sk-xxxxx (get from platform.openai.com)
   ```
7. Click **"Apply"** → Wait for deployment
8. Copy your backend URL: `https://pasal-sathi-api.onrender.com`

---

## Step 3: Deploy Frontend on Vercel (5 mins)

1. Go to [Vercel](https://vercel.com) → Sign up with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repo
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
5. Add Environment Variable:
   - Name: `REACT_APP_BACKEND_URL`
   - Value: `https://pasal-sathi-api.onrender.com` (your Render URL)
6. Click **"Deploy"**
7. Your app is live at: `https://your-app.vercel.app`

---

## Step 4: Update CORS (Important!)

After Vercel deployment, go back to Render:
1. Dashboard → pasal-sathi-api → Environment
2. Update `CORS_ORIGINS` to your Vercel URL
3. Click "Save Changes" → Service will redeploy

---

## Post-Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] CORS_ORIGINS updated with Vercel URL
- [ ] Test login with PIN: 1234
- [ ] Test AI Scanner feature
- [ ] Install PWA on phone

---

## Environment Variables Summary

### Backend (Render)
| Variable | Value |
|----------|-------|
| MONGO_URL | `mongodb+srv://...` |
| DB_NAME | `pasalsathi` |
| CORS_ORIGINS | `https://your-app.vercel.app` |
| OPENAI_API_KEY | `sk-...` (from platform.openai.com) |

### Frontend (Vercel)
| Variable | Value |
|----------|-------|
| REACT_APP_BACKEND_URL | `https://pasal-sathi-api.onrender.com` |

---

## Troubleshooting

### Backend not starting?
- Check Render logs for errors
- Verify MONGO_URL is correct
- Ensure all requirements are in requirements.txt

### Frontend API errors?
- Check REACT_APP_BACKEND_URL is correct
- Verify CORS_ORIGINS includes your frontend URL
- Check browser console for errors

### AI Scanner not working?
- Verify OPENAI_API_KEY is set in Render
- Get key from https://platform.openai.com/api-keys
- Check Render logs for API errors

---

## Free Tier Limits

| Service | Limit |
|---------|-------|
| Render | 750 hrs/month, sleeps after 15 min inactivity |
| Vercel | 100GB bandwidth/month |
| MongoDB Atlas | 512MB storage |

---

## Custom Domain (Optional)

### Vercel
1. Settings → Domains → Add your domain
2. Update DNS records as instructed

### Render
1. Settings → Custom Domain → Add domain
2. Update DNS records

---

## Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
