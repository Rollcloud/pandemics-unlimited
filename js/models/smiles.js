import { countryCodes } from "./countries";
import populations from "./populations";
import sniffles from "./sniffles";
import bacon from "./bacon";

const meta = { name: "Smiles", icon: "😊", colour: "#ff9500" };

const internalSpreadRate = 0.01; // per tick

// seed each country with a single smile
const smiles = countryCodes.reduce((acc, countryCode) => {
  acc[countryCode] = 1;
  return acc;
}, {});

const tick = () => {
  // each tick, the number of smiles in each country increases by the spread rate, limited by population
  Object.keys(smiles).forEach((countryCode) => {
    const spreadSmiles = Math.ceil(
      smiles[countryCode] * (1 + internalSpreadRate)
    );

    // create interplay with sniffles and bacon - sniffles reduce smiles, bacon increase smiles
    const total = populations.getPopulation(countryCode);
    const numberBacon = bacon.baconCounter[countryCode];
    const numberSniffles = sniffles.amounts[countryCode];

    const percentSmiles = spreadSmiles / total;
    const percentBacon = numberBacon / total;
    const percentSniffles = numberSniffles / total;

    const percentBaconSmiles = percentBacon * percentSmiles;
    const percentSnifflesSmiles = percentSniffles * percentSmiles;

    const percentSmilesNew =
      percentSmiles - percentSnifflesSmiles + percentBaconSmiles;
    const newSmiles = Math.round(percentSmilesNew * total);

    smiles[countryCode] = populations.capByPopulation(countryCode, newSmiles);
  });

  return smiles;
};

export default { meta, tick };
