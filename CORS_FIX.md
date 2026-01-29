# CORS & API URL Configuration Fix

## Issues Fixed

1. ✅ **CORS Policy Blocking**: Backend now allows requests from Vercel frontend
2. ✅ **Double Slash in API URL**: Frontend now handles trailing slashes properly

## Backend Changes (server.py)

Updated CORS middleware to include production frontend URL by default:

```python
# Default production origins if CORS_ORIGINS not set
allowed_origins = [
    "https://pasal-sathi-shop-friend.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
]
```

## Frontend Changes

Updated all API URL constructions to remove trailing slashes:

```javascript
// Before: Could cause double slashes
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// After: Handles trailing slashes properly
const API_BASE = process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, "") || "";
const API = `${API_BASE}/api`;
```

## Deployment Steps

### 1. Redeploy Backend (Render)

Push changes to GitHub, then:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your `pasal-sathi-api` service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait for deployment to complete

**Optional**: Set `CORS_ORIGINS` environment variable:

- Navigate to: Environment → Add `CORS_ORIGINS`
- Value: `https://pasal-sathi-shop-friend.vercel.app,http://localhost:3000`

### 2. Redeploy Frontend (Vercel)

Push changes to GitHub, then:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `pasal-sathi-shop-friend` project
3. Vercel will auto-deploy from GitHub, or click **"Redeploy"**

**Verify Environment Variable**:

- Go to: Settings → Environment Variables
- Check `REACT_APP_BACKEND_URL` = `https://pasal-sathi-api.onrender.com` (NO trailing slash!)

### 3. Test the Fix

After deployment:

1. Open your app: `https://pasal-sathi-shop-friend.vercel.app`
2. Open Browser DevTools (F12) → Console tab
3. You should **NOT** see CORS errors anymore
4. Check Network tab - API calls should succeed with status 200

## Environment Variables Reference

### Backend (Render)

```bash
MONGO_URL=mongodb+srv://...
DB_NAME=pasalsathi
CORS_ORIGINS=https://pasal-sathi-shop-friend.vercel.app  # Optional, has default
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
```

### Frontend (Vercel)

```bash
REACT_APP_BACKEND_URL=https://pasal-sathi-api.onrender.com  # NO trailing slash!
```

## Troubleshooting

### Still seeing CORS errors?

1. **Check Backend Logs** (Render):
   - Dashboard → pasal-sathi-api → Logs
   - Look for CORS-related messages

2. **Verify Frontend URL**:
   - Make sure your Vercel deployment URL is `https://pasal-sathi-shop-friend.vercel.app`
   - If different, update `allowed_origins` in server.py

3. **Hard Refresh Browser**:
   - Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - This clears cached service worker

4. **Unregister Service Worker**:
   - Open DevTools → Application → Service Workers
   - Click "Unregister" for old service worker
   - Refresh page

### Still seeing 404 errors?

1. **Check API URL**:
   - Vercel → Settings → Environment Variables
   - Ensure `REACT_APP_BACKEND_URL` has NO trailing slash
   - Correct: `https://pasal-sathi-api.onrender.com`
   - Wrong: `https://pasal-sathi-api.onrender.com/`

2. **Check Backend Routes**:
   - Visit: `https://pasal-sathi-api.onrender.com/api/`
   - Should return: `{"message": "Pasal Sathi API - पसल साथी", "version": "1.1.0"}`

3. **Rebuild Frontend**:
   - Vercel → Deployments → Latest → "..." menu → Redeploy

## Testing Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

### Frontend

```bash
cd frontend
# Create .env.local file
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env.local
npm install
npm start
```

Local URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Additional Notes

- The backend now defaults to allowing your production frontend even without CORS_ORIGINS env var
- Frontend code now safely handles any trailing slash in the backend URL
- Changes are backward compatible with local development
- Service worker cache may need clearing for immediate effect

## Need More Help?

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide
- Backend logs: Render Dashboard → Logs
- Frontend logs: Browser DevTools → Console
- API testing: Use Postman or `curl` with the backend URL
