document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.main-nav');
  toggle?.addEventListener('click', () => nav.classList.toggle('active'));

  // Button-like smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Counter animation
  const statNumbers = document.querySelectorAll('.stat-number');
  const animateCounters = () => {
    statNumbers.forEach(el => {
      const target = +el.getAttribute('data-target');
      const duration = 2000;
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(start);
        }
      }, 16);
    });
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    });
  }, { threshold: 0.5 });
  if (statNumbers.length) observer.observe(statNumbers[0].parentNode);

  // Load news preview from JSON
  fetch('data/news.json')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('news-preview');
      if (!container) return;
      container.innerHTML = data.slice(0, 3).map(item => `
        <article class="news-card glass">
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          <small>${item.date}</small>
        </article>
      `).join('');
    });

  // GSAP Scroll animations (only if GSAP loaded)
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.feature-card').forEach(card => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 80%' },
        opacity: 0,
        y: 50,
        duration: 0.8
      });
    });
  }
});