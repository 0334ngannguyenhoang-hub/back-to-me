function printStatus(message, isError = false) {
  const element = document.getElementById("printStatus");
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? "#b42318" : "#6d4a35";
}

function getTokenizedUrl(pathname) {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const url = new URL(pathname, window.location.origin);
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

function fillText(id, value, fallback = "Chưa cập nhật") {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value || fallback;
}

function fillImage(id, src) {
  const element = document.getElementById(id);
  if (!element || !src) return;
  element.src = src;
}

function triggerDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

async function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Cannot convert HQ canvas to blob."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

async function captureCard(cardElement) {
  return html2canvas(cardElement, {
    scale: 5,
    useCORS: true,
    backgroundColor: "#ffffff",
    imageTimeout: 0,
    logging: false
  });
}

async function downloadHqCards() {
  const card1 = document.querySelector(".card-side");
  const card2 = document.querySelector(".card-side-1");
  const button = document.getElementById("downloadPrintButton");

  if (!card1 || !card2) return;

  button.disabled = true;
  printStatus("Đang render 2 file PNG HQ cho bản in...");

  try {
    const [canvas1, canvas2] = await Promise.all([
      captureCard(card1),
      captureCard(card2)
    ]);
    const [blob1, blob2] = await Promise.all([
      canvasToBlob(canvas1),
      canvasToBlob(canvas2)
    ]);

    triggerDownload(blob1, "back-to-me-print-adult.png");
    setTimeout(() => triggerDownload(blob2, "back-to-me-print-child.png"), 250);
    printStatus("Đã render xong 2 file PNG HQ. Bạn kiểm tra thư mục tải xuống nhé.");
  } catch (error) {
    console.error("Cannot render HQ print cards.", error);
    printStatus("Không render được file HQ. Bạn thử lại sau khi ảnh tải xong hoàn toàn nhé.", true);
  } finally {
    button.disabled = false;
  }
}

async function loadSubmission() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";

  if (!id) {
    printStatus("Thiếu mã submission.", true);
    return;
  }

  try {
    const response = await fetch(getTokenizedUrl(`/api/submissions/${encodeURIComponent(id)}`));
    const payload = await response.json();

    if (!response.ok || !payload.row) {
      throw new Error(payload.error || "Cannot load submission.");
    }

    const row = payload.row;

    fillText("adultName", row.adult_name, "Tên hiện tại");
    fillText("adultAge", row.adult_age, "Tuổi");
    fillText("adultJob", row.adult_job);
    fillText("adultLifeUpdate", row.adult_life_update);
    fillText("adultSuper", row.adult_super);
    fillText("adultIssues", row.adult_issues);

    fillText("childName", row.child_name, "Tên hồi bé");
    fillText("childAge", row.child_age, "Tuổi");
    fillText("childDream", row.child_dream);
    fillText("childLifeUpdate", row.child_life_update);
    fillText("childSuper", row.child_super);
    fillText("childIssues", row.child_issues);

    fillImage("adultImg", row.adult_portrait_path || row.adult_card_path);
    fillImage("childImg", row.child_portrait_path || row.child_card_path);

    const adultStored = document.getElementById("openAdultStored");
    const childStored = document.getElementById("openChildStored");
    if (adultStored) adultStored.href = row.adult_card_path;
    if (childStored) childStored.href = row.child_card_path;

    if (!row.adult_portrait_path || !row.child_portrait_path) {
      printStatus("Submission này chưa có portrait crop riêng. Bạn vẫn có thể mở file lưu hiện tại, nhưng HQ render chuẩn chỉ áp dụng tốt nhất cho submission mới.", true);
    } else {
      printStatus("Đã tải xong dữ liệu HQ. Bạn có thể xuất 2 PNG chất lượng cao để in.");
    }
  } catch (error) {
    console.error("Cannot load submission for HQ render.", error);
    printStatus("Không tải được submission cho chế độ HQ.", true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("downloadPrintButton");
  if (button) {
    button.addEventListener("click", () => {
      downloadHqCards();
    });
  }

  loadSubmission();
});
