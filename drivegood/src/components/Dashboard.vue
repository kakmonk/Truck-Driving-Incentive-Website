<script setup>
  import { Amplify } from 'aws-amplify';
  import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';
  import { ref, onMounted, watch, computed } from "vue";
  import { table, getRequest, postRequest } from '../external/api-requests';
  import dropdownImage from "../assets/dropdownLogo.png";
  import cartImage from "../assets/cart.png";


  // search variables
  const searchQ = ref("");
  const searchResults = ref([]);
  const page = ref(0);
  const limit = 10;
  const DynamoAPI = 'https://g5esy4pnad.execute-api.us-east-1.amazonaws.com/default/Team20DynamoInteract';
  const selectedDriverID = ref("");
  const driverPoints = ref([]);


  // sponsor settings
  const isSponsor = ref(false); // Placeholder for sponsorship logic
  const sponsorSettings = ref({ minPrice: 0, maxPrice: 1000 });
  const orgID = ref(null);
  const settingsLoaded = ref(false);
  const cartItems = ref([]);

const addToCart = (item) => {
  const foundItem = cartItems.value.find(cartItem => cartItem.trackId === item.trackId);
  if (foundItem) {
    foundItem.quantity++;
  } else {
    cartItems.value.push({ ...item, quantity: 1 });
  }

  // Save cart items to localStorage
  localStorage.setItem('cartItems', JSON.stringify(cartItems.value));
};

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



  const fetchUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const session = await fetchAuthSession();
        const payload = session.tokens.idToken.payload;

        if (payload['cognito:groups'] && Array.isArray(payload['cognito:groups'])) {
          isSponsor.value = payload['cognito:groups'].includes('Sponsor');
        }
        const userID = payload["sub"];
        console.log("Fetching OrgID for user:", userID);

        const tableToUse = isSponsor.value ? table.sponsors : table.drivers;
        const userData = await getRequest(tableToUse, userID);

        if (userData && userData.OrgID && userData.OrgID.N) {
          orgID.value = userData.OrgID.N;
          console.log("OrgID Retrieved from DB:", orgID.value);
          await fetchSponsorSettings(orgID.value);
        } else {
          console.error("OrgID not found in the database.");
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchSponsorSettings = async (orgID) => {
    try {
      const response = await fetch(`${DynamoAPI}?TableName=Team20_Organization&PartitionKey=id&PartitionValue=${orgID}`);
      const data = await response.json();
      console.log("API Response:", data);

      sponsorSettings.value = {
        minPrice: parseFloat(data.MinPrice.N),
        maxPrice: parseFloat(data.MaxPrice.N)
      };
      
    } catch (error) {
      console.error("Error fetching sponsor settings:", error);
    } finally {
      settingsLoaded.value = true;
    }
  };

  const updateSponsorSettings = async () => {
    if (!orgID.value) {
      console.error("Cannot update settings: OrgID is missing.");
      return;
    }

    try {
      const item = {
        id: { N: orgID.value.toString() },
        MinPrice: { N: sponsorSettings.value.minPrice.toString() },
        MaxPrice: { N: sponsorSettings.value.maxPrice.toString() }
      };
      const response = await fetch(DynamoAPI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          TableName: 'Team20_Organization',
          Item: item,
        }),
      });

      //const response = await postRequest(table.organizations, item);
      console.log("Settings updated:", await response.json());
    } catch (error) {
      console.error("Error updating sponsor settings:", error);
    }
  };

  const search = async () => {
    const offset = page.value * limit;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQ.value)}&limit=${limit}&offset=${offset}&explicit=N`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log("Fetched results:", data.results);

      searchResults.value = data.results
        .filter(item => item.trackPrice || item.collectionPrice)
        .map(item => {
          const price = item.trackPrice ?? item.collectionPrice ?? 0;
          return {
            ...item,
            priceInPoints: Math.round(price * 100),
          };
      });
      console.log("Filtered Results:", filteredResults.value);

    } catch (error) {
      console.error("Error fetching data", error);
      searchResults.value = [];
    }
  };

  const filteredResults = computed(() => {
    console.log("Applying filter with:", sponsorSettings.value.minPrice, sponsorSettings.value.maxPrice);
    return searchResults.value.filter(item =>
      item.priceInPoints >= sponsorSettings.value.minPrice * 100 &&
      item.priceInPoints <= sponsorSettings.value.maxPrice * 100
    );
  });

  const handleSearch = () => {
    page.value = 0;
    search();
  };

  watch(page, () => {
    search();
  });

  const nextPage = () => {
    page.value++;
  };

  const prevPage = () => {
    if (page.value > 0) {
      page.value--;
    }
  };



  const handleAccount = () => {
  };

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

  onMounted(async () => {
    await fetchUserRole();
    fetchDriverPoints();
    if (settingsLoaded.value) {
      search();
    }
  });
</script>

<template>
  <div v-if ="viewAsDriver" class="view-alert">
  <h2 class="alert alert-info">You are currently viewing as a <u>Driver</u></h2>
  <button class="action-button back-button" @click="handleViewSwap"><b>↩️ RESET VIEW</b></button>
  </div>
  <h1>iTunes Store</h1>
  <h1 v-if="!isSponsor">Total Points: {{ selectedDriverPoints }}</h1>

  <div class="dropdown">
    <button class="dropdown-btn">
  <img :src="dropdownImage" alt="Menu" style="width: 40px; height: 40px; border-radius: 50%;" />
  
  <div class="cart-container">
    <img 
      :src="cartImage" 
      alt="Cart" 
      style="width: 40px; height: 40px; border-radius: 50%; margin-left: 60mm;" 
      @click="$router.push('/cart')" 
    />
    <div class="cart-info">
      <p>Cart ({{ cartItems.length }})</p>
    </div>
  </div>

</button>
    <div class="dropdown-content">
      <button v-if="isSponsor" @click="handleViewSwap" class="view-swap-button">Toggle View</button> <!-- New button for view swap -->
    </div>
  </div>


  <!-- Sponsor Settings (Only Visible for Sponsors) -->
  <div v-if="(isSponsor) && (!viewAsDriver)" class="sponsor-controls">
    <h3>Set Price Range (USD)</h3>
    <label>
      Min Price:
      <input type="number" v-model="sponsorSettings.minPrice" step="0.01" />
    </label>
    <label>
      Max Price:
      <input type="number" v-model="sponsorSettings.maxPrice" step="0.01" />
    </label>
    <button @click="updateSponsorSettings" style="color: black;">Apply</button>
  </div>

  <div class="search-bar">
    <input v-model="searchQ" placeholder="Search song" />
    <button @click="handleSearch" style="color: black;">Search</button>
  </div>

  <div v-if="settingsLoaded && Array.isArray(searchResults) && searchResults.length">
    <h2><center>Results</center></h2>
    <div class="results-container">
      <ul v-if="searchResults.length">
        <li v-for="item in filteredResults" :key="item.trackId || item.collectionId" class="result-item">
          <img :src="item.artworkUrl100" alt="Artwork" />
          <div class="result-info">
            <p><strong>{{item.trackName || item.collectionName}}</strong></p>
            <p>Price: {{item.priceInPoints}} Points</p>
          </div>
          <div class="result-actions">
            <button @click="addToCart(item)">Add to cart</button> <!-- Add item to cart -->
          </div>
        </li>
      </ul>
    </div>
    <div class="pagination">
      <button @click="prevPage" :disabled="page === 0">Previous</button>
      <button @click="nextPage">Next</button>
    </div>
  </div>
</template>

<style scoped>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f2f6fc;
    color: #333;
    padding: 20px;
  }

  h1 {
    text-align: center;
    font-size: 2.5rem;
    color: #2c3e50;
    margin-bottom: 30px;
  }

  .logout-button, .account-button {
    background-color: #dc3545;
    color: white;
    padding: 10px 18px;
    font-size: 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    display: block;
    margin: 20px auto;
    text-decoration: none;
  }


    .logout-button:hover, .account-button:hover {
      background-color: #c82333;
    }

    .dropdown {
  position: absolute;
  top: 10px;
  right: 20px; 
}

 
.dropdown-btn {
  background-color: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  margin-top: 3mm;
}

.dropdown-btn:hover {
  background-color: transparent;
}

  
.dropdown-content {
  display: none;
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  z-index: 1000;
}

.dropdown:hover .dropdown-content {
  display: block;
}
.dropdown-content button {
  background-color: #007aff;
  color: white;
  padding: 10px 18px;
  width: 100%;
  margin-bottom: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.dropdown-content button:hover {
  background-color: #005ecb;
}
  .search-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-bottom: 30px;
  }

    .search-bar input {
      padding: 10px 15px;
      font-size: 16px;
      width: 300px;
      border: 1px solid #ccc;
      border-radius: 8px;
      transition: border-color 0.3s ease;
    }

      .search-bar input:focus {
        outline: none;
        border-color: #007aff;
      }

  button {
    padding: 10px 18px;
    font-size: 16px;
    background-color: #ffcc00;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

    button:hover {
      background-color: #005ecb;
    }

  .sponsor-controls {
    max-width: 400px;
    margin: 0 auto 30px;
    padding: 20px;
    background-color: #eaf0f6;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

    .sponsor-controls h3 {
      margin-bottom: 15px;
      font-weight: 600;
      color: #34495e;
    }

    .sponsor-controls label {
      display: block;
      margin-bottom: 10px;
    }

    .sponsor-controls input {
      padding: 8px;
      width: 100%;
      font-size: 15px;
      border: 1px solid #ccc;
      border-radius: 6px;
      margin-top: 4px;
    }

  .results-container {
    display: flex;
    flex-direction: column;
    max-width: 900px;
    margin: 0 auto;
  }

  .result-item {
    display: flex;
    align-items: center;
    background: white;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.06);
    width: 100%;
    margin-bottom: 20px;
    transition: transform 0.2s ease;
  }

    .result-item:hover {
      transform: translateY(-3px);
    }

    .result-item img {
      width: 100px;
      height: 100px;
      border-radius: 10px;
      object-fit: cover;
      margin-right: 20px;
    }

  .result-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

    .result-info p {
      margin: 4px 0;
      font-size: 16px;
    }

    .result-info strong {
      color: #2c3e50;
    }

  .result-actions {
    margin-left: auto;
  }

    .result-actions button {
      background-color: #28a745;
    }

      .result-actions button:hover {
        background-color: #1e7e34;
      }

  .pagination {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 30px 0;
  }

    .pagination button {
      padding: 10px 16px;
      font-size: 14px;
      border-radius: 6px;
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

  .cart-dropdown {
  position: absolute;
  top: 10px;
  right: 70px; 
}
.cart-container {
  position: absolute;
  top: 10px;
  right: 80px; 
  text-align: center;
}

.cart-info p {
  margin-top: 2px;
  margin-left: 60mm;
  font-size: 10px;
  color: #ffffff;
}

</style>
