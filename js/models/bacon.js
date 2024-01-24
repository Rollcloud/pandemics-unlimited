import { borders, countryCodes } from "./countries";

// in a dictionary, for each country code in list of country codes, set value to 0
const baconCounter = countryCodes.reduce((acc, countryCode) => {
  acc[countryCode] = 0;
  return acc;
}, {});

// place bacon in the given country
const seed_bacon = (countryCode, amount = 1) => {
  baconCounter[countryCode] += amount;
};

// for all countries if it, or any of its neighbours, has bacon, add 1 to the bacon counter
const tick = () => {
  Object.keys(baconCounter).forEach((countryCode) => {
    if (borders[countryCode].length > 0) {
      const neighbouringBacon = borders[countryCode].some(
        (neighbourCountryCode) => baconCounter[neighbourCountryCode] > 0
      );
      if (neighbouringBacon) {
        baconCounter[countryCode] += 1;
      }
    }
  });

  return baconCounter;
};

export { seed_bacon, tick };
