# Vercel Deployment Guide

## Issue: 404 Error on Direct URL Access

The 404 error occurs because Vercel doesn't know how to handle client-side routing. The `vercel.json` file has been created to fix this.

## Environment Variables Setup

You need to configure environment variables in your Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variable:

```
VITE_API_URL = https://your-backend-url.com/api
```

Replace `https://your-backend-url.com/api` with your actual backend API URL.

## Backend Deployment

Make sure your backend is also deployed and accessible. You have a few options:

### Option 1: Deploy Backend to Vercel
- Create a separate Vercel project for your backend
- Deploy the backend folder
- Use the Vercel-provided URL for `VITE_API_URL`

### Option 2: Deploy Backend to Railway/Heroku
- Deploy your backend to Railway, Heroku, or similar service
- Use the provided URL for `VITE_API_URL`

### Option 3: Use Local Backend (Development Only)
- Keep using `http://localhost:5001/api` for local development
- This won't work in production

## Steps to Fix

1. ✅ `vercel.json` file created (handles SPA routing)
2. 🔄 Deploy your backend to a hosting service
3. 🔄 Set `VITE_API_URL` environment variable in Vercel
4. 🔄 Redeploy your frontend

## Testing

After deployment:
- `https://ledger-app-chi.vercel.app/` should show the landing page
- `https://ledger-app-chi.vercel.app/login` should show the login page
- `https://ledger-app-chi.vercel.app/register` should show the register page
