const { toggleAvailability } = require("../../../utils/toggleAvailability");
const { sendError } = require("../../../responses/index");

async function deleteRoomFromBooking(roomId, roomType, updatedBookings) {
  const roomIndex = updatedBookings.findIndex(
    (b) => b.roomId === roomId && b.roomType === roomType
  );
  if (roomIndex !== -1) {
    updatedBookings.splice(roomIndex, 1);
    await toggleAvailability(roomType, roomId, true);
  } else {
    return sendError(
      404,
      `Room with ID ${roomId} not found in existing bookings.`
    );
  }
}

module.exports = { deleteRoomFromBooking };
