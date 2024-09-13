const { db } = require("../../services/index");
const { sendResponse, sendError } = require("../../responses/index");
const { toggleAvailability } = require("../../utils/toggleAvailability");

exports.handler = async (event) => {
  // Hämta order-ID (pk) via pathParameters
  const { id } = event.pathParameters;

  if (!id) {
    return sendError(400, { success: false, message: "Missing order ID" });
  }

  try {
    //Hämtar ordern från databasen 
    const { Item } = await db.get({
      TableName: "roomorders-db",
      Key: { pk: id },
    });

    if (!Item) {
      return sendError(404, { success: false, message: "Order not found" });
    }

    //Tar ut bokade rum från ordern
    const { bookings: bookedRooms } = Item;

    //Loopar igenom rummen och ändrar availability till true via vår utility-funktion
    for (const booking of bookedRooms) {
      const { roomType, roomId } = booking;

      console.log("Processing booking:", booking);

      if (!roomId) {
        console.error("roomId is undefined for booking:", booking);
        return sendError(400, {
          success: false,
          message: "Invalid booking data. Missing roomId.",
        });
      }

      try {
        await toggleAvailability(roomType, roomId, true);
      } catch (toggleError) {
        console.error("Error toggling room availability:", toggleError);
        return sendError(500, {
          success: false,
          message: `Failed to toggle availability for room: ${roomId}`,
        });
      }
    }

    //Ta bort ordern
    await db.delete({
      TableName: "roomorders-db",
      Key: { pk: id },
    });

    return sendResponse(200, {
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return sendError(500, { success: false, message: error.message });
  }
};
