const CARD_DATA_KEY = "cardData";
const API_BASE_URL =
  window.BACK_TO_ME_API_BASE_URL ||
  ((window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
    ? "http://127.0.0.1:8000"
    : window.location.origin);
const CARD_DB_NAME = "backToMeDemo";
const CARD_STORE_NAME = "cards";
const CARD_RECORD_KEY = "latestCard";
const CARD_PRINT_WIDTH = 1011;
const CARD_PRINT_HEIGHT = 638;

function getRuntimeProfile() {
  const userAgent = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) || window.innerWidth <= 900;
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isInAppBrowser = /FBAN|FBAV|Instagram|Line|MicroMessenger/i.test(userAgent);
  const deviceMemory = Number(navigator.deviceMemory || 0);
  const lowMemory = (deviceMemory > 0 && deviceMemory <= 4) || isInAppBrowser;

  return {
    isMobile,
    isAndroid,
    isIOS,
    isInAppBrowser,
    lowMemory
  };
}

function getExportScale(kind = "png") {
  const profile = getRuntimeProfile();

  if (kind === "gif") {
    if (profile.isInAppBrowser) return 1;
    if (profile.isMobile || profile.lowMemory) return 1;
    return 2;
  }

  if (profile.isInAppBrowser) return 2;
  if (profile.isMobile || profile.lowMemory) return 2;
  return Math.max(2, Math.min(3, Math.ceil(window.devicePixelRatio || 1)));
}

function getGifConfig() {
  const profile = getRuntimeProfile();

  if (profile.lowMemory) {
    return {
      width: 404,
      height: 255,
      frames: 10,
      delay: 40,
      workers: 1,
      quality: 5,
      captureScale: 2
    };
  }

  if (profile.isMobile) {
    return {
      width: 506,
      height: 319,
      frames: 14,
      delay: 34,
      workers: 1,
      quality: 3,
      captureScale: 2
    };
  }

  return {
      width: 506,
      height: 319,
      frames: 16,
      delay: 30,
      workers: 2,
      quality: 2,
      captureScale: 2
  };
}

function getPrintUploadScale() {
  const profile = getRuntimeProfile();

  if (profile.isInAppBrowser) return 2;
  if (profile.lowMemory) return 2;
  if (profile.isMobile) return 3;
  return 4;
}

function getVideoConfig() {
  const profile = getRuntimeProfile();

  if (profile.lowMemory) {
    return {
      width: 758,
      height: 478,
      fps: 24,
      bitrate: 7_500_000,
      captureScale: 2,
      holdMs: 1700,
      transitionMs: 1400,
      pauseMs: 3800
    };
  }

  if (profile.isMobile) {
    return {
      width: CARD_PRINT_WIDTH,
      height: CARD_PRINT_HEIGHT,
      fps: 30,
      bitrate: 12_000_000,
      captureScale: 3,
      holdMs: 1700,
      transitionMs: 1400,
      pauseMs: 3800
    };
  }

  return {
    width: CARD_PRINT_WIDTH,
    height: CARD_PRINT_HEIGHT,
    fps: 30,
    bitrate: 16_000_000,
    captureScale: 3,
    holdMs: 1700,
    transitionMs: 1400,
    pauseMs: 3800
  };
}

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

function readProcessedImage(id) {
  if (typeof window.getProcessedCardImage !== "function") return null;
  return window.getProcessedCardImage(id);
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

async function updateCardPayload(patch) {
  const existing = (await loadCardPayload()) || {};
  await saveCardPayload({
    ...existing,
    ...patch
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

function buildLightweightCardData(data) {
  return {
    submissionId: data.submissionId,
    adultName: data.adultName,
    adultAge: data.adultAge,
    adultJob: data.adultJob,
    adultLifeUpdate: data.adultLifeUpdate,
    adultSuper: data.adultSuper,
    adultIssues: data.adultIssues,
    childName: data.childName,
    childAge: data.childAge,
    childDream: data.childDream,
    childLifeUpdate: data.childLifeUpdate,
    childSuper: data.childSuper,
    childIssues: data.childIssues,
    createdAt: data.createdAt,
    hasIndexedImages: true
  };
}

async function generateCard() {
  const messageEl = document.getElementById("formMessage");
  const button = document.getElementById("generateButton");

  clearValidationState();
  setMessage(messageEl, "", "");

  const files = {
    adultImage: readProcessedImage("adultImage") || readSelectedFile("adultImage"),
    childImage: readProcessedImage("childImage") || readSelectedFile("childImage")
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
    "Đang lưu dữ liệu card. Với điện thoại hoặc ảnh lớn, bước này có thể mất thêm vài giây...",
    "is-loading"
  );

  try {
    await saveCardPayload({
      ...data,
      adultImageBlob: files.adultImage && files.adultImage.blob ? files.adultImage.blob : files.adultImage,
      childImageBlob: files.childImage && files.childImage.blob ? files.childImage.blob : files.childImage
    });

    localStorage.setItem(CARD_DATA_KEY, JSON.stringify(buildLightweightCardData(data)));
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

function showProductBlockingNotice(message, type = "is-error") {
  setProductMessage(message, type);

  const messageElement = getProductMessageElement();
  if (messageElement) {
    messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (typeof window.alert === "function") {
    window.alert(message);
  }
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
  updateLabel(gifButton, "Tải video MP4", "Đang xuất video...");
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

async function postSubmissionWithRetry(formData, maxAttempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        let errorMessage = `Upload failed with status ${response.status}`;

        try {
          const payload = await response.json();
          if (payload && payload.error) {
            errorMessage = `${errorMessage}: ${payload.error}`;
          }
        } catch {}

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts) {
        break;
      }

      await wait(700 * attempt);
    }
  }

  throw lastError || new Error("Cannot upload submission.");
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

function getDownloadTrayElements() {
  return {
    tray: document.getElementById("downloadTray"),
    links: document.getElementById("downloadLinks")
  };
}

function clearDownloadTray() {
  const { tray, links } = getDownloadTrayElements();
  if (!tray || !links) return;

  Array.from(links.querySelectorAll("a")).forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("blob:")) {
      URL.revokeObjectURL(href);
    }
  });

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

async function fetchRenderedVideo(formData) {
  const response = await fetch(`${API_BASE_URL}/api/render-video`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    let errorMessage = `Video render failed with status ${response.status}`;

    try {
      const payload = await response.json();
      if (payload && payload.error) {
        errorMessage = `${errorMessage}: ${payload.error}`;
      }
    } catch {}

    throw new Error(errorMessage);
  }

  return response.blob();
}

function resizeCanvas(sourceCanvas, targetWidth, targetHeight) {
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;

  const context = outputCanvas.getContext("2d");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, targetWidth, targetHeight);
  context.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  return outputCanvas;
}

async function captureCardCanvas(element, scale, backgroundColor = null) {
  return html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor,
    imageTimeout: 0,
    logging: false
  });
}

async function uploadGeneratedCardsOnce(adultCanvas, childCanvas) {
  const storedCardData = safeReadLocalCardData();
  let cardPayload = null;

  if (typeof window.loadCardPayload === "function") {
    try {
      cardPayload = await window.loadCardPayload();
    } catch (error) {
      console.error("Cannot read stored card payload for upload.", error);
    }
  }

  const cardData =
    storedCardData && storedCardData.submissionId
      ? storedCardData
      : (cardPayload ? buildLightweightCardData(cardPayload) : null);

  if (!cardData || !cardData.submissionId) {
    throw new Error("MISSING_CARD_DATA");
  }

  if (!storedCardData && cardPayload) {
    localStorage.setItem(CARD_DATA_KEY, JSON.stringify(buildLightweightCardData(cardPayload)));
  }

  const alreadyUploaded =
    (cardData.backendUploadedAt && cardData.backendSubmissionId) ||
    (cardPayload && cardPayload.backendUploadedAt && cardPayload.backendSubmissionId);

  if (alreadyUploaded) {
    return { skipped: true, reason: "already-uploaded" };
  }

  const normalizedAdultCanvas = resizeCanvas(adultCanvas, CARD_PRINT_WIDTH, CARD_PRINT_HEIGHT);
  const normalizedChildCanvas = resizeCanvas(childCanvas, CARD_PRINT_WIDTH, CARD_PRINT_HEIGHT);
  const adultBlob = await canvasToBlob(normalizedAdultCanvas);
  const childBlob = await canvasToBlob(normalizedChildCanvas);

  const formData = new FormData();
  formData.append("metadata", JSON.stringify(cardData));
  formData.append("adultCard", adultBlob, "adult-card.png");
  formData.append("childCard", childBlob, "child-card.png");

  if (cardPayload && cardPayload.adultImageBlob instanceof Blob) {
    formData.append("adultPortrait", cardPayload.adultImageBlob, "adult-portrait.jpg");
  }

  if (cardPayload && cardPayload.childImageBlob instanceof Blob) {
    formData.append("childPortrait", cardPayload.childImageBlob, "child-portrait.jpg");
  }

  const payload = await postSubmissionWithRetry(formData);

  updateStoredCardData({
    backendUploadedAt: new Date().toISOString(),
    backendSubmissionId: payload.submissionId || cardData.submissionId
  });

  try {
    await updateCardPayload({
      backendUploadedAt: new Date().toISOString(),
      backendSubmissionId: payload.submissionId || cardData.submissionId
    });
  } catch (error) {
    console.error("Cannot update IndexedDB payload after backend upload.", error);
  }

  return payload;
}

async function buildUploadCanvases(card1, card2, minimumScale) {
  const printUploadScale = Math.max(minimumScale, getPrintUploadScale());

  if (printUploadScale <= minimumScale) {
    return null;
  }

  showCardFace("adult");
  await wait(180);
  const adultCanvas = await captureCardCanvas(card1, printUploadScale);

  showCardFace("child");
  await wait(320);
  const childCanvas = await captureCardCanvas(card2, printUploadScale);

  return {
    adultCanvas,
    childCanvas
  };
}

async function syncGeneratedCards(card1, card2, baseAdultCanvas, baseChildCanvas, minimumScale) {
  let uploadCanvas1 = baseAdultCanvas;
  let uploadCanvas2 = baseChildCanvas;
  const uploadCanvases = await buildUploadCanvases(card1, card2, minimumScale);

  if (uploadCanvases) {
    uploadCanvas1 = uploadCanvases.adultCanvas;
    uploadCanvas2 = uploadCanvases.childCanvas;
  }

  return uploadGeneratedCardsOnce(uploadCanvas1, uploadCanvas2);
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
  const runtimeProfile = getRuntimeProfile();
  const { gifButton } = getProductButtons();

  if (runtimeProfile.isInAppBrowser && gifButton) {
    gifButton.textContent = "Mở trình duyệt để tải video";
  }

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
  const runtimeProfile = getRuntimeProfile();
  const exportScale = getExportScale("png");
  const printUploadScale = getPrintUploadScale();
  const captureScale =
    runtimeProfile.isMobile || runtimeProfile.lowMemory
      ? Math.max(exportScale, printUploadScale)
      : exportScale;

  clearDownloadTray();
  setDownloadButtonsDisabled(true, pngButton);
  setProductMessage("Đang xuất 2 ảnh PNG. Trên điện thoại bước này có thể mất vài giây...", "is-loading");

  try {
    await waitForImages(document.body);

    showCardFace("adult");
    await wait(280);

    const canvas1 = await captureCardCanvas(card1, captureScale);

    showCardFace("child");
    await wait(500);

    const canvas2 = await captureCardCanvas(card2, captureScale);

    const [adultBlob, childBlob] = await Promise.all([
      canvasToBlob(canvas1),
      canvasToBlob(canvas2)
    ]);

    const downloadItems = [
      {
        href: URL.createObjectURL(adultBlob),
        filename: "nguEch-card-1.png",
        label: "Tải ảnh hiện tại",
        className: "is-adult"
      },
      {
        href: URL.createObjectURL(childBlob),
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
      setTimeout(() => downloadLinks[1].click(), 300);
    }

    setProductMessage(
      "Hệ thống đang tải 2 ảnh PNG. Nếu trình duyệt chặn một ảnh, bạn bấm nút còn lại ngay bên dưới nhé. Sau đó hãy upload đúng 2 ảnh này vào Google Form đăng ký.",
      "is-success"
    );
  } catch (error) {
    console.error("Cannot export PNG cards.", error);
    setProductMessage("Tải 2 ảnh PNG chưa thành công. Với điện thoại yếu, bạn hãy mở lại bằng trình duyệt ngoài Messenger nhé.", "is-error");
  } finally {
    resetCardFace();
    restoreCardState(previousState);
    setDownloadButtonsDisabled(false);
  }
}

function drawVideoFrame(context, outputCanvas, adultCanvas, childCanvas, progress) {
  context.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  context.globalAlpha = 1;
  context.drawImage(adultCanvas, 0, 0, outputCanvas.width, outputCanvas.height);

  if (progress > 0) {
    context.globalAlpha = progress;
    context.drawImage(childCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
  }

  context.globalAlpha = 1;
}

function easeInOutCubic(value) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;

  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

async function recordCanvasSequence(outputCanvas, drawStep, format, config) {
  const stream = outputCanvas.captureStream(config.fps);
  const chunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: format.mimeType,
    videoBitsPerSecond: config.bitrate
  });

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const finished = new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: format.mimeType }));
    recorder.onerror = () => reject(new Error("Video recording failed."));
  });

  recorder.start(250);
  await drawStep();
  await wait(180);
  if (typeof recorder.requestData === "function" && recorder.state === "recording") {
    recorder.requestData();
  }
  recorder.stop();

  return finished;
}

async function playVideoSequence(config, outputCanvas, context, adultCanvas, childCanvas) {
  const frameMs = Math.round(1000 / config.fps);
  const holdFrames = Math.round(config.holdMs / frameMs);
  const transitionFrames = Math.round(config.transitionMs / frameMs);
  const pauseFrames = Math.round(config.pauseMs / frameMs);

  for (let i = 0; i < holdFrames; i += 1) {
    drawVideoFrame(context, outputCanvas, adultCanvas, childCanvas, 0);
    await wait(frameMs);
  }

  for (let i = 0; i <= transitionFrames; i += 1) {
    const progress = easeInOutCubic(i / transitionFrames);
    drawVideoFrame(context, outputCanvas, adultCanvas, childCanvas, progress);
    await wait(frameMs);
  }

  for (let i = 0; i < pauseFrames; i += 1) {
    drawVideoFrame(context, outputCanvas, childCanvas, adultCanvas, 0);
    await wait(frameMs);
  }

  for (let i = 0; i <= transitionFrames; i += 1) {
    const progress = easeInOutCubic(i / transitionFrames);
    drawVideoFrame(context, outputCanvas, childCanvas, adultCanvas, progress);
    await wait(frameMs);
  }

  for (let i = 0; i < holdFrames; i += 1) {
    drawVideoFrame(context, outputCanvas, adultCanvas, childCanvas, 0);
    await wait(frameMs);
  }
}

async function downloadVideo() {
  if (!canExportCards()) return;

  const runtimeProfile = getRuntimeProfile();
  if (runtimeProfile.isInAppBrowser) {
    showProductBlockingNotice("Messenger in-app browser không ổn định để tải video. Bạn hãy mở link bằng Chrome hoặc Safari nhé.");
    return;
  }

  const { card1, card2 } = getCardSides();
  const { gifButton } = getProductButtons();
  const previousState = captureCardState();
  const config = getVideoConfig();
  setDownloadButtonsDisabled(true, gifButton);
  setProductMessage("Đang render video MP4 chất lượng cao trên server...", "is-loading");

  try {
    await waitForImages(document.body);

    showCardFace("adult");
    await wait(220);
    const adultCanvas = resizeCanvas(
      await captureCardCanvas(card1, config.captureScale),
      CARD_PRINT_WIDTH,
      CARD_PRINT_HEIGHT
    );

    showCardFace("child");
    await wait(320);
    const childCanvas = resizeCanvas(
      await captureCardCanvas(card2, config.captureScale),
      CARD_PRINT_WIDTH,
      CARD_PRINT_HEIGHT
    );

    const [adultBlob, childBlob] = await Promise.all([
      canvasToBlob(adultCanvas),
      canvasToBlob(childCanvas)
    ]);

    const formData = new FormData();
    formData.append("adultCard", adultBlob, "adult-card.png");
    formData.append("childCard", childBlob, "child-card.png");

    const videoBlob = await fetchRenderedVideo(formData);

    const objectUrl = URL.createObjectURL(videoBlob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "back-to-me-card.mp4";
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

    setProductMessage("Đã xuất xong video MP4 chất lượng cao để đăng story. Bạn kiểm tra thư mục tải xuống nhé.", "is-success");
  } catch (error) {
    console.error("Cannot export video.", error);
    setProductMessage("Xuất video MP4 chưa thành công. Bạn hãy thử lại sau ít phút nhé.", "is-error");
  } finally {
    resetCardFace();
    restoreCardState(previousState);
    setDownloadButtonsDisabled(false);
  }
}
