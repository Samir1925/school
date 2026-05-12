// Simple admin panel logic (to be used with Cloudflare Function API)
const API = '/api';
let token = localStorage.getItem('adminToken') || '';

function checkAuth() {
  if (!token) {
    document.getElementById('loginSection')?.style.setProperty('display', 'flex');
    document.getElementById('dashboardSection')?.style.setProperty('display', 'none');
  } else {
    document.getElementById('loginSection')?.style.setProperty('display', 'none');
    document.getElementById('dashboardSection')?.style.setProperty('display', 'block');
    loadDashboard();
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem('adminToken', token);
    checkAuth();
  } else {
    alert('Login failed');
  }
}

function logout() {
  token = '';
  localStorage.removeItem('adminToken');
  checkAuth();
}

async function loadDashboard() {
  const res = await fetch(`${API}/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  document.getElementById('studentCount').textContent = data.students || 0;
  document.getElementById('teacherCount').textContent = data.teachers || 0;
  // Fetch notices etc.
}

// Similar functions for notices CRUD, file upload, etc., calling API endpoints.
document.addEventListener('DOMContentLoaded', checkAuth);