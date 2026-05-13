gsap.registerPlugin(ScrollTrigger);

// Hero entrance
const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
tl.to("#hero-title", { opacity: 1, y: 0, duration: 1 })
  .to("#hero-subtitle", { opacity: 1, y: 0, duration: 0.8 }, "-=0.5")
  .to("#hero-cta", { opacity: 1, scale: 1, duration: 0.5 }, "-=0.3");

// Counter animation
document.querySelectorAll('.counter').forEach(counter => {
  const target = +counter.getAttribute('data-target');
  gsap.to(counter, {
    scrollTrigger: {
      trigger: counter,
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    innerText: target,
    duration: 2,
    snap: { innerText: 1 },
    onUpdate: function() {
      counter.innerText = Math.ceil(counter.innerText);
    }
  });
});

// Scroll-triggered fade-ups
gsap.utils.toArray('.fade-up').forEach(el => {
  gsap.from(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none none'
    },
    y: 40,
    opacity: 0,
    duration: 1
  });
});
