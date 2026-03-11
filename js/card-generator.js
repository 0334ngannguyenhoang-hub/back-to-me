function generateCard() {

  const data = {
    adultName: document.getElementById("adultNameInput").value,
    adultAge: document.getElementById("adultAgeInput").value,
    adultJob: document.getElementById("adultJobInput").value,
    adultLifeUpdate: document.getElementById("adultLifeUpdateInput").value,
    adultSuper: document.getElementById("adultSuperInput").value,
    adultIssues: document.getElementById("adultIssuesInput").value,

    childName: document.getElementById("childNameInput").value,
    childAge: document.getElementById("childAgeInput").value,
    childDream: document.getElementById("childDreamInput").value,
    childLifeUpdate: document.getElementById("childLifeUpdateInput").value,
    childSuper: document.getElementById("childSuperInput").value,
    childIssues: document.getElementById("childIssuesInput").value,
  };

  // lấy ảnh
  const adultImg = document.getElementById("previewAdultImg").src;
  const childImg = document.getElementById("previewChildImg").src;

  data.adultImg = adultImg;
  data.childImg = childImg;

  // lưu vào localStorage
  localStorage.setItem("cardData", JSON.stringify(data));

  // chuyển trang
  window.location.href = "product.html";
}

async function downloadCards() {

  const cards = document.querySelectorAll(".card-side, .card-side-1");

  let index = 1;

  for (const card of cards) {

    const canvas = await html2canvas(card, {
      scale: 3,
      useCORS: true,
      backgroundColor: null
    });

    const image = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = `nguach-card-${index}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    index++;
  }
}