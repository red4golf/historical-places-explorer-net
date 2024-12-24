import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base paths - adjust for development structure
const CONTENT_DIR = path.join(__dirname, '..', '..', 'content');
const LOCATIONS_DIR = path.join(CONTENT_DIR, 'locations');
const DRAFTS_DIR = path.join(LOCATIONS_DIR, 'drafts');

export async function ensureDirectories() {
    console.log('LocationService: Ensuring directories exist');
    console.log('- Content Dir:', CONTENT_DIR);
    console.log('- Locations Dir:', LOCATIONS_DIR);
    console.log('- Drafts Dir:', DRAFTS_DIR);

    try {
        await Promise.all([
            fs.mkdir(CONTENT_DIR, { recursive: true }),
            fs.mkdir(LOCATIONS_DIR, { recursive: true }),
            fs.mkdir(DRAFTS_DIR, { recursive: true })
        ]);
        console.log('LocationService: Directories verified');
    } catch (error) {
        console.error('LocationService: Error creating directories:', error);
        throw error;
    }
}

export async function getLocations() {
    try {
        console.log('LocationService: Starting getLocations');
        await ensureDirectories();
        
        // Get verified locations
        console.log('LocationService: Reading verified locations directory');
        const verifiedFiles = await fs.readdir(LOCATIONS_DIR);
        console.log('LocationService: Found files:', verifiedFiles);
        
        const verifiedLocations = await Promise.all(
            verifiedFiles
                .filter(file => file.endsWith('.json') && !file.startsWith('.') &&
                              !['.', '..', 'drafts', 'examples', 'schema'].includes(file))
                .map(async file => {
                    try {
                        console.log('LocationService: Reading file:', file);
                        const content = await fs.readFile(path.join(LOCATIONS_DIR, file), 'utf8');
                        const location = JSON.parse(content);
                        location.id = location.id || path.basename(file, '.json');
                        console.log('LocationService: Loaded verified location:', location.name);
                        return { ...location, isDraft: false };
                    } catch (error) {
                        console.error('LocationService: Error reading location file:', file, error);
                        return null;
                    }
                })
        );

        // Get draft locations
        console.log('LocationService: Reading drafts directory');
        const draftFiles = await fs.readdir(DRAFTS_DIR);
        console.log('LocationService: Found draft files:', draftFiles);
        
        const draftLocations = await Promise.all(
            draftFiles
                .filter(file => file.endsWith('.json') && !file.startsWith('.'))
                .map(async file => {
                    try {
                        const content = await fs.readFile(path.join(DRAFTS_DIR, file), 'utf8');
                        const location = JSON.parse(content);
                        location.id = location.id || path.basename(file, '.json');
                        console.log('LocationService: Loaded draft location:', location.name);
                        return { ...location, isDraft: true };
                    } catch (error) {
                        console.error('LocationService: Error reading draft file:', file, error);
                        return null;
                    }
                })
        );

        const allLocations = [...verifiedLocations, ...draftLocations]
            .filter(location => location !== null);

        console.log(`LocationService: Found ${allLocations.length} total locations`);

        // Format response for the map
        const response = {
            verified: allLocations
                .filter(loc => !loc.isDraft)
                .map(loc => ({
                    id: loc.id,
                    name: loc.name,
                    coordinates: loc.coordinates,
                    shortDescription: loc.shortDescription,
                    historicalPeriods: loc.historicalPeriods,
                    content: loc.content,  // Include content property
                    tags: loc.tags
                })),
            drafts: allLocations.filter(loc => loc.isDraft)
        };

        console.log('LocationService: Returning formatted response:', response);
        return response;
    } catch (error) {
        console.error('LocationService: Error in getLocations:', error);
        throw error;
    }
}

import os from 'os';
import { networkInterfaces } from 'os';

function getLocalIP() {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const networkInterface of interfaces[name]) {
      if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
        return networkInterface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost if no external IP found
}

export async function deleteLocation(id) {
    try {
        console.log(`LocationService: Attempting to delete location: ${id}`);
        const draftPath = path.join(DRAFTS_DIR, `${id}.json`);
        const verifiedPath = path.join(LOCATIONS_DIR, `${id}.json`);
        
        let locationData = null;

        // Try draft first
        try {
            locationData = JSON.parse(await fs.readFile(draftPath, 'utf8'));
            await fs.unlink(draftPath);
            console.log('LocationService: Deleted draft location:', locationData.name);
        } catch {
            // If not in drafts, try verified
            try {
                locationData = JSON.parse(await fs.readFile(verifiedPath, 'utf8'));
                await fs.unlink(verifiedPath);
                console.log('LocationService: Deleted verified location:', locationData.name);
            } catch {
                console.log('LocationService: Location not found:', id);
                throw new Error('Location not found');
            }
        }

        return locationData;
    } catch (error) {
        console.error('LocationService: Error in deleteLocation:', error);
        throw error;
    }
}