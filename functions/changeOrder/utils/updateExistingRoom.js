const { validateNumberOfGuests } = require("../../../utils/checkGuests");
const { calculateBookingPrice } = require("../../../utils/calculatePrice");

async function updateExistingRoom(
  existingRoom,
  roomId,
  roomType,
  numberOfGuests,
  checkInDate,
  checkOutDate,
  db
) {
  const guestValidationError = validateNumberOfGuests(roomType, numberOfGuests);
  if (guestValidationError) {
    throw new Error(guestValidationError);
  }

  const roomParams = {
    TableName: "rooms-db",
    Key: { pk: roomType, sk: roomId },
  };
  const roomResult = await db.get(roomParams);
  const roomPrice = roomResult.Item?.price;
  if (roomPrice === undefined) {
    throw new Error(`Price for roomId ${roomId} not found.`);
  }

  Object.assign(existingRoom, {
    numberOfGuests,
    checkInDate,
    checkOutDate,
    roomType,
    totalPrice: calculateBookingPrice(roomPrice, checkInDate, checkOutDate),
  });
}

module.exports = { updateExistingRoom };
