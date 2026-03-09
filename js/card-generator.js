function downloadCard(){

const card = document.getElementById("cardOutput")

html2canvas(card,{scale:3}).then(canvas=>{

const link=document.createElement("a")

link.download="back-to-me-id.png"

link.href=canvas.toDataURL()

link.click()

})

}