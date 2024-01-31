import worldBankLoader from "../loaders/world-bank";
import { countryCodes } from "../models/countries";

const meta = { name: "Prophylaxis", icon: "🧑‍⚕️", colour: "#008080" };

const preventableDeathsFilename = "API_SH.DTH.COMM.ZS_DS2_en_csv_v2_6300689.csv";

// load initial data
let values;
const init = async (countriesDOM) => {
  values = await worldBankLoader
    .loadDataForCountriesByYear(preventableDeathsFilename, countryCodes, 2019)
    .then((data) => {
      // invert the rates of percentage cause of death to a proxy of prophylaxis
      // normalise the rates to the baseInternalSpreadRate equal to the median rate
      // median preventable death rate is 10
      const medianRate = 10;
      return Object.keys(data).reduce((acc, countryCode) => {
        acc[countryCode] = 1 / (data[countryCode] / medianRate);
        return acc;
      }, {});
    });

  // update the DOM
  Object.keys(values).forEach((countryCode) => {
    const value = getCountryValue(countryCode);
    const magnitude = Math.log10(value);
    const regions = countriesDOM[countryCode];
    regions.forEach((region) => {
      region.setAttribute("data-prophylaxis", Math.round(magnitude * 100));
    });
  });
};

const getCountryValue = (countryCode) => {
  return values[countryCode] || 0;
};

export default { meta, init, getCountryValue };
