const { db } = require("../../services/index");
const { sendResponse, sendError } = require("../../responses/index");
const { v4: uuidv4 } = require("uuid"); // Importerar UUID
const { validateNumberOfGuests } = require("../../utils/checkGuests");
const { calculateBookingPrice } = require("../../utils/calculatePrice");
const { toggleAvailability } = require("../../utils/toggleAvailability");

exports.handler = async (event) => {
  try {
    //Omvandlar JSON-strängen till JS-objekt. 
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

    //Anger obligatoriska fält
    const requiredFields = [
      "roomType",
      "numberOfGuests",
      "checkInDate",
      "checkOutDate",
    ];

    //loopar igenom bokning/bokningar och kontrollerar obligatoriska fält
    for (const booking of bookings) {
      const bookingFields = Object.keys(booking);

      if (!requiredFields.every((field) => bookingFields.includes(field))) {
        return sendError(400, {
          error: `Missing required fields in booking: ${JSON.stringify(
            booking
          )}`,
        });
      }

      //Kontroll av att antalet fält i bokningsobjektet stämmer överens med obligatoriska fält
      if (bookingFields.length !== requiredFields.length) {
        return sendError(400, {
          error: `Extra fields found in booking: ${JSON.stringify(booking)}`,
        });
      }
    }

    //Ger ordern ett ID
    const orderId = uuidv4();

    // Bokningslogik
    let totalPrice = 0;
    const bookingDetails = []; //Lagrar detaljer om bokningen

    //loopar igenom bokning/bokningar 
    for (const booking of bookings) {
      const { roomType, numberOfGuests, checkInDate, checkOutDate } = booking;

      //Letar upp lediga rum utifrån roomType
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

        //Om inga lediga rum finns skickas felmeddelande
        if (!Array.isArray(availableRooms) || availableRooms.length === 0) {
          return sendError(400, {
            error: `Room type ${roomType} is not available at the moment.`,
          });
        }

        //Hitta första lediga rum av rätt typ
        const room = availableRooms[0];

        //Kallar på utility-funktionen för att validera antalet gäster för varje rum
        const guestValidationError = validateNumberOfGuests(
          room.pk,
          numberOfGuests
        );
        if (guestValidationError) {
          return sendError(400, guestValidationError);
        }

        //Kallar på utility-funktionen för att beräkna pris
        const bookingPrice = calculateBookingPrice(
          room.price,
          checkInDate,
          checkOutDate
        );
        totalPrice += bookingPrice;

        //Lägg in bokningsdetaljerna i en array utan namn och e-mail
        bookingDetails.push({
          roomId: room.sk,
          roomType,
          numberOfGuests,
          checkInDate,
          checkOutDate,
          totalPrice: bookingPrice,
        });

        //Kallar på utility-funktionen för att ändra rum till available: false 
        await toggleAvailability(room.pk, room.sk, false);
      } catch (error) {
        console.error("Error querying room availability:", error);
        return sendError(500, { message: "Internal server error" });
      }
    }

    //Lägger in ordern i roomorders-db
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
      await db.put(orderParams);
    } catch (error) {
      console.error("Error storing order in roomorders-db:", error);
      return sendError(500, { message: "Internal server error" });
    }

    //Skickar svar om att bokning genomförts samt detaljer om bokningen
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
