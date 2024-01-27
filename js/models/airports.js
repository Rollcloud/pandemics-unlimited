import all_airports from "airports";

// all_airports is an array of airport objects, for example:
// {
//     "iata": "YOH",
//     "lon": "-95.27668",
//     "iso": "CA",
//     "status": 1,
//     "name": "Oxford House Airport",
//     "continent": "NA",
//     "type": "airport",
//     "lat": "54.934242",
//     "size": "medium"
// }

// it contains the sizes below:
//   null: 180
//   small: 2485
//   medium: 3556
//   large: 505

// it contains the continents below:
//    AF: 955
//    AS: 1482
//    EU: 1091
//    NA: 1502
//    OC: 862
//    SA: 834

// from each continent, return 10 random large airports and 10 random medium airports
const get_airports = () => {
  const continents = ["AF", "AS", "EU", "NA", "OC", "SA"];
  const numberLargeAirports = 5;
  const numberMediumAirports = 5;

  // filter all_airports to remove airports with status 0
  all_airports.filter((airport) => airport.status == 1);
  // filter all_airports to remove airports with invalid lat or lon
  all_airports.filter((airport) => !isNaN(airport.lat) || !isNaN(airport.lon));
  // filter all_airports to remove airports without an iso code
  all_airports.filter(
    (airport) =>
      airport.iso !== "" && airport.iso !== null && airport.iso !== undefined
  );

  const airports = continents.reduce((acc, continent) => {
    const largeAirports = all_airports.filter(
      (airport) => airport.continent === continent && airport.size === "large"
    );
    const mediumAirports = all_airports.filter(
      (airport) => airport.continent === continent && airport.size === "medium"
    );
    const largeAirportCount = largeAirports.length;
    const mediumAirportCount = mediumAirports.length;
    const largeAirportIndices = [];
    const mediumAirportIndices = [];
    for (let i = 0; i < numberLargeAirports; i++) {
      largeAirportIndices.push(Math.floor(Math.random() * largeAirportCount));
    }
    for (let i = 0; i < numberMediumAirports; i++) {
      mediumAirportIndices.push(Math.floor(Math.random() * mediumAirportCount));
    }
    const largeAirportSelection = largeAirportIndices.map(
      (index) => largeAirports[index]
    );
    const mediumAirportSelection = mediumAirportIndices.map(
      (index) => mediumAirports[index]
    );
    return [...acc, ...largeAirportSelection, ...mediumAirportSelection];
  }, []);

  return airports;
};

const airports = get_airports();

export { airports };
