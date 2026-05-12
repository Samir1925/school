const testimonials = [
  { quote: "xxxx xxxx xxxx xxxx xxxx.", author: "Parent Name", role: "Parent" },
  { quote: "xxxx xxxx xxxx xxxx xxxx.", author: "Alumni", role: "Class of 2020" },
  { quote: "xxxx xxxx xxxx xxxx xxxx.", author: "Teacher", role: "Faculty" }
];

const slider = document.getElementById('testimonial-slider');
if (slider) {
  slider.innerHTML = testimonials.map(t => `
    <div class="testimonial-card">
      <blockquote>"${t.quote}"</blockquote>
      <cite>— ${t.author}, <span>${t.role}</span></cite>
    </div>
  `).join('');
}