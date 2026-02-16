#!/usr/bin/env node

const contentfulManagement = require('contentful-management');

function validateEnvironmentVariables() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const branchName = process.env.BRANCH_NAME;

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

  return { spaceId, accessToken, branchName };
}

function extractSearchName(branchName) {
  return branchName.includes('/')
    ? branchName.split('/').slice(1).join('/')
    : branchName;
}

function displaySearchInfo(branchName, searchName, spaceId) {
  console.log(`🔍 Checking for Contentful environment matching branch: "${branchName}"`);
  console.log(`🔎 Search term (extracted): "${searchName}"`);
  console.log(`📦 Space ID: ${spaceId}`);
  console.log('');
}

async function initializeContentfulAndFetchEnvironments(accessToken, spaceId) {
  const client = contentfulManagement.createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  console.log(`✅ Successfully connected to Contentful space: ${space.name}`);
  console.log('');
  const environments = await space.getEnvironments();

  return { client, environments };
}

async function fetchCurrentUserProfile(client) {
  console.log('🔄 Fetching current user information...');

  try {
    const currentUser = await client.getCurrentUser();

    if (currentUser && currentUser.sys && currentUser.sys.id) {
      console.log(`✅ Loaded current user: ${currentUser.firstName} ${currentUser.lastName}`);
      console.log('');
      return currentUser;
    }
  } catch (error) {
    console.log('⚠️  Could not fetch user details (will show user IDs only)');
    console.log('');
  }

  return null;
}

function buildUsersMap(currentUser) {
  const usersMap = {};

  if (currentUser) {
    const userId = currentUser.sys.id;
    usersMap[userId] = {
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      email: currentUser.email || '',
      avatarUrl: currentUser.avatarUrl || ''
    };
  }

  return usersMap;
}

function createUserFormatter(usersMap) {
  return function formatUserInfo(userId) {
    const user = usersMap[userId];

    if (user) {
      const fullName = `${user.firstName} ${user.lastName}`.trim();
      const nameAndEmail = fullName ? `${fullName} (${user.email})` : user.email;
      return nameAndEmail || userId;
    }

    return userId;
  };
}

function findExactMatches(environments, searchName) {
  return environments.items.filter(
    env => env.name === searchName || env.sys.id === searchName
  );
}

function findPartialMatches(environments, searchName) {
  return environments.items.filter(env => {
    const isExactMatch = env.name === searchName || env.sys.id === searchName;
    const containsInId = env.sys.id.includes(searchName);
    const containsInName = env.name.includes(searchName);
    return !isExactMatch && (containsInId || containsInName);
  });
}

function displayEnvironmentDetails(env, index, isExactMatch, formatUserInfo) {
  const matchType = isExactMatch ? '(Exact Match)' : '(Partial Match)';

  console.log('═══════════════════════════════════════');
  console.log(`Environment ${index + 1} ${matchType}`);
  console.log('═══════════════════════════════════════');
  console.log(`Environment ID: ${env.sys.id}`);
  console.log(`Environment Name: ${env.name}`);
  console.log('');

  if (env.sys.createdBy) {
    console.log('👤 Creator Information:');
    console.log(`   Created by: ${formatUserInfo(env.sys.createdBy.sys.id)}`);
  }

  if (env.sys.createdAt) {
    console.log(`   Created at: ${new Date(env.sys.createdAt).toLocaleString()}`);
  }

  if (env.sys.updatedAt) {
    console.log(`   Updated at: ${new Date(env.sys.updatedAt).toLocaleString()}`);
  }

  if (env.sys.updatedBy) {
    console.log(`   Updated by: ${formatUserInfo(env.sys.updatedBy.sys.id)}`);
  }

  console.log('═══════════════════════════════════════');
  console.log('');
}

function displayMatchingEnvironments(allMatches, exactMatches, formatUserInfo) {
  console.log(`✅ FOUND ${allMatches.length} MATCHING ENVIRONMENT(S)`);
  console.log('');

  allMatches.forEach((env, index) => {
    const isExactMatch = exactMatches.includes(env);
    displayEnvironmentDetails(env, index, isExactMatch, formatUserInfo);
  });
}

function displayNoMatchesFound(searchName, environments) {
  console.log('ℹ️  No matching environment found');
  console.log(`   Search term "${searchName}" does not match any environment in the space.`);
  console.log('');
  console.log('📋 Available environments:');

  environments.items.forEach(env => {
    console.log(`   - ${env.sys.id} (${env.name})`);
  });
}

function handleContentfulError(error) {
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

async function checkContentfulEnvironment() {
  const { spaceId, accessToken, branchName } = validateEnvironmentVariables();
  const searchName = extractSearchName(branchName);

  displaySearchInfo(branchName, searchName, spaceId);

  try {
    const { client, environments } = await initializeContentfulAndFetchEnvironments(accessToken, spaceId);

    const currentUser = await fetchCurrentUserProfile(client);
    const usersMap = buildUsersMap(currentUser);
    const formatUserInfo = createUserFormatter(usersMap);

    const exactMatches = findExactMatches(environments, searchName);
    const partialMatches = findPartialMatches(environments, searchName);
    const allMatches = [...exactMatches, ...partialMatches];

    if (allMatches.length > 0) {
      displayMatchingEnvironments(allMatches, exactMatches, formatUserInfo);
    } else {
      displayNoMatchesFound(searchName, environments);
    }
  } catch (error) {
    handleContentfulError(error);
  }
}

checkContentfulEnvironment();
