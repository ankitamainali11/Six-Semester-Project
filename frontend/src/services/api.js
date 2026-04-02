const API_BASE_URL = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async verifyEmail(email, code) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async register(name, email, password, role = 'volunteer', interests = undefined) {
    const body = { name, email, password, role };
    if (interests) body.interests = interests;
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Opportunities methods
  async getOpportunities(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item));
        } else {
          queryParams.append(key, value);
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/opportunities${queryString ? `?${queryString}` : ''}`;
    
    const data = await this.request(endpoint);
    if (Array.isArray(data)) {
      return { opportunities: data };
    }
    if (data && Array.isArray(data.data)) {
      return { opportunities: data.data };
    }

    return data;
  }

  async getOpportunity(id) {
    return this.request(`/opportunities/${id}`);
  }

  async createOpportunity(opportunityData) {
    return this.request('/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunityData),
    });
  }

  async updateOpportunity(id, opportunityData) {
    return this.request(`/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(opportunityData),
    });
  }

  async deleteOpportunity(id) {
    return this.request(`/opportunities/${id}`, {
      method: 'DELETE',
    });
  }

  async applyToOpportunity(id) {
    return this.request(`/opportunities/${id}/apply`, {
      method: 'POST',
    });
  }

  // Tags methods
  async getTags() {
    return this.request('/tags');
  }

  async createTag(name) {
    return this.request('/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // User applications
  async getMyApplications() {
    return this.request('/opportunities/my-applications');
  }

  async getMyOpportunities() {
    return this.request('/opportunities/my');
  }

  async getApplicants(opportunityId) {
    return this.request(`/opportunities/${opportunityId}/applicants`);
  }

  async approveApplicant(opportunityId, userId) {
    return this.request(`/opportunities/${opportunityId}/approve-applicant`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async rejectApplicant(opportunityId, userId) {
    return this.request(`/opportunities/${opportunityId}/reject-applicant`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async markAsCompleted(opportunityId, userId) {
    return this.request(`/opportunities/${opportunityId}/mark-completed`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getRecommendedOpportunities() {
    return this.request('/opportunities/recommendations');
  }

  async getUserDashboard() {
    return this.request('/opportunities/dashboard');
  }

  async searchOpportunities(query) {
    return this.request(`/opportunities/search?q=${encodeURIComponent(query)}`);
  }

  // User profile
  async updateProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Contact form
  async sendContactMessage(messageData) {
    return this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // User preferences (saved opportunities)
  async getSavedOpportunities() {
    return this.request('/user/saved-opportunities');
  }

  async saveOpportunity(id) {
    return this.request('/user/saved-opportunities', {
      method: 'POST',
      body: JSON.stringify({ opportunityId: id }),
    });
  }

  async unsaveOpportunity(id) {
    return this.request(`/user/saved-opportunities/${id}`, {
      method: 'DELETE',
    });
  }

  // Get user interests (for testing)
  async getUserInterests() {
    return this.request('/user/interests');
  }

  // Admin API methods
  async adminListUsers(params = {}) {
    return this.request(`/admin/users?${new URLSearchParams(params).toString()}`);
  }

  async adminCreateUser(userData) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async adminGetUser(id) {
    return this.request(`/admin/users/${id}`);
  }

  async adminUpdateUser(id, userData) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async adminDeleteUser(id) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async adminListOpportunities(params = {}) {
    return this.request(`/admin/opportunities?${new URLSearchParams(params).toString()}`);
  }

  async adminCreateOpportunity(opportunityData) {
    return this.request('/admin/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunityData),
    });
  }

  async adminUpdateOpportunity(id, opportunityData) {
    return this.request(`/admin/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(opportunityData),
    });
  }

  async adminDeleteOpportunity(id) {
    return this.request(`/admin/opportunities/${id}`, {
      method: 'DELETE',
    });
  }

  async adminGetStats() {
    return this.request('/admin/stats');
  }
}

export default new ApiService();