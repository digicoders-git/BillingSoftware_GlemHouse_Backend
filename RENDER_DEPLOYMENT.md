## Render Deployment Guide

### Environment Variables to Set in Render Dashboard:

```
PORT=5555
MONGO_URI=mongodb+srv://digicodersdevelopment_db_user:KoJGvdKsGU9IQQvk@cluster0.9ssqshr.mongodb.net/GlemHouse_Billing?retryWrites=true&w=majority
JWT_SECRET=glemhousebillingsoftwaredevelopedbyprogrammershiva45
NODE_ENV=production
FRONTEND_URL=https://billing-software-glem-house-admin-p.vercel.app
```

### Steps:

1. Go to https://dashboard.render.com
2. Select your backend service
3. Go to **Environment** tab
4. Add all variables above
5. Click **Save changes**
6. Render will auto-redeploy

### Verify:

- Test: `curl https://billingsoftware-glemhouse-backend.onrender.com/`
- Health: `https://billingsoftware-glemhouse-backend.onrender.com/api/health`

### CORS Enabled for:

- https://billing-software-glem-house-admin-p.vercel.app
- localhost:5173
- localhost:5174
- All production requests (fallback)
