import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testEndpoints() {
  try {
    // Load test data
    const testData = JSON.parse(
      await fs.readFile(path.join(__dirname, 'test-location.json'), 'utf8')
    );

    console.log('Testing POST endpoint...');
    const createResponse = await fetch('http://localhost:3000/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!createResponse.ok) {
      throw new Error(`POST failed: ${createResponse.statusText}`);
    }

    const createdLocation = await createResponse.json();
    console.log('Successfully created location:', createdLocation);

    // Test updating the location
    console.log('\nTesting PUT endpoint...');
    const updatedData = {
      ...createdLocation,
      shortDescription: createdLocation.shortDescription + ' Updated description.'
    };

    const updateResponse = await fetch(`http://localhost:3000/api/locations/${createdLocation.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!updateResponse.ok) {
      throw new Error(`PUT failed: ${updateResponse.statusText}`);
    }

    const updatedLocation = await updateResponse.json();
    console.log('Successfully updated location:', updatedLocation);

    // Verify the location appears in GET all locations
    console.log('\nTesting GET endpoint...');
    const getResponse = await fetch('http://localhost:3000/api/locations');
    const allLocations = await getResponse.json();
    
    const found = allLocations.find(loc => loc.id === createdLocation.id);
    if (found) {
      console.log('Successfully retrieved location from GET all locations');
    } else {
      throw new Error('Created location not found in GET all locations');
    }

    console.log('\nAll tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testEndpoints();