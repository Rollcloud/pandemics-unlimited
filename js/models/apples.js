import { countryCodes } from "./countries";
import ourWorldInDataLoader from "../loaders/our-world-in-data";

const meta = { name: "Apples", icon: "🍏", colour: "#6bc714" };

const annualProductionFilename = "apple-production.csv";

// keep track of the amount of apples in each country
const values = countryCodes.reduce((acc, countryCode) => {
  acc[countryCode] = 0;
  return acc;
}, {});

// load data
let annualProduction;
const init = async (countriesDOM) => {
  annualProduction = await ourWorldInDataLoader
    .loadDataForCountriesByYear(annualProductionFilename, countryCodes, 2020, "Apples")
    .then((data) => {
      return Object.keys(data).reduce((acc, countryCode) => {
        acc[countryCode] = data[countryCode];
        return acc;
      }, {});
    });

  // update the DOM
  Object.keys(annualProduction).forEach((countryCode) => {
    const million = 1000000;
    const value = annualProduction[countryCode];
    const magnitude = Math.log(value);
    const regions = countriesDOM[countryCode];
    regions.forEach((region) => {
      region.setAttribute("data-apples", Math.round(magnitude));
    });
  });
};

const getCountryValue = (countryCode) => {
  return values[countryCode] || 0;
};

// change number of apples in a country
const delta = async (countryCode, number) => {
  values[countryCode] += number;
  return values;
};

const produceApples = () => {
  // each tick, the amounts in each country increases production rate

  // convert annual production in tonnes to daily production in apples
  const applesPerTonne = 7000;
  const daysPerYear = 365;
  const daysPerTick = 0.000001;
  Object.keys(annualProduction).forEach((countryCode) => {
    const newApples = Math.ceil(
      ((annualProduction[countryCode] * applesPerTonne) / daysPerYear) * daysPerTick
    );
    values[countryCode] += newApples;
  });
};

const tick = () => {
  produceApples();
};

export default { meta, init, delta, tick, getCountryValue };
