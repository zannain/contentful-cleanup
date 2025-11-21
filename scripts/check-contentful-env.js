#!/usr/bin/env node

const contentfulManagement = require('contentful-management');

/**
 * Main function to check if a Contentful environment exists
 * matching the branch name from the pull request
 */
async function checkContentfulEnvironment() {
  // Get environment variables
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const branchName = process.env.BRANCH_NAME;

  // Validate required environment variables
  if (!spaceId) {
    console.error('❌ Error: CONTENTFUL_SPACE_ID is not set');
    process.exit(1);
  }

  if (!accessToken) {
    console.error('❌ Error: CONTENTFUL_MANAGEMENT_TOKEN is not set');
    process.exit(1);
  }

  if (!branchName) {
    console.error('❌ Error: BRANCH_NAME is not set');
    process.exit(1);
  }

  // Extract the name after the slash (e.g., "feat/test-env-deletion" → "test-env-deletion")
  const searchName = branchName.includes('/')
    ? branchName.split('/').slice(1).join('/')
    : branchName;

  console.log(`🔍 Checking for Contentful environment matching branch: "${branchName}"`);
  console.log(`🔎 Search term (extracted): "${searchName}"`);
  console.log(`📦 Space ID: ${spaceId}`);
  console.log('');

  try {
    // Initialize Contentful Management client
    const client = contentfulManagement.createClient({
      accessToken: accessToken,
    });

    // Get the space
    const space = await client.getSpace(spaceId);
    console.log(`✅ Successfully connected to Contentful space: ${space.name}`);
    console.log('');

    // Get all environments in the space
    const environments = await space.getEnvironments();

    // Find exact matches first
    const exactMatches = environments.items.filter(
      env => env.name === searchName || env.sys.id === searchName
    );

    // Find partial matches (environments that contain the search name)
    const partialMatches = environments.items.filter(env => {
      const isExactMatch = env.name === searchName || env.sys.id === searchName;
      const containsInId = env.sys.id.includes(searchName);
      const containsInName = env.name.includes(searchName);
      return !isExactMatch && (containsInId || containsInName);
    });

    // Combine all matches
    const allMatches = [...exactMatches, ...partialMatches];

    if (allMatches.length > 0) {
      console.log(`✅ FOUND ${allMatches.length} MATCHING ENVIRONMENT(S)!`);
      console.log('');

      allMatches.forEach((env, index) => {
        const matchType = exactMatches.includes(env) ? '(Exact Match)' : '(Partial Match)';

        console.log('═══════════════════════════════════════');
        console.log(`Environment ${index + 1} ${matchType}`);
        console.log('═══════════════════════════════════════');
        console.log(`Environment ID: ${env.sys.id}`);
        console.log(`Environment Name: ${env.name}`);
        console.log('');

        // Display creator information if available
        if (env.sys.createdBy) {
          console.log('👤 Creator Information:');
          console.log(`   Created by: ${env.sys.createdBy.sys.id}`);
          console.log(`   Type: ${env.sys.createdBy.sys.linkType}`);
        }

        // Display creation and update timestamps
        if (env.sys.createdAt) {
          console.log(`   Created at: ${new Date(env.sys.createdAt).toLocaleString()}`);
        }

        if (env.sys.updatedAt) {
          console.log(`   Updated at: ${new Date(env.sys.updatedAt).toLocaleString()}`);
        }

        if (env.sys.updatedBy) {
          console.log(`   Updated by: ${env.sys.updatedBy.sys.id}`);
        }

        console.log('═══════════════════════════════════════');
        console.log('');
      });
    } else {
      console.log('ℹ️  No matching environment found');
      console.log(`   Search term "${searchName}" does not match any environment in the space.`);
      console.log('');
      console.log('📋 Available environments:');
      environments.items.forEach(env => {
        console.log(`   - ${env.sys.id} (${env.name})`);
      });
    }

  } catch (error) {
    console.error('❌ Error occurred while querying Contentful:');
    console.error('');
    
    if (error.message) {
      console.error(`Message: ${error.message}`);
    }
    
    if (error.response && error.response.status) {
      console.error(`Status: ${error.response.status}`);
    }
    
    if (error.response && error.response.statusText) {
      console.error(`Status Text: ${error.response.statusText}`);
    }

    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Verify your CONTENTFUL_MANAGEMENT_TOKEN is valid');
    console.error('   2. Ensure the token has access to the specified space');
    console.error('   3. Check that CONTENTFUL_SPACE_ID is correct');
    
    process.exit(1);
  }
}

// Run the main function
checkContentfulEnvironment();

