//function transition hero 
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.body.classList.add("hero-loaded");
  }, 300);
});

//function transition intro
const introSection = document.querySelector(".intro");

const introObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      introSection.classList.add("intro-active");
    }
  });
}, { threshold: 0.4 });

introObserver.observe(introSection);


