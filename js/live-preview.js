// Live preview script: updates the card output as the user types and uploads images.

function setupLivePreview() {
  const textMappings = [
    { inputId: "adultNameInput", outputId: "adultName" },
    { inputId: "adultAgeInput", outputId: "adultAge" },
    { inputId: "adultJobInput", outputId: "adultJob" },
    { inputId: "adultLifeUpdateInput", outputId: "adultLifeUpdate" },
    { inputId: "adultSuperInput", outputId: "adultSuper" },
    { inputId: "adultIssuesInput", outputId: "adultIssues" },
    { inputId: "childNameInput", outputId: "childName" },
    { inputId: "childAgeInput", outputId: "childAge" },
    { inputId: "childDreamInput", outputId: "childDream" },
    { inputId: "childLifeUpdateInput", outputId: "childLifeUpdate" },
    { inputId: "childSuperInput", outputId: "childSuper" },
    { inputId: "childIssuesInput", outputId: "childIssues" },
  ];

  textMappings.forEach(({ inputId, outputId }) => {
    const input = document.getElementById(inputId);
    const output = document.getElementById(outputId);

    if (!input || !output) return;

    const update = () => {
      output.textContent = input.value || "";
    };

    input.addEventListener("input", update);
    // Initialize in case there is prefilled content
    update();
  });

  const imageMappings = [
    { inputId: "adultImage", imgId: "previewAdultImg" },
    { inputId: "childImage", imgId: "previewChildImg" },
  ];

  imageMappings.forEach(({ inputId, imgId }) => {
    const input = document.getElementById(inputId);
    const img = document.getElementById(imgId);

    if (!input || !img) return;

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) {
        img.src = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupLivePreview);
} else {
  setupLivePreview();
}
