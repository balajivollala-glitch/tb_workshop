const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database file path - FIXED: Now points to correct location
const dbPath = path.join(__dirname, 'db.json');

// Helper function to read database
const readDB = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return { users: [], requests: [] };
    }
};

// Helper function to write database
const writeDB = (data) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing database:', error);
    }
};

// Initialize database if it doesn't exist
if (!fs.existsSync(dbPath)) {
    const initialData = {
        users: [
            { 
                id: 1, 
                username: 'student1', 
                password: 'pass123', 
                role: 'student', 
                name: 'Rahul Kumar', 
                department: 'CSE', 
                rollNo: 'CSE001' 
            },
            { 
                id: 2, 
                username: 'moderator1', 
                password: 'mod123', 
                role: 'moderator', 
                name: 'Dr. Sharma' 
            },
            { 
                id: 3, 
                username: 'gatekeeper1', 
                password: 'gate123', 
                role: 'gatekeeper', 
                name: 'Ravi Singh' 
            }
        ],
        requests: []
    };
    writeDB(initialData);
    console.log('✅ Database initialized successfully!');
}

// ==================== AUTH ROUTES ====================

// NEW: Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required' 
        });
    }
    
    const db = readDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
});

// ==================== STUDENT ROUTES ====================

// Submit gate pass request
app.post('/api/requests', (req, res) => {
    const db = readDB();
    
    const newRequest = {
        id: Date.now(),
        studentId: req.body.studentId,
        studentName: req.body.studentName,
        department: req.body.department,
        rollNo: req.body.rollNo,
        date: req.body.date,
        time: req.body.time,
        parentPhone: req.body.parentPhone,
        parentInformed: req.body.parentInformed,
        reason: req.body.reason,
        status: 'pending',
        remarks: '',
        createdAt: new Date().toISOString()
    };
    
    db.requests.push(newRequest);
    writeDB(db);
    
    console.log(`✅ New request created by ${newRequest.studentName}`);
    res.json({ success: true, request: newRequest });
});

// Get student's requests
app.get('/api/requests/student/:studentId', (req, res) => {
    const db = readDB();
    const requests = db.requests.filter(r => r.studentId == req.params.studentId);
    res.json(requests);
});

// ==================== MODERATOR ROUTES ====================

// Get all pending requests
app.get('/api/requests/pending', (req, res) => {
    const db = readDB();
    const pending = db.requests.filter(r => r.status === 'pending');
    res.json(pending);
});

// Get all requests
app.get('/api/requests', (req, res) => {
    const db = readDB();
    res.json(db.requests);
});

// NEW: Approve request
app.put('/api/requests/:id/approve', (req, res) => {
    const db = readDB();
    const request = db.requests.find(r => r.id == req.params.id);
    
    if (request) {
        request.status = 'approved';
        request.remarks = req.body.remarks || 'Approved';
        request.approvedAt = new Date().toISOString();
        writeDB(db);
        
        console.log(`✅ Request approved for ${request.studentName}`);
        res.json({ success: true, request });
    } else {
        res.status(404).json({ success: false, message: 'Request not found' });
    }
});

// NEW: Reject request
app.put('/api/requests/:id/reject', (req, res) => {
    const db = readDB();
    const request = db.requests.find(r => r.id == req.params.id);
    
    if (request) {
        request.status = 'rejected';
        request.remarks = req.body.remarks || 'Rejected';
        request.rejectedAt = new Date().toISOString();
        writeDB(db);
        
        console.log(`❌ Request rejected for ${request.studentName}`);
        res.json({ success: true, request });
    } else {
        res.status(404).json({ success: false, message: 'Request not found' });
    }
});

// ==================== GATEKEEPER ROUTES ====================

// Get approved requests
app.get('/api/requests/approved', (req, res) => {
    const db = readDB();
    const approved = db.requests.filter(r => r.status === 'approved');
    res.json(approved);
});

// NEW: Search request by student name or roll number
app.get('/api/requests/search', (req, res) => {
    const { query } = req.query;
    
    if (!query) {
        return res.status(400).json({ 
            success: false, 
            message: 'Search query is required' 
        });
    }
    
    const db = readDB();
    const searchLower = query.toLowerCase();
    
    const results = db.requests.filter(r => 
        r.studentName.toLowerCase().includes(searchLower) ||
        r.rollNo.toLowerCase().includes(searchLower) ||
        r.department.toLowerCase().includes(searchLower)
    );
    
    console.log(`🔍 Search for "${query}" - Found ${results.length} results`);
    res.json(results);
});

// NEW: Mark as exited
app.put('/api/requests/:id/exit', (req, res) => {
    const db = readDB();
    const request = db.requests.find(r => r.id == req.params.id);
    
    if (request) {
        request.exited = true;
        request.exitTime = new Date().toISOString();
        writeDB(db);
        
        console.log(`🚪 ${request.studentName} marked as exited`);
        res.json({ success: true, request });
    } else {
        res.status(404).json({ success: false, message: 'Request not found' });
    }
});

// ==================== UTILITY ROUTES ====================

// Get all users (for testing)
app.get('/api/users', (req, res) => {
    const db = readDB();
    // Remove passwords from response
    const usersWithoutPasswords = db.users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 ============================================');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🚀 Database location: ${dbPath}`);
    console.log('🚀 ============================================');
    console.log('📋 Available endpoints:');
    console.log('   POST   /api/login');
    console.log('   POST   /api/requests');
    console.log('   GET    /api/requests');
    console.log('   GET    /api/requests/student/:id');
    console.log('   GET    /api/requests/pending');
    console.log('   GET    /api/requests/approved');
    console.log('   GET    /api/requests/search?query=...');
    console.log('   PUT    /api/requests/:id/approve');
    console.log('   PUT    /api/requests/:id/reject');
    console.log('   PUT    /api/requests/:id/exit');
    console.log('   GET    /api/users');
    console.log('   GET    /health');
    console.log('🚀 ============================================');
});