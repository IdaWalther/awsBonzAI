

 **Get all rooms (GET)**  
  *http://INVOKE-URL/rooms*

 **Book room (POST)**  
  *http://INVOKE-URL/rooms*
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

  **Get specific order (GET)**  
*http://INVOKE-URL/orders/:id*

  **Get all orders as an admin (GET)**  
*http://INVOKE-URL/orders/admin*

  **Delete an order (DELETE)**  
*http://INVOKE-URL/orders/:id*

  **Update an order (PUT)**  
*http://INVOKE-URL/orders/:id*  
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
 
För att uppdatera ett eller flera befintliga rum i orden följ mallen under. Ange roomId samt roomType för att specifiera vilket rum som ska uppdateras. Resterande attribut är valfria.  

För att lägga till ett rum i ordern, ta bort "roomId". Den kommer automatisk söka upp ett ledigt rum från den angivna roomType. Ange alla attributs förutom roomId i bookings.

"name" och "email" är valfritt och behöver inte anges om man inte vill uppdatera dom i ordern.
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
