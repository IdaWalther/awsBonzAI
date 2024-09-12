const { findAvailableRoom } = require("../../../utils/findRoom");
const { validateNumberOfGuests } = require("../../../utils/checkGuests");
const { calculateBookingPrice } = require("../../../utils/calculatePrice");
const { toggleAvailability } = require("../../../utils/toggleAvailability");

async function addNewRoom(
  roomType,
  numberOfGuests,
  checkInDate,
  checkOutDate,
  updatedBookings
) {
  // Validate required fields
  if (!roomType || !numberOfGuests || !checkInDate || !checkOutDate) {
    throw {
      statusCode: 400,
      message:
        "Missing required fields: roomType, numberOfGuests, checkInDate, and checkOutDate are all required to add a new room.",
    };
  }

  const room = await findAvailableRoom(roomType);

  validateNumberOfGuests(roomType, numberOfGuests);

  const bookingPrice = calculateBookingPrice(
    room.price,
    checkInDate,
    checkOutDate
  );
  updatedBookings.push({
    roomId: room.sk,
    roomType,
    numberOfGuests,
    checkInDate,
    checkOutDate,
    totalPrice: bookingPrice,
  });

  await toggleAvailability(room.pk, room.sk, false);
}

module.exports = { addNewRoom };
