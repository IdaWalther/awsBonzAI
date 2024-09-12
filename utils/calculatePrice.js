/**
 * Calculates the total price for a room booking based on the room price and duration of stay.
 * @param {number} roomPrice - The price per night for the room.
 * @param {string} checkInDate - The check-in date in ISO 8601 format (e.g., '2024-09-01').
 * @param {string} checkOutDate - The check-out date in ISO 8601 format (e.g., '2024-09-10').
 * @returns {number} - The total price for the booking, calculated as roomPrice multiplied by the number of days stayed.
 */

const calculateBookingPrice = (roomPrice, checkInDate, checkOutDate) => {
  const days =
    (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24);
  return roomPrice * days;
};

//Ingen felhantering här, handler checkar så de angivna värdena är godkände
module.exports = { calculateBookingPrice };
