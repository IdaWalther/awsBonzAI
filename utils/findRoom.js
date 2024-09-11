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
      throw new Error(`Room type ${roomType} is not available at the moment.`);
    }

    // Return the first available room
    return availableRooms[0];
  } catch (error) {
    console.error("Error querying room availability:", error);
    throw new Error("Internal server error");
  }
};

module.exports = { findAvailableRoom };
