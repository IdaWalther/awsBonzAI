# API Documentation - awsBonzai


Målet att skapa en applikation med funktioner som gör det möjligt att se alla tillgängliga rum, boka rum, se beställning som receptionist, ta bort hela order, ändra beställning samt uppdatera, hämta specifik beställning.

---

## Get all rooms (GET)  
 *Att hämta en lista över alla tillgängliga rum.*

  http://INVOKE-URL/rooms

  Detta **API-endpoint** returnerar en lista över alla rum som för närvarande är tillgängliga i systemet. Du får en översikt över rumstyper, deras tillgänglighet och andra relevanta detaljer.

---

## Book room (POST)  
 *Att boka ett eller flera rum.*

    http://INVOKE-URL/rooms

### Request Body (JSON)
  ```JSON
  {
  "name": "John Doe",
  "email": "john.doe@example.com",
  "bookings": [
    {
      "roomType": "singleroom",
      "numberOfGuests": 1,
      "checkInDate": "2024-10-01",
      "checkOutDate": "2024-10-05"
    },

    {
      "roomType": "singleroom",
      "numberOfGuests": 1,
      "checkInDate": "2024-10-01",
      "checkOutDate": "2024-10-05"
    }
    
  ]
  }
  ```

---

## Get specific order (GET) 
*Ange orderns ID för att hämta en specifik beställning.*

http://INVOKE-URL/orders/:id

Detta **API-endpoint** används för att hämta detaljerna för en specifik beställning. Du behöver ange **orderns ID** som en del av URL:en för att få information om den valda beställningen.

---

## Get all orders as an admin (GET) 
*Använd för att hämta alla beställningar.*

http://INVOKE-URL/orders/admin

---

## Delete an order (DELETE) 
*Ta bort en beställning med orderns ID.*

http://INVOKE-URL/orders/:id

Anropet används för att ta bort ett order från en specifik beställning. Det skickas som en DELETE-förfrågan och kräver att ett giltigt beställnings-**ID** (:id) inkluderas i URL.

**OBS!** Ersätt med beställningens **faktiska 'PK**'.
Vid **lyckad** borttagning returneras följande meddelande:

```json
{
  "data": {
    "success": true,
    "message": "Order cancelled successfully"
  }
}
```

Om ett **felaktigt PK** skickas, returneras ett felmeddelande, som indikerar att beställningen inte hittades:

```json
{
  "success": false,
  "data": {
    "success": false,
    "message": "Order not found"
  }
}
```

---

 ## Update an order (PUT) 
 *Uppdatera en beställning genom att ange ID. Du kan lägga till eller ta bort rum.*

http://INVOKE-URL/orders/:id

Använd PK för ordern som path parameter.  

För att ta bort ett rum från order, fyll i roomId, roomType samt sätt "delete" till true.

```JSON
{
  "bookings": [
    {
     "delete": true,                    
     "roomId": "1",
     "roomType": "singleroom"
    }             
  ]
}
```
 
För att **uppdatera ett eller flera befintliga rum** i orden följ mallen under. Ange **roomId** samt **roomType** för att specifiera vilket rum som ska uppdateras. Resterande attribut är valfria.  

"**name**" och "**email**" är valfritt och behöver inte anges om man inte vill uppdatera dom i ordern.

```JSON
{
    "name": "NAMN",
    "email": "EMAIL@EMAIL.COM",
    "bookings": [
        {
            "numberOfGuests": 1,
            "checkOutDate": "2024-10-02",
            "checkInDate": "2024-10-01",
            "roomId": "1",
            "roomType": "singleroom"
        }
    ]
}
```

För att **lägga till ett rum** i ordern, ange endast **roomType**, samt **numberOfGuests**, **checkInDate** och **checkOutDate**. Den kommer automatiskt känna av att rum id saknas och då lägga till ett nytt rum i ordern om ett rum i den typen finns ledig.

```JSON
{
    "bookings": [
        {
            "numberOfGuests": 1,
            "checkOutDate": "2024-10-02",
            "checkInDate": "2024-10-01",
            "roomType": "singleroom"
        }
    ]
}
```

Logiken för att uppdatera order loopar genom "bookings" arrayen, så det går att utföra flera olika operationer i samma request. 
