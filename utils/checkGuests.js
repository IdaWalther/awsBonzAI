/**
 * Validates the number of guests for a given room type.
 * @param {string} roomType - The type of the room (e.g., 'singleroom', 'doubleroom', 'suit').
 * @param {number} numberOfGuests - The number of guests to validate.
 * @throws {Object} - Throws an error with a message and status code if validation fails.
 * @throws {string} [error.message] - The error message if the validation fails.
 * @throws {number} [error.statusCode] - The HTTP status code associated with the error.
 */

const validateNumberOfGuests = (roomType, numberOfGuests) => {
  if (numberOfGuests <= 0) {
    const error = new Error("The number of guests must be greater than 0.");
    error.statusCode = 400; // Bad Request
    throw error;
  }

  //Validerar numret av gäster beroende på rum
  const maxGuests = {
    singleroom: 1,
    doubleroom: 2,
    suit: 3,
  };

  if (maxGuests[roomType] && numberOfGuests > maxGuests[roomType]) {
    const error = new Error(
      `Invalid number of guests for room type ${roomType}. Maximum allowed is ${maxGuests[roomType]}.`
    );
    error.statusCode = 400; // Bad Request
    throw error;
  }

  // No validation errors
};

module.exports = { validateNumberOfGuests };
