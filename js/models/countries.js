import isoCountries from "i18n-iso-countries";
import Papa from "papaparse";

isoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));

const bordersCsvPath = "data/geodatasource-country-borders.csv";

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

const alpha2Codes = isoCountries.getAlpha2Codes();
const alpha3Codes = isoCountries.getAlpha3Codes();
const countries = isoCountries.getNames("en", { select: "official" });
const countryCodes = Object.keys(countries);
const borders = await compileBorders(countryCodes);

export { alpha2Codes, alpha3Codes, borders, countries, countryCodes };
