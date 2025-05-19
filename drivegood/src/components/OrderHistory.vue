<template>
    <div class="order-history-container">
      <header>
        <h1>Order History</h1>
      </header>
      <section v-if="orderHistory.length" class="order-list">
        <ul>
          <li v-for="order in orderHistory" :key="order.orderId" class="order-card">
            <div class="order-info">
              <p><strong>Order ID:</strong> {{ order.orderId }}</p>
              <p><strong>Address:</strong> {{ order.address }}</p>
              <p><strong>Notes:</strong> {{ order.notes }}</p>
              <p><strong>Total Points:</strong> {{ order.totalPoints }}</p>
            </div>
          </li>
        </ul>
      </section>
      <p v-else class="no-orders">Loading or no order history found.</p>
    </div>
  </template>
  
  <script>
  import { getRequest, table } from "../external/api-requests";
  import { ref, onMounted } from "vue";
  import { fetchAuthSession } from 'aws-amplify/auth';
  
  export default {
    setup() {
      const selectedDriverID = ref(""); 
      const orderHistory = ref([]); 
  
      const fetchOrderHistory = async () => {
        try {
          // Fetch all orders
          const response = await getRequest(table.purchases);
  
          // Fetch authenticated session details
          const authSession = await fetchAuthSession();
          selectedDriverID.value = authSession.userSub; 
  
          console.log("Authenticated Driver ID:", selectedDriverID.value); 
          console.log("All Orders Response:", response.Items); 
  
          orderHistory.value = response.Items
            .filter(item => {
              const driverID = item.driverID?.S || ''; 
              console.log("Comparing DriverID:", driverID, "with selectedDriverID:", selectedDriverID.value); // Log each comparison
  
              return driverID === selectedDriverID.value; 
            })
            .map(item => ({
              orderId: item.OrderID?.S || '',
              driverID: item.driverID?.S || '',
              address: item.address?.S || '',
              notes: item.notes?.S || '',
              items: item.items?.S || '',
              totalPoints: item.totalPoints?.N || '0',
            }));
  
          console.log("Filtered Order History:", orderHistory.value); 
        } catch (error) {
          console.error("Error fetching order history:", error);
        }
      };
  
      
      onMounted(() => {
        fetchOrderHistory();
      });
  
      return {
        orderHistory, 
      };
    },
  };
  </script>
  
  <style scoped>

  .order-history-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Arial', sans-serif;
    color: #333;
  }
  
  /* Header styling */
  header {
    text-align: center;
    margin-bottom: 20px;
  }
  
  h1 {
    font-size: 28px;
    color: #2C3E50;
    font-weight: bold;
  }
  

  .order-list ul {
    list-style-type: none;
    padding: 0;
  }
  
  .order-card {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease-in-out;
  }
  

  .order-card:hover {
    transform: translateY(-5px);
  }
  

  .order-info p {
    margin: 10px 0;
    font-size: 14px;
    line-height: 1.5;
  }
  

  .no-orders {
    text-align: center;
    color: #777;
    font-size: 16px;
    font-style: italic;
  }
  

  @media (max-width: 600px) {
    .order-history-container {
      padding: 10px;
    }
  
    h1 {
      font-size: 22px;
    }
  
    .order-card {
      padding: 15px;
    }
  
    .order-info p {
      font-size: 12px;
    }
  }
  </style>
  