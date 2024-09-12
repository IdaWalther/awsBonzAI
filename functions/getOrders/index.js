const { db } = require('../../services/index.js');
const { sendResponse, sendError } = require('../../responses/index.js');

exports.handler = async (event) => {

    //Hämtar alla orders från roomorders-db
    try {
        const data = await db.scan({
            TableName: 'roomorders-db',
        })
        if (!data.Items || data.Items.length === 0) {
            return sendError(404, 'No orders found');
        }
        return sendResponse(200, data.Items);
    } catch (error) {
        return sendError(404, { message: error.message });
    }
};