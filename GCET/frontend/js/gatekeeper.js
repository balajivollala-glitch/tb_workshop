const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let allApprovedPasses = [];

window.onload = function() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = '../index.html';
        return;
    }
    
    currentUser = JSON.parse(userStr);
    document.getElementById('gatekeeperName').textContent = currentUser.name;
    
    loadApprovedPasses();
    
    // Setup search functionality
    document.getElementById('searchInput').addEventListener('input', filterPasses);
};

async function loadApprovedPasses() {
    try {
        const response = await fetch(`${API_URL}/requests/approved/today`);
        allApprovedPasses = await response.json();
        
        displayPasses(allApprovedPasses);
    } catch (error) {
        console.error('Error loading approved passes:', error);
        alert('Error connecting to server. Make sure backend is running!');
    }
}

function displayPasses(passes) {
    const container = document.getElementById('approvedPasses');
    
    if (passes.length === 0) {
        container.innerHTML = '<div class="empty-state">No approved passes for today</div>';
        return;
    }
    
    container.innerHTML = passes.map(req => `
        <div class="request-card approved">
            <div class="request-header">
                <h4>${req.studentName}</h4>
                <span class="status-badge approved">✓ Approved</span>
            </div>
            <div class="request-details">
                <p><strong>Student ID:</strong> ${req.studentId}</p>
                <p><strong>Department:</strong> ${req.department}</p>
                <p><strong>Exit Time:</strong> ${req.time}</p>
                <p><strong>Parent Phone:</strong> ${req.parentPhone}</p>
                <p><strong>Parent Informed:</strong> ${req.parentInformed === 'yes' ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Reason:</strong> ${req.reason}</p>
                ${req.remarks ? `<p><strong>Moderator Remarks:</strong> ${req.remarks}</p>` : ''}
            </div>
            <div class="request-actions">
                <button onclick="allowExit('${req.studentName}', '${req.studentId}')" class="btn btn-success">
                    ✓ Allow Exit
                </button>
            </div>
        </div>
    `).join('');
}

function filterPasses() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayPasses(allApprovedPasses);
        return;
    }
    
    const filtered = allApprovedPasses.filter(pass => 
        pass.studentName.toLowerCase().includes(searchTerm) ||
        pass.studentId.toLowerCase().includes(searchTerm)
    );
    
    displayPasses(filtered);
}

function allowExit(studentName, studentId) {
    if (confirm(`Allow ${studentName} (${studentId}) to exit the gate?`)) {
        alert(`✓ ${studentName} is allowed to exit. Gate opened!`);
        // In a real system, you might want to log this action
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}