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

function generateCard() {

  document.getElementById("childName").innerText =
    document.getElementById("childNameInput").value;

  document.getElementById("childDream").innerText =
    document.getElementById("childDreamInput").value;

  document.getElementById("childSuper").innerText =
    document.getElementById("childSuperInput").value;

  document.getElementById("adultName").innerText =
    document.getElementById("adultNameInput").value;

  document.getElementById("adultJob").innerText =
    document.getElementById("adultJobInput").value;

  document.getElementById("adultSuper").innerText =
    document.getElementById("adultSuperInput").value;

  document.getElementById("cardOutput").classList.remove("hidden");
}

function downloadCard() {
  const card = document.getElementById("cardOutput");

  html2canvas(card, { scale: 3 }).then(canvas => {
    const link = document.createElement("a");
    link.download = "back-to-me-id.png";
    link.href = canvas.toDataURL();
    link.click();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.body.classList.add("hero-loaded");
  }, 300);
});