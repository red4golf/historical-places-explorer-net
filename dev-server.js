import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { getLocations, deleteLocation } from './src/utils/locationService.js';
import { getStory } from './src/utils/storyService.js';
import { networkInterfaces } from 'os';

// Add function to get local IP address
function getLocalIP() {
    const nets = networkInterfaces();
    let addresses = [];
    
    // Collect all IPv4 addresses
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                addresses.push({
                    name: name,
                    address: net.address
                });
            }
        }
    }
    
    // Prioritize physical network adapters (typically 192.168.x.x)
    const physicalAdapter = addresses.find(addr => 
        addr.address.startsWith('192.168')
    );
    
    return physicalAdapter ? physicalAdapter.address : addresses[0]?.address || '127.0.0.1';
}

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

// Story endpoint
app.get('/api/stories/:filename', async (req, res) => {
    console.log('API: Received request for story:', req.params.filename);
    try {
        const content = await getStory(req.params.filename);
        res.setHeader('Content-Type', 'text/markdown');
        res.send(content);
        console.log('API: Story sent successfully');
    } catch (error) {
        console.error('API Error loading story:', error);
        res.status(500).json({ error: 'Failed to load story' });
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

// The server is set up to be accessible from mobile devices on the same network using the local IP address.
const PORT = process.env.PORT || 5173;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
    const localIP = getLocalIP();
    console.log('='.repeat(50));
    console.log(`Dev server running on:`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://${localIP}:${PORT}`);
    console.log('\nAPI endpoints:');
    console.log(`- GET  http://localhost:${PORT}/api/locations`);
    console.log(`- GET  http://localhost:${PORT}/api/stories/:filename`);
    console.log(`- DELETE http://localhost:${PORT}/api/locations/:id`);
    console.log('='.repeat(50));
});
