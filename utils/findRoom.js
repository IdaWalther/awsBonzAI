// utils/findRoom.js
const { db } = require("../services/index");

const findAvailableRoom = async (roomType) => {
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
      const error = new Error(
        `Room type ${roomType} is not available at the moment.`
      );
      error.statusCode = 404; // Add the status code to the error
      throw error;
    }

    // Return the first available room
    return availableRooms[0];
  } catch (error) {
    console.error("Error querying room availability:", error);
    throw error;
  }
};

module.exports = { findAvailableRoom };
