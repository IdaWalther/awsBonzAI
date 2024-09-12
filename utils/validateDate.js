const checkDate = (checkInDate, checkOutDate) => {
    //Skapar ett reguljärt uttryck för att kontrollera att datumet är i rätt format YYYY-MM-DD
    //Kontrollera sedan att checkInDate och checkOutDate är i korrekt format
    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormat.test(checkInDate) || !dateFormat.test(checkOutDate)) {
        const error = new Error("The date is not in the correct form. Please write YYYY-MM-DD");
        error.statusCode = 400; 
        throw error;
    }

    //Kontrollera att checkInDate inte är efter checkOutDate
    if (checkInDate > checkOutDate) {
        const error = new Error("The check-out date can't be before the check-in date");
        error.statusCode = 400; 
        throw error;
    }
};

module.exports = { checkDate };