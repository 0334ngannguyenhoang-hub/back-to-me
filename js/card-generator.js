function generateCard() {

  /* ================= CHILD ================= */

  const childImageInput = document.getElementById("childImage");
  const childName = document.getElementById("childNameInput").value;
  const childAge = document.getElementById("childAgeInput").value;
  const childDream = document.getElementById("childDreamInput").value;
  const childLifeUpdate = document.getElementById("childLifeUpdateInput").value;
  const childSuper = document.getElementById("childSuperInput").value;
  const childIssues = document.getElementById("childIssuesInput").value;

  document.getElementById("childName").innerText = childName;
  document.getElementById("childDream").innerText = childDream;
  document.getElementById("childSuper").innerText = childSuper;

  // Preview child image
  if (childImageInput.files && childImageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("previewChildImg").src = e.target.result;
    };
    reader.readAsDataURL(childImageInput.files[0]);
  }


  /* ================= ADULT ================= */

  const adultImageInput = document.getElementById("adultImage");
  const adultName = document.getElementById("adultNameInput").value;
  const adultAge = document.getElementById("adultAgeInput").value;
  const adultJob = document.getElementById("adultJobInput").value;
  const adultLifeUpdate = document.getElementById("adultLifeUpdateInput").value;
  const adultSuper = document.getElementById("adultSuperInput").value;
  const adultIssues = document.getElementById("adultIssuesInput").value;

  document.getElementById("adultName").innerText = adultName;
  document.getElementById("adultJob").innerText = adultJob;
  document.getElementById("adultSuper").innerText = adultSuper;

  // Preview adult image
  if (adultImageInput.files && adultImageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("previewAdultImg").src = e.target.result;
    };
    reader.readAsDataURL(adultImageInput.files[0]);
  }


  /* ================= SHOW CARD ================= */

  document.getElementById("cardOutput").classList.remove("hidden");

  // Scroll xuống thẻ cho mượt
  document.getElementById("cardOutput").scrollIntoView({
    behavior: "smooth"
  });
}



/* ================= DOWNLOAD ================= */

function downloadCard() {
  const card = document.getElementById("cardOutput");

  html2canvas(card, { scale: 3 }).then(canvas => {
    const link = document.createElement("a");
    link.download = "back-to-me-id.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}