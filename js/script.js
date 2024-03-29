import bootstrap from "bootstrap/dist/js/bootstrap.min.js";

import { countries, alpha3Codes, countryCodes } from "./models/countries.js";
import populations from "./models/populations.js";
import { airports } from "./models/airports.js";
import { createJourney } from "./models/paths.js";
import apples from "./models/apples.js";
import bacon from "./models/bacon.js";
import smiles from "./models/smiles.js";
import sniffles from "./models/sniffles.js";
import prophylaxis from "./views/prophylaxis.js";

const worldMapUrl = "data/Worldmap_location_NED_50m.svg";
let inspectTarget = null;

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Setup model UI components
const models = [populations, prophylaxis, apples, bacon, smiles, sniffles];
const modelObjects = models.reduce((acc, model) => {
  acc[model.meta.name] = model;
  return acc;
}, {});

const map = document.getElementById("map-countries");
const viewBar = document.getElementById("show-models");

const showModel = (modelName) => {
  const modelClass = `show-${modelName.toLowerCase()}`;

  // remove all show-* classes
  map.classList.forEach((className) => {
    if (className.startsWith("show-")) {
      map.classList.remove(className);
    }
  });
  // add show-* class for the selected model
  map.classList.add(modelClass);
};

Object.keys(modelObjects).forEach((modelName) => {
  const input_ = document.createElement("input");
  input_.type = "radio";
  input_.classList = "btn-check";
  input_.name = `model-view`;
  input_.id = `model-view-${modelName}`;
  input_.dataset.model = modelName.toLowerCase();

  input_.addEventListener("click", (event) => {
    showModel(modelName);
  });

  // activate the first model by default
  if (modelName === models[0].meta.name) {
    map.classList.add(`show-${modelName.toLowerCase()}`);
    input_.checked = true;
  }

  const label = document.createElement("label");
  label.classList = "btn btn-secondary";
  label.setAttribute("for", `model-view-${modelName}`);
  label.textContent = `${modelObjects[modelName].meta.icon}`;
  // show tooltip on hover
  label.setAttribute("data-bs-toggle", "tooltip");
  label.setAttribute("data-bs-placement", "left");
  label.setAttribute("data-bs-title", modelName);
  label.setAttribute("data-model", modelName.toLowerCase());
  // add hover event listeners
  label.addEventListener("mouseover", (event) => {
    const hoveredModelName = event.target.dataset.model;
    showModel(hoveredModelName);
  });
  label.addEventListener("mouseout", (event) => {
    const checkedModelName = document.querySelector('input[name="model-view"]:checked')
      .dataset.model;
    showModel(checkedModelName);
  });

  viewBar.appendChild(input_);
  viewBar.appendChild(label);
});

// enable tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

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

// TODO: split out into UI module
const dashboardInspector = document.getElementById("dashboard-inspector");
const inspectorIcon = document.getElementById("inspector-icon");
const inspectorTitle = document.getElementById("inspector-title");
const inspectorContent = document.getElementById("inspector-content");
const statsPercentBacon = document.getElementById("stats-percent-bacon");
const statsPercentSmiles = document.getElementById("stats-percent-smiles");
const statsPercentSniffles = document.getElementById("stats-percent-sniffles");

const inspect = (info) => {
  inspectTarget = info;
  updateInspector();
};

let countriesDOM = {};
const loadMap = loadSvgInline("map-countries", worldMapUrl)
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
    // add regions to countriesDOM
    countryCodes.forEach((countryCode) => {
      countriesDOM[countryCode] = document.querySelectorAll(
        `#map-countries .${countryCode}`
      );
    });

    // when hovering over a country, show the country name, code, and bacon
    Object.values(countriesDOM).forEach((regions) => {
      regions.forEach((region) => {
        region.addEventListener("mouseover", (event) => {
          const classes = event.target.getAttribute("class");
          const code = extractCountryCode(classes);
          const name = countries[code];

          inspect({
            category: "country",
            identifier: code,
            name: name,
          });
        });
      });
    });
  });

const lonToX = (lon) => ((lon + 180) * (100 / 360) + 100) % 100;
const latToY = (lat) => ((90 - lat) * (100 / 180)) % 100;

// plot all airports at their lat/lon coordinates on the map
const plotAirports = () => {
  const airportsLayer = document.getElementById("map-airports");
  airports.forEach((airport) => {
    const lat = parseFloat(airport.lat);
    const lon = parseFloat(airport.lon);
    const airportMarker = document.createElement("div");
    airportMarker.classList.add("airport");
    airportMarker.setAttribute("data-iata", airport.iata);
    airportMarker.setAttribute("data-continent", airport.continent);
    airportMarker.setAttribute("data-size", airport.size);
    airportMarker.style.left = `${lonToX(lon)}%`;
    airportMarker.style.top = `${latToY(lat)}%`;
    airportsLayer.appendChild(airportMarker);

    airportMarker.addEventListener("mouseover", (event) => {
      // const iata = event.target.getAttribute("data-iata");
      // const name = event.target.getAttribute("data-name");

      inspect({
        category: "airport",
        identifier: airport.iata,
        name: airport.name,
        size: airport.size,
        countryCode: airport.iso,
      });
    });
  });
};

const simulatePopulations = () => {
  populations.tick();
  populations.render(countriesDOM);
};

const simulateApples = () => {
  apples.tick(); // update simulation
};

let baconCounter = bacon.seed_bacon("ZA");

const simulateBacon = () => {
  baconCounter = bacon.tick(); // update simulation

  // update bacon counter on map
  const baconPercentage = Object.keys(baconCounter).reduce((acc, countryCode) => {
    acc[countryCode] = populations.getPercentagePopulation(countryCode, baconCounter);
    return acc;
  }, {});
  Object.keys(baconPercentage).forEach((countryCode) => {
    const percentage = baconPercentage[countryCode];
    const regions = countriesDOM[countryCode];
    regions.forEach((region) => {
      region.setAttribute("data-bacon", percentage);
    });
  });
};

let smilesAmounts = {};
const simulateSmiles = () => {
  smilesAmounts = smiles.tick(); // update simulation

  // update smile counter on map
  const smilePercentage = Object.keys(smilesAmounts).reduce((acc, countryCode) => {
    acc[countryCode] = populations.getPercentagePopulation(countryCode, smilesAmounts);
    return acc;
  }, {});
  Object.keys(smilePercentage).forEach((countryCode) => {
    const percentage = smilePercentage[countryCode];
    const regions = countriesDOM[countryCode];
    regions.forEach((region) => {
      region.setAttribute("data-smile", percentage);
    });
  });
};

const simulateSniffles = () => {
  snifflesAmounts = sniffles.tick(); // update simulation

  // update sniffle counter on map
  const snifflesPercentage = Object.keys(snifflesAmounts).reduce((acc, countryCode) => {
    acc[countryCode] = populations.getPercentagePopulation(countryCode, snifflesAmounts);
    return acc;
  }, {});
  Object.keys(snifflesPercentage).forEach((countryCode) => {
    const percentage = snifflesPercentage[countryCode];
    const regions = countriesDOM[countryCode];
    regions.forEach((region) => {
      region.setAttribute("data-sniffles", percentage);
    });
  });
};

const renderVehicle = (marker, vehicle) => {
  marker.style.left = `${lonToX(vehicle.position.lon)}%`;
  marker.style.top = `${latToY(vehicle.position.lat)}%`;
  marker.style.transform = `rotate(${vehicle.bearing}deg)`;
  if (Object.hasOwn(vehicle, "altitude")) {
    marker.style.fontSize = `${Math.floor(vehicle.altitude / 1.5) + 5}px`;
  }
};

/**
 * Load passengers from the given country, up to the given capacity.
 * @param {string} countryCode - The country to load passengers from.
 * @param {number} capacity - The maximum number of passengers to load.
 * @returns {object} - An object containing the number of passengers loaded.
 * */
const loadPassengers = (countryCode, capacity) => {
  const countryPopulation = populations.getPopulation(countryCode);
  // prevent more passengers leaving than population
  const boardedPassengers = Math.min(countryPopulation, capacity);

  const countryBacon = baconCounter[countryCode];
  const countrySniffles = snifflesAmounts[countryCode];

  const baconPercentage = countryBacon / countryPopulation || 0;
  const snifflesPercentage = countrySniffles / countryPopulation || 0;
  const baconSnifflesPercentage = baconPercentage * snifflesPercentage;

  const baconPassengers = Math.round(baconPercentage * boardedPassengers);
  const snifflesPassengers = Math.round(snifflesPercentage * boardedPassengers);
  const baconSnifflesPassengers = Math.round(baconSnifflesPercentage * boardedPassengers);
  const neitherPassengers =
    boardedPassengers - baconPassengers - snifflesPassengers + baconSnifflesPassengers;

  // remove boarded passengers from country
  populations.migrate(countryCode, -boardedPassengers);
  // remove bacon passengers from countryBacon
  bacon.seed_bacon(countryCode, -baconPassengers);
  // remove sniffles passengers from snifflesAmounts
  snifflesAmounts[countryCode] -= snifflesPassengers;

  return {
    capacity,
    boardedPassengers,
    baconPassengers,
    snifflesPassengers,
    baconSnifflesPassengers,
    neitherPassengers,
  };
};

const createNewJourney = () => {
  // create a journey between two random airports
  const speed = 100; // km/tick
  const airportsCount = airports.length;
  const startAirportIndex = Math.floor(Math.random() * airportsCount);
  const endAirportIndex = Math.floor(Math.random() * airportsCount);
  const startAirport = airports[startAirportIndex];
  const endAirport = airports[endAirportIndex];
  const start = {
    lat: parseFloat(startAirport.lat),
    lon: parseFloat(startAirport.lon),
  };
  const end = {
    lat: parseFloat(endAirport.lat),
    lon: parseFloat(endAirport.lon),
  };
  const journey = createJourney(start, end, speed);
  const vehicle = journey.vehicle;
  // add vehicle to map
  const vehicleLayer = document.getElementById("map-vehicles");
  const vehicleMarker = document.createElement("div");
  vehicleMarker.classList = "vehicle plane";
  vehicle.altitude = 0;
  vehicle.payload = loadPassengers(startAirport.iso, 100);
  vehicle.destination = endAirport.iso;
  renderVehicle(vehicleMarker, vehicle);
  vehicleMarker.addEventListener("mouseover", (event) => {
    inspect({
      category: "vehicle",
      identifier: vehicle.id,
      name: `Flight [${startAirport.iata} - ${endAirport.iata}]`,
      vehicle_type: "plane",
      origin: startAirport.iata,
      destination: endAirport.iata,
    });
  });
  vehicleLayer.appendChild(vehicleMarker);
  journey.marker = vehicleMarker;
  return journey;
};

let journey;
const simulateJourneys = () => {
  journey = journey || createNewJourney();
  const vehicle = journey.tick();
  const vehicleMarker = journey.marker;
  renderVehicle(vehicleMarker, vehicle);

  // if the vehicle has reached its destination, remove it
  if (vehicle.distanceTravelled >= journey.path.distance) {
    const destination = vehicle.destination;
    const passengers = vehicle.payload;
    // add passengers to destination
    populations.migrate(destination, passengers.boardedPassengers);
    // add bacon people to destination
    bacon.seed_bacon(destination, passengers.baconPassengers);
    // add sniffles passengers to destination
    snifflesAmounts[destination] += passengers.snifflesPassengers;

    vehicleMarker.remove();
    journey = null;
  }
};

const updateInspector = () => {
  // inspectTarget should be an object with at least the properties:
  //   - category
  //   - identifier
  //   - name
  // but may have additional properties

  if (!inspectTarget) return;

  const category = inspectTarget.category;
  const identifier = inspectTarget.identifier;
  const name = inspectTarget.name;

  inspectorTitle.textContent = name;

  if (category === "country") {
    const code = identifier.toUpperCase();
    const population = populations.getPopulation(code);
    const prophylaxisValue = prophylaxis.getCountryValue(code);
    const numberApples = apples.getCountryValue(code);
    const amountBacon = baconCounter[code] || 0;
    const amountSmiles = smilesAmounts[code] || 0;
    const amountSniffles = snifflesAmounts[code] || 0;
    inspectorIcon.classList = `fi fi-${code.toLowerCase()} fis`;
    inspectorContent.innerHTML = `
    <ul>
      <li>Code: ${code}</li>
      <li>Population: ${population.toLocaleString()}👥</li>
      <li>Prophylaxis: ${prophylaxisValue.toFixed(2)}${prophylaxis.meta.icon}</li>
      <li>Apples: ${numberApples.toLocaleString()}${apples.meta.icon}</li>
      <li>Bacon: ${amountBacon.toLocaleString()}🥓</li>
      <li>Smiles: ${amountSmiles.toLocaleString()}😊</li>
      <li>Sniffles: ${amountSniffles.toLocaleString()}🥶</li>
    </ul>
    `;
    const percentageBacon = (amountBacon / population) * 100;
    const percentageSmiles = (amountSmiles / population) * 100;
    const percentageSniffles = (amountSniffles / population) * 100;

    statsPercentBacon.style = `--p: ${percentageBacon}`;
    statsPercentSmiles.style = `--p: ${percentageSmiles}`;
    statsPercentSniffles.style = `--p: ${percentageSniffles}`;
  }

  if (category === "airport") {
    const countryCode = inspectTarget.countryCode.toUpperCase();
    const countryName = countries[countryCode];
    const airportSize = inspectTarget.size;
    inspectorIcon.classList = `airport-${airportSize}`;
    inspectorContent.innerHTML = `
    <ul>
      <li><span class="fi fi-${countryCode.toLowerCase()}" ></span> ${countryName}</li>
      <li>IATA: ${identifier}</li>
      <li>Size: ${toTitleCase(airportSize)}</li>
    </ul>
    `;
  }

  if (category === "vehicle") {
    if (inspectTarget.vehicle_type === "plane") {
      inspectorIcon.classList = "plane-icon";

      const payload = journey.vehicle.payload;
      const capacity = payload.capacity;
      const boardedPassengers = payload.boardedPassengers;
      const baconPassengers = payload.baconPassengers;
      const snifflesPassengers = payload.snifflesPassengers;

      inspectorContent.innerHTML = `
      <ul>
        <li>Passengers: ${boardedPassengers}/${capacity}${populations.meta.icon}</li>
        <li>Bacon: ${baconPassengers.toLocaleString()}${bacon.meta.icon}</li>
        <li>Sniffles: ${snifflesPassengers.toLocaleString()}${sniffles.meta.icon}</li>
      </ul>
      `;
      const percentageBacon = (baconPassengers / boardedPassengers) * 100;
      const percentageSniffles = (snifflesPassengers / boardedPassengers) * 100;
      statsPercentBacon.style = `--p: ${percentageBacon}`;
      statsPercentSmiles.style = `--p: 0`;
      statsPercentSniffles.style = `--p: ${percentageSniffles}`;
    }
  }
};

const initViews = () => {
  return Promise.all([
    populations.init(countriesDOM),
    prophylaxis.init(countriesDOM),
  ]).then(simulatePopulations);
};

let snifflesAmounts;

const seedModels = () => {
  return Promise.all([
    apples.init(countriesDOM),
    bacon.seed_bacon("ZA"),
    sniffles.seed("CD").then((data) => {
      snifflesAmounts = data;
    }),
  ]);
};

const removeLoadingScreen = () => {
  const loadingScreen = document.getElementById("loading-screen");
  // fade out loading screen, then remove from DOM
  loadingScreen.classList.add("fade-loading");
  setTimeout(() => {
    loadingScreen.remove();
  }, 1000);
};

// start the game
const startGame = () => {
  setInterval(simulatePopulations, 60 * 1000);
  setInterval(simulateApples, 100);
  setInterval(simulateBacon, 100);
  setInterval(simulateJourneys, 30);
  setInterval(simulateSmiles, 100);
  setInterval(simulateSniffles, 100);
  setInterval(updateInspector, 100);
};

loadMap
  .then(plotAirports)
  .then(initViews)
  .then(seedModels)
  .then(removeLoadingScreen)
  .then(startGame);
