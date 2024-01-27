import isoCountries from "i18n-iso-countries";
import Papa from "papaparse";

isoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));

const bordersCsvPath = "data/geodatasource-country-borders.csv";
const popTotalsCsvPath = "data/API_SP.POP.TOTL_DS2_en_csv_v2_6508519.csv";
const popGrowthCsvPath = "data/API_SP.POP.GROW_DS2_en_csv_v2_6298705.csv";

Papa.parsePromise = function (file, config = {}) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { ...config, complete, error });
  });
};

const fetchBorders = async () => {
  return Papa.parsePromise(bordersCsvPath, {
    download: true,
    header: true,
  }).then(function (results) {
    // Convert to a dictionary of country codes to bordering country codes
    return results.data.reduce((acc, row) => {
      if (row.country_code === "" || row.country_border_code === "") return acc;

      if (!acc[row.country_code]) {
        acc[row.country_code] = [];
      }
      acc[row.country_code].push(row.country_border_code);
      return acc;
    }, {});
  });
};

const compileBorders = async (countryCodes) => {
  const bordersData = await fetchBorders();
  const bordersCountries = {};
  countryCodes.forEach((countryCode) => {
    if (!bordersData[countryCode]) {
      //  if there are any countries without borders, add them
      bordersCountries[countryCode] = [];
    } else {
      bordersCountries[countryCode] = bordersData[countryCode];
    }
  });

  return bordersCountries;
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
    const alpha3Code = isoCountries.alpha2ToAlpha3(countryCode);
    const total = totals[alpha3Code] || 0;
    const growth = growths[alpha3Code] || 0;
    acc[countryCode] = { total, growth };
    return acc;
  }, {});
};

// default to today's date
const getPopulation = (countryCode, date = new Date()) => {
  const populationAt2022 = populations[countryCode].total;
  const annualGrowthRate = populations[countryCode].growth;
  const dailyGrowthRate = annualGrowthRate / 365; // TODO: make this exponential, not linear
  const daysDelta = (date - new Date("2022-01-01")) / (1000 * 60 * 60 * 24);
  const populationAtDate = Math.floor(
    populationAt2022 + dailyGrowthRate * daysDelta
  );
  return populationAtDate;
};

const alpha3Codes = isoCountries.getAlpha3Codes();
const countries = isoCountries.getNames("en", { select: "official" });
const countryCodes = Object.keys(countries);
const borders = await compileBorders(countryCodes);
const populations = await compilePopulations(countryCodes);

export { borders, countries, countryCodes, alpha3Codes, getPopulation };
