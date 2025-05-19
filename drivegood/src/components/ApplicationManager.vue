<script setup>
  import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
  import { ref, onMounted, computed } from "vue";
  import { getRequest, table, postRequest } from "../external/api-requests"; // Import API helper
  import { logAuditEvent } from '../external/auditLogAPI';

  const isSponsor = ref(false);
  const applications = ref([]);
  const organizationList = ref([]);
  const currentUser = ref(null);

  const fetchUserRole = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const session = await fetchAuthSession();
        const idTokenPayload = session.tokens?.idToken?.payload || {};
        const userGroups = idTokenPayload["cognito:groups"] || [];

        isSponsor.value = userGroups.includes("Sponsor");
        currentUser.value = {
          username: user.username,
        };
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };
  const unnamedOrgCount = ref(0);
  const attemptedToFetchOrgs = ref(false);

  // Sets up the organization list and fetches the org name.
   async function fetchOrgNames() {
    try {      
        if (organizationList.value.length === 0) {
          const DynamoAPI = 'https://g5esy4pnad.execute-api.us-east-1.amazonaws.com/default/Team20DynamoInteract';
          const response1 = await fetch(`${DynamoAPI}?TableName=Team20_Organization`);
          const data = await response1.json();
          // Prevent infinite loops
          if (attemptedToFetchOrgs.value) {
            console.error("No organization data found");
            alert("There are currently no organizations registered.");
            return;
          }
          attemptedToFetchOrgs.value = true;
          organizationList.value = data.Items.map(item => ({id: item.id.N, name: item?.name?.S || 'Unnamed Organization ' + (unnamedOrgCount.value = unnamedOrgCount.value + 1)}));
        
        }
      } catch (error) {
        console.error('Error listing organizations:', error);
      }
  }

  const fetchApplications = async () => {
    try {
      const response = await getRequest(table.applications);
      applications.value = response.Items.filter(item => item.Status?.S === "Pending").map(item => ({
        id: item.ApplicationID.S,
        driverID: item.DriverID?.S || '',
        name: item.Name?.S || '',
        dob: item.DOB?.S || '',
        email: item.Email?.S || '',
        phone: item.Phone?.S || '',
        licenseNumber: item.LicenseNumber?.S || '',
        orgID: String(item.OrgID?.N) || '',
        organization: organizationList.value.find(org => org.id === item.OrgID?.N)?.name || "Unknown Organization",
        timestamp: item.Timestamp?.S || ''
      }));
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  // Fetch data when component mounts
  // Changed to async because sometimes data would not exist when applications were loaded.
  onMounted(async () => {
    await fetchOrgNames();
    await fetchUserRole();
    await fetchApplications();
  });
</script>

<template>
  <div v-if="isSponsor" class="dashboard">
    <h1 style="text-align: center;">Submitted Applications</h1>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Vehicle</th>
          <th>Organization</th>
          <th>Files</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="application in applications" :key="application.id">
          <td>{{ application.name }}</td>
          <td>{{ application.email }}</td>
          <td>{{ application.phone }}</td>
          <td>{{ application.organization }}</td>
          <td>
            <button class="approve" @click="approveApplication(application)">Approve</button>
            <button class="deny" @click="denyApplication(application)">Deny</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

  export default {
    methods: {
      async approveApplication(application) {
        try {
          const updateItem = {
            ApplicationID: { S: application.id },
            DriverID: { S: application.driverID },
            Name: { S: application.name },
            DOB: { S: application.dob },
            Email: { S: application.email },
            Phone: { S: application.phone },
            LicenseNumber: { S: application.licenseNumber },
            OrgID: { N: String(application.orgID) },
            Status: { S: "Approved" },
            Timestamp: { S: application.timestamp }
          };
          await postRequest(table.applications, updateItem);

          const driverUpdate = {
            DriverID: { S: application.driverID },
            OrgID: { N: String(application.orgID) }
          };
          await postRequest(table.drivers, driverUpdate);

          const user = await getCurrentUser();
          const sponsUsername = user?.signInDetails?.loginId || "Unknown";

          const driverUserInfo = await getRequest(table.users, application.driverID);
          let driverUsername = application.driverID;
          if (driverUserInfo && driverUserInfo.username?.S) {
            driverUsername = driverUserInfo.username.S;
          } else {
            console.warn("Username not found in record:", driverUserInfo);
          }

          console.log("Approving application as:", sponsUsername);
          await logAuditEvent(
            "application",
            sponsUsername,
            driverUsername,
            {
              status: "Approved",
              timestamp: new Date().toISOString(),
              reason: "Accepted by sponsor"
            }
          );
         
          alert(`Application ${application.id} approved!`);
          this.fetchApplications(); // Refresh list
        } catch (error) {
          console.error("Error approving application:", error);
        }
      },
      async denyApplication(application) {
        try {
          const updateItem = {
            ApplicationID: { S: application.id },
            DriverID: { S: application.driverID },
            Name: { S: application.name },
            DOB: { S: application.dob },
            Email: { S: application.email },
            Phone: { S: application.phone },
            LicenseNumber: { S: application.licenseNumber },
            OrgID: { N: String(application.orgID) },
            Status: { S: "Rejected" },
            Timestamp: { S: application.timestamp }
          };

          // Using postRequest to update the application
          await postRequest(table.applications, updateItem);
          const user = await getCurrentUser();
          const sponsUsername = user?.signInDetails?.loginId || "Unknown";

          const driverUserInfo = await getRequest(table.users, application.driverID);
          let driverUsername = application.driverID;
          if (driverUserInfo && driverUserInfo.username?.S) {
            driverUsername = driverUserInfo.username.S;
          } else {
            console.warn("Username not found in record:", driverUserInfo);
          }
          await logAuditEvent(
            "application",
            sponsUsername,
            driverUsername,
            {
              status: "Rejected",
              timestamp: new Date().toISOString(),
              reason: "Rejected by sponsor"
            }
          );

          alert(`Application ${application.id} denied!`);
          this.fetchApplications(); // Refresh list
        } catch (error) {
          console.error("Error denying application:", error);
        }
      }
    }
  };
</script>


<style scoped>
  .dashboard {
    font-family: Arial, sans-serif;
    padding: 20px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  thead {
    background: #ffcc00;
  }

    thead th {
      padding: 10px;
      text-align: left;
    }

  tbody td {
    padding: 10px;
    border-bottom: 1px solid #ddd;
  }

  a {
    display: block;
    color: blue;
    text-decoration: underline;
    margin-top: 5px;
  }

  button {
    margin: 5px;
    padding: 5px 10px;
    border: none;
    cursor: pointer;
    font-size: 14px;
  }

  .approve {
    background-color: #28a745;
    color: white;
  }

  .deny {
    background-color: #dc3545;
    color: white;
  }
</style>
