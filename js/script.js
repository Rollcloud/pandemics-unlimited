import { seed_bacon, tick } from "./models/bacon.js";
import { countries, alpha3Codes } from "./models/countries.js";
import { airports } from "./models/airports.js";

const worldMapUrl = "data/Worldmap_location_NED_50m.svg";

// load svg file inline, returning promise
const loadSvgInline = (elementId, imageUrl) => {
  const element = document.getElementById(elementId);
  return fetch(imageUrl)
    .then((response) => response.text())
    .then((svg) => {
      element.innerHTML = svg;
    });
};

const extractCountryCode = (classes) => {
  classes = classes.split(" ");
  const letterCode = classes[classes.length - 1]; // get the last class
  if (letterCode.length === 2) return letterCode;

  const region2LetterCode = alpha3Codes[letterCode];
  if (!region2LetterCode) {
    console.error(`No 2-letter code for ${letterCode}`);
    return;
  }
  return region2LetterCode;
};

loadSvgInline("map-countries", worldMapUrl)
  .then(() => {
    // add 2-letter country class to each region
    const regions = document.querySelectorAll("#map-countries .region");
    regions.forEach((region) => {
      const classes = region.getAttribute("class");
      const region2LetterCode = extractCountryCode(classes);
      region.classList.add(region2LetterCode);
    });
  })
  .then(() => {
    // when hovering over a country, show the country name, code, id, class and data-bacon
    const countryInfo = document.createElement("div");
    countryInfo.classList.add("country-info");
    // add countryInfo to top of page
    document.body.prepend(countryInfo);

    const regions = document.querySelectorAll("#map-countries .region");
    regions.forEach((region) => {
      region.addEventListener("mouseover", (event) => {
        const classes = event.target.getAttribute("class");
        const code = extractCountryCode(classes);
        const name = countries[code];
        const bacon = event.target.getAttribute("data-bacon");
        const countryInfo = document.querySelector(".country-info");
        countryInfo.innerHTML = `[${code}] ${name} ${bacon} bacon`;
      });
    });
  });

const lonToX = (lon) => (lon + 180) * (100 / 360);
const latToY = (lat) => (90 - lat) * (100 / 180);

// plot all airports at their lat/lon coordinates on the map
const plotAirports = () => {
  const airportsLayer = document.getElementById("map-airports");
  airports.forEach((airport) => {
    const lat = parseFloat(airport.lat);
    const lon = parseFloat(airport.lon);
    const airportDot = document.createElement("div");
    airportDot.classList.add("airport");
    airportDot.setAttribute("data-iata", airport.iata);
    airportDot.setAttribute("data-name", airport.name);
    airportDot.setAttribute("data-continent", airport.continent);
    airportDot.style.left = `${lonToX(lon)}%`;
    airportDot.style.top = `${latToY(lat)}%`;
    airportsLayer.appendChild(airportDot);
  });
};

plotAirports();

// start the game
const startGame = () => {
  setInterval(() => {
    const baconCounter = tick();
    // console.log(baconCounter);
    Object.keys(baconCounter).forEach((countryCode) => {
      const baconCount = baconCounter[countryCode];
      // select all regions with the country code
      const regions = document.querySelectorAll(`.${countryCode}`);
      regions.forEach((region) => {
        region.setAttribute("data-bacon", baconCount);
      });
    });
  }, 1000);
};

const initialCountry = "ZA";
seed_bacon(initialCountry);
seed_bacon("CA");
startGame();
