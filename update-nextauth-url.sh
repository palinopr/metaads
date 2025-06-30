#!/bin/bash
# Update NEXTAUTH_URL in Vercel to the correct production URL
vercel env rm NEXTAUTH_URL production -y
vercel env add NEXTAUTH_URL production <<< "https://metaads-web.vercel.app"
echo "NEXTAUTH_URL updated to https://metaads-web.vercel.app for production"