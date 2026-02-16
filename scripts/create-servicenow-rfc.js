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
  // Handle both formats:
  // 1. Flat structure from Contentful webhook template (GitHub client_payload)
  // 2. Nested structure for local testing

  let contentType, entryId, environment, spaceId, updatedBy, updatedAt;

  if (payload.contentType && payload.entryId) {
    // Flat structure from webhook
    contentType = payload.contentType || 'unknown';
    entryId = payload.entryId || 'unknown';
    environment = payload.environment || 'unknown';
    spaceId = payload.space || 'unknown';
    updatedBy = payload.updatedBy || 'unknown';
    updatedAt = payload.updatedAt || new Date().toISOString();
  } else {
    // Nested structure for local testing
    const sys = payload.sys || {};
    contentType = sys.contentType?.sys?.id || 'unknown';
    entryId = sys.id || 'unknown';
    environment = sys.environment?.sys?.id || 'unknown';
    spaceId = sys.space?.sys?.id || 'unknown';
    updatedBy = sys.updatedBy?.sys?.id || sys.createdBy?.sys?.id || 'unknown';
    updatedAt = sys.updatedAt || new Date().toISOString();
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
    category: 'Content Management',
    type: 'Standard',
    risk: 'Low',
    justification: `Content entry ${details.entryId} of type "${details.contentType}" was published in the "${details.environment}" environment by user ${details.updatedBy}.`,
    requested_by: details.updatedBy,
    configuration_item: `Contentful Space ${details.spaceId}`,
    planned_start_date: details.updatedAt,
    planned_end_date: details.updatedAt,
  };
}

function displayRfc(rfc) {
  console.log('========================================');
  console.log('  SERVICENOW RFC (MOCK)');
  console.log('========================================');
  console.log('');

  const fieldLabels = {
    short_description: 'Short Description',
    description: 'Description',
    category: 'Category',
    type: 'Type',
    risk: 'Risk',
    justification: 'Justification',
    requested_by: 'Requested By',
    configuration_item: 'Configuration Item',
    planned_start_date: 'Planned Start Date',
    planned_end_date: 'Planned End Date',
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

  console.log('========================================');
  console.log('  NOTE: This is a mock RFC for POC.');
  console.log('  In production, this would POST to the');
  console.log('  ServiceNow REST API at:');
  console.log('  https://<instance>.service-now.com/api/sn_chg_rest/change/standard');
  console.log('========================================');
}

function createServiceNowRfc() {
  const { contentfulPayload } = validateEnvironmentVariables();

  console.log('Parsing Contentful webhook payload...');
  console.log('Raw payload:', JSON.stringify(contentfulPayload, null, 2));
  const details = extractEventDetails(contentfulPayload);

  console.log('Building ServiceNow RFC...');
  console.log('');

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

  console.log('');
  console.log('Mock RFC created successfully.');
}

createServiceNowRfc();
