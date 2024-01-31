import Papa from "papaparse";
import { alpha3Codes } from "../models/countries";

Papa.parsePromise = function (file, config = {}) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { ...config, complete, error });
  });
};

const loadDataForCountriesByYear = async (filename, countryCodes, year) => {
  const filepath = `data/${filename}`;
  return Papa.parsePromise(filepath, {
    download: true,
    comments: "//",
    header: true,
  }).then(function (results) {
    // Convert to a dictionary of country codes year data
    return results.data.reduce((acc, row) => {
      const alpha2Code = alpha3Codes[row["Country Code"]];
      if (countryCodes.includes(alpha2Code))
        acc[alpha2Code] = parseInt(row[String(year)]);
      return acc;
    }, {});
  });
};

export default { loadDataForCountriesByYear };
