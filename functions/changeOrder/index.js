const { db } = require("../../services/index");
const { sendResponse, sendError } = require("../../responses/index");
const { deleteRoomFromBooking } = require("./utils/deleteRoomFromBooking");
const { updateExistingRoom } = require("./utils/updateExistingRoom");
const { addNewRoom } = require("./utils/addNewRoom");
const { checkDate } = require("../../utils/validateDate");

exports.handler = async (event) => {
  console.log("Received Event:", JSON.stringify(event, null, 2));

  try {
    console.log("event.pathParameters:", event.pathParameters);
    const bookingId = event.pathParameters && event.pathParameters.id;
    console.log("Extracted bookingId:", bookingId);

    // Extraherar uppdateringsdata från begäran
    const updateData =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    console.log("Extracted updateData:", updateData);

    // Kontrollera om bookingId eller updateData saknas
    if (!bookingId || !updateData) {
      console.error("bookingId or updateData missing");
      return sendError(400, "bookingId and updateData are required.");
    }

    // Hämta befintlig order från databasen med hjälp av bookingId
    const getParams = { TableName: "roomorders-db", Key: { pk: bookingId } };
    console.log("Fetching existing order with params:", getParams);

    const existingOrder = await db.get(getParams);
    console.log("Fetched existing order:", existingOrder);

    // Kontrollera om ordern inte finns
    if (!existingOrder.Item) {
      console.error("Order not found for bookingId:", bookingId);
      return sendError(404, "Order not found.");
    }

    const currentBookings = existingOrder.Item.bookings || [];
    let updatedBookings = [...currentBookings];
    let newTotalPrice = 0;

    // Iterera genom varje uppdatering av bokning
    for (const updatedBooking of updateData.bookings) {
      const {
        roomId,
        roomType,
        numberOfGuests,
        checkInDate,
        checkOutDate,
        delete: deleteRoom,
      } = updatedBooking;
      console.log("Processing booking:", updatedBooking);

      try {
        // Kontrollera att checkInDate och checkOutDate är i korrekt format
        checkDate(checkInDate, checkOutDate);

        // Ta bort rum om "deleteRoom" är satt och rumsuppgifter finns
        if (deleteRoom && roomId && roomType) {
          console.log("Deleting room with ID:", roomId);
          await deleteRoomFromBooking(roomId, roomType, updatedBookings);
          console.log("Room deleted successfully");
          continue;
        }

        // Uppdatera befintligt rum om roomId finns
        if (roomId) {
          console.log("Updating existing room with ID:", roomId);
          const existingRoom = currentBookings.find((b) => b.roomId === roomId);
          if (!existingRoom) {
            console.error(
              "Room with ID not found in existing bookings:",
              roomId
            );
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
          // Lägg till ett nytt rum om roomId inte finns
          console.log("Adding new room of type:", roomType);
          await addNewRoom(
            roomType,
            numberOfGuests,
            checkInDate,
            checkOutDate,
            updatedBookings
          );
        }
      } catch (error) {
        console.error("Error processing booking:", error);
        if (error.statusCode) {
          return sendError(error.statusCode, error.message);
        }
        return sendError(400, error.message);
      }
    }

    // Beräkna nytt totalpris för alla bokningar
    newTotalPrice = updatedBookings.reduce(
      (total, booking) => total + booking.totalPrice,
      0
    );
    console.log("Calculated new total price:", newTotalPrice);

    // Uppdatera ordern i databasen med de nya uppgifterna
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

    console.log("Updating order with params:", updateParams);
    const updatedOrder = await db.update(updateParams);
    console.log("Order updated successfully:", updatedOrder);

    // Returnera svar med uppdaterad orderinformation
    return sendResponse(200, {
      message: "Order updated successfully",
      updatedOrder: updatedOrder.Attributes,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return sendError(500, "Failed to update order", error.message);
  }
};
