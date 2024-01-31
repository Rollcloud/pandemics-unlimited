import Papa from "papaparse";
import { alpha2Codes, countryCodes } from "./countries";
import worldBankLoader from "../loaders/world-bank";

const meta = { name: "Population", icon: "👥", colour: "#3d0063" };
const popTotalsFilename = "API_SP.POP.TOTL_DS2_en_csv_v2_6508519.csv";
const popGrowthFilename = "API_SP.POP.GROW_DS2_en_csv_v2_6298705.csv";

let populations = {};

Papa.parsePromise = function (file, config = {}) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { ...config, complete, error });
  });
};

const compilePopulations = async (countryCodes, date = new Date()) => {
  const totals = await worldBankLoader.loadDataForCountriesByYear(
    popTotalsFilename,
    countryCodes,
    2022
  );
  const growths = await worldBankLoader.loadDataForCountriesByYear(
    popGrowthFilename,
    countryCodes,
    2022
  );

  // Create a dictionary of country codes to population totals and growth rates
  return countryCodes.reduce((acc, countryCode) => {
    const total2022 = totals[countryCode] || 0;
    const growth2022 = growths[countryCode] || 0;

    const dailyGrowthRate = growth2022 / 365; // TODO: make this exponential, not linear
    const daysDelta = (date - new Date("2022-01-01")) / (1000 * 60 * 60 * 24);
    const total = Math.floor(total2022 + dailyGrowthRate * daysDelta);

    acc[countryCode] = { total2022, growth2022, total };
    return acc;
  }, {});
};

const getPopulation = (countryCode) => {
  const code = countryCode.toUpperCase();
  return populations[code].total;
};

const getPercentagePopulation = (countryCode, amounts) => {
  const amount = amounts[countryCode];
  const population = getPopulation(countryCode);
  return Math.floor((amount / population) * 100) || 0;
};

const capByPopulation = (countryCode, amount) => {
  const population = getPopulation(countryCode);
  return Math.min(amount, population);
};

const migrate = (countryCode, amount) => {
  if (!populations[countryCode]) {
    console.log(`Country code ${countryCode} not found in populations`);
    return;
  }
  populations[countryCode].total += amount;
};

const render = (countriesDOM) => {
  // update population counter on map, by country using magnitude
  Object.keys(populations).forEach((countryCode) => {
    const population = populations[countryCode].total;
    const magnitude = Math.floor(Math.log10(population));
    const regions = countriesDOM[countryCode];
    regions.forEach((region) => {
      region.setAttribute("data-population-magnitude", magnitude);
    });
  });
};

const init = async (countriesDOM) => {
  populations = await compilePopulations(countryCodes);
  render(countriesDOM);
};

const tick = () => {
  // return dict of country codes to populations
  return Object.keys(populations).reduce((acc, countryCode) => {
    acc[countryCode] = getPopulation(countryCode);
    return acc;
  }, {});
};

export default {
  meta,
  init,
  tick,
  render,
  migrate,
  getPopulation,
  getPercentagePopulation,
  capByPopulation,
};
