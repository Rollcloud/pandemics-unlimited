import Papa from "papaparse";
import { alpha3Codes } from "../models/countries";

Papa.parsePromise = function (file, config = {}) {
  return new Promise(function (complete, error) {
    Papa.parse(file, { ...config, complete, error });
  });
};

const loadDataForCountriesByYear = async (filename, countryCodes, year, columnPrompt) => {
  const filepath = `data/${filename}`;
  return Papa.parsePromise(filepath, {
    download: true,
    header: true,
  }).then(function (results) {
    // Convert to a dictionary of country codes year data

    // find the column name containing the columnPrompt
    let fullColumnName;
    Object.keys(results.data[0]).forEach((columnName) => {
      if (columnName.includes(columnPrompt)) {
        fullColumnName = columnName;
      }
    });
    return results.data.reduce((acc, row) => {
      const alpha2Code = alpha3Codes[row["Code"]];
      if (countryCodes.includes(alpha2Code) && row["Year"] == year)
        acc[alpha2Code] = parseInt(row[fullColumnName]);
      return acc;
    }, {});
  });
};

export default { loadDataForCountriesByYear };
