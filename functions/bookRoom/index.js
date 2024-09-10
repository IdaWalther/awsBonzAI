const { db } = require("../../services/index");
const { sendResponse, sendError } = require("../../responses/index");
const { v4: uuidv4 } = require("uuid"); // Importing UUID
const { validateNumberOfGuests } = require("../../utils/checkGuests");
const { calculateBookingPrice } = require("../../utils/calculatePrice");
const { toggleAvailability } = require("../../utils/toggleAvailability");

exports.handler = async (event) => {
  try {
    // Parse the request body and check for invalid fields
    const { bookings, name, email } = JSON.parse(event.body);

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return sendError(400, {
        error: 'Invalid request body. "bookings" must be a non-empty array.',
      });
    }

    if (!name || !email) {
      return sendError(400, {
        error: "Name and email are required at the order level.",
      });
    }

    // Validate request body for required fields
    const requiredFields = [
      "roomType",
      "numberOfGuests",
      "checkInDate",
      "checkOutDate",
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

    // Generate a unique ID for the entire order
    const orderId = uuidv4();

    // Booking logic
    let totalPrice = 0;
    const bookingDetails = []; // To store details of each booking
    const roomsToUpdate = []; // To store the rooms to be updated

    for (const booking of bookings) {
      const { roomType, numberOfGuests, checkInDate, checkOutDate } = booking;

      // Query the rooms for the specified room type
      const queryParams = {
        TableName: "rooms-db",
        KeyConditionExpression: "pk = :pk",
        FilterExpression: "available = :available",
        ExpressionAttributeValues: {
          ":pk": roomType,
          ":available": true,
        },
      };

      try {
        const { Items } = await db.query(queryParams);
        const availableRooms = Items;

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

        // Add booking details to the array without name and email
        bookingDetails.push({
          roomType,
          numberOfGuests,
          checkInDate,
          checkOutDate,
          totalPrice: bookingPrice,
        });
        // Add room details to be updated
        roomsToUpdate.push({ pk: room.pk, sk: room.sk });
      } catch (error) {
        console.error("Error querying room availability:", error);
        return sendError(500, { message: "Internal server error" });
      }
    }

    // Toggle availability for all rooms
    await Promise.all(
      roomsToUpdate.map(
        ({ pk, sk }) => toggleAvailability(pk, sk, false) // Mark rooms as unavailable
      )
    );

    // Store the entire order in the roomorders-db table
    const orderParams = {
      TableName: "roomorders-db",
      Item: {
        pk: orderId, // Use orderId as the primary key
        totalPrice,
        bookings: bookingDetails, // Store the details of each booking
        name, // Store name at the order level
        email, // Store email at the order level
        createdAt: new Date().toISOString(), // Optional: store creation timestamp
      },
    };

    try {
      await db.put(orderParams);
    } catch (error) {
      console.error("Error storing order in roomorders-db:", error);
      return sendError(500, { message: "Internal server error" });
    }

    // Respond with success message and order details
    return sendResponse(200, {
      message: "Rooms booked successfully",
      orderId, // Include the order ID
      totalPrice,
      bookings: bookingDetails, // Include booking details
    });
  } catch (error) {
    console.error("Error booking rooms:", error);
    return sendError(500, { message: "Internal server error" });
  }
};
