# Deployment Guide for Render

This project is configured for seamless deployment on [Render](https://render.com).

## Render Web Service Settings

- **Service Type**: Web Service
- **Runtime**: Node
- **Root Directory**: `.` (leave empty for project root)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## Render Environment Variables

Add the following environment variables in the Render Dashboard (**Settings > Environment**):

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `COOKIE_SECRET` | A long, random string for signing cookies |
| `EMAIL_USER` | Your Gmail address (e.g., `example@gmail.com`) |
| `EMAIL_PASS` | Your Gmail [App Password](https://myaccount.google.com/apppasswords) (16 chars, no spaces) |
| `EMAIL_TO` | (Optional) Destination email. Defaults to `EMAIL_USER` if missing. |
| `FRONTEND_ORIGINS` | `https://birabrick.netlify.app` (comma-separated list of allowed origins) |

> [!IMPORTANT]
> Do **not** set `PORT` manually. Render provides `process.env.PORT` automatically.

## Post-Deployment Steps

1.  **Verify Health**:
    Check `https://YOUR-RENDER-SERVICE.onrender.com/health` - it should return `{"status":"ok",...}`.
2.  **Verify CSRF**:
    Check `https://YOUR-RENDER-SERVICE.onrender.com/api/csrf-token` - it should return a JSON token.
3.  **Update Frontend**:
    In `docs/script.js`, replace the `PRODUCTION_API_BASE_URL` value with your real Render URL:
    ```javascript
    const PRODUCTION_API_BASE_URL = 'https://YOUR-RENDER-SERVICE.onrender.com';
    ```

## Local Testing Checklist

### Backend
1. Run `npm install`.
2. Create a `.env` file based on `.env.example`.
3. Run `npm start`.
4. Test endpoints:
   - `http://127.0.0.1:3000/health`
   - `http://127.0.0.1:3000/api/csrf-token`

### Frontend
1. Open `docs/index.html` using a local server (e.g., VS Code Live Server at `http://127.0.0.1:5500`).
2. The form should automatically connect to `http://127.0.0.1:3000`.
3. Test a form submission.
