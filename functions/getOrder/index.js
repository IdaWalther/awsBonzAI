const { db } = require('../../services/index.js');
const { sendResponse, sendError } = require('../../responses/index.js'); 

exports.handler = async (event) => {
    try {
        const orderNumber = event.pathParameters.id;
        const data = await db.get({
            TableName: 'roomorders-db',
            Key: {
                pk: orderNumber,
            }
        })
        if(!data.Item) {
            return sendError(404, 'No orders found');
        }
        return sendResponse(200, data.Item);
    } catch (error) {
        return sendError(404, {message: error.message});
    }
}