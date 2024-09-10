const { db } = require("../../services/index");
const { sendResponse, sendError } = require("../../responses/index");
const { v4: uuidv4 } = require("uuid"); // Importing UUID
const { validateNumberOfGuests } = require("../../utils/checkGuests");
const { calculateBookingPrice } = require("../../utils/calculatePrice");

exports.handler = async (event) => {
  try {
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
    const bookingResults = []; // To store each booking's result with the generated ID

    for (const booking of bookings) {
      const { roomType, numberOfGuests, checkInDate, checkOutDate } = booking;

      // Generate a unique ID for this booking
      const bookingId = uuidv4();

      // Query the rooms for the specified room type
      const queryParams = {
        TableName: "rooms-db", // Replace with your table name
        KeyConditionExpression: "pk = :pk",
        FilterExpression: "available = :available",
        ExpressionAttributeValues: {
          ":pk": roomType, // No need to use { S: roomType } because `db` handles it
          ":available": true,
        },
      };

      try {
        const { Items } = await db.query(queryParams);
        const availableRooms = Items; // Directly using Items since db auto-converts

        if (!Array.isArray(availableRooms) || availableRooms.length === 0) {
          return sendError(400, {
            error: `Room type ${roomType} is not available at the moment.`,
          });
        }

        // Find the first available room of the specified type
        const room = availableRooms[0];

        // Use the utility function to validate number of guests for each room
        const guestValidationError = validateNumberOfGuests(
          room.pk,
          numberOfGuests
        );
        if (guestValidationError) {
          return sendError(400, guestValidationError);
        }

        // Use the utility function to calculate booking price
        const bookingPrice = calculateBookingPrice(
          room.price,
          checkInDate,
          checkOutDate
        );
        totalPrice += bookingPrice;

        // Store the booking result with the generated ID
        bookingResults.push({
          bookingId,
          ...booking,
          totalPrice: bookingPrice,
        });
      } catch (error) {
        console.error("Error querying room availability:", error);
        return sendError(500, { message: "Internal server error" });
      }
    }

    // Respond with success message, total price, and generated IDs
    return sendResponse(200, {
      message: "Rooms booked successfully",
      totalPrice,
      bookings: bookingResults, // Include booking details with generated IDs
    });
  } catch (error) {
    console.error("Error booking rooms:", error);
    return sendError(500, { message: "Internal server error" });
  }
};
