function safeReadCardData() {
  try {
    return JSON.parse(localStorage.getItem("cardData"));
  } catch (error) {
    console.error("Cannot parse card data from localStorage.", error);
    return null;
  }
}

function fillText(id, value, fallback = "Chưa cập nhật") {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value || fallback;
}

function fillImage(id, value) {
  const element = document.getElementById(id);
  if (!element) return;

  if (value) {
    element.src = value;
  } else {
    element.removeAttribute("src");
  }
}

function showProductEmptyState() {
  const emptyState = document.getElementById("emptyState");
  const cardOutput = document.querySelector(".card-output");
  const actionButton = document.querySelector(".action-button");
  const footer = document.querySelector(".product-footer");

  if (emptyState) emptyState.hidden = false;
  if (cardOutput) cardOutput.hidden = true;
  if (actionButton) actionButton.hidden = true;
  if (footer) footer.hidden = true;
}

function loadCardData() {
  const data = safeReadCardData();

  if (!data || !data.adultName || !data.childName) {
    showProductEmptyState();
    return;
  }

  fillText("adultName", data.adultName, "Tên hiện tại");
  fillText("adultAge", data.adultAge, "Tuổi");
  fillText("adultJob", data.adultJob);
  fillText("adultLifeUpdate", data.adultLifeUpdate);
  fillText("adultSuper", data.adultSuper);
  fillText("adultIssues", data.adultIssues);

  fillText("childName", data.childName, "Tên hồi bé");
  fillText("childAge", data.childAge, "Tuổi");
  fillText("childDream", data.childDream);
  fillText("childLifeUpdate", data.childLifeUpdate);
  fillText("childSuper", data.childSuper);
  fillText("childIssues", data.childIssues);

  fillImage("adultImg", data.adultImg);
  fillImage("childImg", data.childImg);
}

document.addEventListener("DOMContentLoaded", loadCardData);
