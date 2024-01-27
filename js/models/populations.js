import Papa from "papaparse";
import { alpha2Codes, countryCodes } from "./countries";

const meta = { name: "Population", icon: "👥", colour: "#3d0063" };
const popTotalsCsvPath = "data/API_SP.POP.TOTL_DS2_en_csv_v2_6508519.csv";
const popGrowthCsvPath = "data/API_SP.POP.GROW_DS2_en_csv_v2_6298705.csv";

let populations = {};

Papa.parsePromise = function (file, config = {}) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { ...config, complete, error });
  });
};

const fetchPopulationTotals = async () => {
  return Papa.parsePromise(popTotalsCsvPath, {
    download: true,
    comments: "//",
    header: true,
  }).then(function (results) {
    // Convert to a dictionary of country codes to population totals for 2022
    return results.data.reduce((acc, row) => {
      acc[row["Country Code"]] = parseInt(row["2022"]);
      return acc;
    }, {});
  });
};

const fetchPopulationGrowths = async () => {
  return Papa.parsePromise(popGrowthCsvPath, {
    download: true,
    comments: "//",
    header: true,
  }).then(function (results) {
    // Convert to a dictionary of country codes to population growths for 2022
    return results.data.reduce((acc, row) => {
      acc[row["Country Code"]] = parseFloat(row["2022"]);
      return acc;
    }, {});
  });
};

const compilePopulations = async (countryCodes) => {
  const totals = await fetchPopulationTotals();
  const growths = await fetchPopulationGrowths();

  // Create a dictionary of country codes to population totals and growth rates
  return countryCodes.reduce((acc, countryCode) => {
    const alpha3Code = alpha2Codes[countryCode];
    const total = totals[alpha3Code] || 0;
    const growth = growths[alpha3Code] || 0;
    acc[countryCode] = { total, growth };
    return acc;
  }, {});
};

// default to today's date
const getPopulation = (countryCode, date = new Date()) => {
  const populationAt2022 = populations[countryCode.toUpperCase()].total;
  const annualGrowthRate = populations[countryCode.toUpperCase()].growth;
  const dailyGrowthRate = annualGrowthRate / 365; // TODO: make this exponential, not linear
  const daysDelta = (date - new Date("2022-01-01")) / (1000 * 60 * 60 * 24);
  const populationAtDate = Math.floor(
    populationAt2022 + dailyGrowthRate * daysDelta
  );
  return populationAtDate;
};

const getPercentagePopulation = (countryCode, amounts, date = new Date()) => {
  const amount = amounts[countryCode];
  const population = getPopulation(countryCode, date);
  return Math.floor((amount / population) * 100) || 0;
};

const capByPopulation = (countryCode, amount, date = new Date()) => {
  const population = getPopulation(countryCode, date);
  return Math.min(amount, population);
};

const seed = async () => {
  populations = await compilePopulations(countryCodes);
};

const tick = () => {};

export default {
  meta,
  seed,
  tick,
  getPopulation,
  getPercentagePopulation,
  capByPopulation,
};
