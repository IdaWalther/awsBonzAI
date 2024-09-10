const { db } = require('../../services/index');
const { sendResponse, sendError } = require('../../responses/index');

exports.handler = async (event) => {
    // Hämta 'pk' z pathParameters
    const { id } = event.pathParameters;

    // Kolla upp om 'id' (pk) har levererats
    if (!id) {
        return sendError(400, { success: false, message: 'Missing order ID' });
    }

    try {
        // Valfri kontroll för att beställningen finns
        const { Item } = await db.get({
            TableName: 'roomorders-db',
            Key: { pk: id }
        });

        if (!Item) {
            return sendError(404, { success: false, message: 'Order not found' });
        }

        // Ta bort orders
        await db.delete({
            TableName: 'roomorders-db',
            Key: { pk: id }
        });

        return sendResponse(200, { success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error:', error);
        return sendError(500, { success: false, message: error.message });
    }

};
