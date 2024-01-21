const loadSvgInline = (elementId, imageUrl) => {
  const element = document.getElementById(elementId);
  fetch(imageUrl)
    .then((response) => response.text())
    .then((svg) => {
      element.innerHTML = svg;
    });
};

loadSvgInline("map-countries", "img/world.svg");
