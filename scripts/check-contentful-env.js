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

  console.log(`🔍 Checking for Contentful environment matching branch: "${branchName}"`);
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

    // Look for an environment matching the branch name
    const matchingEnv = environments.items.find(
      env => env.name === branchName || env.sys.id === branchName
    );

    if (matchingEnv) {
      console.log('✅ ENVIRONMENT FOUND!');
      console.log('═══════════════════════════════════════');
      console.log(`Environment ID: ${matchingEnv.sys.id}`);
      console.log(`Environment Name: ${matchingEnv.name}`);
      console.log('');

      // Display creator information if available
      if (matchingEnv.sys.createdBy) {
        console.log('👤 Creator Information:');
        console.log(`   Created by: ${matchingEnv.sys.createdBy.sys.id}`);
        console.log(`   Type: ${matchingEnv.sys.createdBy.sys.linkType}`);
      }

      // Display creation and update timestamps
      if (matchingEnv.sys.createdAt) {
        console.log(`   Created at: ${new Date(matchingEnv.sys.createdAt).toLocaleString()}`);
      }

      if (matchingEnv.sys.updatedAt) {
        console.log(`   Updated at: ${new Date(matchingEnv.sys.updatedAt).toLocaleString()}`);
      }

      if (matchingEnv.sys.updatedBy) {
        console.log(`   Updated by: ${matchingEnv.sys.updatedBy.sys.id}`);
      }

      console.log('═══════════════════════════════════════');
      console.log('');
    } else {
      console.log('ℹ️  No matching environment found');
      console.log(`   Branch name "${branchName}" does not match any environment in the space.`);
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

