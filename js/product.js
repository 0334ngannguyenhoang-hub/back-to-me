function loadCardData(){

  const data = JSON.parse(localStorage.getItem("cardData"));

  if(!data) return;

  document.getElementById("adultName").textContent = data.adultName;
  document.getElementById("adultAge").textContent = data.adultAge;
  document.getElementById("adultJob").textContent = data.adultJob;
  document.getElementById("adultLifeUpdate").textContent = data.adultLifeUpdate;
  document.getElementById("adultSuper").textContent = data.adultSuper;
  document.getElementById("adultIssues").textContent = data.adultIssues;

  document.getElementById("childName").textContent = data.childName;
  document.getElementById("childAge").textContent = data.childAge;
  document.getElementById("childDream").textContent = data.childDream;
  document.getElementById("childLifeUpdate").textContent = data.childLifeUpdate;
  document.getElementById("childSuper").textContent = data.childSuper;
  document.getElementById("childIssues").textContent = data.childIssues;

  document.getElementById("adultImg").src = data.adultImg;
  document.getElementById("childImg").src = data.childImg;

}

document.addEventListener("DOMContentLoaded", loadCardData); 