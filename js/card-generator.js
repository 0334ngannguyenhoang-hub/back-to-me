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
