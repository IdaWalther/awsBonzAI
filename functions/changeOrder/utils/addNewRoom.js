const { findAvailableRoom } = require("../../../utils/findRoom");
const { validateNumberOfGuests } = require("../../../utils/checkGuests");
const { calculateBookingPrice } = require("../../../utils/calculatePrice");
const { toggleAvailability } = require("../../../utils/toggleAvailability");
const { checkDate } = require("../../../utils/validateDate");

//Util-funktion som lägger till rum i bokning
async function addNewRoom(
  roomType,
  numberOfGuests,
  checkInDate,
  checkOutDate,
  updatedBookings
) {
  // Kontrollera att checkInDate och checkOutDate är i korrekt format
  checkDate(checkInDate, checkOutDate);
  // Kontroll av nödvändiga fält
  if (!roomType || !numberOfGuests || !checkInDate || !checkOutDate) {
    throw {
      statusCode: 400,
      message:
        "Missing required fields: roomType, numberOfGuests, checkInDate, and checkOutDate are all required to add a new room.",
    };
  }

  //Kallar på util-funktion som hittar ledigt rum
  const room = await findAvailableRoom(roomType);

  //Kallar på util-funktion för att validera antalet gäster
  validateNumberOfGuests(roomType, numberOfGuests);

  //Kallar på util-funktion för att beräkna pris
  const bookingPrice = calculateBookingPrice(
    room.price,
    checkInDate,
    checkOutDate
  );

  //uppdaterar bokningen
  updatedBookings.push({
    roomId: room.sk,
    roomType,
    numberOfGuests,
    checkInDate,
    checkOutDate,
    totalPrice: bookingPrice,
  });

  //Kallar på util-funktion för att ändra tillgänglighet på rum
  await toggleAvailability(room.pk, room.sk, false);
}

module.exports = { addNewRoom };
