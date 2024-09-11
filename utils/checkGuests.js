/**
 * Validates the number of guests for a given room type.
 * @param {string} roomType - The type of the room (e.g., 'singleroom', 'doubleroom', 'suit').
 * @param {number} numberOfGuests - The number of guests to validate.
 * @returns {Object|null} - Returns an error object if validation fails or null if validation passes.
 * @returns {string} [error] - The error message if the validation fails.
 */
const validateNumberOfGuests = (roomType, numberOfGuests) => {
  if (numberOfGuests <= 0) {
    return { error: "The number of guests must be greater than 0." };
  }

  //Validerar numret av gäster beroende på rum
  const maxGuests = {
    singleroom: 1,
    doubleroom: 2,
    suit: 3,
  };

  if (maxGuests[roomType] && numberOfGuests > maxGuests[roomType]) {
    return {
      error: `Invalid number of guests for room type ${roomType}. Maximum allowed is ${maxGuests[roomType]}.`,
    };
  }

  return null;
};

module.exports = { validateNumberOfGuests };
