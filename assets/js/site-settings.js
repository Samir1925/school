import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Fetches the site settings from Firestore (singleton document)
 * and updates all matching elements on the page.
 */
export async function loadSiteSettings() {
  try {
    const snap = await getDoc(doc(db, "site_settings", "singleton"));
    if (!snap.exists()) {
      console.warn("site-settings: No site settings document found.");
      return null;
    }

    const s = snap.data();

    // 1. Update the browser tab title
    if (s.school_name) {
      document.title = s.school_name + (s.tagline ? " – " + s.tagline : "");
    }

    // 2. Update all elements with a [data-setting] attribute
    document.querySelectorAll("[data-setting]").forEach(el => {
      const key = el.getAttribute("data-setting");
      if (s[key] !== undefined) {
        if (el.tagName === "IMG") {
          // Image elements – update the src
          el.src = s[key];
        } else if (el.tagName === "A" && el.hasAttribute("href")) {
          // Anchor elements – update the href (useful for tel: / mailto:)
          el.href = s[key];
        } else {
          // All other elements – update text content
          el.textContent = s[key];
        }
      }
    });

    // 3. Update all logo images that have the class "site-logo"
    if (s.logo_url) {
      document.querySelectorAll(".site-logo").forEach(img => {
        img.src = s.logo_url;
      });
    }

    // 4. Set CSS custom properties for primary/secondary colours
    if (s.primary_color) {
      document.documentElement.style.setProperty("--primary", s.primary_color);
      document.documentElement.style.setProperty("--primary-dark", adjustColor(s.primary_color, -20));
    }
    if (s.secondary_color) {
      document.documentElement.style.setProperty("--secondary", s.secondary_color);
    }

    // 5. Update address / phone / email in any element with specific data attributes
    if (s.address) {
      document.querySelectorAll("[data-address]").forEach(el => el.textContent = s.address);
    }
    if (s.phone) {
      document.querySelectorAll("[data-phone]").forEach(el => {
        if (el.tagName === "A") el.href = `tel:${s.phone}`;
        else el.textContent = s.phone;
      });
    }
    if (s.email) {
      document.querySelectorAll("[data-email]").forEach(el => {
        if (el.tagName === "A") el.href = `mailto:${s.email}`;
        else el.textContent = s.email;
      });
    }

    console.log("site-settings: Branding updated successfully.");
    return s;
  } catch (err) {
    console.error("site-settings: Failed to load settings –", err);
    return null;
  }
}

/**
 * Simple helper to darken/lighten a hex colour.
 * @param {string} hex - e.g. "#4f46e5"
 * @param {number} percent - negative to darken, positive to lighten
 * @returns {string} new hex colour
 */
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}
