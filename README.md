# Contentful Environment Check - GitHub Action POC

This repository contains a proof-of-concept (POC) GitHub Action that automatically checks for Contentful environments matching the branch name when a pull request is merged.

## Overview

When a pull request is merged, this workflow:
1. Extracts the branch name from the merged PR
2. Queries your Contentful space for environments
3. Checks if an environment exists with the same name as the branch
4. Displays the environment details including:
   - Environment ID and name
   - Creator information (user ID)
   - Creation and update timestamps
   - Who last updated the environment

## Setup Instructions

### 1. Prerequisites

- A Contentful account with access to a space
- GitHub repository with Actions enabled
- Node.js 18+ (handled automatically by the GitHub Action)

### 2. Obtain Contentful API Credentials

You need two pieces of information from Contentful:

#### A. Content Management API Token

1. Log in to your Contentful account
2. Go to **Settings** → **API keys** → **Content management tokens**
3. Click **Generate personal access token**
4. Give it a descriptive name (e.g., "GitHub Actions Token")
5. Copy the token (you won't be able to see it again!)

#### B. Space ID

1. In Contentful, navigate to your space
2. Go to **Settings** → **General settings**
3. Copy your **Space ID**

### 3. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `CONTENTFUL_SPACE_ID` | Your Contentful space ID | `abc123xyz` |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Your management API token | `CFPAT-xxxxxxxxxxxxx` |

### 4. Install Dependencies (Local Testing)

If you want to test the script locally:

```bash
npm install
```

### 5. Test Locally (Optional)

You can test the environment check script locally:

```bash
export CONTENTFUL_SPACE_ID="your-space-id"
export CONTENTFUL_MANAGEMENT_TOKEN="your-token"
export BRANCH_NAME="your-branch-name"
node scripts/check-contentful-env.js
```

## How It Works

### Workflow Trigger

The GitHub Action is triggered when a pull request is **closed** and **merged**:

```yaml
on:
  pull_request:
    types: [closed]

jobs:
  check-environment:
    if: github.event.pull_request.merged == true
```

This ensures the workflow only runs on actual merges, not when PRs are simply closed without merging.

### Branch Name Extraction

The workflow extracts the source branch name from the PR using `github.head_ref` context variable.

### Environment Query

The script uses the Contentful Management API to:
1. Connect to your Contentful space
2. Retrieve all environments
3. Search for an environment where the ID or name matches the branch name
4. Display detailed information if found

## Example Output

### When Environment is Found:

```
🔍 Checking for Contentful environment matching branch: "feature/new-landing-page"
📦 Space ID: abc123xyz

✅ Successfully connected to Contentful space: My Awesome Space

✅ ENVIRONMENT FOUND!
═══════════════════════════════════════
Environment ID: feature-new-landing-page
Environment Name: feature/new-landing-page

👤 Creator Information:
   Created by: 5xXxXxXxXxXxXxXxXx
   Type: User
   Created at: 11/15/2025, 10:30:00 AM
   Updated at: 11/18/2025, 3:45:00 PM
   Updated by: 5xXxXxXxXxXxXxXxXx
═══════════════════════════════════════
```

### When No Environment is Found:

```
🔍 Checking for Contentful environment matching branch: "feature/non-existent"
📦 Space ID: abc123xyz

✅ Successfully connected to Contentful space: My Awesome Space

ℹ️  No matching environment found
   Branch name "feature/non-existent" does not match any environment in the space.

📋 Available environments:
   - master (master)
   - staging (staging)
   - feature-landing-page (feature/landing-page)
```

## File Structure

```
.
├── .github/
│   └── workflows/
│       └── contentful-env-check.yml   # GitHub Actions workflow
├── scripts/
│   └── check-contentful-env.js        # Node.js script to query Contentful
├── package.json                        # Dependencies
└── README.md                           # This file
```

## Troubleshooting

### Authentication Errors

If you see authentication errors:
- Verify your `CONTENTFUL_MANAGEMENT_TOKEN` is correct and hasn't expired
- Ensure the token has proper permissions for the space
- Check that `CONTENTFUL_SPACE_ID` matches your actual space ID

### Environment Not Found

If the script doesn't find your environment:
- Environment IDs in Contentful often use dashes instead of slashes
- The script checks both the environment ID and name
- Check the "Available environments" list in the output

### Workflow Not Triggering

If the workflow doesn't run:
- Ensure the PR was actually merged (not just closed)
- Check the Actions tab for any errors
- Verify the workflow file is in `.github/workflows/`

## Limitations & Future Enhancements

### Current Limitations:
- Creator information shows user ID only (not full name/email) as per Contentful API limitations
- Only checks exact matches of branch name to environment ID/name

### Possible Enhancements:
- Add fuzzy matching for environment names
- Fetch additional user details via separate API calls
- Add ability to automatically create/delete environments
- Support for multiple Contentful spaces
- Slack/email notifications of results

## Security Notes

- Never commit API tokens to your repository
- Always use GitHub Secrets for sensitive credentials
- Rotate your management tokens periodically
- Use the principle of least privilege for API tokens

## License

MIT

