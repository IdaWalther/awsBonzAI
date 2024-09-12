// handlers/bookRoom.js
const { db } = require("../../services/index");
const { sendResponse, sendError } = require("../../responses/index");
const { v4: uuidv4 } = require("uuid");
const { validateNumberOfGuests } = require("../../utils/checkGuests");
const { calculateBookingPrice } = require("../../utils/calculatePrice");
const { toggleAvailability } = require("../../utils/toggleAvailability");
const { findAvailableRoom } = require("../../utils/findRoom");

exports.handler = async (event) => {
  try {
    // Parsar förfrågningskroppen och kontrollerar för ogiltiga fält
    const { bookings, name, email } = JSON.parse(event.body);

    // Kontrollera att "bookings" är en icke-tom array
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return sendError(400, {
        error: 'Invalid request body. "bookings" must be a non-empty array.',
      });
    }

    // Kontrollera att "name" och "email" finns
    if (!name || !email) {
      return sendError(400, {
        error: "Name and email are required at the order level.",
      });
    }

    // Validerar förfrågningskroppen för nödvändiga fält
    const requiredFields = [
      "roomType",
      "numberOfGuests",
      "checkInDate",
      "checkOutDate",
    ];

    for (const booking of bookings) {
      const bookingFields = Object.keys(booking);

      // Kontrollera efter saknade fält
      const missingFields = requiredFields.filter(
        (field) => !bookingFields.includes(field)
      );
      if (missingFields.length > 0) {
        return sendError(400, {
          error: `Missing required fields in booking. ${missingFields.join(
            ", "
          )} must be provided`,
        });
      }

      // Kontrollera efter extra fält
      const extraFields = bookingFields.filter(
        (field) => !requiredFields.includes(field)
      );
      if (extraFields.length > 0) {
        return sendError(400, {
          error: `Extra fields found in booking. Only ${requiredFields.join(
            ", "
          )} are allowed`,
        });
      }
    }

    // Generera ett unikt ID för hela bokningen
    const orderId = uuidv4();

    // Bokningslogik
    let totalPrice = 0;
    const bookingDetails = [];

    for (const booking of bookings) {
      const { roomType, numberOfGuests, checkInDate, checkOutDate } = booking;

      try {
        // Hitta ett tillgängligt rum av specifik typ
        const room = await findAvailableRoom(roomType);

        // Validera antalet gäster för rummet
        const guestValidationError = validateNumberOfGuests(
          room.pk,
          numberOfGuests
        );
        if (guestValidationError) {
          return sendError(400, guestValidationError);
        }

        // Beräkna bokningspriset baserat på rumspriset och datumen
        const bookingPrice = calculateBookingPrice(
          room.price,
          checkInDate,
          checkOutDate
        );
        totalPrice += bookingPrice;

        // Lägger till bokningsdetaljer
        bookingDetails.push({
          roomId: room.sk,
          roomType,
          numberOfGuests,
          checkInDate,
          checkOutDate,
          totalPrice: bookingPrice,
        });

        // Uppdaterar rumstillgänglighet till otillgänglig
        await toggleAvailability(room.pk, room.sk, false);
      } catch (error) {
        console.error("Error processing booking:", error);
        if (error.statusCode) {
          return sendError(error.statusCode, error.message);
        } else {
          return sendError(500, { message: "Internal server error" });
        }
      }
    }

    // Skapa orderobjekt för att lagra i databasen
    const orderParams = {
      TableName: "roomorders-db",
      Item: {
        pk: orderId,
        totalPrice,
        bookings: bookingDetails,
        name,
        email,
        createdAt: new Date().toISOString(),
      },
    };

    try {
      // Spara ordern i databasen
      await db.put(orderParams);
    } catch (error) {
      console.error("Error storing order in roomorders-db:", error);
      return sendError(500, { message: "Internal server error" });
    }

    // Returnera framgångsmeddelande
    return sendResponse(200, {
      message: "Rooms booked successfully",
      orderId,
      totalPrice,
      bookings: bookingDetails,
    });
  } catch (error) {
    console.error("Error booking rooms:", error);
    return sendError(500, { message: "Internal server error" });
  }
};
