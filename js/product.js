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

  if (element.dataset.objectUrl) {
    URL.revokeObjectURL(element.dataset.objectUrl);
    delete element.dataset.objectUrl;
  }

  if (!value) {
    element.removeAttribute("src");
    return;
  }

  if (value instanceof Blob) {
    const objectUrl = URL.createObjectURL(value);
    element.src = objectUrl;
    element.dataset.objectUrl = objectUrl;
    return;
  }

  element.src = value;
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

async function getCardDataForProduct() {
  if (typeof window.loadCardPayload === "function") {
    try {
      const payload = await window.loadCardPayload();
      if (payload) return payload;
    } catch (error) {
      console.error("Cannot read card payload from IndexedDB.", error);
    }
  }

  return safeReadCardData();
}

async function loadCardData() {
  const data = await getCardDataForProduct();

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

  fillImage("adultImg", data.adultRenderUrl || data.adultImageBlob || data.adultImg);
  fillImage("childImg", data.childRenderUrl || data.childImageBlob || data.childImg);
}

document.addEventListener("DOMContentLoaded", () => {
  loadCardData();
});
