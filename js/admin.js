// ============================================================
// G STAR SCHOOL – ADMIN PANEL (Cloudflare Functions + D1 + imgBB)
// ============================================================

// ------------------ CONFIG ------------------
const IMG_BB_API_KEY = '7fc4e70ff7c285b2e7c0ae7d1d60c4db';   // <-- REPLACE with your key from imgbb.com
const API_URL = '/api';
let token = localStorage.getItem('adminToken') || '';

// ------------------ AUTH ------------------
function checkAuth() {
  if (!token) {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
  } else {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    loadPage('dashboard');
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;
  try {
    const res = await fetch(`${API_URL}/login`, {
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
      document.getElementById('loginError').textContent = data.error || 'Login failed';
    }
  } catch (e) {
    document.getElementById('loginError').textContent = 'Network error';
  }
}

function logout() {
  token = '';
  localStorage.removeItem('adminToken');
  checkAuth();
}

// ------------------ API helper ------------------
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${token}` }
  };
  if (body && body instanceof FormData) {
    // For multipart (we use it for imgBB, not our own API anyway)
    opts.body = body;
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}${path}`, opts);
  return res.json();
}

// ------------------ NAVIGATION ------------------
function loadPage(page) {
  const content = document.getElementById('pageContent');
  switch (page) {
    case 'dashboard': loadDashboard(content); break;
    case 'notices': loadNotices(content); break;
    case 'news': loadNews(content); break;
    case 'gallery': loadGallery(content); break;
    case 'admissions': loadAdmissionForms(content); break;
    case 'teachers': loadTeachers(content); break;
    case 'students': loadStudents(content); break;
  }
}

document.querySelector('.sidebar nav').addEventListener('click', (e) => {
  e.preventDefault();
  if (e.target.tagName === 'A' && e.target.dataset.page) {
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    e.target.classList.add('active');
    loadPage(e.target.dataset.page);
  }
});

// ------------------ DASHBOARD ------------------
async function loadDashboard(container) {
  const data = await api('GET', '/dashboard');
  container.innerHTML = `
    <h2>Dashboard</h2>
    <div class="dashboard-cards">
      <div class="card"><h3>Students</h3><p>${data.students}</p></div>
      <div class="card"><h3>Teachers</h3><p>${data.teachers}</p></div>
      <div class="card"><h3>Notices</h3><p>${data.notices}</p></div>
      <div class="card"><h3>Admission Forms</h3><p>${data.admissions}</p></div>
    </div>
  `;
}

// ------------------ NOTICES (CRUD) ------------------
function loadNotices(container) {
  container.innerHTML = `
    <h2>Notices</h2>
    <button class="btn btn-primary" onclick="showNoticeForm()">Add Notice</button>
    <div id="noticesList"></div>
  `;
  refreshNotices();
}
async function refreshNotices() {
  const notices = await api('GET', '/notices');
  let html = '<table class="data-table"><tr><th>Title</th><th>Date</th><th>Actions</th></tr>';
  notices.forEach(n => html += `
    <tr>
      <td>${n.title}</td>
      <td>${n.date}</td>
      <td>
        <button class="btn btn-primary" onclick="editNotice('${n.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteNotice('${n.id}')">Delete</button>
      </td>
    </tr>`);
  html += '</table>';
  document.getElementById('noticesList').innerHTML = html;
}
function showNoticeForm(notice = null) {
  const id = notice ? notice.id : '';
  const title = notice ? notice.title : '';
  const content = notice ? notice.content : '';
  const date = notice ? notice.date : '';
  document.getElementById('pageContent').insertAdjacentHTML('afterbegin', `
    <div class="admin-form">
      <h3>${notice ? 'Edit' : 'Add'} Notice</h3>
      <input type="hidden" id="notId" value="${id}">
      <input id="notTitle" placeholder="Title" value="${title.replace(/"/g, '&quot;')}">
      <textarea id="notContent">${content}</textarea>
      <input id="notDate" type="date" value="${date}">
      <button class="btn btn-primary" onclick="saveNotice()">Save</button>
      <button class="btn" onclick="loadPage('notices')">Cancel</button>
    </div>
  `);
}
async function saveNotice() {
  const id = document.getElementById('notId').value;
  const body = {
    id: id || undefined,
    title: document.getElementById('notTitle').value,
    content: document.getElementById('notContent').value,
    date: document.getElementById('notDate').value
  };
  await api(id ? 'PUT' : 'POST', '/notices', body);
  loadPage('notices');
}
function editNotice(id) {
  api('GET', '/notices').then(notices => {
    const n = notices.find(n => n.id === id);
    showNoticeForm(n);
  });
}
function deleteNotice(id) {
  if (confirm('Delete?')) api('DELETE', `/notices/${id}`).then(() => refreshNotices());
}

// ------------------ NEWS (CRUD) ------------------
// Same pattern as notices – I include a basic version to show consistency.
// For full implementation, replicate the notices structure with news endpoints.
function loadNews(container) {
  container.innerHTML = `
    <h2>News</h2>
    <button class="btn btn-primary" onclick="showNewsForm()">Add News</button>
    <div id="newsList"></div>
  `;
  refreshNews();
}
async function refreshNews() {
  const news = await api('GET', '/news');
  let html = '<table class="data-table"><tr><th>Title</th><th>Date</th><th>Actions</th></tr>';
  news.forEach(n => html += `
    <tr>
      <td>${n.title}</td>
      <td>${n.date}</td>
      <td>
        <button class="btn btn-primary" onclick="editNews('${n.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteNews('${n.id}')">Delete</button>
      </td>
    </tr>`);
  html += '</table>';
  document.getElementById('newsList').innerHTML = html;
}
function showNewsForm(newsItem = null) {
  const id = newsItem ? newsItem.id : '';
  const title = newsItem ? newsItem.title : '';
  const summary = newsItem ? newsItem.summary : '';
  const content = newsItem ? newsItem.content : '';
  const date = newsItem ? newsItem.date : '';
  const image = newsItem ? newsItem.image : '';
  document.getElementById('pageContent').insertAdjacentHTML('afterbegin', `
    <div class="admin-form">
      <h3>${newsItem ? 'Edit' : 'Add'} News</h3>
      <input type="hidden" id="newsId" value="${id}">
      <input id="newsTitle" placeholder="Title" value="${title.replace(/"/g, '&quot;')}">
      <input id="newsSummary" placeholder="Summary" value="${summary}">
      <textarea id="newsContent">${content}</textarea>
      <input id="newsDate" type="date" value="${date}">
      <input id="newsImage" placeholder="Image URL (from imgBB or any)" value="${image}">
      <button class="btn btn-primary" onclick="saveNews()">Save</button>
      <button class="btn" onclick="loadPage('news')">Cancel</button>
    </div>
  `);
}
async function saveNews() {
  const id = document.getElementById('newsId').value;
  const body = {
    id: id || undefined,
    title: document.getElementById('newsTitle').value,
    summary: document.getElementById('newsSummary').value,
    content: document.getElementById('newsContent').value,
    date: document.getElementById('newsDate').value,
    image: document.getElementById('newsImage').value
  };
  await api(id ? 'PUT' : 'POST', '/news', body);
  loadPage('news');
}
function editNews(id) {
  api('GET', '/news').then(news => {
    const n = news.find(n => n.id === id);
    showNewsForm(n);
  });
}
function deleteNews(id) {
  if (confirm('Delete?')) api('DELETE', `/news/${id}`).then(() => refreshNews());
}

// ------------------ GALLERY (imgBB upload) ------------------
function loadGallery(container) {
  container.innerHTML = `
    <h2>Gallery</h2>
    <button class="btn btn-primary" onclick="showGalleryUpload()">Upload Photo</button>
    <div id="galleryList"></div>
  `;
  refreshGallery();
}
async function refreshGallery() {
  const items = await api('GET', '/gallery');
  let html = '<table class="data-table"><tr><th>Image</th><th>Category</th><th>Actions</th></tr>';
  items.forEach(g => html += `
    <tr>
      <td><img src="${g.url}" style="width:80px;height:60px;object-fit:cover"></td>
      <td>${g.category}</td>
      <td><button class="btn btn-danger" onclick="deleteGalleryItem('${g.id}')">Delete</button></td>
    </tr>`);
  html += '</table>';
  document.getElementById('galleryList').innerHTML = html;
}
function showGalleryUpload() {
  document.getElementById('pageContent').insertAdjacentHTML('afterbegin', `
    <div class="admin-form">
      <h3>Upload Photo</h3>
      <input type="file" id="galleryFile" accept="image/*">
      <input id="galleryAlt" placeholder="Description (optional)">
      <select id="galleryCategory">
        <option value="campus">Campus</option>
        <option value="events">Events</option>
        <option value="sports">Sports</option>
        <option value="classroom">Classroom</option>
      </select>
      <button class="btn btn-primary" onclick="uploadGalleryToImgBB()">Upload</button>
      <button class="btn" onclick="loadPage('gallery')">Cancel</button>
    </div>
  `);
}

// 🚀 New function – upload to imgBB, then save to D1
async function uploadGalleryToImgBB() {
  const fileInput = document.getElementById('galleryFile');
  const file = fileInput.files[0];
  if (!file) return alert('Please select an image file');

  const alt = document.getElementById('galleryAlt').value;
  const category = document.getElementById('galleryCategory').value;

  // 1) Upload to imgBB
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMG_BB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Upload failed');

    const imageUrl = json.data.url; // direct public URL

    // 2) Save URL and metadata to our D1 database via API
    await api('POST', '/gallery', {
      url: imageUrl,
      alt: alt || file.name,
      category
    });

    loadPage('gallery');
  } catch (err) {
    alert('Upload error: ' + err.message);
  }
}

function deleteGalleryItem(id) {
  if (confirm('Delete this photo?')) api('DELETE', `/gallery/${id}`).then(() => refreshGallery());
}

// ------------------ TEACHERS (CRUD) ------------------
function loadTeachers(container) {
  container.innerHTML = `
    <h2>Teachers</h2>
    <button class="btn btn-primary" onclick="showTeacherForm()">Add Teacher</button>
    <div id="teacherList"></div>
  `;
  refreshTeachers();
}
async function refreshTeachers() {
  const teachers = await api('GET', '/teachers');
  let html = '<table class="data-table"><tr><th>Name</th><th>Subject</th><th>Email</th><th>Actions</th></tr>';
  teachers.forEach(t => html += `
    <tr>
      <td>${t.name}</td>
      <td>${t.subject}</td>
      <td>${t.email}</td>
      <td>
        <button class="btn btn-primary" onclick="editTeacher('${t.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteTeacher('${t.id}')">Delete</button>
      </td>
    </tr>`);
  html += '</table>';
  document.getElementById('teacherList').innerHTML = html;
}
function showTeacherForm(teacher = null) {
  const id = teacher ? teacher.id : '';
  const name = teacher ? teacher.name : '';
  const subject = teacher ? teacher.subject : '';
  const email = teacher ? teacher.email : '';
  document.getElementById('pageContent').insertAdjacentHTML('afterbegin', `
    <div class="admin-form">
      <h3>${teacher ? 'Edit' : 'Add'} Teacher</h3>
      <input type="hidden" id="tId" value="${id}">
      <input id="tName" placeholder="Name" value="${name.replace(/"/g, '&quot;')}">
      <input id="tSubject" placeholder="Subject" value="${subject}">
      <input id="tEmail" placeholder="Email" value="${email}">
      <button class="btn btn-primary" onclick="saveTeacher()">Save</button>
      <button class="btn" onclick="loadPage('teachers')">Cancel</button>
    </div>
  `);
}
async function saveTeacher() {
  const id = document.getElementById('tId').value;
  const body = {
    id: id || undefined,
    name: document.getElementById('tName').value,
    subject: document.getElementById('tSubject').value,
    email: document.getElementById('tEmail').value
  };
  await api(id ? 'PUT' : 'POST', '/teachers', body);
  loadPage('teachers');
}
function editTeacher(id) {
  api('GET', '/teachers').then(teachers => {
    const t = teachers.find(t => t.id === id);
    showTeacherForm(t);
  });
}
function deleteTeacher(id) {
  if (confirm('Delete?')) api('DELETE', `/teachers/${id}`).then(() => refreshTeachers());
}

// ------------------ STUDENTS (CRUD) ------------------
function loadStudents(container) {
  container.innerHTML = `
    <h2>Students</h2>
    <button class="btn btn-primary" onclick="showStudentForm()">Add Student</button>
    <div id="studentList"></div>
  `;
  refreshStudents();
}
async function refreshStudents() {
  const students = await api('GET', '/students');
  let html = '<table class="data-table"><tr><th>Name</th><th>Grade</th><th>Parent</th><th>Actions</th></tr>';
  students.forEach(s => html += `
    <tr>
      <td>${s.name}</td>
      <td>${s.grade}</td>
      <td>${s.parent_name}</td>
      <td>
        <button class="btn btn-primary" onclick="editStudent('${s.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteStudent('${s.id}')">Delete</button>
      </td>
    </tr>`);
  html += '</table>';
  document.getElementById('studentList').innerHTML = html;
}
function showStudentForm(student = null) {
  const id = student ? student.id : '';
  const name = student ? student.name : '';
  const grade = student ? student.grade : '';
  const parent = student ? student.parent_name : '';
  document.getElementById('pageContent').insertAdjacentHTML('afterbegin', `
    <div class="admin-form">
      <h3>${student ? 'Edit' : 'Add'} Student</h3>
      <input type="hidden" id="sId" value="${id}">
      <input id="sName" placeholder="Name" value="${name.replace(/"/g, '&quot;')}">
      <input id="sGrade" placeholder="Grade" value="${grade}">
      <input id="sParent" placeholder="Parent Name" value="${parent}">
      <button class="btn btn-primary" onclick="saveStudent()">Save</button>
      <button class="btn" onclick="loadPage('students')">Cancel</button>
    </div>
  `);
}
async function saveStudent() {
  const id = document.getElementById('sId').value;
  const body = {
    id: id || undefined,
    name: document.getElementById('sName').value,
    grade: document.getElementById('sGrade').value,
    parent_name: document.getElementById('sParent').value
  };
  await api(id ? 'PUT' : 'POST', '/students', body);
  loadPage('students');
}
function editStudent(id) {
  api('GET', '/students').then(students => {
    const s = students.find(s => s.id === id);
    showStudentForm(s);
  });
}
function deleteStudent(id) {
  if (confirm('Delete?')) api('DELETE', `/students/${id}`).then(() => refreshStudents());
}

// ------------------ ADMISSION FORMS ------------------
async function loadAdmissionForms(container) {
  const data = await api('GET', '/admissions');
  container.innerHTML = `<h2>Admission Submissions</h2>
    <table class="data-table">
      <tr><th>Student</th><th>Parent</th><th>Grade</th><th>Email</th><th>Date</th><th>Action</th></tr>
      ${data.map(a => `
        <tr>
          <td>${a.student_name}</td>
          <td>${a.parent_name}</td>
          <td>${a.grade}</td>
          <td>${a.email}</td>
          <td>${new Date(a.submitted_at).toLocaleDateString()}</td>
          <td><button class="btn btn-danger" onclick="deleteAdmission('${a.id}')">Delete</button></td>
        </tr>`).join('')}
    </table>`;
}
function deleteAdmission(id) {
  if (confirm('Delete?')) api('DELETE', `/admissions/${id}`).then(() => loadPage('admissions'));
}

// ------------------ INIT ------------------
document.addEventListener('DOMContentLoaded', checkAuth);
