#!/usr/bin/env node
/**
 * Seed DynamoDB Tables table with tables for Georgian restaurants.
 * Dynamically queries current location IDs from the Locations table.
 * Usage: node scripts/seed-tables.mjs
 */
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'node:crypto';

const client = new DynamoDBClient({ region: 'us-west-2' });

async function getLocationIds() {
  const result = await client.send(new ScanCommand({
    TableName: 'Locations',
    ProjectionExpression: 'id, address',
  }));
  // Sort by address to get consistent order: Tbilisi, Batumi, Kutaisi
  const locations = result.Items?.sort((a, b) =>
    a.address.S.localeCompare(b.address.S)
  ) ?? [];
  return locations.map((l) => l.id.S);
}

const TABLES_PER_LOCATION = [
  // tableNumber, capacity
  [1, 2], [2, 4], [3, 4], [4, 6], [5, 2], [6, 4],
];

async function main() {
  const locationIds = await getLocationIds();
  if (locationIds.length === 0) {
    console.error('No locations found. Run seed-dynamodb.mjs first.');
    process.exit(1);
  }

  console.log(`Found ${locationIds.length} locations:`, locationIds);

  let count = 0;
  for (const [locIdx, locationId] of locationIds.entries()) {
    for (const [tableNumber, capacity] of TABLES_PER_LOCATION) {
      await client.send(new PutItemCommand({
        TableName: 'Tables',
        Item: {
          id: { S: randomUUID() },
          locationId: { S: locationId },
          capacity: { N: String(capacity) },
          tableNumber: { N: String(tableNumber) },
        },
      }));
      count++;
    }
  }

  console.log(`Seeded ${count} tables across ${locationIds.length} locations`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
