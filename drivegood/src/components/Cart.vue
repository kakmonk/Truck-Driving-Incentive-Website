<template>
  <div v-if ="viewAsDriver" class="view-alert">
  <h2 class="alert alert-info">You are currently viewing as a <u>Driver</u></h2>
  <button class="action-button back-button" @click="handleViewSwap"><b>↩️ RESET VIEW</b></button>
  </div>
  <div class="cart-container">
    <h2>Your Cart</h2>
    <h2 style="text-align: center;">Points Available to Spend: {{ selectedDriverPoints }}</h2>
    
    <!-- If cart is empty -->
    <div v-if="cartItems.length === 0" class="empty-cart">
      <p>Your cart is empty.</p>
    </div>

    <!-- If cart has items -->
    <div v-else>
      <div v-for="item in cartItems" :key="item.trackId" class="cart-item">
        <img :src="item.artworkUrl100" alt="Item Image" class="item-image" />
        <div class="item-details">
          <p><strong>{{ item.trackName || item.collectionName }}</strong></p>
          <p>Price: {{ item.priceInPoints }} Points</p>
          <div class="quantity-controls">
            <button @click="decreaseQuantity(item)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="increaseQuantity(item)">+</button>
          </div>
          <button @click="removeItem(item)" class="remove-btn">Remove</button>
        </div>
      </div>
      <!-- Cart Total -->
      <div class="cart-total">
        <p><strong>Total:</strong> {{ totalPoints }} Points</p>
        <button 
          @click="proceedToCheckout" 
          class="checkout-btn" 
          :disabled="selectedDriverPoints < totalPoints"
        >
          Proceed to Checkout
        </button>
      <p v-if="selectedDriverPoints < totalPoints" class="alert alert-error">
        You don't have enough points to complete the transaction.
      </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed} from "vue";
import { useRouter } from 'vue-router';
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { getRequest, table } from "../external/api-requests";

// Gets the correct driverID and also determines the drivers points.

const selectedDriverID = ref("");
    const driverPoints = ref([]);

    const fetchDriverPoints = async () => {
      try {
        const response = await getRequest(table.drivers);
        const authSession = await fetchAuthSession();
        console.log('Auth Session:', authSession);
        const userSub = authSession.userSub;
        selectedDriverID.value = authSession.userSub;
        
        console.log('User Sub:', userSub);
        const filteredDriver = response.Items
          .filter(item => item.DriverID?.S === selectedDriverID.value)
          .map(item => ({
            driverID: item.DriverID?.S,
            orgId: item.OrgID?.S || '',
            points: item.Points?.N || '0',
            sentence: item.Sentence?.S || '',
            source: item.Source?.S || '',
          }));

        driverPoints.value = filteredDriver;
        console.log("Filtered driver points:", driverPoints.value);
      } catch (error) {
        console.error("Error fetching driver points:", error);
      }
    };

    const selectedDriverPoints = computed(() => {
      const driver = driverPoints.value[0]; // only one driver
      return driver ? driver.points : 0;
    });

  // View as Driver functionality //
const viewAsDriver = ref(localStorage.getItem('viewAsDriver') === 'true');

watch(viewAsDriver, (newValue) => {
  localStorage.setItem('viewAsDriver', newValue);
});

function handleViewSwap() {
  viewAsDriver.value = !viewAsDriver.value;
  console.log("View swapped. Current view:", viewAsDriver.value ? "Driver" : "User");
}
  //////////////////////////////////

// Getting router instance
const router = useRouter();

// Get cart items from localStorage
const cartItems = ref(JSON.parse(localStorage.getItem('cartItems')) || []);

// Update localStorage when cartItems changes
const updateCartInLocalStorage = () => {
  localStorage.setItem('cartItems', JSON.stringify(cartItems.value));
};

// Add item to the cart
const addToCart = (item) => {
  const foundItem = cartItems.value.find(cartItem => cartItem.trackId === item.trackId);
  if (foundItem) {
    foundItem.quantity++;
  } else {
    cartItems.value.push({ ...item, quantity: 1 });
  }
  updateCartInLocalStorage(); // Update localStorage whenever the cart changes
};

// Handle quantity increase and decrease
const increaseQuantity = (item) => {
  item.quantity++;
  updateCartInLocalStorage();
};

const decreaseQuantity = (item) => {
  if (item.quantity > 1) {
    item.quantity--;
    updateCartInLocalStorage();
  }
};

const removeItem = (item) => {
  const index = cartItems.value.indexOf(item);
  if (index !== -1) {
    cartItems.value.splice(index, 1);
    updateCartInLocalStorage();
  }
};

const totalPoints = ref(cartItems.value.reduce((total, item) => total + item.priceInPoints * item.quantity, 0));

onMounted(() => {
  totalPoints.value = cartItems.value.reduce((total, item) => total + item.priceInPoints * item.quantity, 0);
  console.log('Component is mounted!');
      fetchDriverPoints();
});

// Navigate to checkout
const proceedToCheckout = () => {
  if (cartItems.value.length === 0) {
    alert("Your cart is empty. Add items to your cart before proceeding.");
    return;
  }

  // Navigate to the checkout page
  router.push('/checkout');
};
</script>

<style scoped>
/* Cart styles */
.cart-container {
  width: 80%;
  margin: auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
}

h2 {
  text-align: center;
}

.cart-item {
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

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

button {
  padding: 8px 15px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #005ecb;
}

.remove-btn {
  background-color: #dc3545;
}

.remove-btn:hover {
  background-color: #c82333;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #f1f1f1;
  border-radius: 8px;
  margin-top: 20px;
}

.checkout-btn {
  background-color: #28a745;
}

.checkout-btn:hover {
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
