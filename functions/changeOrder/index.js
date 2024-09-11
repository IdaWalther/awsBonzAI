const { db } = require("../../services/index");
const { sendResponse, sendError } = require("../../responses/index");
const { validateNumberOfGuests } = require("../../utils/checkGuests");
const { calculateBookingPrice } = require("../../utils/calculatePrice");
const { toggleAvailability } = require("../../utils/toggleAvailability");
const { findAvailableRoom } = require("../../utils/findRoom");

exports.handler = async (event) => {
  console.log("Received Event:", JSON.stringify(event, null, 2));

  try {
    console.log("event.pathParameters:", event.pathParameters);
    const bookingId = event.pathParameters && event.pathParameters.id;
    console.log("Extracted bookingId:", bookingId);

    const updateData =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    console.log("Extracted updateData:", updateData);

    if (!bookingId || !updateData) {
      return sendError(400, "bookingId and updateData are required.");
    }

    const getParams = {
      TableName: "roomorders-db",
      Key: { pk: bookingId },
    };

    const existingOrder = await db.get(getParams);
    if (!existingOrder.Item) {
      return sendError(404, "Order not found.");
    }

    const currentBookings = existingOrder.Item.bookings || [];
    let updatedBookings = [...currentBookings];
    let newTotalPrice = 0;

    for (const updatedBooking of updateData.bookings) {
      const {
        roomId,
        roomType,
        numberOfGuests,
        checkInDate,
        checkOutDate,
        delete: deleteRoom,
      } = updatedBooking;

      if (deleteRoom && roomId && roomType) {
        // Room deletion logic
        const roomIndex = updatedBookings.findIndex(
          (b) => b.roomId === roomId && b.roomType === roomType
        );
        if (roomIndex !== -1) {
          // Remove room from updatedBookings
          updatedBookings.splice(roomIndex, 1);

          // Toggle room availability back to true
          await toggleAvailability(roomType, roomId, true);
        } else {
          return sendError(
            404,
            `Room with ID ${roomId} not found in existing bookings.`
          );
        }
        continue; // Skip further processing for this room as it's deleted
      }

      if (roomId) {
        // Existing room: Validate and update
        const existingRoom = currentBookings.find((b) => b.roomId === roomId);
        if (existingRoom) {
          const guestValidationError = validateNumberOfGuests(
            roomType,
            numberOfGuests
          );
          if (guestValidationError) {
            return sendError(400, guestValidationError);
          }

          // Fetch the price of the room from the database
          const roomParams = {
            TableName: "rooms-db", // Adjust this if your room table has a different name
            Key: { pk: roomType, sk: roomId },
          };
          const roomResult = await db.get(roomParams);
          const roomPrice = roomResult.Item?.price;
          if (roomPrice === undefined) {
            return sendError(404, `Price for roomId ${roomId} not found.`);
          }

          // Update existing booking
          Object.assign(existingRoom, {
            numberOfGuests,
            checkInDate,
            checkOutDate,
            roomType,
            totalPrice: calculateBookingPrice(
              roomPrice,
              checkInDate,
              checkOutDate
            ),
          });
        } else {
          return sendError(
            404,
            `Room with ID ${roomId} not found in existing bookings.`
          );
        }
      } else {
        // New room: Find and add
        const room = await findAvailableRoom(roomType, numberOfGuests);
        if (!room) {
          return sendError(
            400,
            `No available room found for type ${roomType}.`
          );
        }
        const guestValidationError = validateNumberOfGuests(
          roomType,
          numberOfGuests
        );
        if (guestValidationError) {
          return sendError(400, guestValidationError);
        }
        const bookingPrice = calculateBookingPrice(
          room.price,
          checkInDate,
          checkOutDate
        );

        updatedBookings.push({
          roomId: room.sk,
          roomType,
          numberOfGuests,
          checkInDate,
          checkOutDate,
          totalPrice: bookingPrice,
        });

        await toggleAvailability(room.pk, room.sk, false);
      }
    }

    // Recalculate total price
    newTotalPrice = updatedBookings.reduce(
      (total, booking) => total + booking.totalPrice,
      0
    );

    const updateParams = {
      TableName: "roomorders-db",
      Key: { pk: bookingId },
      UpdateExpression:
        "SET #name = :name, #email = :email, #bookings = :bookings, #totalPrice = :totalPrice",
      ExpressionAttributeNames: {
        "#name": "name",
        "#email": "email",
        "#bookings": "bookings",
        "#totalPrice": "totalPrice",
      },
      ExpressionAttributeValues: {
        ":name": updateData.name || existingOrder.Item.name,
        ":email": updateData.email || existingOrder.Item.email,
        ":bookings": updatedBookings,
        ":totalPrice": newTotalPrice,
      },
      ReturnValues: "ALL_NEW",
    };

    const updatedOrder = await db.update(updateParams);

    return sendResponse(200, {
      message: "Order updated successfully",
      updatedOrder: updatedOrder.Attributes,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return sendError(500, "Failed to update order", error.message);
  }
};
