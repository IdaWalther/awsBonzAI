const { db } = require("../../services/index");
const { sendResponse, sendError } = require("../../responses/index");
const { deleteRoomFromBooking } = require("./utils/deleteRoomFromBooking");
const { updateExistingRoom } = require("./utils/updateExistingRoom");
const { addNewRoom } = require("./utils/addNewRoom");

exports.handler = async (event) => {
  console.log("Received Event:", JSON.stringify(event, null, 2));

  try {
    // Loggar eventets pathParameters för felsökning
    console.log("event.pathParameters:", event.pathParameters);
    const bookingId = event.pathParameters && event.pathParameters.id;
    console.log("Extracted bookingId:", bookingId);

    // Parsar event.body om det är en sträng, annars använder det som det är
    const updateData =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    console.log("Extracted updateData:", updateData);

    // Kontrollerar om bookingId och updateData finns
    if (!bookingId || !updateData) {
      return sendError(400, "bookingId and updateData are required.");
    }

    // Hämta den befintliga ordern från DynamoDB
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

    // Går igenom varje bokning som ska uppdateras
    for (const updatedBooking of updateData.bookings) {
      const {
        roomId,
        roomType,
        numberOfGuests,
        checkInDate,
        checkOutDate,
        delete: deleteRoom,
      } = updatedBooking;

      try {
        if (deleteRoom && roomId && roomType) {
          // Om rummet ska tas bort, anropa funktionen för att ta bort rummet
          await deleteRoomFromBooking(roomId, roomType, updatedBookings);
          continue; // Hoppa över vidare bearbetning för detta rum
        }

        if (roomId) {
          // Om roomId finns, uppdatera ett befintligt rum
          const existingRoom = currentBookings.find((b) => b.roomId === roomId);
          if (!existingRoom) {
            return sendError(
              404,
              `Room with ID ${roomId} not found in existing bookings.`
            );
          }
          await updateExistingRoom(
            existingRoom,
            roomId,
            roomType,
            numberOfGuests,
            checkInDate,
            checkOutDate,
            db
          );
        } else {
          // Om inget roomId finns, lägg till ett nytt rum
          await addNewRoom(
            roomType,
            numberOfGuests,
            checkInDate,
            checkOutDate,
            updatedBookings
          );
        }
      } catch (error) {
        return sendError(400, error.message);
      }
    }

    // Beräkna det nya totala priset
    newTotalPrice = updatedBookings.reduce(
      (total, booking) => total + booking.totalPrice,
      0
    );

    // Uppdatera den befintliga ordern i DynamoDB
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
