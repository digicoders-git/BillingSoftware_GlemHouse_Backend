const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Distributor = require('./models/Distributor');
const SalesRep = require('./models/SalesRep');
const Branch = require('./models/Branch');
const Return = require('./models/Return');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected');

  try {
    const adminUser = await User.findOne({ role: 'admin' });
    const branchUser = await User.findOne({ role: 'branch' });
    const salesUser = await User.findOne({ role: 'sales' });
    const distUser = await User.findOne({ role: 'distributor' });

    console.log('Admin found:', !!adminUser);
    console.log('Branch found:', !!branchUser);
    console.log('Sales found:', !!salesUser);
    console.log('Distributor found:', !!distUser);

    const generateToken = (id) => {
      return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    };

    const tokens = {
      admin: adminUser ? generateToken(adminUser._id) : null,
      branch: branchUser ? generateToken(branchUser._id) : null,
      sales: salesUser ? generateToken(salesUser._id) : null,
      distributor: distUser ? generateToken(distUser._id) : null,
    };

    console.log('\n--- Tokens ---');
    console.log('Branch Token:', tokens.branch ? 'Generated' : 'Missing');
    console.log('Sales Token:', tokens.sales ? 'Generated' : 'Missing');
    console.log('Distributor Token:', tokens.distributor ? 'Generated' : 'Missing');

    // We can print tokens so we could use them in curl if we wanted, 
    // but we can just use fetch here since Node 18+ has fetch.
    
    const testEndpoint = async (role, token, url, options = {}) => {
        if (!token) return console.log(`Skipping ${role} test, no token.`);
        try {
            const res = await fetch(`http://localhost:5555/api${url}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
            const data = await res.json();
            console.log(`[${role}] ${options.method || 'GET'} ${url} -> Status: ${res.status}`);
            if (res.status >= 400) {
                console.log(`Error Response:`, data);
            } else {
                console.log(`Success, got ${Array.isArray(data) ? data.length + ' items' : 'data'}`);
            }
            return { status: res.status, data };
        } catch (err) {
            console.log(`[${role}] Error fetching ${url}`, err.message);
        }
    };

    console.log('\n--- Testing GET /returns ---');
    await testEndpoint('admin', tokens.admin, '/returns?type=incoming');
    await testEndpoint('branch', tokens.branch, '/returns?type=outgoing');
    await testEndpoint('branch', tokens.branch, '/returns?type=incoming');
    await testEndpoint('sales', tokens.sales, '/returns?type=outgoing');
    await testEndpoint('sales', tokens.sales, '/returns?type=incoming');
    await testEndpoint('distributor', tokens.distributor, '/returns?type=outgoing');

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
});
