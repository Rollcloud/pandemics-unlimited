import { borders, countryCodes } from "./countries";
import populations from "./populations";

const meta = { name: "Bacon", icon: "🥓", colour: "#991717" };

// in a dictionary, for each country code in list of country codes, set value to 0
const baconCounter = countryCodes.reduce((acc, countryCode) => {
  acc[countryCode] = 0;
  return acc;
}, {});

// place bacon in the given country
const seed_bacon = (countryCode, amount = 1) => {
  baconCounter[countryCode] += amount;
  return baconCounter;
};

const tick = () => {
  // in a dictionary, for each country code in list of country codes, set value to false
  const countriesAddBacon = countryCodes.reduce((acc, countryCode) => {
    acc[countryCode] = false;
    return acc;
  }, {});

  // for each country in baconCounter, if it has bacon, add it to countriesWithBacon
  const countriesWithBacon = countryCodes.filter(
    (countryCode) => baconCounter[countryCode] > 0
  );

  // for all countries
  //   for all of its neighbours
  //     if a neighbour has bacon, set the country to add bacon
  countriesWithBacon.forEach((countryCode) => {
    const neighbours = borders[countryCode];
    neighbours.forEach((neighbourCode) => {
      countriesAddBacon[neighbourCode] = true;
    });
  });

  // foreach country in countriesAddBacon, if it is true, add bacon to baconCounter, limited by population
  Object.keys(countriesAddBacon).forEach((countryCode) => {
    if (countriesAddBacon[countryCode]) {
      const population = populations.getPopulation(countryCode);
      const newBacon = baconCounter[countryCode] + 1000;
      baconCounter[countryCode] = Math.min(newBacon, population);
    }
  });

  return baconCounter;
};

export default { meta, seed_bacon, tick, baconCounter };
