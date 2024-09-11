const { db } = require("../services/index");
/**
 * Toggles the "available" status of rooms in DynamoDB.
 * @param {string} pk - The primary key of the room (e.g., room type).
 * @param {string} sk - The sort key of the room (e.g., room identifier).
 * @param {boolean} available - The new availability status to set (true or false).
 * @returns {Promise<Object>} - The result of the DynamoDB update operation.
 */
const toggleAvailability = async (pk, sk, available) => {
  const updateParams = {
    TableName: "rooms-db",
    Key: {
      pk: pk,
      sk: sk,
    },
    UpdateExpression: "SET available = :available",
    ExpressionAttributeValues: {
      ":available": available,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const result = await db.update(updateParams);
    return result;
  } catch (error) {
    console.error("Error toggling room availability:", error);
    throw new Error("Error updating room availability");
  }
};

module.exports = { toggleAvailability };
