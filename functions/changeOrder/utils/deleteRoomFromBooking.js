const { toggleAvailability } = require("../../../utils/toggleAvailability");

async function deleteRoomFromBooking(roomId, roomType, updatedBookings) {
  const roomIndex = updatedBookings.findIndex(
    (b) => b.roomId === roomId && b.roomType === roomType
  );
  if (roomIndex !== -1) {
    updatedBookings.splice(roomIndex, 1);
    await toggleAvailability(roomType, roomId, true);
  } else {
    throw new Error(`Room with ID ${roomId} not found in existing bookings.`);
  }
}

module.exports = { deleteRoomFromBooking };
