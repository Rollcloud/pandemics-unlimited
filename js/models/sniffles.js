import { borders, countryCodes } from "./countries";
import populations from "./populations";
import worldBankLoader from "../loaders/world-bank";

const meta = { name: "Sniffles", icon: "🥶", colour: "#00aeef" };

const baseInternalSpreadRate = 0.01; // per tick
const externalSpreadRate = 0.0001; // per tick
const externalSpreadThreshold = 20; // internal percentage threshold for external spread
let preventableDeathsRate;

// create an amounts registry for each country
const amounts = countryCodes.reduce((acc, countryCode) => {
  acc[countryCode] = 0;
  return acc;
}, {});

const preventableDeathsFilename = "API_SH.DTH.COMM.ZS_DS2_en_csv_v2_6300689.csv";

// increase amounts in the given country
const seed = async (countryCode, amount = 1) => {
  amounts[countryCode] += amount;

  // load health data
  preventableDeathsRate = await worldBankLoader
    .loadDataForCountriesByYear(preventableDeathsFilename, countryCodes, 2019)
    .then((data) => {
      // find the highest rate and substitute NaNs with this value
      const maxRate = Object.values(data).reduce((acc, rate) => {
        if (isNaN(rate)) return acc;
        return Math.max(acc, rate);
      }, 0);

      return Object.keys(data).reduce((acc, countryCode) => {
        if (isNaN(data[countryCode])) acc[countryCode] = maxRate;
        else acc[countryCode] = data[countryCode];
        return acc;
      }, {});
    })
    .then((data) => {
      // normalise the rates to the baseInternalSpreadRate equal to the median rate
      // median preventable death rate is 10
      const medianRate = 10;
      return Object.keys(data).reduce((acc, countryCode) => {
        acc[countryCode] = data[countryCode] / medianRate;
        return acc;
      }, {});
    });

  return amounts;
};

const spreadInternally = () => {
  // each tick, the amounts in each country increases by the spread rate, limited by population
  Object.keys(amounts).forEach((countryCode) => {
    const population = populations.getPopulation(countryCode);
    const newamounts = Math.ceil(
      amounts[countryCode] *
        (1 + baseInternalSpreadRate * preventableDeathsRate[countryCode])
    );
    amounts[countryCode] = Math.min(newamounts, population);
  });
};

const spreadOverBorders = () => {
  const internalPercentages = Object.keys(amounts).reduce((acc, countryCode) => {
    acc[countryCode] = populations.getPercentagePopulation(countryCode, amounts);
    return acc;
  }, {});
  const countriesWithExternalSpread = Object.keys(amounts).filter((countryCode) => {
    return internalPercentages[countryCode] > externalSpreadThreshold;
  });
  const newSpread = {};
  countriesWithExternalSpread.forEach((countryCode) => {
    const spreadAmount = Math.ceil(amounts[countryCode] * externalSpreadRate);
    const neighbours = borders[countryCode];
    neighbours.forEach((neighbourCode) => {
      if (newSpread[neighbourCode] === undefined) {
        newSpread[neighbourCode] = spreadAmount;
      } else {
        newSpread[neighbourCode] += spreadAmount;
      }
    });
  });

  Object.keys(newSpread).forEach((countryCode) => {
    const newAmount = amounts[countryCode] + newSpread[countryCode];
    amounts[countryCode] = populations.capByPopulation(countryCode, newAmount);
  });
};

const tick = () => {
  spreadInternally();
  spreadOverBorders();
  return amounts;
};

export default { meta, seed, tick, amounts };
