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

function updateImagePreview(inputId, imgId) {
  const input = document.getElementById(inputId);
  const img = document.getElementById(imgId);

  if (!input || !img) return;

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];

    if (!file) {
      img.removeAttribute("src");
      return;
    }

    const normalizedImage = await createCardImageDataUrl(file, 140, 170);
    img.src = normalizedImage;
  });
}

function createCardImageDataUrl(file, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");
        const scale = Math.max(targetWidth / image.width, targetHeight / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const offsetX = (targetWidth - drawWidth) / 2;
        const offsetY = (targetHeight - drawHeight) / 2;

        context.clearRect(0, 0, targetWidth, targetHeight);
        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };

      image.onerror = () => reject(new Error("Cannot read selected image."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Cannot load image file."));
    reader.readAsDataURL(file);
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
