import bootstrap from "bootstrap/dist/js/bootstrap.min.js";

import { countries, alpha3Codes, countryCodes } from "./models/countries.js";
import populations from "./models/populations.js";
import { airports } from "./models/airports.js";
import { createJourney } from "./models/paths.js";
import bacon from "./models/bacon.js";
import smiles from "./models/smiles.js";
import sniffles from "./models/sniffles.js";

const worldMapUrl = "data/Worldmap_location_NED_50m.svg";

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Setup model UI components
const models = [populations, bacon, smiles, sniffles];
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
    const checkedModelName = document.querySelector(
      'input[name="model-view"]:checked'
    ).dataset.model;
    showModel(checkedModelName);
  });

  viewBar.appendChild(input_);
  viewBar.appendChild(label);
});

// enable tooltips
const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
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
  // info should be an object with at least the properties:
  //   - category
  //   - identifier
  //   - name
  // but may have additional properties

  const category = info.category;
  const identifier = info.identifier;
  const name = info.name;

  inspectorTitle.textContent = name;

  if (category === "country") {
    const population = populations.getPopulation(identifier);
    inspectorIcon.classList = `fi fi-${identifier.toLowerCase()} fis`;
    inspectorContent.innerHTML = `
    <ul>
      <li>Code: ${identifier}</li>
      <li>Population: ${population.toLocaleString()}👥</li>
      <li>Bacon: ${(info.bacon || 0).toLocaleString()}🥓</li>
      <li>Smiles: ${(info.smiles || 0).toLocaleString()}😊</li>
      <li>Sniffles: ${info.sniffles.toLocaleString()}🥶</li>
    </ul>
    `;
    const percentageBacon = (info.bacon / population) * 100;
    const percentageSmiles = (info.smiles / population) * 100;
    const percentageSniffles = (info.sniffles / population) * 100;

    statsPercentBacon.style = `--p: ${percentageBacon}`;
    statsPercentSmiles.style = `--p: ${percentageSmiles}`;
    statsPercentSniffles.style = `--p: ${percentageSniffles}`;
  }

  if (category === "airport") {
    const country = countries[info.countryCode];
    inspectorIcon.classList = `airport-${info.size}`;
    inspectorContent.innerHTML = `
    <ul>
      <li><span class="fi fi-${info.countryCode.toLowerCase()}" ></span> ${country}</li>
      <li>IATA: ${identifier}</li>
      <li>Size: ${toTitleCase(info.size)}</li>
    </ul>
    `;
  }

  if (category === "vehicle") {
    if (info.vehicle_type === "plane") {
      inspectorIcon.classList = "plane-icon";
      inspectorContent.innerHTML = `
      <ul>
        <li>Passengers: ${info.passengers.totalPassengers.toLocaleString()}${
        populations.meta.icon
      }</li>
        <li>Bacon: ${info.passengers.baconPeople.toLocaleString()}${
        bacon.meta.icon
      }</li>
        <li>Sniffles: ${info.passengers.snifflesPeople.toLocaleString()}${
        sniffles.meta.icon
      }</li>
      </ul>
      `;
      const percentageBacon =
        (info.passengers.baconPeople / info.passengers.totalPassengers) * 100;
      const percentageSniffles =
        (info.passengers.snifflesPeople / info.passengers.totalPassengers) *
        100;
      statsPercentBacon.style = `--p: ${percentageBacon}`;
      statsPercentSmiles.style = `--p: 0`;
      statsPercentSniffles.style = `--p: ${percentageSniffles}`;
    }
  }
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
          const bacon = baconCounter[code];
          const smileCount = smilesAmounts[code];
          const sniffleCount = snifflesAmounts[code];

          inspect({
            category: "country",
            identifier: code,
            name: name,
            bacon: bacon,
            smiles: smileCount,
            sniffles: sniffleCount,
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
  const populationsAmounts = populations.tick(); // update simulation

  // update population counter on map, by country using magnitude
  Object.keys(populationsAmounts).forEach((countryCode) => {
    const population = populationsAmounts[countryCode];
    const magnitude = Math.floor(Math.log10(population));
    const regions = countriesDOM[countryCode];
    regions.forEach((region) => {
      region.setAttribute("data-population-magnitude", magnitude);
    });
  });
};

let baconCounter = bacon.seed_bacon("ZA");

const simulateBacon = () => {
  baconCounter = bacon.tick(); // update simulation

  // update bacon counter on map
  const baconPercentage = Object.keys(baconCounter).reduce(
    (acc, countryCode) => {
      acc[countryCode] = populations.getPercentagePopulation(
        countryCode,
        baconCounter
      );
      return acc;
    },
    {}
  );
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
  const smilePercentage = Object.keys(smilesAmounts).reduce(
    (acc, countryCode) => {
      acc[countryCode] = populations.getPercentagePopulation(
        countryCode,
        smilesAmounts
      );
      return acc;
    },
    {}
  );
  Object.keys(smilePercentage).forEach((countryCode) => {
    const percentage = smilePercentage[countryCode];
    const regions = countriesDOM[countryCode];
    regions.forEach((region) => {
      region.setAttribute("data-smile", percentage);
    });
  });
};

let snifflesAmounts = sniffles.seed("ZA");
const simulateSniffles = () => {
  snifflesAmounts = sniffles.tick(); // update simulation

  // update sniffle counter on map
  const snifflesPercentage = Object.keys(snifflesAmounts).reduce(
    (acc, countryCode) => {
      acc[countryCode] = populations.getPercentagePopulation(
        countryCode,
        snifflesAmounts
      );
      return acc;
    },
    {}
  );
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

const loadPassengers = (country, totalPassengers) => {
  const countryPopulation = populations.getPopulation(country);
  const countryBacon = baconCounter[country];
  const countrySniffles = snifflesAmounts[country];

  const baconPercentage = countryBacon / countryPopulation;
  const snifflesPercentage = countrySniffles / countryPopulation;
  const baconSnifflesPercentage = baconPercentage * snifflesPercentage;

  const baconPeople = Math.round(baconPercentage * totalPassengers);
  const snifflesPeople = Math.round(snifflesPercentage * totalPassengers);
  const baconSnifflesPeople = Math.round(
    baconSnifflesPercentage * totalPassengers
  );
  const neitherPeople =
    totalPassengers - baconPeople - snifflesPeople + baconSnifflesPeople;

  // remove total passengers from country
  populations.migrate(country, -totalPassengers);
  // remove bacon people from countryBacon
  bacon.seed_bacon(country, -baconPeople);
  // remove sniffles people from snifflesAmounts
  snifflesAmounts[country] -= snifflesPeople;

  return {
    totalPassengers,
    baconPeople,
    snifflesPeople,
    baconSnifflesPeople,
    neitherPeople,
  };
};

const createNewJourney = () => {
  // create a journey between two random airports
  const speed = 200; // km/tick
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
      passengers: vehicle.payload,
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
    populations.migrate(destination, passengers.totalPassengers);
    // add bacon people to destination
    bacon.seed_bacon(destination, passengers.baconPeople);
    // add sniffles people to destination
    snifflesAmounts[destination] += passengers.snifflesPeople;

    vehicleMarker.remove();
    journey = null;
  }
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
  setInterval(simulateBacon, 30);
  setInterval(simulateJourneys, 30);
  setInterval(simulateSmiles, 10);
  setInterval(simulateSniffles, 10);
};

loadMap
  .then(plotAirports)
  .then(populations.seed)
  .then(simulatePopulations)
  .then(removeLoadingScreen)
  .then(startGame);
