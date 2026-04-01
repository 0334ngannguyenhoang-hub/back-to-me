const MOBILE_CARD_IMAGE_SCALE = 3;
const DESKTOP_CARD_IMAGE_SCALE = 4;
const MOBILE_CARD_IMAGE_QUALITY = 0.9;
const DESKTOP_CARD_IMAGE_QUALITY = 0.94;

window.backToMeImageCache = window.backToMeImageCache || {};

function isCompactMobileRuntime() {
  const userAgent = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) || window.innerWidth <= 900;
  const isInApp = /FBAN|FBAV|Instagram|Line|MicroMessenger/i.test(userAgent);
  return isMobile || isInApp;
}

function getCardImageOptions() {
  if (isCompactMobileRuntime()) {
    return {
      scale: MOBILE_CARD_IMAGE_SCALE,
      quality: MOBILE_CARD_IMAGE_QUALITY
    };
  }

  return {
    scale: DESKTOP_CARD_IMAGE_SCALE,
    quality: DESKTOP_CARD_IMAGE_QUALITY
  };
}

function updateTextPreview(inputId, outputId, fallback = "") {
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);

  if (!input || !output) return;

  const renderValue = () => {
    const value = input.value.trim();
    output.textContent = value || fallback;
  };

  input.addEventListener("input", renderValue);
  renderValue();
}

async function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Cannot convert canvas to blob."));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

async function createCardImageAsset(file, targetWidth, targetHeight) {
  const { scale, quality } = getCardImageOptions();

  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth * scale;
        canvas.height = targetHeight * scale;

        const context = canvas.getContext("2d");
        const outputWidth = canvas.width;
        const outputHeight = canvas.height;
        const drawScale = Math.max(outputWidth / image.width, outputHeight / image.height);
        const drawWidth = image.width * drawScale;
        const drawHeight = image.height * drawScale;
        const offsetX = (outputWidth - drawWidth) / 2;
        const offsetY = (outputHeight - drawHeight) / 2;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.clearRect(0, 0, outputWidth, outputHeight);
        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

        const blob = await canvasToBlob(canvas, "image/jpeg", quality);
        const objectUrl = URL.createObjectURL(blob);

        resolve({
          blob,
          objectUrl,
          width: outputWidth,
          height: outputHeight
        });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(sourceUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("Cannot read selected image."));
    };
    image.src = sourceUrl;
  });
}

function setProcessedCardImage(inputId, asset) {
  const previousAsset = window.backToMeImageCache[inputId];
  if (previousAsset && previousAsset.objectUrl) {
    URL.revokeObjectURL(previousAsset.objectUrl);
  }
  window.backToMeImageCache[inputId] = asset;
}

window.getProcessedCardImage = function getProcessedCardImage(inputId) {
  return window.backToMeImageCache[inputId] || null;
};

function updateImagePreview(inputId, imgId) {
  const input = document.getElementById(inputId);
  const img = document.getElementById(imgId);

  if (!input || !img) return;

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];

    if (!file) {
      setProcessedCardImage(inputId, null);
      img.removeAttribute("src");
      return;
    }

    try {
      const processedImage = await createCardImageAsset(file, 140, 170);
      setProcessedCardImage(inputId, processedImage);
      img.src = processedImage.objectUrl;
    } catch (error) {
      console.error("Cannot prepare preview image.", error);
      setProcessedCardImage(inputId, null);
      img.removeAttribute("src");
    }
  });
}

function setupLivePreview() {
  const textMappings = [
    { inputId: "adultNameInput", outputId: "adultName", fallback: "Tên hiện tại" },
    { inputId: "adultAgeInput", outputId: "adultAge", fallback: "Tuổi" },
    { inputId: "adultJobInput", outputId: "adultJob", fallback: "Chưa cập nhật" },
    { inputId: "adultLifeUpdateInput", outputId: "adultLifeUpdate", fallback: "Chưa cập nhật" },
    { inputId: "adultSuperInput", outputId: "adultSuper", fallback: "Chưa cập nhật" },
    { inputId: "adultIssuesInput", outputId: "adultIssues", fallback: "Chưa cập nhật" },
    { inputId: "childNameInput", outputId: "childName", fallback: "Tên hồi bé" },
    { inputId: "childAgeInput", outputId: "childAge", fallback: "Tuổi" },
    { inputId: "childDreamInput", outputId: "childDream", fallback: "Chưa cập nhật" },
    { inputId: "childLifeUpdateInput", outputId: "childLifeUpdate", fallback: "Chưa cập nhật" },
    { inputId: "childSuperInput", outputId: "childSuper", fallback: "Chưa cập nhật" },
    { inputId: "childIssuesInput", outputId: "childIssues", fallback: "Chưa cập nhật" }
  ];

  textMappings.forEach(({ inputId, outputId, fallback }) => {
    updateTextPreview(inputId, outputId, fallback);
  });

  updateImagePreview("adultImage", "previewAdultImg");
  updateImagePreview("childImage", "previewChildImg");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupLivePreview);
} else {
  setupLivePreview();
}
