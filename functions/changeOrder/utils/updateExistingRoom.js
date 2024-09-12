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
  // Fetch room price from the rooms table
  const roomParams = {
    TableName: "rooms-db",
    Key: { pk: roomType, sk: roomId },
  };

  const roomResult = await db.get(roomParams);
  const roomPrice = roomResult.Item?.price;

  if (roomPrice === undefined) {
    throw {
      statusCode: 500,
      message: `Price for roomId ${roomId} not found.`,
    };
  }

  // Update only the provided fields
  if (checkInDate !== undefined) {
    existingRoom.checkInDate = checkInDate;
  }

  if (checkOutDate !== undefined) {
    existingRoom.checkOutDate = checkOutDate;
  }

  if (roomType !== undefined) {
    existingRoom.roomType = roomType;
  }

  // Validate number of guests
  if (numberOfGuests !== undefined) {
    validateNumberOfGuests(roomType, numberOfGuests);
    existingRoom.numberOfGuests = numberOfGuests;
  }

  // Recalculate the total price if checkInDate or checkOutDate is provided
  if (checkInDate !== undefined || checkOutDate !== undefined) {
    existingRoom.totalPrice = calculateBookingPrice(
      roomPrice,
      existingRoom.checkInDate,
      existingRoom.checkOutDate
    );
  }
}

module.exports = { updateExistingRoom };
