// Lightbox gallery – used on gallery.html
document.addEventListener('DOMContentLoaded', () => {
  const galleryItems = document.querySelectorAll('.gallery-item img');
  galleryItems.forEach(img => {
    img.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', () => overlay.remove());
    });
  });
});