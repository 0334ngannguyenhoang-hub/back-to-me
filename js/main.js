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



function previewImage(input, targetId) {
  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    document.getElementById(targetId).src = e.target.result;
  };

  reader.readAsDataURL(file);
}

document.getElementById("childImage").addEventListener("change", function() {
  previewImage(this, "previewChildImg");
});

document.getElementById("adultImage").addEventListener("change", function() {
  previewImage(this, "previewAdultImg");
});


