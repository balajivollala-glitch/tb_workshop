const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// Load current user on page load
window.onload = function() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = '../index.html';
        return;
    }
    
    currentUser = JSON.parse(userStr);
    document.getElementById('studentName').textContent = currentUser.name;
    document.getElementById('studentId').textContent = currentUser.studentId;
    document.getElementById('department').textContent = currentUser.department;
    
    loadMyRequests();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);
};

// Handle form submission
document.getElementById('requestForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const requestData = {
        studentId: currentUser.studentId,
        studentName: currentUser.name,
        department: currentUser.department,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        parentPhone: document.getElementById('parentPhone').value,
        parentInformed: document.getElementById('parentInformed').value,
        reason: document.getElementById('reason').value
    };
    
    try {
        const response = await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Gate pass request submitted successfully!');
            document.getElementById('requestForm').reset();
            loadMyRequests();
        }
    } catch (error) {
        alert('Error submitting request. Please try again.');
        console.error(error);
    }
});

// Load student's requests
async function loadMyRequests() {
    try {
        const response = await fetch(`${API_URL}/requests/student/${currentUser.studentId}`);
        const requests = await response.json();
        
        const requestsList = document.getElementById('requestsList');
        
        if (requests.length === 0) {
            requestsList.innerHTML = '<div class="empty-state">No requests yet</div>';
            return;
        }
        
        requestsList.innerHTML = requests.map(req => `
            <div class="request-card ${req.status}">
                <div class="request-header">
                    <h4>Request #${req.id}</h4>
                    <span class="status-badge ${req.status}">${req.status}</span>
                </div>
                <div class="request-details">
                    <p><strong>Date:</strong> ${req.date}</p>
                    <p><strong>Time:</strong> ${req.time}</p>
                    <p><strong>Reason:</strong> ${req.reason}</p>
                    ${req.remarks ? `<p><strong>Moderator Remarks:</strong> ${req.remarks}</p>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}