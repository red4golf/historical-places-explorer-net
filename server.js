import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLocations, deleteLocation } from './src/utils/locationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// JSON middleware
app.use(express.json());

// API endpoints first
app.get('/api/locations', async (req, res) => {
    try {
        const locations = await getLocations();
        res.json(locations);
    } catch (error) {
        console.error('Error loading locations:', error);
        res.status(500).json({ error: 'Failed to load locations' });
    }
});

app.delete('/api/locations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const locationData = await deleteLocation(id);
        res.json({ message: 'Location deleted successfully', location: locationData });
    } catch (error) {
        if (error.message === 'Location not found') {
            res.status(404).json({ error: 'Location not found' });
        } else {
            console.error('Error deleting location:', error);
            res.status(500).json({ error: 'Failed to delete location' });
        }
    }
});

// Static file serving after API routes
app.use('/map-view', express.static('map-view'));
app.use(express.static('dist'));
app.use(express.static('public'));

// Route handlers
app.get('/map', (req, res) => {
    res.sendFile(path.join(__dirname, 'map-view', 'index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'map-view', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Production server running at http://localhost:${port}`);
    console.log('API endpoints:');
    console.log(`- GET  http://localhost:${port}/api/locations`);
    console.log(`- DELETE http://localhost:${port}/api/locations/:id`);
});