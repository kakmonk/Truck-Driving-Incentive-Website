<template>
    <div v-if ="viewAsDriver" class="view-alert">
    <h2 class="alert alert-info">You are currently viewing as a <u>Driver</u></h2>
    <button class="action-button back-button" @click="handleViewSwap"><b>↩️ RESET VIEW</b></button>
    </div>
    <div class="checkout-container">
      <h2>Checkout</h2>
  
      <!-- If cart is empty -->
      <div v-if="cartItems.length === 0" class="empty-cart">
        <p>Your cart is empty.</p>
            </div>
        
            <!-- If cart has items -->
            <div v-else>
        <div v-for="item in cartItems" :key="item.trackId" class="checkout-item">
          <img :src="item.artworkUrl100" alt="Item Image" class="item-image" />
          <div class="item-details">
            <p><strong>{{ item.trackName || item.collectionName }}</strong></p>
            <p>Price: {{ item.priceInPoints }} Points</p>
            <p>Quantity: {{ item.quantity }}</p>
          </div>
        </div>
        
        <!-- Cart Summary -->
        <div class="checkout-summary">
          <p><strong>Total:</strong> {{ totalPoints }} Points</p>
        </div>
        
        <!-- Shipping Form (for drivers) -->
        <div class="shipping-details">
          <h3>Shipping/Details</h3>
          <label for="address">Shipping Address:</label>
          <input type="text" id="address" v-model="address" placeholder="Enter your shipping address" required />
          <label for="notes">Additional Notes:</label>
          <textarea id="notes" v-model="notes" placeholder="Enter any additional notes"></textarea>
        </div>
        
        <button @click="submitOrder" class="confirm-btn">Confirm Order</button>
            </div>
          </div>
        </template>
        
        <script setup>
        import { ref, watch } from 'vue';
        import { useRouter } from 'vue-router';
      import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';
      import { getRequest, postRequest, table } from "../external/api-requests";
      const selectedDriverID = ref("");
      const driverPoints = ref([]);
        

        // View as Driver functionality //
        const viewAsDriver = ref(localStorage.getItem('viewAsDriver') === 'true');
        const router = useRouter();

        watch(viewAsDriver, (newValue) => {
          localStorage.setItem('viewAsDriver', newValue);
        });

        function handleViewSwap() {
          viewAsDriver.value = !viewAsDriver.value;
          console.log("View swapped. Current view:", viewAsDriver.value ? "Driver" : "User");
        }

        const submitOrder = async () => {
          try {
            const authSession = await fetchAuthSession();
            console.log('Auth Session:', authSession);
            const userSub = authSession.userSub;
            selectedDriverID.value = authSession.userSub;
            const OrderID = `ORD-${Date.now()}`;
            const orderData = {
            OrderID: { S: OrderID },
             driverID: { S: selectedDriverID.value },
            address: { S: address.value },
            notes: { S: notes.value },
            items: { S: JSON.stringify(cartItems.value) },
        totalPoints: { N: String(totalPoints.value) }
};
;
           await postRequest(table.purchases, orderData);
         //  router.push({ name: 'OrderConfirmation', params: { orderId: OrderID } });
            ////alert(`Order submitted successfully! Order ID: ${OrderID}`);
            // Optionally clear the cart after order submission
           // localStorage.removeItem('cartItems');
            // Optionally redirect to a confirmation page
             router.push('/order-history');
           // console.log("Order submitted successfully:", response);
    
          } catch (error) {
            console.error("Error submitting order:", error);
          }
        };
  //////////////////////////////////

  // Cart items from localStorage or a shared state
  const cartItems = ref(JSON.parse(localStorage.getItem('cartItems') || '[]'));
  
  // Shipping details
  const address = ref('');
  const notes = ref('');
  
  
  // Calculate total points
  const totalPoints = ref(cartItems.value.reduce((total, item) => total + item.priceInPoints * item.quantity, 0));
  
  // Function for checkout confirmation
  const proceedToCheckout = () => {
    if (address.value.trim() === '') {
      alert('Please enter a shipping address');
      return;
    }
    
    alert(`Checkout successful! Shipping to: ${address.value}`);
    
    // Optionally clear the cart after checkout
    localStorage.removeItem('cartItems');
  };
  </script>
  
  <style scoped>
  .checkout-container {
    width: 80%;
    margin: auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 10px;
  }
  
  h2 {
    text-align: center;
  }
  
  .checkout-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 10px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  }
  
  .item-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    margin-right: 20px;
  }
  
  .item-details {
    flex-grow: 1;
  }
  
  .checkout-summary {
    margin-top: 20px;
    padding: 10px;
    background-color: #f1f1f1;
    border-radius: 8px;
  }
  
  .shipping-details {
    margin-top: 20px;
    padding: 10px;
    background-color: #eaf0f6;
    border-radius: 8px;
  }
  
  .shipping-details label {
    display: block;
    margin-bottom: 5px;
  }
  
  .shipping-details input,
  .shipping-details textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    margin-bottom: 10px;
  }
  
  .confirm-btn {
    background-color: #28a745;
    color: white;
    padding: 12px 20px;
    font-size: 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
  
  .confirm-btn:hover {
    background-color: #218838;
  }
  
  .empty-cart {
    text-align: center;
    padding: 20px;
    background-color: #f1f1f1;
    border-radius: 8px;
  }
  
.alert {
    margin-top: 20px;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
  }
  
  .alert-info {
    background-color: #edebd4;
    color: #575415;
    border: 1px solid #c3e6cb;
  }
  
  .alert-error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .action-button {
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    margin-right: 5px;
  }
  
  .back-button {
    background-color: #f8d7da;
    color: #721c24;
  }

  .view-alert {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    background-color: rgba(197, 219, 52, 0.15);
    color: #2980b9;
    padding: 12px 15px;
    margin: 19px auto;
    max-width: 800px;
    border-radius: 6px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    font-weight: 500;
  }
  </style>
  