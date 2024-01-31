const RADIUS_EARTH = 6371; // km

// create path object from lat/lon coordinates 1 to lat/lon coordinates 2
// returns the start and end lat/lon coordinates, using Great Circle formulae, returns the distance in kilometres between them and the appropriate bearing in degrees
const createPath = (startCoordinates, endCoordinates) => {
  const lat1 = startCoordinates.lat;
  const lon1 = startCoordinates.lon;
  const lat2 = endCoordinates.lat;
  const lon2 = endCoordinates.lon;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const start = { lat: lat1, lon: lon1 };
  const end = { lat: lat2, lon: lon2 };
  const distance = RADIUS_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const direction = Math.atan2(
    Math.sin(dLon) * Math.cos(lat2Rad),
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)
  );

  return { start, end, distance, direction };
};

// create a vehicle object that can travel along a path
const createVehicle = (start, bearing, speed) => {
  return {
    position: start,
    bearing,
    speed,
    distanceTravelled: 0,
  };
};

const calcAltitude = (distanceTravelled, totalDistance) => {
  // calculate the altitude, 0 at the start, 0 at the end,
  // cruiseAltitude when distanceToCruise from the start or end,
  // and linear in between
  const distanceToCruise = 1000; // kilometres
  const cruiseAltitude = 10; // kilometres
  const distanceFromStart = distanceTravelled;
  const distanceFromEnd = totalDistance - distanceTravelled;
  const gradient = cruiseAltitude / distanceToCruise;
  const startAltitude = distanceFromStart * gradient;
  const endAltitude = distanceFromEnd * gradient;
  // choose the minimum of startAltitude, cruiseAltitude, and endAltitude
  return Math.min(startAltitude, cruiseAltitude, endAltitude);
};

// move the vehicle along the Great Circle path at the given speed in km/h, and return the new lat/lon coordinates
const moveVehicle = (vehicle, path, speed) => {
  const distanceToTravel = (speed / 3600) * 1000;
  const distanceRemaining = path.distance - vehicle.distanceTravelled;
  const distanceTravelled =
    distanceToTravel < distanceRemaining
      ? vehicle.distanceTravelled + distanceToTravel
      : path.distance;
  const bearing = path.direction;
  const lat1 = (path.start.lat * Math.PI) / 180;
  const lon1 = (path.start.lon * Math.PI) / 180;
  const angularDistance = distanceTravelled / RADIUS_EARTH;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );
  const lat = (lat2 * 180) / Math.PI;
  const lon = (lon2 * 180) / Math.PI;

  const altitude = calcAltitude(distanceTravelled, path.distance);

  return {
    position: { lat, lon },
    distanceTravelled,
    altitude,
  };
};

const deg2rad = (degrees) => {
  return (degrees * Math.PI) / 180;
};

const rad2deg = (radians) => {
  return (radians * 180) / Math.PI;
};

// calculate the angle between two lat/lon coordinates
const calcAngleDegrees = (start, end) => {
  const startLat = deg2rad(start.lat);
  const startLon = deg2rad(start.lon);
  const endLat = deg2rad(end.lat);
  const endLon = deg2rad(end.lon);
  const dLon = endLon - startLon;
  const dLat = endLat - startLat;
  const bearing = 90 - rad2deg(Math.atan2(dLat, dLon));
  return (bearing + 360) % 360;
};

// create a journey class that contains a vehicle and a path, when the journey is created, the vehicle is placed at the start of the path, the distance travelled is set to 0 km,the bearing is set to the bearing of the path. When journey.tick() is called, the vehicle is moved along the path at the given speed, and the distance travelled and vehicle position are updated.
const createJourney = (start, end, speed) => {
  const path = createPath(start, end);
  const vehicle = createVehicle(path.start, path.direction, speed);
  return {
    vehicle,
    path,
    tick() {
      const newVehicle = moveVehicle(vehicle, path, speed);
      vehicle.bearing = calcAngleDegrees(vehicle.position, newVehicle.position);
      vehicle.position = newVehicle.position;
      vehicle.distanceTravelled = newVehicle.distanceTravelled;
      vehicle.altitude = newVehicle.altitude;
      return vehicle;
    },
  };
};

export { createJourney };
