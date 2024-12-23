import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { getLocations, deleteLocation } from './src/utils/locationService.js';

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API Routes
app.get('/api/locations', async (req, res) => {
    console.log('API: Received request for locations');
    try {
        console.log('API: Calling getLocations()');
        const locations = await getLocations();
        console.log('API: Got locations:', locations);
        
        // Set explicit headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        
        res.json(locations);
        console.log('API: Sent response successfully');
    } catch (error) {
        console.error('API Error loading locations:', error);
        res.status(500).json({ error: 'Failed to load locations' });
    }
});

app.delete('/api/locations/:id', async (req, res) => {
    console.log(`API: Received delete request for location ${req.params.id}`);
    try {
        const { id } = req.params;
        const locationData = await deleteLocation(id);
        res.json({ message: 'Location deleted successfully', location: locationData });
    } catch (error) {
        if (error.message === 'Location not found') {
            res.status(404).json({ error: 'Location not found' });
        } else {
            console.error('API Error deleting location:', error);
            res.status(500).json({ error: 'Failed to delete location' });
        }
    }
});

// Create Vite dev server
let vite;
try {
    console.log('Creating Vite server...');
    vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
    });
    console.log('Vite server created successfully');
} catch (error) {
    console.error('Error creating Vite server:', error);
    process.exit(1);
}

// Use Vite's connect instance as middleware
app.use(vite.middlewares);

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`Dev server running at http://localhost:${PORT}`);
    console.log('API endpoints:');
    console.log(`- GET  http://localhost:${PORT}/api/locations`);
    console.log(`- DELETE http://localhost:${PORT}/api/locations/:id`);
    console.log('='.repeat(50));
});