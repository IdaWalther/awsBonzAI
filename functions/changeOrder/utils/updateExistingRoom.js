const { validateNumberOfGuests } = require("../../../utils/checkGuests");
const { calculateBookingPrice } = require("../../../utils/calculatePrice");
const { sendError } = require("../../../responses/index");
async function updateExistingRoom(
  existingRoom,
  roomId,
  roomType,
  numberOfGuests,
  checkInDate,
  checkOutDate,
  db
) {
  // Validate number of guests and throw a string message instead of an Error object
  const guestValidationError = validateNumberOfGuests(roomType, numberOfGuests);
  if (guestValidationError) {
    return sendError(400, guestValidationError);
  }

  // Fetch room price from the rooms table
  const roomParams = {
    TableName: "rooms-db",
    Key: { pk: roomType, sk: roomId },
  };

  try {
    const roomResult = await db.get(roomParams);
    const roomPrice = roomResult.Item?.price;
    if (roomPrice === undefined) {
      return sendError(404, `Price for roomId ${roomId} not found.`);
    }

    // Update the existing room with new details
    Object.assign(existingRoom, {
      numberOfGuests,
      checkInDate,
      checkOutDate,
      roomType,
      totalPrice: calculateBookingPrice(roomPrice, checkInDate, checkOutDate),
    });
  } catch (error) {
    // Ensure the error is a string
    return sendError(
      500,
      `Error updating room ${roomId}: ${error.message || error}`
    );
  }
}

module.exports = { updateExistingRoom };
