#!/usr/bin/env node
/**
 * Seed DynamoDB Waiters table with waiters for each Georgian restaurant location.
 * Dynamically queries current location IDs from the Locations table.
 * Usage: node scripts/seed-waiters.mjs
 */
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'node:crypto';

const client = new DynamoDBClient({ region: 'us-west-2' });

async function getLocationIds() {
  const result = await client.send(new ScanCommand({
    TableName: 'Locations',
    ProjectionExpression: 'id, address',
  }));
  const locations = result.Items?.sort((a, b) =>
    a.address.S.localeCompare(b.address.S)
  ) ?? [];
  return locations.map((l) => ({ id: l.id.S, address: l.address.S }));
}

const WAITERS_PER_LOCATION = [
  { name: 'Giorgi', phone: '+995 599 123 456' },
  { name: 'Nino', phone: '+995 599 789 012' },
  { name: 'Luka', phone: '+995 599 345 678' },
];

async function main() {
  const locations = await getLocationIds();
  if (locations.length === 0) {
    console.error('No locations found. Run seed-dynamodb.mjs first.');
    process.exit(1);
  }

  console.log(`Found ${locations.length} locations:`);
  locations.forEach((l) => console.log(`  ${l.address} (${l.id})`));

  let count = 0;
  const now = new Date().toISOString();
  for (const location of locations) {
    for (let i = 0; i < WAITERS_PER_LOCATION.length; i++) {
      const w = WAITERS_PER_LOCATION[i];
      const userId = randomUUID();
      await client.send(new PutItemCommand({
        TableName: 'Waiters',
        Item: {
          userId: { S: userId },
          locationId: { S: location.id },
          createdAt: { S: now },
          reservations: { L: [] },
        },
      }));
      count++;
      console.log(`  Waiter ${w.name} (${userId}) -> ${location.address}`);
    }
  }

  console.log(`\nSeeded ${count} waiters across ${locations.length} locations`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
