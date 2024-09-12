const { findAvailableRoom } = require("../../../utils/findRoom");
const { validateNumberOfGuests } = require("../../../utils/checkGuests");
const { calculateBookingPrice } = require("../../../utils/calculatePrice");
const { toggleAvailability } = require("../../../utils/toggleAvailability");
const { sendError } = require("../../../responses/index");

async function addNewRoom(
  roomType,
  numberOfGuests,
  checkInDate,
  checkOutDate,
  updatedBookings
) {
  const room = await findAvailableRoom(roomType, numberOfGuests);
  if (!room) {
    return sendError(404, `No available room found for type ${roomType}.`);
  }

  const guestValidationError = validateNumberOfGuests(roomType, numberOfGuests);
  if (guestValidationError) {
    return sendError(400, guestValidationError);
  }

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