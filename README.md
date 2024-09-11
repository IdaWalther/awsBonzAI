

- **Get all rooms (GET)**  
  *http://INVOKE-URL/rooms*

- **Book room (POST)**  
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

- **Get specific order (GET)**  
*http://INVOKE-URL/orders/:id*

- **Get all orders as an admin (GET)**  
*http://INVOKE-URL/orders/admin*

- **Delete an order (DELETE)**  
*http://INVOKE-URL/orders/:id*

- **Update an order (PUT)**  
*http://INVOKE-URL/orders/:id*
