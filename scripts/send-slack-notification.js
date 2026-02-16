#!/usr/bin/env node

const axios = require('axios');

function validateEnvironmentVariables() {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  const contentfulPayloadRaw = process.env.CONTENTFUL_PAYLOAD;

  if (!slackWebhookUrl) {
    console.error('Error: SLACK_WEBHOOK_URL is not set');
    process.exit(1);
  }

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

  return { slackWebhookUrl, contentfulPayload };
}

function extractEventDetails(payload) {
  const sys = payload.sys || {};
  const contentType = sys.contentType?.sys?.id || 'unknown';
  const entryId = sys.id || 'unknown';
  const environment = sys.environment?.sys?.id || 'unknown';
  const spaceId = sys.space?.sys?.id || 'unknown';
  const createdBy = sys.createdBy?.sys?.id || 'unknown';
  const updatedBy = sys.updatedBy?.sys?.id || createdBy;
  const updatedAt = sys.updatedAt || new Date().toISOString();
  const eventType = 'Entry.publish';

  return {
    eventType,
    contentType,
    entryId,
    environment,
    spaceId,
    updatedBy,
    updatedAt,
  };
}

function buildSlackMessage(details) {
  const contentfulLink = `https://app.contentful.com/spaces/${details.spaceId}/environments/${details.environment}/entries/${details.entryId}`;
  const timestamp = new Date(details.updatedAt).toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Contentful Entry Published',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Event Type:*\n${details.eventType}`,
          },
          {
            type: 'mrkdwn',
            text: `*Content Type:*\n${details.contentType}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Entry ID:*\n${details.entryId}`,
          },
          {
            type: 'mrkdwn',
            text: `*Environment:*\n${details.environment}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Changed By (User ID):*\n${details.updatedBy}`,
          },
          {
            type: 'mrkdwn',
            text: `*Timestamp (UTC):*\n${timestamp}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View in Contentful',
            },
            url: contentfulLink,
            style: 'primary',
          },
        ],
      },
    ],
  };
}

async function sendSlackNotification() {
  const { slackWebhookUrl, contentfulPayload } = validateEnvironmentVariables();

  console.log('Parsing Contentful webhook payload...');
  const details = extractEventDetails(contentfulPayload);

  console.log('Event details:');
  console.log(`  Event Type:    ${details.eventType}`);
  console.log(`  Content Type:  ${details.contentType}`);
  console.log(`  Entry ID:      ${details.entryId}`);
  console.log(`  Environment:   ${details.environment}`);
  console.log(`  Changed By:    ${details.updatedBy}`);
  console.log(`  Timestamp:     ${details.updatedAt}`);
  console.log('');

  const slackMessage = buildSlackMessage(details);

  console.log('Sending Slack notification...');

  try {
    const response = await axios.post(slackWebhookUrl, slackMessage, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(`Slack notification sent successfully (status: ${response.status})`);
  } catch (error) {
    console.error('Error sending Slack notification:');

    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`  Message: ${error.message}`);
    }

    console.error('');
    console.error('Troubleshooting tips:');
    console.error('  1. Verify your SLACK_WEBHOOK_URL is valid');
    console.error('  2. Ensure the Slack app is installed in the target workspace');
    console.error('  3. Check that the webhook has not been revoked');

    process.exit(1);
  }
}

sendSlackNotification();
