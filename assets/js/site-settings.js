import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadSiteSettings() {
  try {
    const snap = await getDoc(doc(db, "site_settings", "singleton"));
    if (!snap.exists()) return null;
    const s = snap.data();

    // 1. Update page title
    if (s.school_name) {
      document.title = s.school_name + (s.tagline ? " – " + s.tagline : "");
    }

    // 2. Update simple data-setting elements (school_name, tagline, address, etc.)
document.querySelectorAll("[data-setting]").forEach(el => {
  const key = el.getAttribute("data-setting");
  if (s[key] !== undefined) {
    if (el.tagName === "IMG") {
      el.src = s[key];
    } else if (el.tagName === "A") {
      // For anchors, update href AND text content
      if (key === "phone") {
        el.href = `tel:${s.phone}`;
        el.textContent = s.phone;
      } else if (key === "email") {
        el.href = `mailto:${s.email}`;
        el.textContent = s.email;
      } else {
        el.href = s[key];
        el.textContent = s[key];  // also update visible text
      }
    } else {
      el.textContent = s[key];
    }
  }
});

    // 3. Update logo images with class .site-logo
    if (s.logo_url) {
      document.querySelectorAll(".site-logo").forEach(img => img.src = s.logo_url);
    }

    // 4. CSS variables
    if (s.primary_color) document.documentElement.style.setProperty("--primary", s.primary_color);
    if (s.secondary_color) document.documentElement.style.setProperty("--secondary", s.secondary_color);

    // 5. Update Hero Section (if elements exist)
    if (s.hero_title && document.getElementById("hero-title"))
      document.getElementById("hero-title").textContent = s.hero_title;
    if (s.hero_subtitle && document.getElementById("hero-subtitle"))
      document.getElementById("hero-subtitle").textContent = s.hero_subtitle;
    if (s.cta_text && document.getElementById("hero-cta"))
      document.getElementById("hero-cta").textContent = s.cta_text;

    // 6. Update About Text (if element with id 'about-text' exists)
    if (s.about_text && document.getElementById("about-text"))
      document.getElementById("about-text").textContent = s.about_text;

    // 7. Build Statistics Section (container id = "stats-container")
    if (s.stats && Array.isArray(s.stats)) {
      const container = document.getElementById("stats-container");
      if (container) {
        container.innerHTML = s.stats.map(stat => `
          <div class="p-6">
            <i class="${stat.icon} text-5xl text-indigo-600 mb-4"></i>
            <p class="text-4xl font-bold text-gray-900"><span class="counter" data-target="${stat.value}">0</span>+</p>
            <p class="text-gray-600 mt-2">${stat.label}</p>
          </div>
        `).join('');
        // Re-run counter animation if any (call a global function)
        if (window.initCounters) window.initCounters();
      }
    }

    // 8. Build Features Section (id = "features-container")
    if (s.features && Array.isArray(s.features)) {
      const container = document.getElementById("features-container");
      if (container) {
        container.innerHTML = s.features.map(f => `
          <div class="fade-up bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition">
            <i class="${f.icon} text-5xl text-indigo-600 mb-6"></i>
            <h3 class="text-2xl font-semibold mb-4">${f.title}</h3>
            <p class="text-gray-600">${f.description}</p>
          </div>
        `).join('');
      }
    }

    // 9. Build Testimonials Section (id = "testimonials-container")
    if (s.testimonials && Array.isArray(s.testimonials)) {
      const container = document.getElementById("testimonials-container");
      if (container) {
        container.innerHTML = s.testimonials.map(t => `
          <div class="fade-up bg-white/10 backdrop-blur p-8 rounded-2xl">
            <p class="italic mb-6">"${t.quote}"</p>
            <div class="flex items-center gap-4">
              <img src="${t.image}" class="w-12 h-12 rounded-full" alt="${t.name}" />
              <div>
                <p class="font-bold">${t.name}</p>
                <p class="text-sm opacity-75">${t.role}</p>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // 10. Update Social Media Links (if elements with IDs exist)
    if (s.facebook && document.getElementById("fb-link"))
      document.getElementById("fb-link").href = s.facebook;
    if (s.instagram && document.getElementById("ig-link"))
      document.getElementById("ig-link").href = s.instagram;
    if (s.youtube && document.getElementById("yt-link"))
      document.getElementById("yt-link").href = s.youtube;

    console.log("site-settings: Full branding applied.");
    return s;
  } catch (err) {
    console.error("site-settings: Error –", err);
    return null;
  }
}
