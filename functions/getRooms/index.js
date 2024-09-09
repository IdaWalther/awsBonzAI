const { db } = require('../../services/index')
const { sendResponse, sendError } = require('../../responses/index')

exports.handler = async (event) => {
    try {
        const { Items } = await db.scan({
            TableName: 'rooms-db',
            //   FilterExpression: 'attribute_exists(#DYNOBASE_event)',
            //   ExpressionAttributeNames: {
            //     '#DYNOBASE_event': 'artist'
            //   }
        });
        if (Items) {
            return sendResponse(200, Items);
        } else {
            return sendError(404, { success: false, message: 'no rooms found!' })
        }
    } catch (error) {
        return sendError(404, { message: error.message });
    }
};
