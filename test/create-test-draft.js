import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTestDraft() {
  try {
    // Load test data
    const testData = JSON.parse(
      await fs.readFile(path.join(__dirname, 'forks-timber-museum.json'), 'utf8')
    );

    console.log('Creating draft location...');
    const createResponse = await fetch('http://localhost:3000/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!createResponse.ok) {
      throw new Error(`POST failed: ${createResponse.statusText}`);
    }

    const createdLocation = await createResponse.json();
    console.log('Successfully created draft location:', createdLocation);
    console.log('You can now test the verification workflow with this draft.');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

createTestDraft();