<template>
  <div class="dashboard-container">
    <section class="hero">
      <div class="hero-overlay"></div>
    </section>


    <div class="points-dashboard-container">
      <div class="hero-content">
        <h1> Manage Drivers Incentives</h1>
        <p class="total-points" style="font-size: 3rem;">Total Points: {{ totalPoints }}</p>
      </div>
    </div>


    <div class="main-content">
      <div class="add-points-container">
        <h2>Update Points</h2>
        <label>Driver:
          <input v-model="newEntry.driver" placeholder="Enter driver name" />
        </label>
        <label>Points:
          <input v-model.number="newEntry.points" type="number" placeholder="Enter points" />
        </label>
        <label>Reason:
          <input v-model="newEntry.reason" placeholder="Enter reason" />
        </label>
        <button @click="addPoints">Add Points</button>
      </div>

      <div class="points-log-container">
        <h2>Points Log</h2>
        <table class="styled-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Points</th>
              <th>Reason</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredPointsLog" :key="log.id">
              <td>{{ log.driver }}</td>
              <td :style="{'color': log.points < 0 ? 'red' : 'green'}">{{ log.points }}</td>
              <td>{{ log.reason }}</td>
              <td>{{ log.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { getRequest, table, postRequest } from "../external/api-requests"; 
import { getCurrentUser, fetchAuthSession } from "@aws-amplify/auth";
import { Sponsor } from "../router/auth";
import { logAuditEvent } from '../external/auditLogAPI';


export default {
  data() {
    return {
      pointsLog: [
        { id: 1, driver: "John Doe", points: 10, reason: "Safe driving", date: "2023-10-01" },
        { id: 2, driver: "Jane Smith", points: -20, reason: "Late delivery", date: "2023-10-02" },
        { id: 3, driver: "John Doe", points: 15, reason: "Timely delivery", date: "2023-10-03" },
      ],
      newEntry: { driver: "", points: 0, reason: "" },
    };
  },
  computed: {
    totalPoints() {
      return this.pointsLog.reduce((sum, log) => sum + log.points, 0);
    },
    filteredPointsLog() {
      return this.pointsLog;
    }
  },
  methods: {
    async addPoints() {
      if (this.newEntry.driver && this.newEntry.points !== 0 && this.newEntry.reason) {
        try {
          // jafoy: Get all users data to match the username given with a UserID
          const users = await getRequest(table.users);  
          let driverData;
          

          // jafoy: This contains all info on the UserID entered in the form in the same format as the "Team20_Users" table
          const userInfo = users.Items.find(user => user.username.S === this.newEntry.driver);
          if (!userInfo) {
            alert("Driver not found in users table.");
            console.error("Driver not found in users table.");
            return;
          }

          // jafoy: Get the driver data using the UserID from the users table
          driverData = await getRequest(table.drivers, userInfo.UserID.S);
          console.log("Driver data:", driverData);
          var signedInUser = await fetchAuthSession();
          signedInUser = signedInUser.tokens.idToken?.payload

          // jafoy: Check if the signed-in user is a sponsor so we know if we need to limit them.
          if (signedInUser['cognito:groups'].includes(Sponsor)) 
          { 
            const sponsorData = await getRequest(table.sponsors, signedInUser.sub);
            console.log(signedInUser.sub);
            console.log("Sponsor data:", sponsorData);
            if (sponsorData.DriverID.S !== userInfo.UserID.S) {
              // jafoy: This is the driver that the sponsor is assigned to.) {
              // Sponsors can only update Drivers they are assigned to.
              alert("You do not have permission to update this driver's points.");
              console.error("You do not have permission to update this driver's points.");
              return;
            }
          } else if (signedInUser['cognito:groups'].includes("Driver")) {
            // jafoy: Drivers should not be able to do this.
            alert("You do not have permission to update points.");
            console.error("You do not have permission to update points.");
            return;
          }
          // Admins bypass the above checks.
  
          // Get existing points or initialize
          let currentPoints = 0;
          if (driverData.Points && driverData.Points.N) {
            currentPoints = parseInt(driverData.Points.N, 10);
          }

          const updatedPoints = currentPoints + this.newEntry.points;

          // Update the Points attribute
          const updatedDriverItem = {
            ...driverData,
            Points: { N: updatedPoints.toString() }
          };

          // Post updated item
          const response = await postRequest(table.drivers, updatedDriverItem);
          console.log("Successfully updated driver points:", response);

          const user = await getCurrentUser();
          const currUsername = user?.signInDetails?.loginId || "Unknown";
          const driverUsername = userInfo.username.S || "Unknown";
          logAuditEvent(
            'point change',
            currUsername,
            driverUsername,
            {
              points: this.newEntry.points,
              reason: this.newEntry.reason
            }
          );
        } catch (error) {
          console.error("Error updating driver points:", error);
        }

        // jafoy: This updates the points log locally once the points have been updated in the database
        this.pointsLog.push({
          id: this.pointsLog.length + 1,
          driver: this.newEntry.driver,
          points: this.newEntry.points,
          reason: this.newEntry.reason,
          date: new Date().toISOString().split('T')[0],
        });

        this.newEntry = { driver: "", points: 0, reason: "" };
         
      } else {
        alert("Please fill in all fields.");
        console.error("Please fill in all fields.");
      }
    }
  }
};
</script>

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
  padding: 0px;
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

.add-points-container, .points-log-container {
  background: rgba(255, 255, 255, 0.9);
  color: black;
  padding: px;
  border-radius: 10px;
  width: 48%;
}

.add-points-container {
  flex: 1;
}

.points-log-container {
  flex: 1;
}

h2 {
  font-size: 2rem;
}

.add-points-container label {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.add-points-container input {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #ffffff;
  margin-bottom: 15px;
  width: 70%;
  font-size: 1.1rem;
}

.add-points-container button {
  padding: 12px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  font-size: 1.2rem;
}

.add-points-container button:hover {
  background-color: #1e7e34;
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
