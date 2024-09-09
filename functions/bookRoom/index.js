// functions/bookRoom/index.js

const { handler: getRooms } = require("../getRooms/index");
const { sendResponse, sendError } = require("../../responses/index");

exports.handler = async (event) => {
  try {
    // Simulate an event object for getRooms
    const getRoomsEvent = {}; // No specific event data needed for scan

    // Call the getRooms handler
    const availableRoomsResponse = await getRooms(getRoomsEvent);

    // Ensure the response is in the expected format
    if (availableRoomsResponse.statusCode === 200) {
      const responseBody = JSON.parse(availableRoomsResponse.body);
      const availableRooms = responseBody.data; // Access the 'data' property

      if (!Array.isArray(availableRooms)) {
        return sendError(500, { error: "Expected an array of rooms." });
      }

      // Parse the request body
      const { bookings } = JSON.parse(event.body);

      if (!Array.isArray(bookings) || bookings.length === 0) {
        return sendError(400, {
          error: 'Invalid request body. "bookings" must be a non-empty array.',
        });
      }

      // Validate request body for required fields
      const requiredFields = [
        "roomType",
        "numberOfGuests",
        "checkInDate",
        "checkOutDate",
        "name",
        "email",
      ];

      for (const booking of bookings) {
        const bookingFields = Object.keys(booking);

        if (!requiredFields.every((field) => bookingFields.includes(field))) {
          return sendError(400, {
            error: `Missing required fields in booking: ${JSON.stringify(
              booking
            )}`,
          });
        }

        if (bookingFields.length !== requiredFields.length) {
          return sendError(400, {
            error: `Extra fields found in booking: ${JSON.stringify(booking)}`,
          });
        }
      }

      // Booking logic
      let totalPrice = 0;
      for (const booking of bookings) {
        const { roomType, numberOfGuests, checkInDate, checkOutDate } = booking;

        // Find the room type from available rooms
        const room = availableRooms.find(
          (r) => r.pk === roomType && r.available === true
        );

        if (!room) {
          return sendError(400, {
            error: `Room type ${roomType} is not available.`,
          });
        }

        // Validate number of guests per room type
        if (
          (room.pk === "singleroom" && numberOfGuests > 1) ||
          (room.pk === "doubleroom" && numberOfGuests > 2)
        ) {
          return sendError(400, {
            error: `Invalid number of guests for room type ${roomType}.`,
          });
        }

        // Calculate the price for the current booking
        const days =
          (new Date(checkOutDate) - new Date(checkInDate)) /
          (1000 * 60 * 60 * 24);
        totalPrice += room.price * days;
      }

      // Respond with success message and total price
      return sendResponse(200, {
        message: "Rooms booked successfully",
        totalPrice,
      });
    } else {
      return sendError(
        availableRoomsResponse.statusCode,
        JSON.parse(availableRoomsResponse.body)
      );
    }
  } catch (error) {
    console.error("Error booking rooms:", error);
    return sendError(500, { message: "Internal server error" });
  }
};
