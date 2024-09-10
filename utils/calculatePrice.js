//Calculate the price of an order
const calculateBookingPrice = (roomPrice, checkInDate, checkOutDate) => {
  const days =
    (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24);
  return roomPrice * days;
};

module.exports = { calculateBookingPrice };
