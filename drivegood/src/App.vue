<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { createAdmins } from "./external/admin-service";
import { useRoute, useRouter } from "vue-router"; // Added useRouter
import { cognitoCheckGroupAuth, Admin, Driver, Sponsor, cognitoFetchUser } from "./router/auth";
import profileImage from "./assets/profile.png";
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';

const route = useRoute();
const router = useRouter(); // Initialize router

const keepNav = ["/", "/login", "/about"];
const isAdmin = ref(false);
const isDriver = ref(false);
const isSponsor = ref(false);
const isLoading = ref(true); // Loading state
const username = ref("");

// Function to check user roles
const checkAuth = async () => {
  try {
    const [authResult, drivResult, sponRsult] = await Promise.all([
      cognitoCheckGroupAuth([Admin]),
      cognitoCheckGroupAuth([Driver]),
      cognitoCheckGroupAuth([Sponsor]),
    ]);

    isAdmin.value = authResult.isAuthorized;
    isDriver.value = drivResult.isAuthorized;
    isSponsor.value = sponRsult.isAuthorized;
  } catch (error) {
    console.error("Error checking user roles:", error);
  } finally {
    isLoading.value = false;
  }
};

async function getUsername() {
  try {
    const user = await getCurrentUser();
    if (user) {
      const session = await fetchAuthSession();
      const idTokenPayload = session.tokens?.idToken?.payload || {};
      username.value = String(idTokenPayload["cognito:username"] || "");
    }
  } catch (error) {
    console.error("Error fetching username:", error);
  }
}

// Call authentication check on mount
onMounted(() => {
  checkAuth();
  getUsername();
});

// Watch for route changes to refresh auth status dynamically
watch(route, checkAuth, { deep: true });
// Function to create admins
const handleCreateAdmins = async () => {
  await createAdmins();
  alert("Admins created successfully!");
};

const isDropdownVisible = ref(false);

const toggleDropdown = () => {
  isDropdownVisible.value = !isDropdownVisible.value;
};

const handleSignOut = async () => {
  try {
    await signOut();
    await router.push("/login"); // Redirect to login after logout
  } catch (error) {
    console.error("Error during sign-out:", error);
  }
};

async function handleUserSettings() {
  try {
    const user = await getCurrentUser();
    if (user) {
      const session = await fetchAuthSession();
      if (session) {
        window.location.href = "/settings";
      }
    }
  } catch (error) {
    console.error("Error fetching user settings:", error);
  }
}
</script>


<template>
  <div>
    <!-- Navigation bar with cart icon on the same line -->
    <nav v-if="keepNav.includes(route.path)" class="nav-container">
     
      <div class="nav-links">
        <router-link to="/">Home</router-link>
        <router-link to="/about">About Us</router-link>
        <router-link to="/login">Login</router-link>
      </div>
    </nav>

    <nav v-if="!keepNav.includes(route.path) && !isLoading" class="nav-container">
      <div class="nav-left">
        <!-- Cart icon with click handler to toggle dropdown -->
        <div class="user-info">
          <img :src="profileImage" alt="Profile" class="cart-icon" @click="toggleDropdown" />
          <span class="username"><b>{{ username }}</b></span>
        </div>
        <!-- Dropdown menu -->
        <div v-if="isDropdownVisible" class="dropdown-menu">
          <button @click="handleUserSettings" class="dropdown-item">Account Settings</button>
          <button @click="handleSignOut" class="dropdown-item">Log Out</button>
        </div>
      </div>
      <div class="nav-links">
        <router-link to="/dashboard">Dashboard</router-link>
        <router-link v-if="isSponsor" to="/applicationmanager">Applications</router-link>
        <router-link v-if="isSponsor || isAdmin" to="/create-user">Driver Manager</router-link>
        <router-link v-if="isSponsor || isAdmin" to="/manage-points">Points</router-link>
        <router-link v-if="isDriver" to="/points">Points</router-link> 
        <router-link v-if="!isSponsor && !isAdmin" to="/Application">Application</router-link> 
        <router-link v-if="isSponsor || isAdmin" to="/audit-log-report">Reports</router-link>
        <router-link v-if="isDriver" to="/order-history">Order History</router-link>
      </div>
    </nav>

    <router-view v-if="!isLoading"></router-view>
  </div>
</template>

<style scoped>

.nav-container {
  display: flex;
  align-items: center; 
  background: #2c3e50;
  padding: 10px 20px;
  justify-content: space-between; 
}


.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  color: white;
  font-size: 16px;
}

.cart-icon {
  width: 40px;
  height: 40px;
  cursor: pointer;
}
.nav-left {
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  width: 200px;
}


.dropdown-menu {
  position: absolute;
  top: 60px; 
  left: 0;
  background: #fff;
  border: 1px solid #ccc;
  padding: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.dropdown-item {
  background: #fff;
  border: none;
  padding: 10px;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f1f1f1;
}


.nav-links {
  display: flex;
  gap: 20px; 
  justify-content: center; 
  flex-grow: 1; 
  margin-right: 200px;
}
nav a {
  color: white;
  text-decoration: none;
  font-size: 20px;
}

nav a:hover {
  font-weight: bold;
}
</style>
