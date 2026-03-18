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

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];

    if (img.dataset.objectUrl) {
      URL.revokeObjectURL(img.dataset.objectUrl);
      delete img.dataset.objectUrl;
    }

    if (!file) {
      img.removeAttribute("src");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.dataset.objectUrl = objectUrl;
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
