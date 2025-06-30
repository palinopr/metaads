# Database URL Configuration Fix

## Issue
The database connection was failing with "getaddrinfo ENOTFOUND base" because the password contains special characters that need URL encoding.

## Solution
In Vercel environment variables, update:

1. **DATABASE_URL**: Replace `!` with `%21` in the password
2. **DIRECT_URL**: Replace `!` with `%21` in the password

## Example
If your password is `JaimeOrtizPr787!`, it should be `JaimeOrtizPr787%21` in the connection string.

## Steps to Fix in Vercel
1. Go to Vercel Dashboard > Settings > Environment Variables
2. Edit DATABASE_URL and DIRECT_URL
3. Replace the `!` in the password with `%21`
4. Save changes
5. Redeploy (will happen automatically after pushing to GitHub)