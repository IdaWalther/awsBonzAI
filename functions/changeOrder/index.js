const { db } = require('../../services/index.js');
const { sendResponse, sendError } = require('../../responses/index.js');
const { validateNumberOfGuests } = require('../../utils/checkGuests');

exports.handler = async (event) => {
    try {
        // Hämta ordernummer från URL:ens path parameters
        const orderNumber = event.pathParameters.id;

        // Hämta orderdata från databasen
        const data = await db.get({
            TableName: 'roomorders-db',
            Key: {
                pk: orderNumber,
            }
        });

        // Kontrollera om ordern existerar
        if (!data.Item) {
            return sendError(404, 'No orders found');
        }

        // Hämta uppdateringsdata från request body
        const updateData = JSON.parse(event.body);
        const { roomId, numberOfGuests } = updateData;

        if (!roomId || !numberOfGuests) {
            return sendError(400, 'roomId and numberOfGuests are required');
        }

        // Hitta rätt bokning i `bookings` arrayen
        const bookingToUpdate = data.Item.bookings.find(booking => booking.roomId === roomId);
        if (!bookingToUpdate) {
            return sendError(400, `Booking with roomId ${roomId} not found.`);
        }

        // Validera antal gäster med validateNumberOfGuests-funktionen
        const validationError = validateNumberOfGuests(bookingToUpdate.roomType, numberOfGuests);

        // Om valideringen misslyckas, returnera ett fel
        if (validationError) {
            return sendError(400, validationError.error);
        }

        // Hitta rätt bokning i `bookings` arrayen
        let updatedBookings = data.Item.bookings.map(booking => {
            if (booking.roomId === roomId) {
                // Uppdatera antal gäster för rätt bokning
                return {
                    ...booking,
                    numberOfGuests: numberOfGuests
                };
            }
            return booking; // Returnera andra bokningar oförändrade
        });

        const updateParams = {
            TableName: 'roomorders-db',
            Key: {
                pk: orderNumber,
            },
            UpdateExpression: 'set #bookings = :bookings',
            ExpressionAttributeNames: {
                '#bookings': 'bookings',
            },
            ExpressionAttributeValues: {
                ':bookings': updatedBookings,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        // Uppdatera posten i databasen
        const updatedData = await db.update(updateParams);

        // Skicka en framgångsresponse med den uppdaterade posten
        return sendResponse(200, updatedData.Attributes);
    } catch (error) {
        // Hantera fel och skicka en felrespons
        return sendError(500, { message: error.message });
    }
};