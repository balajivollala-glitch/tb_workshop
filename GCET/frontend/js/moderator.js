const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let allRequests = [];

window.onload = function() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = '../index.html';
        return;
    }
    
    currentUser = JSON.parse(userStr);
    document.getElementById('moderatorName').textContent = currentUser.name;
    
    loadAllRequests();
};

async function loadAllRequests() {
    try {
        const response = await fetch(`${API_URL}/requests`);
        allRequests = await response.json();
        
        displayPendingRequests();
        displayAllRequests();
    } catch (error) {
        console.error('Error loading requests:', error);
        alert('Error connecting to server. Make sure backend is running!');
    }
}

function displayPendingRequests() {
    const pending = allRequests.filter(req => req.status === 'pending');
    const container = document.getElementById('pendingRequests');
    
    if (pending.length === 0) {
        container.innerHTML = '<div class="empty-state">No pending requests</div>';
        return;
    }
    
    container.innerHTML = pending.map(req => `
        <div class="request-card pending">
            <div class="request-header">
                <h4>${req.studentName} (${req.studentId})</h4>
                <span class="status-badge pending">Pending</span>
            </div>
            <div class="request-details">
                <p><strong>Department:</strong> ${req.department}</p>
                <p><strong>Date:</strong> ${req.date}</p>
                <p><strong>Time:</strong> ${req.time}</p>
                <p><strong>Parent Phone:</strong> ${req.parentPhone}</p>
                <p><strong>Parent Informed:</strong> ${req.parentInformed}</p>
                <p><strong>Reason:</strong> ${req.reason}</p>
                <p><strong>Submitted:</strong> ${new Date(req.submittedAt).toLocaleString()}</p>
            </div>
            <div class="remarks-section">
                <textarea id="remarks-${req.id}" class="remarks-input" placeholder="Enter remarks (optional for approval, required for rejection)" rows="3"></textarea>
                <div class="request-actions">
                    <button onclick="updateRequest(${req.id}, 'approved')" class="btn btn-success">✓ Approve</button>
                    <button onclick="updateRequest(${req.id}, 'rejected')" class="btn btn-danger">✗ Reject</button>
                </div>
            </div>
        </div>
    `).join('');
}

function displayAllRequests() {
    const container = document.getElementById('allRequests');
    
    if (allRequests.length === 0) {
        container.innerHTML = '<div class="empty-state">No requests history</div>';
        return;
    }
    
    // Sort by most recent first
    const sorted = [...allRequests].sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
    );
    
    container.innerHTML = sorted.map(req => `
        <div class="request-card ${req.status}">
            <div class="request-header">
                <h4>${req.studentName} (${req.studentId})</h4>
                <span class="status-badge ${req.status}">${req.status}</span>
            </div>
            <div class="request-details">
                <p><strong>Department:</strong> ${req.department}</p>
                <p><strong>Date:</strong> ${req.date}</p>
                <p><strong>Time:</strong> ${req.time}</p>
                <p><strong>Reason:</strong> ${req.reason}</p>
                <p><strong>Submitted:</strong> ${new Date(req.submittedAt).toLocaleString()}</p>
                ${req.remarks ? `<p><strong>Remarks:</strong> ${req.remarks}</p>` : ''}
                ${req.updatedAt ? `<p><strong>Updated:</strong> ${new Date(req.updatedAt).toLocaleString()}</p>` : ''}
            </div>
        </div>
    `).join('');
}

async function updateRequest(requestId, status) {
    const remarksInput = document.getElementById(`remarks-${requestId}`);
    const remarks = remarksInput ? remarksInput.value.trim() : '';
    
    // Validate remarks for rejection
    if (status === 'rejected' && !remarks) {
        alert('Please provide remarks for rejection');
        return;
    }
    
    // Confirm action
    const confirmMsg = status === 'approved' 
        ? 'Are you sure you want to APPROVE this request?' 
        : 'Are you sure you want to REJECT this request?';
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, remarks })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Request ${status} successfully!`);
            loadAllRequests(); // Reload all requests
        } else {
            alert('Error updating request');
        }
    } catch (error) {
        console.error('Error updating request:', error);
        alert('Error connecting to server');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}