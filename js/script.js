import {
  countries,
  alpha3Codes,
  getPopulation,
  countryCodes,
} from "./models/countries.js";
import { airports } from "./models/airports.js";
import { createJourney } from "./models/paths.js";
import { seed_bacon, tick } from "./models/bacon.js";
import { tick as tickSmiles } from "./models/smiles.js";

const worldMapUrl = "data/Worldmap_location_NED_50m.svg";

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

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
    const population = getPopulation(identifier);
    inspectorIcon.classList = `fi fi-${identifier.toLowerCase()} fis`;
    inspectorContent.innerHTML = `
    <ul>
      <li>Code: ${identifier}</li>
      <li>Population: ${population.toLocaleString()}</li>
      <li>Bacon: ${info.bacon}🥓</li>
      <li>Smiles: ${(info.smiles || 0).toLocaleString()}😊</li>
    </ul>
    `;
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
};

let countriesDOM = {};
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
          const smileCount = smiles[code];

          inspect({
            category: "country",
            identifier: code,
            name: name,
            bacon: bacon,
            smiles: smileCount,
          });
        });
      });
    });
  });

const lonToX = (lon) => ((lon + 180) * (100 / 360)) % 100;
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

let baconCounter = seed_bacon("ZA");
plotAirports();

const simulateBacon = () => {
  baconCounter = tick(); // update simulation

  // update bacon counter on map
  const baconPercentage = Object.keys(baconCounter).reduce(
    (acc, countryCode) => {
      const population = getPopulation(countryCode);
      const bacon = baconCounter[countryCode];
      acc[countryCode] = Math.floor((bacon / population) * 100) || 0;
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

let smiles = {};
const simulateSmiles = () => {
  smiles = tickSmiles(); // update simulation

  // update smile counter on map
  const smilePercentage = Object.keys(smiles).reduce((acc, countryCode) => {
    const population = getPopulation(countryCode);
    const smile = smiles[countryCode];
    acc[countryCode] = Math.floor((smile / population) * 100) || 0;
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

const renderVehicle = (marker, vehicle) => {
  marker.style.left = `${lonToX(vehicle.position.lon)}%`;
  marker.style.top = `${latToY(vehicle.position.lat)}%`;
  marker.style.transform = `rotate(${vehicle.bearing}deg)`;
  if (Object.hasOwn(vehicle, "altitude")) {
    marker.style.fontSize = `${Math.floor(vehicle.altitude / 1.5) + 5}px`;
  }
};

const loadPassengers = (country, number) => {
  const baconPeople = baconCounter[country];
  const availablePassengers = Math.min(number, baconPeople);
  baconCounter[country] -= availablePassengers;
  return { bacon: availablePassengers, nonBacon: 0 };
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
  vehicleLayer.appendChild(vehicleMarker);
  journey.marker = vehicleMarker;
  return journey;
};

let journey = createNewJourney();
const simulateJourneys = () => {
  const vehicle = journey.tick();
  const vehicleMarker = journey.marker;
  renderVehicle(vehicleMarker, vehicle);

  // if the vehicle has reached its destination, remove it
  if (vehicle.distanceTravelled >= journey.path.distance) {
    // add passengers to destination
    const destination = vehicle.destination;
    const passengers = vehicle.payload;
    seed_bacon(destination, passengers.bacon);
    vehicleMarker.remove();
    journey = createNewJourney();
  }
};

// start the game
const startGame = () => {
  setInterval(simulateBacon, 30);
  setInterval(simulateJourneys, 30);
  setInterval(simulateSmiles, 10);
};

startGame();
