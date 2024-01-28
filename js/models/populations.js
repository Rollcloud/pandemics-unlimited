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

const compilePopulations = async (countryCodes, date = new Date()) => {
  const totals = await fetchPopulationTotals();
  const growths = await fetchPopulationGrowths();

  // Create a dictionary of country codes to population totals and growth rates
  return countryCodes.reduce((acc, countryCode) => {
    const alpha3Code = alpha2Codes[countryCode];
    const total2022 = totals[alpha3Code] || 0;
    const growth2022 = growths[alpha3Code] || 0;

    const dailyGrowthRate = growth2022 / 365; // TODO: make this exponential, not linear
    const daysDelta = (date - new Date("2022-01-01")) / (1000 * 60 * 60 * 24);
    const total = Math.floor(total2022 + dailyGrowthRate * daysDelta);

    acc[countryCode] = { total2022, growth2022, total };
    return acc;
  }, {});
};

// default to today's date
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
  populations[countryCode].total += amount;
};

const seed = async () => {
  populations = await compilePopulations(countryCodes);
};

const tick = () => {};

export default {
  meta,
  seed,
  tick,
  migrate,
  getPopulation,
  getPercentagePopulation,
  capByPopulation,
};
