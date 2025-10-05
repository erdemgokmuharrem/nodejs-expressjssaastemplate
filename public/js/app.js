// SaaS Boilerplate Frontend JavaScript

class SaaSApp {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.loadDashboard();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Register form
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
    }

    async checkAuthStatus() {
        if (!this.accessToken) {
            this.showLogin();
            return;
        }

        try {
            const response = await this.apiCall('/api/auth/me');
            if (response.success) {
                this.user = response.data.user;
                this.updateUI();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
        }
    }

    async apiCall(endpoint, options = {}) {
        const url = this.apiBaseUrl + endpoint;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` })
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();

        if (response.status === 401 && endpoint !== '/api/auth/me') {
            // Token expired, try to refresh
            const refreshed = await this.refreshToken();
            if (refreshed) {
                // Retry the original request
                return this.apiCall(endpoint, options);
            } else {
                this.logout();
                throw new Error('Authentication failed');
            }
        }

        return data;
    }

    async refreshToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(this.apiBaseUrl + '/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            const data = await response.json();
            if (data.success) {
                this.accessToken = data.data.accessToken;
                this.refreshToken = data.data.refreshToken;
                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('refreshToken', this.refreshToken);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        return false;
    }

    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            this.showLoading(true);
            const response = await this.apiCall('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response.success) {
                this.accessToken = response.data.accessToken;
                this.refreshToken = response.data.refreshToken;
                this.user = response.data.user;

                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('refreshToken', this.refreshToken);
                localStorage.setItem('user', JSON.stringify(this.user));

                this.hideModal('loginModal');
                this.updateUI();
                this.loadDashboard();
                this.showToast('Login successful!', 'success');
            } else {
                this.showToast(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showToast('Error occurred during login', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async register() {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const firstName = document.getElementById('registerFirstName').value;
        const lastName = document.getElementById('registerLastName').value;

        try {
            this.showLoading(true);
            const response = await this.apiCall('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, firstName, lastName })
            });

            if (response.success) {
                this.accessToken = response.data.accessToken;
                this.refreshToken = response.data.refreshToken;
                this.user = response.data.user;

                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('refreshToken', this.refreshToken);
                localStorage.setItem('user', JSON.stringify(this.user));

                this.hideModal('registerModal');
                this.updateUI();
                this.loadDashboard();
                this.showToast('Registration successful!', 'success');
            } else {
                this.showToast(response.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showToast('Error occurred during registration', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        this.showLogin();
    }

    updateUI() {
        if (this.user) {
            document.getElementById('userEmail').textContent = this.user.email;
            document.querySelector('.navbar-nav .dropdown-toggle').style.display = 'block';
        } else {
            document.querySelector('.navbar-nav .dropdown-toggle').style.display = 'none';
        }
    }

    async loadDashboard() {
        if (!this.user) return;

        try {
            // Load user projects
            const projectsResponse = await this.apiCall('/api/projects?limit=5');
            if (projectsResponse.success) {
                this.updateProjectStats(projectsResponse.data.projects);
                this.updateRecentProjects(projectsResponse.data.projects);
            }

            // Load subscription status
            const subscriptionResponse = await this.apiCall('/api/subscriptions/status');
            if (subscriptionResponse.success) {
                this.updateSubscriptionInfo(subscriptionResponse.data);
            }
        } catch (error) {
            console.error('Dashboard load failed:', error);
        }
    }

    updateProjectStats(projects) {
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.isActive).length;
        
        document.getElementById('totalProjects').textContent = totalProjects;
        document.getElementById('activeProjects').textContent = activeProjects;
    }

    updateRecentProjects(projects) {
        const container = document.getElementById('recentProjects');
        
        if (projects.length === 0) {
            container.innerHTML = '<p class="text-muted">No projects yet. <a href="#" onclick="app.showProjects()">Create your first project</a></p>';
            return;
        }

        const projectsHtml = projects.map(project => `
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-folder text-primary me-2"></i>
                <div>
                    <div class="fw-bold">${project.name}</div>
                    <small class="text-muted">${new Date(project.createdAt).toLocaleDateString('tr-TR')}</small>
                </div>
                <span class="badge ${project.isActive ? 'bg-success' : 'bg-secondary'} ms-auto">
                    ${project.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
        `).join('');

        container.innerHTML = projectsHtml;
    }

    updateSubscriptionInfo(subscription) {
        const plan = subscription.plan || 'FREE';
        const status = subscription.status || 'INACTIVE';
        
        document.getElementById('subscriptionPlan').textContent = plan;
        document.getElementById('accountStatus').textContent = status === 'ACTIVE' ? 'Aktif' : 'Pasif';
    }

    showProjects() {
        this.setPageTitle('Projeler');
        this.loadProjects();
    }

    async loadProjects() {
        try {
            const response = await this.apiCall('/api/projects');
            if (response.success) {
                this.displayProjects(response.data.projects);
            }
        } catch (error) {
            this.showToast('Projeler yüklenirken hata oluştu', 'error');
        }
    }

    displayProjects(projects) {
        const content = document.getElementById('content');
        
        if (projects.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h4>No projects yet</h4>
                    <p>Click the button below to create your first project.</p>
                    <button class="btn btn-primary" onclick="app.createProject()">
                        <i class="fas fa-plus me-2"></i>New Project
                    </button>
                </div>
            `;
            return;
        }

        const projectsHtml = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4>My Projects</h4>
                <button class="btn btn-primary" onclick="app.createProject()">
                    <i class="fas fa-plus me-2"></i>New Project
                </button>
            </div>
            <div class="row">
                ${projects.map(project => `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card project-card" onclick="app.editProject('${project.id}')">
                            <div class="card-body">
                                <h5 class="card-title">${project.name}</h5>
                                <p class="card-text text-muted">${project.description || 'No description'}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">
                                        ${new Date(project.createdAt).toLocaleDateString('tr-TR')}
                                    </small>
                                    <span class="badge ${project.isActive ? 'bg-success' : 'bg-secondary'}">
                                        ${project.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        content.innerHTML = projectsHtml;
    }

    createProject() {
        const name = prompt('Project name:');
        if (!name) return;

        const description = prompt('Project description (optional):');

        this.apiCall('/api/projects', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        }).then(response => {
            if (response.success) {
                this.showToast('Project created!', 'success');
                this.loadProjects();
            } else {
                this.showToast(response.message || 'Failed to create project', 'error');
            }
        }).catch(error => {
            this.showToast('Error occurred while creating project', 'error');
        });
    }

    showSubscription() {
        this.setPageTitle('Subscription');
        this.loadSubscription();
    }

    async loadSubscription() {
        try {
            const response = await this.apiCall('/api/subscriptions/status');
            if (response.success) {
                this.displaySubscription(response.data);
            }
        } catch (error) {
            this.showToast('Error occurred while loading subscription info', 'error');
        }
    }

    displaySubscription(subscription) {
        const content = document.getElementById('content');
        
        const statusClass = subscription.status === 'ACTIVE' ? 'success' : 
                           subscription.status === 'CANCELED' ? 'warning' : 'secondary';
        
        content.innerHTML = `
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Subscription Information</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Plan:</strong></div>
                                <div class="col-sm-8">
                                    <span class="badge bg-primary">${subscription.plan || 'FREE'}</span>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Status:</strong></div>
                                <div class="col-sm-8">
                                    <span class="badge bg-${statusClass}">${subscription.status || 'INACTIVE'}</span>
                                </div>
                            </div>
                            ${subscription.currentPeriodEnd ? `
                                <div class="row mb-3">
                                    <div class="col-sm-4"><strong>Next Billing:</strong></div>
                                    <div class="col-sm-8">
                                        ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Plan Upgrade</h5>
                        </div>
                        <div class="card-body">
                            <p>Subscribe to enjoy Pro plan features.</p>
                            <button class="btn btn-success w-100" onclick="app.upgradeSubscription()">
                                <i class="fas fa-credit-card me-2"></i>Buy Pro Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    upgradeSubscription() {
        this.apiCall('/api/subscriptions/create', {
            method: 'POST',
            body: JSON.stringify({ plan: 'PRO' })
        }).then(response => {
            if (response.success) {
                window.open(response.data.url, '_blank');
            } else {
                this.showToast(response.message || 'Failed to create checkout', 'error');
            }
        }).catch(error => {
            this.showToast('Error occurred while creating subscription', 'error');
        });
    }

    showProfile() {
        this.setPageTitle('Profile');
        this.loadProfile();
    }

    async loadProfile() {
        if (!this.user) return;

        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Profile Information</h5>
                        </div>
                        <div class="card-body">
                            <form id="profileForm">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">First Name</label>
                                        <input type="text" class="form-control" id="profileFirstName" value="${this.user.firstName || ''}">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Last Name</label>
                                        <input type="text" class="form-control" id="profileLastName" value="${this.user.lastName || ''}">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" value="${this.user.email}" disabled>
                                </div>
                                <button type="submit" class="btn btn-primary">Update</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Change Password</h5>
                        </div>
                        <div class="card-body">
                            <form id="passwordForm">
                                <div class="mb-3">
                                    <label class="form-label">Current Password</label>
                                    <input type="password" class="form-control" id="currentPassword">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">New Password</label>
                                    <input type="password" class="form-control" id="newPassword">
                                </div>
                                <button type="submit" class="btn btn-warning w-100">Change Password</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add form event listeners
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
    }

    async updateProfile() {
        const firstName = document.getElementById('profileFirstName').value;
        const lastName = document.getElementById('profileLastName').value;

        try {
            const response = await this.apiCall('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify({ firstName, lastName })
            });

            if (response.success) {
                this.user = { ...this.user, firstName, lastName };
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showToast('Profile updated!', 'success');
            } else {
                this.showToast(response.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            this.showToast('Error occurred while updating profile', 'error');
        }
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            const response = await this.apiCall('/api/users/change-password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (response.success) {
                this.showToast('Password changed!', 'success');
                document.getElementById('passwordForm').reset();
            } else {
                this.showToast(response.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            this.showToast('Error occurred while changing password', 'error');
        }
    }

    showAPI() {
        window.open('/api-docs', '_blank');
    }

    setPageTitle(title) {
        document.getElementById('pageTitle').textContent = title;
    }

    showLogin() {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }

    showRegister() {
        this.hideModal('loginModal');
        const modal = new bootstrap.Modal(document.getElementById('registerModal'));
        modal.show();
    }

    hideModal(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) modal.hide();
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('d-none');
        } else {
            spinner.classList.add('d-none');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.classList.remove('bg-success', 'bg-danger', 'bg-info');
        
        if (type === 'success') toast.classList.add('bg-success');
        else if (type === 'error') toast.classList.add('bg-danger');
        else toast.classList.add('bg-info');
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}

// Global functions for HTML onclick events
function showLogin() {
    app.showLogin();
}

function showRegister() {
    app.showRegister();
}

function showDashboard() {
    app.setPageTitle('Dashboard');
    app.loadDashboard();
    document.getElementById('content').innerHTML = document.getElementById('dashboard-content').innerHTML;
}

function showProjects() {
    app.showProjects();
}

function showSubscription() {
    app.showSubscription();
}

function showProfile() {
    app.showProfile();
}

function showAPI() {
    app.showAPI();
}

function logout() {
    app.logout();
}

// Initialize app
const app = new SaaSApp();
