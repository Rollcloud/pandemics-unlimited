import { countryCodes } from "./countries";
import populations from "./populations";

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
    const newSmiles = Math.ceil(smiles[countryCode] * (1 + internalSpreadRate));
    smiles[countryCode] = populations.capByPopulation(countryCode, newSmiles);
  });

  return smiles;
};

export default { meta, tick };
