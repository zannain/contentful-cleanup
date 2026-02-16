#!/usr/bin/env node

function validateEnvironmentVariables() {
  const contentfulPayloadRaw = process.env.CONTENTFUL_PAYLOAD;

  if (!contentfulPayloadRaw) {
    console.error('Error: CONTENTFUL_PAYLOAD is not set');
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

  return { contentfulPayload };
}

function extractEventDetails(payload) {

  let contentType, entryId, environment, spaceId, updatedBy, updatedAt;

  if (payload.contentType && payload.entryId) {
    contentType = payload.contentType || 'unknown';
    entryId = payload.entryId || 'unknown';
    environment = payload.environment || 'unknown';
    spaceId = payload.space || 'unknown';
    updatedBy = payload.updatedBy || 'unknown';
    updatedAt = payload.updatedAt || new Date().toISOString();
  }

  return { contentType, entryId, environment, spaceId, updatedBy, updatedAt };
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
      `Changed By:   ${details.updatedBy}`,
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

function createServiceNowRfc() {
  const { contentfulPayload } = validateEnvironmentVariables();

  console.log('Raw payload:', JSON.stringify(contentfulPayload, null, 2));
  const details = extractEventDetails(contentfulPayload);

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

createServiceNowRfc();
