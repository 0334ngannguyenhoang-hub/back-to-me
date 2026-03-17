//FUNCTION TẠO CARD

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

// Click chuột active cho card transition
const cardOutput = document.querySelector(".card-output");
if (cardOutput) {
  cardOutput.addEventListener("click", () => {
    cardOutput.classList.toggle("active");
  });
}


//FUNCTION DOWNLOAD GIF
async function downloadGIF(){

  const container = document.querySelector(".card-output");
  const card1 = container.querySelector(".card-side");
  const card2 = container.querySelector(".card-side-1");

  const gif = new GIF({
    workers:2,
    quality:4,
    width:520,
    height:300,
    workerScript:"js/gif.worker.js"
  });

  async function capture(){

    const canvas = await html2canvas(container,{
      scale:2,
      useCORS:true,
      backgroundColor:null
    });

    const resized = document.createElement("canvas");
    resized.width = 520;
    resized.height = 300;

    resized.getContext("2d").drawImage(canvas,0,0,520,300);

    return resized;
  }

  const frames = 16;

  /* Bé Bự → Bé Tí */

  card1.style.opacity = 1;
  card2.style.opacity = 0;

  gif.addFrame(await capture(),{delay:500});

  for(let i=0;i<=frames;i++){

    const p = i/frames;

    card1.style.opacity = 1-p;
    card2.style.opacity = p;

    await new Promise(r=>setTimeout(r,30));

    gif.addFrame(await capture(),{delay:30});
  }

  gif.addFrame(await capture(),{delay:400});

  /* Bé Tí → Bé Bự */

  for(let i=0;i<=frames;i++){

    const p = i/frames;

    card1.style.opacity = p;
    card2.style.opacity = 1-p;

    await new Promise(r=>setTimeout(r,30));

    gif.addFrame(await capture(),{delay:30});
  }

  gif.addFrame(await capture(),{delay:800});

  gif.on("finished",function(blob){

    const link=document.createElement("a");

    link.href=URL.createObjectURL(blob);
    link.download="back-to-me-card.gif";

    link.click();
  });

  gif.render();
}