const { toggleAvailability } = require("../../../utils/toggleAvailability");

//Util-funktion som tar bort rum i bokning samt ändrar tillgängligheten i databasen
async function deleteRoomFromBooking(roomId, roomType, updatedBookings) {
  const roomIndex = updatedBookings.findIndex(
    (b) => b.roomId === roomId && b.roomType === roomType
  );

  if (roomIndex !== -1) {
    updatedBookings.splice(roomIndex, 1);
    await toggleAvailability(roomType, roomId, true);
  } else {
    throw {
      statusCode: 404,
      message: `Room with ID ${roomId} not found in existing bookings.`,
    };
  }
}

module.exports = { deleteRoomFromBooking };
