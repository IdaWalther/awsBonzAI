const { db } = require('../../services/index')
const { sendResponse, sendError } = require('../../responses/index')

exports.handler = async (event) => {
    try {
        const { Items } = await db.scan({
            TableName: 'rooms-db',
            FilterExpression: 'available = :available',
            ExpressionAttributeValues: {
                ':available': true
            }
        });
        if (Items && Items.length > 0) {
            return sendResponse(200, Items);
        } else {
            return sendError(404, { success: false, message: 'no rooms found!' })
        }
    } catch (error) {
        return sendError(404, { message: error.message });
    }

};


