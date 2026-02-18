#!/usr/bin/env node

function validateEnvironmentVariables() {
  const contentfulPayloadRaw = process.env.CONTENTFUL_PAYLOAD;
  const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

  if (!contentfulPayloadRaw) {
    console.error('Error: CONTENTFUL_PAYLOAD is not set');
    process.exit(1);
  }

  if (!managementToken) {
    console.error('Error: CONTENTFUL_MANAGEMENT_TOKEN is not set');
    process.exit(1);
  }

  let contentfulPayload;
  try {
    contentfulPayload = JSON.parse(contentfulPayloadRaw);
  } catch (error) {
    console.error('Error: CONTENTFUL_PAYLOAD is not valid JSON');
    console.error(`Parse error: ${error.message}`);
    process.exit(1);
  }

  return { contentfulPayload, managementToken };
}

function extractEventDetails(payload) {

  let contentType, entryId, environment, spaceId, userId, updatedBy, updatedAt;

  if (payload.contentType && payload.entryId) {
    contentType = payload.contentType || 'unknown';
    entryId = payload.entryId || 'unknown';
    environment = payload.environment || 'unknown';
    spaceId = payload.space || 'unknown';
    userId = payload.user || null;
    updatedBy = payload.updatedBy || 'unknown';
    updatedAt = payload.updatedAt || new Date().toISOString();
  }

  return { contentType, entryId, environment, spaceId, userId, updatedBy, updatedAt };
}

async function fetchUserName(spaceId, userId, managementToken) {
  const url = `https://api.contentful.com/spaces/${spaceId}/users/${userId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${managementToken}`,
      },
    });

    if (!response.ok) {
      console.warn(`Warning: Could not fetch user details (HTTP ${response.status})`);
      return null;
    }

    const user = await response.json();
    console.log('User:', user);
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || null;
  } catch (error) {
    console.warn(`Warning: Failed to fetch user details: ${error.message}`);
    return null;
  }
}

function buildRfcObject(details) {
  return {
    short_description: `Contentful content change: ${details.contentType} (${details.entryId})`,
    description: [
      `A content entry was published in Contentful.`,
      ``,
      `Content Type: ${details.contentType}`,
      `Entry ID:     ${details.entryId}`,
      `Environment:  ${details.environment}`,
      `Space ID:     ${details.spaceId}`,
      `Changed By:   ${details.updatedByName ? `${details.updatedByName} (${details.updatedBy})` : details.updatedBy}`,
      `Timestamp:    ${details.updatedAt}`,
      ``,
      `Contentful Link: https://app.contentful.com/spaces/${details.spaceId}/environments/${details.environment}/entries/${details.entryId}`,
    ].join('\n'),
  };
}

function displayRfc(rfc) {

  const fieldLabels = {
    short_description: 'Short Description',
    description: 'Description',
  };

  for (const [key, label] of Object.entries(fieldLabels)) {
    const value = rfc[key];
    if (key === 'description') {
      console.log(`${label}:`);
      value.split('\n').forEach(line => console.log(`  ${line}`));
    } else {
      console.log(`${label}: ${value}`);
    }
    console.log('');
  }
}

async function createServiceNowRfc() {
  const { contentfulPayload, managementToken } = validateEnvironmentVariables();

  console.log('Raw payload:', JSON.stringify(contentfulPayload, null, 2));
  const details = extractEventDetails(contentfulPayload);

  const lookupId = details.userId || details.updatedBy;
  if (lookupId && lookupId !== 'unknown' && details.spaceId && details.spaceId !== 'unknown') {
    console.log(`\nLooking up user details for: ${lookupId}`);
    const userName = await fetchUserName(details.spaceId, lookupId, managementToken);
    if (userName) {
      details.updatedByName = userName;
      console.log(`Resolved user: ${userName}\n`);
    } else {
      console.log('Could not resolve user name, using ID only.\n');
    }
  }

  const rfc = buildRfcObject(details);
  displayRfc(rfc);

  // Placeholder for actual ServiceNow API integration:
  //
  // const SERVICENOW_INSTANCE = process.env.SERVICENOW_INSTANCE;
  // const SERVICENOW_USERNAME = process.env.SERVICENOW_USERNAME;
  // const SERVICENOW_PASSWORD = process.env.SERVICENOW_PASSWORD;
  //
  // const response = await axios.post(
  //   `https://${SERVICENOW_INSTANCE}.service-now.com/api/sn_chg_rest/change/standard`,
  //   rfc,
  //   {
  //     auth: { username: SERVICENOW_USERNAME, password: SERVICENOW_PASSWORD },
  //     headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  //   }
  // );

}

createServiceNowRfc().catch((error) => {
  console.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
