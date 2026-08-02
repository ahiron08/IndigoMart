# Cloudinary Setup Guide

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account (or log in if you already have one)
3. The free tier includes:
   - 25 credits/month
   - ~25,000 transformations or ~25GB storage/bandwidth

## Step 2: Get Your Credentials

After signing up, you'll find your credentials in the Cloudinary Dashboard:

1. Log in to your Cloudinary account
2. Navigate to **Dashboard** (home page)
3. You'll see three key values:
   - **Cloud Name** (e.g., `dxyzabc123`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

## Step 3: Configure Environment Variables

Add these credentials to your `backend/.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Step 4: Verify Configuration

After adding the credentials, restart your backend server:

```bash
cd backend
npm run dev
```

The "Image storage is not configured" error should no longer appear.

## Security Notes

- **Never commit** your `.env` file to version control
- The `.gitignore` file should already exclude `.env`
- In production, use environment variables from your hosting platform (e.g., Vercel, Railway, AWS)
- Rotate your API Secret periodically for better security

## Testing Image Upload

Once configured, you can test image uploads through your application's product creation or profile update features.

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformations Guide](https://cloudinary.com/documentation/image_transformations)