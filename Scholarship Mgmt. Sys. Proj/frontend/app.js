// Configuration
const API_BASE_URL = 'http://localhost:8000/api';
let currentUser = null;
let token = localStorage.getItem('token');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (token) {
        fetchUserProfile();
    }
    loadDashboard();
});

// API Service
const api = {
    setAuthToken: (t) => {
        token = t;
        localStorage.setItem('token', t);
        axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    },
    
    request: async (method, endpoint, data = null) => {
        try {
            const response = await axios({
                method,
                url: `${API_BASE_URL}${endpoint}`,
                data
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Auth Functions
async function login(email, password) {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            email,
            password
        });
        
        api.setAuthToken(response.data.token);
        currentUser = response.data.user;
        updateUIAfterLogin();
        showAlert('Login successful!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        
        return response.data;
    } catch (error) {
        showAlert('Invalid credentials', 'danger');
    }
}

async function register(name, email, password, role) {
    try {
        const response = await axios.post(`${API_BASE_URL}/register`, {
            name,
            email,
            password,
            role
        });
        
        showAlert('Registration successful! Please login.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
        showLogin();
        
        return response.data;
    } catch (error) {
        showAlert('Registration failed', 'danger');
    }
}

async function logout() {
    try {
        await api.request('post', '/logout');
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    updateUIAfterLogout();
    loadDashboard();
    showAlert('Logged out successfully', 'info');
}

async function fetchUserProfile() {
    try {
        const response = await api.request('get', '/user/profile');
        currentUser = response;
        updateUIAfterLogin();
    } catch (error) {
        console.error('Failed to fetch profile:', error);
    }
}

// UI Functions
function updateUIAfterLogin() {
    document.getElementById('userInfo').classList.remove('d-none');
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role;
    
    // Show/hide menus based on role
    if (currentUser.role === 'admin') {
        document.getElementById('adminMenu').classList.remove('d-none');
    }
    if (currentUser.role === 'reviewer' || currentUser.role === 'admin') {
        document.getElementById('reviewerMenu').classList.remove('d-none');
    }
    
    // Update navbar buttons
    document.querySelector('.navbar .d-flex').innerHTML = `
        <div id="userInfo" class="text-white me-3">
            <span id="userName">${currentUser.name}</span>
            <span id="userRole" class="badge bg-light text-dark ms-2">${currentUser.role}</span>
        </div>
        <button class="btn btn-outline-light" onclick="logout()">Logout</button>
    `;
}

function updateUIAfterLogout() {
    document.getElementById('userInfo').classList.add('d-none');
    document.querySelector('.navbar .d-flex').innerHTML = `
        <button class="btn btn-outline-light me-2" onclick="showLogin()">Login</button>
        <button class="btn btn-light" onclick="showRegister()">Register</button>
    `;
    
    // Hide admin/reviewer menus
    document.getElementById('adminMenu').classList.add('d-none');
    document.getElementById('reviewerMenu').classList.add('d-none');
}

function showLogin() {
    new bootstrap.Modal(document.getElementById('loginModal')).show();
}

function showRegister() {
    new bootstrap.Modal(document.getElementById('registerModal')).show();
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Page Loading Functions
async function loadDashboard() {
    document.getElementById('pageTitle').textContent = 'Dashboard';
    document.getElementById('pageActions').innerHTML = '';
    
    let content = '<div class="row">';
    
    if (!currentUser) {
        content += `
            <div class="col-12">
                <div class="card shadow">
                    <div class="card-body text-center py-5">
                        <h3 class="text-muted">Welcome to Scholarship Management System</h3>
                        <p class="lead">Please login or register to continue</p>
                        <button class="btn btn-primary btn-lg me-2" onclick="showLogin()">Login</button>
                        <button class="btn btn-success btn-lg" onclick="showRegister()">Register</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        try {
            const stats = await api.request('get', '/admin/stats');
            
            content += `
                <div class="col-md-3 mb-4">
                    <div class="card bg-primary text-white stat-card">
                        <div class="card-body">
                            <h5 class="card-title">Scholarships</h5>
                            <h2 class="display-6">${stats.totalScholarships || 0}</h2>
                            <p class="card-text">Available opportunities</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card bg-success text-white stat-card">
                        <div class="card-body">
                            <h5 class="card-title">Applications</h5>
                            <h2 class="display-6">${stats.totalApplications || 0}</h2>
                            <p class="card-text">Total submitted</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card bg-warning text-white stat-card">
                        <div class="card-body">
                            <h5 class="card-title">Pending</h5>
                            <h2 class="display-6">${stats.pendingApplications || 0}</h2>
                            <p class="card-text">Under review</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card bg-info text-white stat-card">
                        <div class="card-body">
                            <h5 class="card-title">Users</h5>
                            <h2 class="display-6">${stats.totalUsers || 0}</h2>
                            <p class="card-text">Registered users</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Recent scholarships
            const scholarships = await api.request('get', '/scholarships?status=active&limit=4');
            content += `
                <div class="col-12">
                    <div class="card shadow">
                        <div class="card-header">
                            <h5 class="mb-0">Recent Scholarships</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                ${scholarships.data ? scholarships.data.map(scholarship => `
                                    <div class="col-md-6 mb-3">
                                        <div class="card card-hover h-100">
                                            <div class="card-body">
                                                <h5 class="card-title">${scholarship.title}</h5>
                                                <p class="card-text text-muted">${scholarship.description.substring(0, 100)}...</p>
                                                <div class="d-flex justify-content-between">
                                                    <span class="badge bg-success">$${scholarship.amount}</span>
                                                    <small class="text-muted">Deadline: ${new Date(scholarship.deadline).toLocaleDateString()}</small>
                                                </div>
                                                <button class="btn btn-sm btn-primary mt-2" onclick="viewScholarship(${scholarship.id})">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            content += `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Error loading dashboard data
                    </div>
                </div>
            `;
        }
    }
    
    content += '</div>';
    document.getElementById('contentArea').innerHTML = content;
}

async function loadScholarships() {
    document.getElementById('pageTitle').textContent = 'Available Scholarships';
    
    let actions = '<div class="d-flex gap-2">';
    if (currentUser) {
        actions += `
            <input type="text" class="form-control" id="searchInput" placeholder="Search scholarships..." style="width: 300px;">
            ${currentUser.role === 'admin' ? '<button class="btn btn-primary" onclick="showAddScholarship()"><i class="fas fa-plus me-1"></i> Add Scholarship</button>' : ''}
        `;
    }
    actions += '</div>';
    document.getElementById('pageActions').innerHTML = actions;
    
    try {
        const response = await api.request('get', '/scholarships');
        const scholarships = response.data || [];
        
        let content = `
            <div class="row mb-3">
                <div class="col-12">
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Search scholarships..." id="scholarshipSearch">
                        <button class="btn btn-outline-primary" onclick="searchScholarships()">Search</button>
                    </div>
                </div>
            </div>
            <div class="row" id="scholarshipsList">
        `;
        
        if (scholarships.length === 0) {
            content += `
                <div class="col-12">
                    <div class="alert alert-info">
                        No scholarships available at the moment.
                    </div>
                </div>
            `;
        } else {
            scholarships.forEach(scholarship => {
                const deadline = new Date(scholarship.deadline);
                const isPastDeadline = deadline < new Date();
                
                content += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card h-100 card-hover">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h5 class="card-title">${scholarship.title}</h5>
                                    <span class="badge ${scholarship.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                                        ${scholarship.status}
                                    </span>
                                </div>
                                <h6 class="card-subtitle mb-2 text-muted">${scholarship.provider}</h6>
                                <p class="card-text">${scholarship.description.substring(0, 150)}...</p>
                                <div class="mb-3">
                                    <strong>Amount:</strong> $${scholarship.amount}<br>
                                    <strong>Deadline:</strong> ${deadline.toLocaleDateString()}
                                    ${isPastDeadline ? ' <span class="badge bg-danger">Expired</span>' : ''}
                                </div>
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-sm btn-outline-primary" onclick="viewScholarship(${scholarship.id})">
                                        View Details
                                    </button>
                                    ${currentUser && currentUser.role === 'student' && !isPastDeadline ? `
                                        <button class="btn btn-sm btn-success" onclick="applyScholarship(${scholarship.id})">
                                            Apply Now
                                        </button>
                                    ` : ''}
                                    ${currentUser && currentUser.role === 'admin' ? `
                                        <div>
                                            <button class="btn btn-sm btn-warning" onclick="editScholarship(${scholarship.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger ms-1" onclick="deleteScholarship(${scholarship.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        content += '</div>';
        document.getElementById('contentArea').innerHTML = content;
    } catch (error) {
        document.getElementById('contentArea').innerHTML = `
            <div class="alert alert-danger">
                Error loading scholarships: ${error.message}
            </div>
        `;
    }
}

async function viewScholarship(id) {
    try {
        const scholarship = await api.request('get', `/scholarships/${id}`);
        
        const deadline = new Date(scholarship.deadline);
        const isPastDeadline = deadline < new Date();
        
        document.getElementById('pageTitle').textContent = scholarship.title;
        document.getElementById('pageActions').innerHTML = `
            <button class="btn btn-secondary" onclick="loadScholarships()">
                <i class="fas fa-arrow-left me-1"></i> Back
            </button>
            ${currentUser && currentUser.role === 'student' && !isPastDeadline ? `
                <button class="btn btn-success ms-2" onclick="applyScholarship(${scholarship.id})">
                    <i class="fas fa-paper-plane me-1"></i> Apply Now
                </button>
            ` : ''}
        `;
        
        document.getElementById('contentArea').innerHTML = `
            <div class="card shadow">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h3 class="mb-3">${scholarship.title}</h3>
                            <p class="lead">${scholarship.description}</p>
                            
                            <div class="mb-4">
                                <h5>Eligibility Criteria</h5>
                                <p>${scholarship.eligibility_criteria}</p>
                            </div>
                            
                            <div class="mb-4">
                                <h5>Application Process</h5>
                                <p>${scholarship.application_process}</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h5 class="card-title">Scholarship Details</h5>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item bg-light">
                                            <strong>Provider:</strong><br>
                                            ${scholarship.provider}
                                        </li>
                                        <li class="list-group-item bg-light">
                                            <strong>Amount:</strong><br>
                                            <span class="text-success fw-bold">$${scholarship.amount}</span>
                                        </li>
                                        <li class="list-group-item bg-light">
                                            <strong>Deadline:</strong><br>
                                            ${deadline.toLocaleDateString()}
                                            ${isPastDeadline ? '<span class="badge bg-danger ms-2">Expired</span>' : ''}
                                        </li>
                                        <li class="list-group-item bg-light">
                                            <strong>Status:</strong><br>
                                            <span class="badge ${scholarship.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                                                ${scholarship.status}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        showAlert('Error loading scholarship details', 'danger');
    }
}

async function applyScholarship(scholarshipId) {
    if (!currentUser || currentUser.role !== 'student') {
        showAlert('Please login as a student to apply', 'warning');
        return;
    }
    
    // Show application form modal
    const modalHTML = `
        <div class="modal fade" id="applyModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">Apply for Scholarship</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="applicationForm">
                            <div class="mb-3">
                                <label class="form-label">Why should you receive this scholarship?</label>
                                <textarea class="form-control" rows="4" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Academic Achievements</label>
                                <textarea class="form-control" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Extracurricular Activities</label>
                                <textarea class="form-control" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Upload Documents (PDF, max 5MB)</label>
                                <input type="file" class="form-control" multiple accept=".pdf,.doc,.docx">
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Submit Application</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('applyModal'));
    modal.show();
    
    // Remove modal on hide
    document.getElementById('applyModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
    
    // Handle form submission
    document.getElementById('applicationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            await api.request('post', '/applications', {
                scholarship_id: scholarshipId,
                application_data: {
                    essay: this.querySelector('textarea').value,
                    achievements: this.querySelectorAll('textarea')[1].value,
                    extracurricular: this.querySelectorAll('textarea')[2].value
                }
            });
            
            modal.hide();
            showAlert('Application submitted successfully!', 'success');
        } catch (error) {
            showAlert('Error submitting application', 'danger');
        }
    });
}

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await login(email, password);
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    await register(name, email, password, role);
});

// Initialize axios with token if exists
if (token) {
    api.setAuthToken(token);
}