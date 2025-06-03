# Meta Ads Dashboard

A Next.js application to display your Meta (Facebook) Ads campaign performance. Connects to the Meta Graph API to fetch data like spend, revenue, ROAS, conversions, impressions, clicks, CTR, and CPC.

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/palinopr/metaads.git&project-name=meta-ads-dashboard&repository-name=meta-ads-dashboard)

**Note:** Please verify that `https://github.com/palinopr/metaads.git` in the URL above points to *your correct GitHub repository* containing this project's code. If your GitHub username or repository name is different, update the `repository-url` parameter in the link.

Clicking the "Deploy with Vercel" button will take you to Vercel to deploy this project from your specified GitHub repository.

## Features

-   Connect to Meta Ads API via user-provided credentials.
-   Display key campaign metrics:
    -   Spend, Revenue, ROAS, Conversions
    -   Impressions, Clicks, CTR, CPC
-   Sort campaigns by creation date (newest first).
-   Client-side storage of API credentials in `localStorage`.
-   Refresh button to manually update data.
-   Responsive design with Tailwind CSS and shadcn/ui.
-   Dark mode support.
-   Loading and error states with UI feedback.
-   Formatted numbers for readability.

## Prerequisites for Local Development

-   Node.js (v18 or later recommended)
-   npm, yarn, or pnpm
-   Git
-   A Meta Developer Account with an app that has access to the Ads Management API.
-   Your Meta Ads API Access Token and Ad Account ID.

## Local Development Setup

1.  **Clone the repository (if you haven't already):**
    \`\`\`bash
    # If your project is already synced via v0, you might already have it locally.
    # Otherwise, clone from your GitHub:
    git clone https://github.com/palinopr/metaads.git meta-ads-dashboard-local
    cd meta-ads-dashboard-local
    \`\`\`
    *(Replace `palinopr/metaads` with your actual GitHub repo if different)*

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    \`\`\`

3.  **Run the development server:**
    \`\`\`bash
    npm run dev
    \`\`\`
    Open [http://localhost:3000](http://localhost:3000) in your browser.

4.  **Enter Credentials (Locally):**
    -   On the dashboard, click the Settings (gear) icon.
    -   Enter your Meta Ads API Access Token and Ad Account ID.
    -   Click "Save & Fetch Data".

## Manual Deployment to Vercel (If not using Deploy Button)

If you prefer to set up the Vercel project manually by importing from GitHub:

1.  **Ensure code is on GitHub:** Push your latest local changes to your `metaads` repository on the `main` branch.
2.  **Deploy on Vercel:**
    -   Go to your [Vercel Dashboard](https://vercel.com/dashboard).
    -   Click "Add New..." -> "Project".
    -   Connect your GitHub account.
    -   Select your `metaads` repository.
    -   Vercel automatically detects it as a Next.js project.
    -   No special environment variables are needed for Vercel for this client-side credential setup.
    -   Click "Deploy".

## Security Note

This application stores your Meta API Access Token in your browser's `localStorage`. While convenient for personal use, be aware that this is less secure than server-side environment variables.

## Project Structure

-   `app/page.tsx`: Main dashboard UI (Client Component).
-   `app/api/meta/route.ts`: API route to proxy requests to Meta Graph API.
-   `app/layout.tsx`: Root layout for the application.
-   `components/`: Reusable UI components.
-   `lib/utils.ts`: Utility functions.
