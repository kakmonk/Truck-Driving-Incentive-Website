<script>
import { getRequest, table } from "../external/api-requests";
import { ref, onMounted, computed } from "vue";
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { cognitoFetchUser, Sponsor } from "../router/auth";

export default {
  setup() {
    // Use only this driver ID
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


    onMounted(() => {
      console.log('Component is mounted!');
      fetchDriverPoints();
    });

    return {
      selectedDriverID,
      driverPoints,
      selectedDriverPoints,
    };
  },

  data() {
    return {
      pointsLog: [],
      selectedTab: "",
      selectedMonth: "",
      selectedReason: "",
      sortOrder: "desc",
    };
  },

  computed: {
    totalPoints() {
      return this.pointsLog.reduce((sum, log) => sum + log.points, 0);
    },
    uniqueMonths() {
      return [...new Set(this.pointsLog.map(log => log.date.substring(0, 7)))];
    },
    uniqueReasons() {
      return [...new Set(this.pointsLog.map(log => log.reason))];
    },
    sortedAndFilteredPointsLog() {
      let filteredLogs = this.pointsLog.filter(log =>
        (!this.selectedMonth || log.date.startsWith(this.selectedMonth)) &&
        (!this.selectedReason || log.reason === this.selectedReason)
      );
      return filteredLogs.sort((a, b) =>
        this.sortOrder === "asc" ? a.points - b.points : b.points - a.points
      );
    }
  }
};
</script>



<template>
  <div class="dashboard-container">
    <section class="hero">
      <div class="hero-overlay"></div>
    </section>

    <!-- Points Dashboard centered above the filters and log -->
    <div class="points-dashboard-container">
      <div class="hero-content">
        <h1>Points Dashboard</h1>
        <h1>Total Points: {{ selectedDriverPoints }}</h1>
      </div>
    </div>

    <!-- Filter & Sort and Points Log section -->
    <div class="main-content">
      <div class="filters-container">
        <h2>Filter & Sort</h2>
        <div class="dropdown-menu">
          <select v-model="selectedTab" class="dropdown">
            <option value="">Select a Filter or Sort</option>
            <optgroup label="Filter by Month">
              <option value="month">Filter by Month</option>
            </optgroup>
            <optgroup label="Filter by Reason">
              <option value="reason">Filter by Reason</option>
            </optgroup>
            <optgroup label="Sort">
              <option value="sort">Sort by Points</option>
            </optgroup>
          </select>
        </div>

        <div v-if="selectedTab" class="filter-options">
          <template v-if="selectedTab === 'month'">
            <select v-model="selectedMonth" class="dropdown">
              <option value="">All</option>
              <option v-for="month in uniqueMonths" :key="month" :value="month">{{ month }}</option>
            </select>
          </template>

          <template v-if="selectedTab === 'reason'">
            <select v-model="selectedReason" class="dropdown">
              <option value="">All</option>
              <option v-for="reason in uniqueReasons" :key="reason" :value="reason">{{ reason }}</option>
            </select>
          </template>

          <template v-if="selectedTab === 'sort'">
            <select v-model="sortOrder" class="dropdown">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </template>
        </div>
      </div>

      <div class="points-log-container">
        <h2>Points Log</h2>
        <table class="styled-table">
          <thead>
            <tr>
              <th>Points</th>
              <th>Reason</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in sortedAndFilteredPointsLog" :key="log.id">
              <td>{{ log.points }}</td>
              <td>{{ log.reason }}</td>
              <td>{{ log.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  font-family: Arial, sans-serif;
  color: #f0f0e4;
  text-align: center;
  position: relative;
}

.hero {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('../../public/trucks.jpg') no-repeat center center/cover;
  z-index: -1;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); 
}

.points-dashboard-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.hero-content {
  text-align: center;
}

.hero-content h1 {
  font-size: 3rem;
}

.hero-content p {
  font-size: 1.5rem;
  margin-top: 10px;
}

.main-content {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  gap: 20px;
}

.filters-container, .points-log-container {
  background: rgba(255, 255, 255, 0.9);
  color: black;
  padding: 20px;
  border-radius: 10px;
  width: 48%;
  height: auto;
}

.filters-container {
  flex: 1;
}

.points-log-container {
  flex: 1;
}

h2 {
  font-size: 2rem;
}

.dropdown-menu {
  margin-top: 20px;
}

.dropdown {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background-color: #ffffff;
  width: 100%;
  font-size: 1.1rem;
  margin-top: 10px;
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.styled-table th, .styled-table td {
  padding: 14px;
  text-align: left;
  font-size: 1.1rem;
  border-bottom: 1px solid #ddd;
}

.styled-table th {
  background-color: #ffcc00;
  color: black;
  font-weight: bold;
}

.styled-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.styled-table tr:hover {
  background-color: #ecf0f1;
}
</style>
