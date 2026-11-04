#!/usr/bin/env node
/**
 * Seed DynamoDB Tables table with tables for Georgian restaurants.
 * Usage: node scripts/seed-tables.mjs
 */
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'node:crypto';

const client = new DynamoDBClient({ region: 'us-west-2' });

// Location IDs from the Locations table (in order: Tbilisi, Batumi, Kutaisi)
const LOCATION_IDS = [
  'e5dbf1ef-d488-47a3-ab87-1a5c6ad30a01',
  'ff06af86-77a0-4d92-8ef8-fbe478742574',
  'f107ebe2-08f2-4cb1-91ee-a25c2f9de6a0',
];

const TABLES = [
  { locationIdIndex: 0, tableNumber: 1, capacity: 2 },
  { locationIdIndex: 0, tableNumber: 2, capacity: 4 },
  { locationIdIndex: 0, tableNumber: 3, capacity: 4 },
  { locationIdIndex: 0, tableNumber: 4, capacity: 6 },
  { locationIdIndex: 0, tableNumber: 5, capacity: 2 },
  { locationIdIndex: 0, tableNumber: 6, capacity: 4 },
  { locationIdIndex: 1, tableNumber: 1, capacity: 2 },
  { locationIdIndex: 1, tableNumber: 2, capacity: 4 },
  { locationIdIndex: 1, tableNumber: 3, capacity: 6 },
  { locationIdIndex: 1, tableNumber: 4, capacity: 8 },
  { locationIdIndex: 1, tableNumber: 5, capacity: 4 },
  { locationIdIndex: 1, tableNumber: 6, capacity: 2 },
  { locationIdIndex: 1, tableNumber: 7, capacity: 6 },
  { locationIdIndex: 1, tableNumber: 8, capacity: 4 },
  { locationIdIndex: 2, tableNumber: 1, capacity: 2 },
  { locationIdIndex: 2, tableNumber: 2, capacity: 4 },
  { locationIdIndex: 2, tableNumber: 3, capacity: 4 },
  { locationIdIndex: 2, tableNumber: 4, capacity: 6 },
  { locationIdIndex: 2, tableNumber: 5, capacity: 2 },
  { locationIdIndex: 2, tableNumber: 6, capacity: 4 },
];

async function main() {
  for (const t of TABLES) {
    await client.send(new PutItemCommand({
      TableName: 'Tables',
      Item: {
        id: { S: randomUUID() },
        locationId: { S: LOCATION_IDS[t.locationIdIndex] },
        capacity: { N: String(t.capacity) },
        tableNumber: { N: String(t.tableNumber) },
      },
    }));
  }
  console.log('Seeded', TABLES.length, 'tables');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
