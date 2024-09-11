const { db } = require("../../services/index");
const { sendResponse, sendError } = require("../../responses/index");
const { toggleAvailability } = require("../../utils/toggleAvailability");

exports.handler = async (event) => {
  // Hämta 'pk' z pathParameters
  const { id } = event.pathParameters;

  // Kolla upp om 'id' (pk) har levererats
  if (!id) {
    return sendError(400, { success: false, message: "Missing order ID" });
  }

  try {
    // Valfri kontroll för att beställningen finns
    const { Item } = await db.get({
      TableName: "roomorders-db",
      Key: { pk: id },
    });

    if (!Item) {
      return sendError(404, { success: false, message: "Order not found" });
    }

    // Extract booked rooms from the fetched order
    const { bookings: bookedRooms } = Item;

    // Loop through each booked room and toggle availability to true
    for (const booking of bookedRooms) {
      const { roomType, roomId } = booking; // Ensure roomId is available

      console.log("Processing booking:", booking); // Debugging log

      if (!roomId) {
        console.error("roomId is undefined for booking:", booking);
        return sendError(400, {
          success: false,
          message: "Invalid booking data. Missing roomId.",
        });
      }

      try {
        // Toggle the availability status to true
        await toggleAvailability(roomType, roomId, true);
      } catch (toggleError) {
        console.error("Error toggling room availability:", toggleError);
        return sendError(500, {
          success: false,
          message: `Failed to toggle availability for room: ${roomId}`,
        });
      }
    }

    // Ta bort orders
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
