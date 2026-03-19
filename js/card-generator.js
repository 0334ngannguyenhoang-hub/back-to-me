const CARD_DATA_KEY = "cardData";
const API_BASE_URL =
  window.BACK_TO_ME_API_BASE_URL ||
  ((window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
    ? "http://127.0.0.1:8000"
    : window.location.origin);
const CARD_DB_NAME = "backToMeDemo";
const CARD_STORE_NAME = "cards";
const CARD_RECORD_KEY = "latestCard";

function setMessage(element, message, type) {
  if (!element) return;

  element.textContent = message;
  element.classList.remove("is-error", "is-success", "is-loading");

  if (type) {
    element.classList.add(type);
  }
}

function setInputInvalid(id, isInvalid) {
  const input = document.getElementById(id);
  if (!input) return;

  input.classList.toggle("input-invalid", isInvalid);
  input.setAttribute("aria-invalid", isInvalid ? "true" : "false");
}

function clearValidationState() {
  [
    "adultImage",
    "adultNameInput",
    "adultAgeInput",
    "childImage",
    "childNameInput",
    "childAgeInput"
  ].forEach((id) => setInputInvalid(id, false));
}

function readTrimmedValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function readSelectedFile(id) {
  const input = document.getElementById(id);
  return input && input.files && input.files[0] ? input.files[0] : null;
}

function createSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `submission-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getImageSource(id) {
  const element = document.getElementById(id);
  const src = element ? element.getAttribute("src") || "" : "";
  return src.trim();
}

function collectCardData() {
  return {
    submissionId: createSubmissionId(),
    adultName: readTrimmedValue("adultNameInput"),
    adultAge: readTrimmedValue("adultAgeInput"),
    adultJob: readTrimmedValue("adultJobInput"),
    adultLifeUpdate: readTrimmedValue("adultLifeUpdateInput"),
    adultSuper: readTrimmedValue("adultSuperInput"),
    adultIssues: readTrimmedValue("adultIssuesInput"),
    childName: readTrimmedValue("childNameInput"),
    childAge: readTrimmedValue("childAgeInput"),
    childDream: readTrimmedValue("childDreamInput"),
    childLifeUpdate: readTrimmedValue("childLifeUpdateInput"),
    childSuper: readTrimmedValue("childSuperInput"),
    childIssues: readTrimmedValue("childIssuesInput"),
    adultImg: getImageSource("previewAdultImg"),
    childImg: getImageSource("previewChildImg"),
    createdAt: new Date().toISOString()
  };
}

function validateCardData(data, files) {
  const missing = [];

  if (!files.adultImage || !data.adultImg) missing.push({ id: "adultImage", label: "ảnh hiện tại" });
  if (!data.adultName) missing.push({ id: "adultNameInput", label: "tên hiện tại" });
  if (!data.adultAge) missing.push({ id: "adultAgeInput", label: "tuổi hiện tại" });
  if (!files.childImage || !data.childImg) missing.push({ id: "childImage", label: "ảnh hồi bé" });
  if (!data.childName) missing.push({ id: "childNameInput", label: "tên hồi bé" });
  if (!data.childAge) missing.push({ id: "childAgeInput", label: "tuổi hồi bé" });

  return missing;
}

function toggleButtonState(button, isDisabled, idleLabel, loadingLabel) {
  if (!button) return;

  button.disabled = isDisabled;
  button.textContent = isDisabled ? loadingLabel : idleLabel;
}

function openCardDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CARD_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CARD_STORE_NAME)) {
        db.createObjectStore(CARD_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveCardPayload(payload) {
  const db = await openCardDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CARD_STORE_NAME, "readwrite");
    const store = transaction.objectStore(CARD_STORE_NAME);

    store.put(payload, CARD_RECORD_KEY);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error("Card storage aborted."));
    };
  });
}

async function loadCardPayload() {
  const db = await openCardDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CARD_STORE_NAME, "readonly");
    const store = transaction.objectStore(CARD_STORE_NAME);
    const request = store.get(CARD_RECORD_KEY);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

window.loadCardPayload = loadCardPayload;

function safeReadLocalCardData() {
  try {
    return JSON.parse(localStorage.getItem(CARD_DATA_KEY));
  } catch (error) {
    console.error("Cannot read local card data.", error);
    return null;
  }
}

function updateStoredCardData(patch) {
  const existing = safeReadLocalCardData();
  if (!existing) return;

  localStorage.setItem(
    CARD_DATA_KEY,
    JSON.stringify({
      ...existing,
      ...patch
    })
  );
}

async function generateCard() {
  const messageEl = document.getElementById("formMessage");
  const button = document.getElementById("generateButton");

  clearValidationState();
  setMessage(messageEl, "", "");

  const files = {
    adultImage: readSelectedFile("adultImage"),
    childImage: readSelectedFile("childImage")
  };
  const data = collectCardData();
  const missing = validateCardData(data, files);

  if (missing.length > 0) {
    missing.forEach(({ id }) => setInputInvalid(id, true));
    setMessage(
      messageEl,
      `Bạn cần bổ sung ${missing.map((item) => item.label).join(", ")} trước khi tạo card.`,
      "is-error"
    );

    const firstInvalid = document.getElementById(missing[0].id);
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  toggleButtonState(button, true, "Tạo card của bạn", "Đang tạo card...");
  setMessage(
    messageEl,
    "Đang lưu dữ liệu card. Với ảnh dung lượng lớn, bước này có thể mất thêm vài giây...",
    "is-loading"
  );

  try {
    await saveCardPayload({
      ...data,
      adultImageBlob: files.adultImage,
      childImageBlob: files.childImage,
      adultRenderUrl: data.adultImg,
      childRenderUrl: data.childImg
    });

    localStorage.setItem(
      CARD_DATA_KEY,
      JSON.stringify({
        ...data,
        adultRenderUrl: data.adultImg,
        childRenderUrl: data.childImg,
        hasIndexedImages: true
      })
    );

    window.location.href = "product.html";
  } catch (error) {
    console.error("Cannot save card data.", error);
    setMessage(
      messageEl,
      "Không thể lưu card trong trình duyệt. Bạn thử lại hoặc dùng ảnh nhẹ hơn một chút nhé.",
      "is-error"
    );
    toggleButtonState(button, false, "Tạo card của bạn", "Đang tạo card...");
  }
}

function getProductMessageElement() {
  return document.getElementById("productMessage");
}

function setProductMessage(message, type) {
  setMessage(getProductMessageElement(), message, type);
}

function getProductButtons() {
  return {
    pngButton: document.getElementById("downloadCardsButton"),
    gifButton: document.getElementById("downloadGifButton")
  };
}

function setDownloadButtonsDisabled(isDisabled, activeButton = null) {
  const { pngButton, gifButton } = getProductButtons();

  const updateLabel = (button, idleLabel, loadingLabel) => {
    if (!button) return;
    button.disabled = isDisabled;
    button.textContent = isDisabled && button === activeButton ? loadingLabel : idleLabel;
  };

  updateLabel(pngButton, "Tải 2 ảnh PNG", "Đang xuất PNG...");
  updateLabel(gifButton, "Tải GIF chuyển cảnh", "Đang xuất GIF...");
}

function getCardOutput() {
  return document.querySelector(".card-output");
}

function getCardSides() {
  const container = getCardOutput();
  if (!container) return {};

  return {
    container,
    card1: container.querySelector(".card-side"),
    card2: container.querySelector(".card-side-1")
  };
}

function captureCardState() {
  const { container, card1, card2 } = getCardSides();
  return {
    isActive: container ? container.classList.contains("active") : false,
    card1Opacity: card1 ? card1.style.opacity : "",
    card2Opacity: card2 ? card2.style.opacity : ""
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForImages(container) {
  const images = container.querySelectorAll("img");

  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      if (!img.getAttribute("src")) return Promise.resolve();

      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    })
  );
}

function showCardFace(face) {
  const { container, card1, card2 } = getCardSides();
  if (!container || !card1 || !card2) return;

  if (face === "child") {
    container.classList.add("active");
    card1.style.opacity = "0";
    card2.style.opacity = "1";
  } else {
    container.classList.remove("active");
    card1.style.opacity = "1";
    card2.style.opacity = "0";
  }
}

function resetCardFace() {
  const { card1, card2 } = getCardSides();
  if (!card1 || !card2) return;

  card1.style.opacity = "";
  card2.style.opacity = "";
}

function restoreCardState(state) {
  const { container, card1, card2 } = getCardSides();
  if (!container || !card1 || !card2 || !state) return;

  container.classList.toggle("active", state.isActive);
  card1.style.opacity = state.card1Opacity;
  card2.style.opacity = state.card2Opacity;
}

function download(canvas, filename) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}

function getDownloadTrayElements() {
  return {
    tray: document.getElementById("downloadTray"),
    links: document.getElementById("downloadLinks")
  };
}

function clearDownloadTray() {
  const { tray, links } = getDownloadTrayElements();
  if (!tray || !links) return;

  links.innerHTML = "";
  tray.hidden = true;
}

function setDownloadTray(items) {
  const { tray, links } = getDownloadTrayElements();
  if (!tray || !links) return;

  links.innerHTML = "";

  items.forEach((item) => {
    const link = document.createElement("a");
    link.className = `download-link ${item.className || ""}`.trim();
    link.href = item.href;
    link.download = item.filename;
    link.textContent = item.label;
    links.appendChild(link);
  });

  tray.hidden = items.length === 0;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Cannot convert canvas to blob."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

async function uploadGeneratedCardsOnce(adultCanvas, childCanvas) {
  const cardData = safeReadLocalCardData();

  if (!cardData || !cardData.submissionId) return { skipped: true, reason: "missing-card-data" };
  if (cardData.backendUploadedAt) return { skipped: true, reason: "already-uploaded" };

  const adultBlob = await canvasToBlob(adultCanvas);
  const childBlob = await canvasToBlob(childCanvas);

  const formData = new FormData();
  formData.append("metadata", JSON.stringify(cardData));
  formData.append("adultCard", adultBlob, "adult-card.png");
  formData.append("childCard", childBlob, "child-card.png");

  const response = await fetch(`${API_BASE_URL}/api/submissions`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const payload = await response.json();

  updateStoredCardData({
    backendUploadedAt: new Date().toISOString(),
    backendSubmissionId: payload.submissionId || cardData.submissionId
  });

  return payload;
}

function canExportCards() {
  const adultImg = document.getElementById("adultImg");
  const childImg = document.getElementById("childImg");

  if (!adultImg || !childImg || !adultImg.getAttribute("src") || !childImg.getAttribute("src")) {
    setProductMessage("Thiếu dữ liệu ảnh để xuất file. Bạn hãy quay lại tạo card lại nhé.", "is-error");
    return false;
  }

  const { container, card1, card2 } = getCardSides();
  if (!container || !card1 || !card2) {
    setProductMessage("Không tìm thấy card để xuất file.", "is-error");
    return false;
  }

  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  const cardOutput = getCardOutput();
  if (!cardOutput) return;

  cardOutput.addEventListener("click", () => {
    cardOutput.classList.toggle("active");
  });
});

async function downloadCards() {
  if (!canExportCards()) return;

  const { card1, card2 } = getCardSides();
  const { pngButton } = getProductButtons();
  const previousState = captureCardState();
  const exportScale = Math.max(3, Math.min(5, Math.ceil((window.devicePixelRatio || 1) * 2)));

  clearDownloadTray();
  setDownloadButtonsDisabled(true, pngButton);
  setProductMessage("Đang chụp 2 mặt card ở chất lượng cao...", "is-loading");

  try {
    await waitForImages(document.body);
    let uploadSynced = true;

    showCardFace("adult");
    await wait(400);

    const canvas1 = await html2canvas(card1, {
      scale: exportScale,
      useCORS: true,
      backgroundColor: "#ffffff",
      imageTimeout: 0,
      logging: false
    });

    download(canvas1, "nguEch-card-1.png");

    showCardFace("child");
    await wait(1600);

    const canvas2 = await html2canvas(card2, {
      scale: exportScale,
      useCORS: true,
      backgroundColor: "#ffffff",
      imageTimeout: 0,
      logging: false
    });

    try {
      await uploadGeneratedCardsOnce(canvas1, canvas2);
    } catch (uploadError) {
      uploadSynced = false;
      console.error("Cannot sync generated cards to backend.", uploadError);
      setProductMessage(
        "Ảnh đã tải về được, nhưng chưa đồng bộ lên hệ thống in quà. Bạn kiểm tra backend rồi tải lại một lần nữa nhé.",
        "is-error"
      );
    }

    const downloadItems = [
      {
        href: canvas1.toDataURL("image/png"),
        filename: "nguEch-card-1.png",
        label: "Tải ảnh hiện tại",
        className: "is-adult"
      },
      {
        href: canvas2.toDataURL("image/png"),
        filename: "nguEch-card-2.png",
        label: "Tải ảnh hồi bé",
        className: "is-child"
      }
    ];

    setDownloadTray(downloadItems);

    const downloadLinks = Array.from(document.querySelectorAll("#downloadLinks a"));
    if (downloadLinks[0]) {
      downloadLinks[0].click();
    }
    if (downloadLinks[1]) {
      setTimeout(() => downloadLinks[1].click(), 180);
    }

    if (uploadSynced) {
      setProductMessage(
        "Hệ thống đang tải 2 ảnh PNG. Nếu trình duyệt chặn một ảnh, bạn bấm nút còn lại ngay bên dưới nhé. Bản in cũng đã được lưu lên hệ thống.",
        "is-success"
      );
    } else {
      setProductMessage(
        "Hệ thống đang tải 2 ảnh PNG. Nếu trình duyệt chặn một ảnh, bạn bấm nút còn lại ngay bên dưới nhé.",
        "is-success"
      );
    }
  } catch (error) {
    console.error("Cannot export PNG cards.", error);
    setProductMessage("Tải 2 ảnh PNG chưa thành công. Bạn thử lại sau khi ảnh tải xong hoàn toàn nhé.", "is-error");
  } finally {
    resetCardFace();
    restoreCardState(previousState);
    setDownloadButtonsDisabled(false);
  }
}

async function downloadGIF() {
  if (!canExportCards()) return;
  if (typeof GIF === "undefined") {
    setProductMessage("Thiếu thư viện GIF để xuất file.", "is-error");
    return;
  }

  const { container, card1, card2 } = getCardSides();
  const { gifButton } = getProductButtons();
  const previousState = captureCardState();

  setDownloadButtonsDisabled(true, gifButton);
  setProductMessage("Đang render GIF, phần này sẽ mất vài giây...", "is-loading");

  try {
    await waitForImages(document.body);

    const gif = new GIF({
      workers: 2,
      quality: 4,
      width: 520,
      height: 300,
      workerScript: "js/gif.worker.js"
    });

    async function capture() {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        imageTimeout: 0,
        logging: false
      });

      const resized = document.createElement("canvas");
      resized.width = 520;
      resized.height = 300;
      resized.getContext("2d").drawImage(canvas, 0, 0, 520, 300);
      return resized;
    }

    const frames = 16;

    showCardFace("adult");
    gif.addFrame(await capture(), { delay: 500 });

    for (let i = 0; i <= frames; i += 1) {
      const progress = i / frames;
      card1.style.opacity = String(1 - progress);
      card2.style.opacity = String(progress);
      await wait(30);
      gif.addFrame(await capture(), { delay: 30 });
    }

    gif.addFrame(await capture(), { delay: 400 });

    for (let i = 0; i <= frames; i += 1) {
      const progress = i / frames;
      card1.style.opacity = String(progress);
      card2.style.opacity = String(1 - progress);
      await wait(30);
      gif.addFrame(await capture(), { delay: 30 });
    }

    gif.addFrame(await capture(), { delay: 800 });

    await new Promise((resolve, reject) => {
      gif.on("finished", (blob) => {
        const link = document.createElement("a");
        const objectUrl = URL.createObjectURL(blob);

        link.href = objectUrl;
        link.download = "back-to-me-card.gif";
        link.click();

        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        resolve();
      });

      gif.on("abort", () => reject(new Error("GIF render aborted.")));
      gif.on("error", () => reject(new Error("GIF render failed.")));
      gif.render();
    });

    setProductMessage("Đã xuất xong GIF chuyển cảnh. Bạn kiểm tra thư mục tải xuống nhé.", "is-success");
  } catch (error) {
    console.error("Cannot export GIF.", error);
    setProductMessage("Xuất GIF chưa thành công. Bạn thử lại sau ít giây nhé.", "is-error");
  } finally {
    resetCardFace();
    restoreCardState(previousState);
    setDownloadButtonsDisabled(false);
  }
}
