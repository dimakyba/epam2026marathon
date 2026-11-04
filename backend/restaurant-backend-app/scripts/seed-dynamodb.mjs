#!/usr/bin/env node
/**
 * Seed DynamoDB Locations and Dishes tables with Georgian restaurants/dishes.
 * Usage: node scripts/seed-dynamodb.mjs
 */
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'node:crypto';

const client = new DynamoDBClient({ region: 'us-west-2' });

const LOCATIONS = [
  {
    address: 'Tbilisi, Rustaveli Ave 15',
    description: 'Authentic Georgian cuisine in the heart of Tbilisi. Famous for Adjarian khachapuri and khinkali.',
    totalCapacity: 60,
    averageOccupancy: '70%',
    rating: 4.7,
  },
  {
    address: 'Batumi, seaside boulevard',
    description: 'Black Sea views with classic Georgian dishes. Best satsivi and badrijani in town.',
    totalCapacity: 80,
    averageOccupancy: '65%',
    rating: 4.6,
  },
  {
    address: 'Kutaisi, old town square',
    description: 'Cozy garden terrace with traditional Imeretian recipes and family-style service.',
    totalCapacity: 50,
    averageOccupancy: '60%',
    rating: 4.5,
  },
];

const DISHES = [
  {
    locationIdIndex: 0,
    name: 'Adjarian Khachapuri',
    description: 'Boat-shaped bread filled with sulguni cheese, topped with a raw egg and butter.',
    dishType: 1,
    price: 14.00,
    weight: '350 g',
    calories: '620 kcal',
    proteins: '22 g',
    fats: '28 g',
    carbohydrates: '65 g',
    vitamins: 'A, B12, Calcium',
    state: 1,
  },
  {
    locationIdIndex: 0,
    name: 'Khinkali',
    description: 'Juicy Georgian meat dumplings spiced with black pepper and coriander.',
    dishType: 1,
    price: 12.00,
    weight: '300 g (5 pcs)',
    calories: '420 kcal',
    proteins: '18 g',
    fats: '14 g',
    carbohydrates: '55 g',
    vitamins: 'Iron, B6',
    state: 1,
  },
  {
    locationIdIndex: 0,
    name: 'Lobio',
    description: 'Slow-cooked red bean stew in a clay pot with coriander and walnuts.',
    dishType: 1,
    price: 14.00,
    weight: '300 g',
    calories: '380 kcal',
    proteins: '12 g',
    fats: '10 g',
    carbohydrates: '50 g',
    vitamins: 'Fiber, Folate',
    state: 1,
  },
  {
    locationIdIndex: 1,
    name: 'Satsivi',
    description: 'Chicken in rich walnut-garlic sauce, a classic Georgian winter dish.',
    dishType: 1,
    price: 22.00,
    weight: '350 g',
    calories: '540 kcal',
    proteins: '24 g',
    fats: '30 g',
    carbohydrates: '30 g',
    vitamins: 'Vitamin E, Magnesium',
    state: 1,
  },
  {
    locationIdIndex: 1,
    name: 'Badrijani Nigvzit',
    description: 'Fried eggplant rolls stuffed with walnut paste and pomegranate seeds.',
    dishType: 0,
    price: 16.00,
    weight: '200 g',
    calories: '310 kcal',
    proteins: '6 g',
    fats: '18 g',
    carbohydrates: '28 g',
    vitamins: 'Vitamin C, Potassium',
    state: 1,
  },
  {
    locationIdIndex: 2,
    name: 'Churchkhela',
    description: 'Traditional Georgian candle-shaped candy of nuts dipped in grape must.',
    dishType: 2,
    price: 8.00,
    weight: '150 g',
    calories: '450 kcal',
    proteins: '8 g',
    fats: '12 g',
    carbohydrates: '70 g',
    vitamins: 'Iron, Antioxidants',
    state: 1,
  },
  {
    locationIdIndex: 2,
    name: 'Ajapsandali',
    description: 'Stewed eggplant, tomatoes, bell peppers and potatoes with Georgian herbs.',
    dishType: 0,
    price: 15.00,
    weight: '300 g',
    calories: '290 kcal',
    proteins: '5 g',
    fats: '9 g',
    carbohydrates: '42 g',
    vitamins: 'Vitamin A, C',
    state: 1,
  },
];

async function put(table, item) {
  const command = new PutItemCommand({ TableName: table, Item: item });
  await client.send(command);
  console.log(`Inserted into ${table}:`, item.S?.S ?? item.N?.S ?? item.name?.S);
}

async function main() {
  const locationIds = [];
  for (const loc of LOCATIONS) {
    const id = randomUUID();
    locationIds.push(id);
    await put('Locations', {
      id: { S: id },
      address: { S: loc.address },
      description: { S: loc.description },
      totalCapacity: { N: String(loc.totalCapacity) },
      averageOccupancy: { S: loc.averageOccupancy },
      rating: { N: String(loc.rating) },
      specialtyDishIds: { L: [] },
    });
  }

  for (const dish of DISHES) {
    const id = randomUUID();
    await put('Dishes', {
      id: { S: id },
      name: { S: dish.name },
      description: { S: dish.description },
      dishType: { N: String(dish.dishType) },
      price: { N: String(dish.price) },
      weight: { S: dish.weight },
      calories: { S: dish.calories },
      proteins: { S: dish.proteins },
      fats: { S: dish.fats },
      carbohydrates: { S: dish.carbohydrates },
      vitamins: { S: dish.vitamins },
      state: { N: String(dish.state) },
      locationId: { S: locationIds[dish.locationIdIndex] },
    });
  }

  console.log('\nSeed complete. Locations:', locationIds.length, '| Dishes:', DISHES.length);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
