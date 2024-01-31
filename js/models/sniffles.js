import { borders, countryCodes } from "./countries";
import populations from "./populations";
import prophylaxis from "../views/prophylaxis";
import apples from "./apples";

const meta = { name: "Sniffles", icon: "🥶", colour: "#00aeef" };

const baseInternalSpreadRate = 0.01; // per tick
const externalSpreadRate = 0.0001; // per tick
const externalSpreadThreshold = 20; // internal percentage threshold for external spread

// create an amounts registry for each country
const amounts = countryCodes.reduce((acc, countryCode) => {
  acc[countryCode] = 0;
  return acc;
}, {});

// increase amounts in the given country
const seed = async (countryCode, amount = 1) => {
  amounts[countryCode] += amount;
  return amounts;
};

const spreadInternally = () => {
  // each tick, the amounts in each country increases by the spread rate, decreases with apples limited by population
  Object.keys(amounts).forEach((countryCode) => {
    const population = populations.getPopulation(countryCode);
    let potentialSniffles = Math.ceil(
      amounts[countryCode] *
        (1 + baseInternalSpreadRate / prophylaxis.getCountryValue(countryCode))
    );
    potentialSniffles = Math.min(potentialSniffles, population);
    // an apple a day keeps the sniffles away
    const availableApples = apples.getCountryValue(countryCode);
    const eatenApples = Math.min(availableApples, potentialSniffles);
    potentialSniffles -= eatenApples;
    apples.delta(countryCode, -eatenApples);
    amounts[countryCode] = potentialSniffles;
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
