const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

//fix blurry canvas
canvas.width = canvas.offsetWidth * 2;
canvas.height = canvas.offsetHeight * 2;

const drawMap = () => {
  const img = new Image();
  img.src = "img/world.svg";
  // draw image on canvas, scale to canvas size, keep aspect ratio, center
  const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
  const x = canvas.width / 2 - (img.width / 2) * scale;
  const y = canvas.height / 2 - (img.height / 2) * scale;

  img.onload = () => {
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  };
};

window.addEventListener("load", () => drawMap());
