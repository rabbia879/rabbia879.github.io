const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// File path for data
const DATA_FILE = 'customers.json';

// ========== HELPER FUNCTIONS ==========

// Read customers from file
function getCustomers() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data).customers;
    } catch (error) {
        console.log('Error reading file:', error.message);
        return [];
    }
}

// Save customers to file
function saveCustomers(customers) {
    try {
        const data = { customers: customers };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.log('Error saving file:', error.message);
        return false;
    }
}

// ========== API ROUTES ==========

// GET all customers
app.get('/customers', (req, res) => {
    console.log('GET /customers');
    const customers = getCustomers();
    res.json({
        success: true,
        count: customers.length,
        customers: customers
    });
});

// GET one customer by ID
app.get('/customer/:id', (req, res) => {
    const id = req.params.id.toUpperCase();
    console.log(`GET /customer/${id}`);
    
    const customers = getCustomers();
    const customer = customers.find(c => c.id === id);
    
    if (customer) {
        res.json({
            success: true,
            customer: customer
        });
    } else {
        res.status(404).json({
            success: false,
            message: `Customer ${id} not found`
        });
    }
});

// POST - Add new customer
app.post('/customer', (req, res) => {
    console.log('POST /customer');
    console.log('Received data:', req.body);
    
    const newCustomer = req.body;
    
    // Check required fields
    if (!newCustomer.id || !newCustomer.name || !newCustomer.email || !newCustomer.phone) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields',
            error: 'ID, name, email, and phone are required'
        });
    }
    
    // Get current customers
    const customers = getCustomers();
    
    // Check if ID already exists
    const existing = customers.find(c => c.id === newCustomer.id.toUpperCase());
    if (existing) {
        return res.status(400).json({
            success: false,
            message: 'Customer ID already exists',
            error: `Customer with ID ${newCustomer.id} is already registered`
        });
    }
    
    // Format the customer
    const formattedCustomer = {
        id: newCustomer.id.toUpperCase(),
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address || 'Not provided',
        membership: newCustomer.membership || 'Regular',
        totalSpent: Number(newCustomer.totalSpent) || 0,
        joinDate: new Date().toISOString().split('T')[0],
        lastPurchase: new Date().toISOString().split('T')[0]
    };
    
    // Add to array
    customers.push(formattedCustomer);
    
    // Save to file
    const saved = saveCustomers(customers);
    
    if (!saved) {
        return res.status(500).json({
            success: false,
            message: 'Error saving customer data'
        });
    }
    
    res.status(201).json({
        success: true,
        message: 'Customer added successfully',
        customer: formattedCustomer,
        total: customers.length
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ========================================
    🛒 Hamza Save Mart Customer API
    ========================================
    Server running at: http://localhost:${PORT}
    Data file: ${DATA_FILE}
    
    API Endpoints:
    GET  /customers     - Get all customers
    GET  /customer/:id  - Get specific customer
    POST /customer      - Add new customer
    
    Web Interface available at: http://localhost:${PORT}
    ========================================
    `);
}); 