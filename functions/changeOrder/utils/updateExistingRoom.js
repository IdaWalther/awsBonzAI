const { validateNumberOfGuests } = require("../../../utils/checkGuests");
const { calculateBookingPrice } = require("../../../utils/calculatePrice");
const { checkDate } = require("../../../utils/validateDate");

//Util-funktion som uppdaterar gäster/pris i en bokning
async function updateExistingRoom(
  existingRoom,
  roomId,
  roomType,
  numberOfGuests,
  checkInDate,
  checkOutDate,
  db
) {

  //Hämtar rumspris från db
  const roomParams = {
    TableName: "rooms-db",
    Key: { pk: roomType, sk: roomId },
  };

  const roomResult = await db.get(roomParams);
  const roomPrice = roomResult.Item?.price;

  if (roomPrice === undefined) {
    throw {
      statusCode: 500,
      message: `Price for roomId ${roomId} not found.`,
    };
  }

  //Updaterar endast ifyllda fält 
  if (checkInDate !== undefined) {
    checkDate(checkInDate, existingRoom.checkOutDate);
    existingRoom.checkInDate = checkInDate;
  }

  if (checkOutDate !== undefined) {
    checkDate(existingRoom.checkInDate, checkOutDate);
    existingRoom.checkOutDate = checkOutDate;
  }

  if (checkInDate !== undefined && checkOutDate !== undefined) {
    checkDate(checkInDate, checkOutDate);
  }

  if (roomType !== undefined) {
    existingRoom.roomType = roomType;
  }

  //Kallar på util-funktion för att validera antalet gäster
  if (numberOfGuests !== undefined) {
    validateNumberOfGuests(roomType, numberOfGuests);
    existingRoom.numberOfGuests = numberOfGuests;
  }

  //Kallar på util-funktion för att beräkna pris om nya datum angetts
  if (checkInDate !== undefined || checkOutDate !== undefined) {
    existingRoom.totalPrice = calculateBookingPrice(
      roomPrice,
      existingRoom.checkInDate,
      existingRoom.checkOutDate
    );
  }
}

module.exports = { updateExistingRoom };
