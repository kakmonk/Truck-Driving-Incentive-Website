<script setup>
  import { ref, onMounted } from 'vue';
  import { getRequest, table, postRequest } from "../external/api-requests"; 
  import { fetchAuthSession } from '@aws-amplify/auth';

  const filters = ref({
    startDate: '',
    endDate: '',
    sponsor: '',
    category: ''
  });
  const orgList = ref([]); 
  const auditLogs = ref([])
  const categories = ['Login', 'Application', 'PasswordChange', 'Point Change', "Checkout"]

  async function fetchAuditLogs() {
    console.log("Sending filters:", filters.value)
    const response = await fetch('https://xjcoj9bdbb.execute-api.us-east-1.amazonaws.com/get-audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters.value)
    })

    const data = await response.json()
    console.log("Fetched items:", data);
    auditLogs.value = Array.isArray(data) ? data : []
  }

  async function fetchOrgsAndRole() {
    try {
      const DynamoAPI = 'https://g5esy4pnad.execute-api.us-east-1.amazonaws.com/default/Team20DynamoInteract';
      const session = await fetchAuthSession();
      const userID = session.tokens.idToken.payload.sub; // more reliable method
      const groups = session.tokens.idToken.payload['cognito:groups'] || [];
      const isAdmin = groups.includes('admin');
      isSponsorUser.value = !isAdmin;

      const orgRes = await fetch(`${DynamoAPI}?TableName=Team20_Organization`);
      const orgData = await orgRes.json();
      const allOrgs = Array.isArray(orgData.Items)
        ? orgData.Items.map(item => ({
          id: item.id.N,
          name: item.name?.S || 'Unnamed Org'
        }))
        : [];

      if (isAdmin) {
        sponsors.value = allOrgs.map(org => org.name);
      } else {
        const userData = await getRequest(table.sponsors, userID);
        const orgID = userData.OrgID.N;

        if (!orgID) {
          console.error("Sponsor organization ID not found.");
          return;
        }
        const org = allOrgs.find(org => org.id === orgID);
        if (org) {
          userOrgName.value = org.name;
          filters.value.sponsor = org.name;
          sponsors.value = [org.name];
        } else {
          console.error("Organization not found for user.");
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }
  onMounted(() => {
    fetchOrgsAndRole()
  });

</script>

<template>
  <div class="dashboard">
    <h1 class="text-2xl font-bold mb-4 text-center">Audit Log Report</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 justify-center">
      <div>
        <label>Date Range</label>
        <input type="date" v-model="filters.startDate" />
        <input type="date" v-model="filters.endDate" />
      </div>

      <div>
        <label>Sponsor</label>
        <select v-model="filters.sponsor" :disabled="isSponsorUser">
          <option value="">All</option>
          <option v-for="s in sponsors" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <div>
        <label>Category</label>
        <select v-model="filters.category">
          <option value="">All</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
    </div>

    <button @click="fetchAuditLogs" class="approve">Search</button>

    <div class="mt-6">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Actor</th>
            <th>Sponsor</th>
            <th>Category</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in auditLogs" :key="log.eventID">
            <td>{{ log.timestamp }}</td>
            <td>{{ log.actor }}</td>
            <td>{{ log.sponsor || 'N/A' }}</td>
            <td>{{ log.category }}</td>
            <td>{{ log.details }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

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
