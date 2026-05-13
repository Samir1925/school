/* =================================================================
   G STAR SCHOOL – MAIN SCRIPT (Worker‑ready)
   - Hero background slider
   - Bottom tab bar active state
   - Counter animation (stats)
   - Loads dynamic content from Worker API
   ================================================================= */

// 🔹 Set your Worker URL here (replace YOUR_SUBDOMAIN)
const API_URL = 'https://school-api.YOUR_SUBDOMAIN.workers.dev';

// ---------- Hero Background Slider ----------
(function heroSlider() {
  const slides = document.querySelectorAll('.hero-slider .slide');
  if (slides.length === 0) return;
  let currentIndex = 0;
  setInterval(() => {
    slides[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % slides.length;
    slides[currentIndex].classList.add('active');
  }, 4000);
})();

// ---------- Bottom Navigation Active State ----------
(function bottomNavActive() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bottom-nav a').forEach(link => {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();

// ---------- Stats Counter Animation ----------
(function animateCounters() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNumbers.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          if (isNaN(target)) return;
          let start = 0;
          const duration = 2000;
          const stepTime = 20;
          const totalSteps = duration / stepTime;
          const increment = target / totalSteps;
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              el.textContent = target;
              clearInterval(timer);
            } else {
              el.textContent = Math.floor(start);
            }
          }, stepTime);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const statsContainer = document.querySelector('.stats-grid');
  if (statsContainer) observer.observe(statsContainer);
})();

// ---------- Load News Preview on Homepage ----------
(function loadNewsPreview() {
  const container = document.getElementById('news-preview');
  if (!container) return;

  fetch(`${API_URL}/news`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to load news');
      return res.json();
    })
    .then(data => {
      const html = data.slice(0, 3).map(item => `
        <article class="news-card">
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          <small>${item.date}</small>
        </article>
      `).join('');
      container.innerHTML = html || '<p>No news yet.</p>';
    })
    .catch(err => {
      container.innerHTML = '<p>News could not be loaded.</p>';
      console.error(err);
    });
})();

// ---------- Optional: Smooth Page Transition (app feel) ----------
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href]:not([target="_blank"]):not([href^="#"]):not([href^="javascript"]):not([href^="mailto"]):not([href^="tel"])').forEach(link => {
    link.addEventListener('click', function(e) {
      const url = this.getAttribute('href');
      if (url && !url.startsWith('http') && url.endsWith('.html')) {
        e.preventDefault();
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.2s ease';
        setTimeout(() => {
          window.location.href = url;
        }, 150);
      }
    });
  });
});
