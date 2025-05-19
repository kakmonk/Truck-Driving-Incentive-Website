<template>
<!-- Dropdown Menu for Logout, Account, and Cart -->
    <div class="admin-panel">
      <section class="header">
        <div class="header-overlay"></div>
        <div class="header-content">
            <h1 v-if="group === 'Admin'">Admin User Management</h1>
            <h1 v-if="group === 'Sponsor'"> {{ organization }}</h1>
            <h4 v-if="group === 'Sponsor'">User Management</h4>
          <p>Authorized as <b>[{{group.toUpperCase()}}]</b> <b>{{ LoggedInUser }}</b></p>
        </div>
      </section>
  
      <section class="content-section">
        <div class="container">
          <div v-if="hidden" class="panel">
            <h2>Create a New User</h2>
            <form @submit.prevent="handleCreateUser">
              <div class="form-group">
                <label for="email">Email</label>
                <input id="email" v-model="email" type="email" class="form-control" placeholder="Enter user email" required />
              </div>
  
              <div class="form-group">
                <label for="name">Name</label>
                <input id="name" v-model="username" type="text" class="form-control" placeholder="Enter user name" required />
              </div>
  
              <div class="form-group">
                <label for="role">User Role</label>
                <select id="role" v-model="role" class="form-control" required>
                  <option v-if="group == 'Admin'" value="Admin">Admin</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
            <!-- Organization Selection -->
            <div v-if="role == 'Sponsor'" class="form-group">
                <label for="organization">Organization</label>
                <select v-if="group == 'Admin' && role == 'Sponsor'" class="form-control" id="organization" v-model="orgID" required >
                  <option disabled value="">Please select one</option>
                  <option v-if="isLoading" value="" disabled>Loading organizations...</option>
                  <option v-else-if="organizationList.length === 0" value="" disabled>No organizations available</option>
                  <option v-for="org in organizationList" :key="org.id" :value="org.id">{{ org.name }}</option>
                </select>
                <input v-if="group == 'Sponsor'" class="form-control" id="organization" v-model="organization" required readonly disabled :placeholder="organization" />
                
              </div>

              <div v-if="role == 'Driver'" class="form-group">
                <label for="sponsor-designation">Sponsor Designation</label>
                <select v-if="group == 'Admin'" class="form-control" id="sponsor-designation" v-model="DesignatedSponsorID" required >
                  <option disabled value="">Select a Sponsor to designate to this Driver</option>
                  <option v-if="isLoading2" value="" disabled>Loading Sponsors...</option>
                  <option v-else-if="SponsorList.length === 0" value="" disabled>No sponsors available</option>
                  <option v-for="sponsor in SponsorList" :key="sponsor.id" :value="sponsor.id">{{ sponsor.username }}</option>
                </select>
                <input v-if="group == 'Sponsor'" class="form-control" id="sponsor-designation" v-model="DesignatedSponsorID" required readonly disabled :placeholder="LoggedInUser"/>
              </div>
  
              <button type="submit" class="primary-button">Create User</button>
  
              <div v-if="message" class="alert" :class="{'alert-success': success, 'alert-error': !success}">
                {{ message }}
              </div>
            </form>
          </div>

          <div v-if="!hidden" class="panel">
            <h2>
            <button class="action-button delete-button" @click="editUser_BackButton()"> < Go Back</button>
            Editing [{{editUser_CurrentUser.role.toUpperCase()}}] {{ editUser_CurrentUser.name }}</h2>
            <form @submit.prevent="handleEditUser">
              <div v-if="group == 'Admin'" class="form-group">
              <!-- <input class="form-control" v-if="group == 'Admin'" v-model="editUser_CurrentUser.userID" required readonly disabled :placeholder="editUser_CurrentUser.userID" /> --->
              </div>

              <div class="form-group">
                <label for="name">Name</label>
                <input class="form-control" v-model="editUser_CurrentUser.username" required readonly disabled :placeholder="editUser_CurrentUser.username" />
              </div>

              <div class="form-group">
                <label for="name">User Role</label>
                <input class="form-control" v-model="editUser_CurrentUser.role" required readonly disabled :placeholder="editUser_CurrentUser.role" />
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input id="email" v-model="email" type="email" class="form-control" />
              </div>
  
              <div class="form-group" hidden="true">
                <label for="role">User Role</label>
                <select id="role" v-model="role" class="form-control">
                  <option v-if="group == 'Admin'" value="Admin">Admin</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
            <!-- Organization Selection -->
            <div v-if="role == 'Sponsor'" class="form-group">
                <label for="organization">Organization</label>
                <select v-if="group == 'Admin' && role == 'Sponsor'" class="form-control" id="organization" v-model="orgID" required >
                  <option disabled value="">Please select one</option>
                  <option v-if="isLoading" value="" disabled>Loading organizations...</option>
                  <option v-else-if="organizationList.length === 0" value="" disabled>No organizations available</option>
                  <option v-for="org in organizationList" :key="org.id" :value="org.id">
                    {{ org.name }}
                  </option>
                </select>
                <b v-if="group == 'Admin'" class="warning-text">Changing a Sponsor's organization will unassociate all Drivers with them.</b>
                <input v-if="group == 'Sponsor'" class="form-control" id="organization" v-model="organization" required readonly disabled :placeholder="organization" />
                
              </div>

              <div v-if="role == 'Driver'" class="form-group">
                <label v-if="group == 'Admin'" for="sponsor-designation">Add Sponsor Designation</label>
                <!-- <label v-if="group == 'Sponsor'" for="sponsor-designation">Sponsor</label> -->
                <select v-if="group == 'Admin'" class="form-control" id="sponsor-designation" v-model="DesignatedSponsorID" required >
                  <option disabled value="">Select a Sponsor to designate to this Driver</option>
                  <option v-if="isLoading2" value="" disabled>Loading Sponsors...</option>
                  <option v-else-if="SponsorList.length === 0" value="" disabled>No sponsors available</option>
                  <option v-for="sponsor in SponsorList" :key="sponsor.id" :value="sponsor.id">{{ sponsor.username }}</option>
                </select>
                <!-- <input v-if="group == 'Sponsor'" class="form-control" id="sponsor-designation" v-model="DesignatedSponsorName" required readonly disabled :placeholder="LoggedInUser"/> -->
              </div>
  
              <button type="submit" class="primary-button">Edit User</button>
  
              <div v-if="message" class="alert" :class="{'alert-success': success, 'alert-error': !success}">
                {{ message }}
              </div>
            </form>
          </div>
  
          <div class="panel mt-4">
            <h2>Existing Users</h2>
            
            <div class="filter-container">
              <label for="user-filter">User:</label>
              <select id="user-filter" v-model="selectedUserFilter" class="form-control user-filter">
                <option v-for="option in userFilterOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="table-responsive">
              <table class="user-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Organization</th>
                    <th>Assigned Sponsors</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in filteredUsers" :key="user.email">
                    <td>{{ user.email }}</td>
                    <td>{{ user.username }}</td>
                    <td>{{ (organizationList.find(org => String(org.id) === String(user.organization))?.name) || 'Unassigned' }} </td>
                    <td>
                      <template v-if="user.sponsors && user.sponsors.length > 0">
                        <div v-for="(sponsor, index) in user.sponsors" :key="sponsor.id">
                          {{ SponsorList.find(sp => sp.id === sponsor.id)?.username || sponsor.id }}
                        </div>
                      </template>
                      <template v-else>
                        Unassigned
                      </template>
                    </td>
                    <td><span class="badge" :class="getBadgeClass(user.role)">{{ user.role }}</span></td>
                    <td>
                      <button class="action-button edit-button" @click="editUser_EditButton(user)">Edit</button>
                      <!-- <button class="action-button delete-button">Delete</button> -->
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  </template>
  
  <script setup>

  import { ref, onMounted, watch, computed } from 'vue';
  import { useRouter, useRoute } from 'vue-router';

  import { Amplify } from 'aws-amplify';
  import {getCurrentUser, fetchAuthSession, signOut} from 'aws-amplify/auth';
 // sponsor settings

 ////////// ////////////////////////////////////////////////////////////////////////////////////////////////////
  const filteredUsers = computed(() => {
    if (!users.value || !users.value.users) return [];
    
    if (selectedUserFilter.value === 'all') {
      return users.value.users;
    } else {
      return users.value.users.filter(user => user.userID === selectedUserFilter.value);
    }
  });

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.reload(); // Refresh the page after logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAccount = () => {
  };

  const handleCart = () => {
  };

 //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const LoggedInUser = ref('');
  const unnamedOrgCount = ref(0);
  const DesignatedSponsorID = ref('');
  const DesignatedSponsorName = ref('');
  const isLoading2 = ref(true);
  const username = ref('');
  const email = ref('');
  const users = ref([]);
  const role = ref('');
  const message = ref('');
  const password = ref('');
  const group = ref('');
  const error = ref('');
  const hidden = ref(true);
  const router = useRouter();
  const route = useRoute();
  const success = ref(false);
  const isLoading = ref(true);
  const selectedUserFilter = ref('all');
  const userFilterOptions = ref([]);
  var editUser_BeforeEditData = {};
  const organization = ref('');
  const editUser_CurrentUser = ref(null);
  var SponsorList = ref([]);
  var organizationList = ref([]); 
  var orgID = '';
  const isSponsor = ref(false);
// TODO: Implement the badge class function
function getBadgeClass(role) {
  return ' '
}

function editUser_BackButton() {
  hidden.value = true;
  editUser_CurrentUser.value = null;
  message.value = '';
  success.value = false;
  username.value = '';
  email.value = '';
  role.value = '';
  DesignatedSponsorID.value = '';
  DesignatedSponsorName.value = '';
  orgID = '';
  organization.value = '';

  handleForm();
  handleListOrganizations();
  handleListSponsors();
  handleListUsers();
}

function editUser_EditButton(user) {
  hidden.value = false;
  message.value = '';
  editUser_CurrentUser.value = user;
  email.value = user.email;
  username.value = user.username;
  role.value = user.role;
  DesignatedSponsorID.value = user.sponsorID;
  orgID = user.organization || 'Unassigned';
  organization.value = organizationList.value.find(org => String(org.id) === String(user.organization))?.name || 'Unassigned';
  
  editUser_BeforeEditData = {
    userID: user.userID,
    username: user.username,
    email: user.email,
    role: user.role,
    organization: user.organization,
    orgID: orgID,
    sponsorID: user.sponsorID
  };
}
async function handleEditUser(user) {

  //email.value = user.email;
  //username.value = user.username;
  //role.value = user.role;
  //DesignatedSponsorID.value = user.sponsorID;
  //DesignatedSponsorName.value = user.sponsorName || 'Unassigned';
  //orgID = user.organization || 'Unassigned';
  //organization.value = organizationList.value.find(org => String(org.id) === String(user.organization))?.name || 'Unassigned';


  console.log('Orgs: ' + organization.value)
  console.log(orgID)
  console.log('Sponsor: ' + DesignatedSponsorID.value)
  console.log('Sponsor Name: ' + DesignatedSponsorName.value)
  const session  = await fetchAuthSession();
  const editUsersAPI = 'https://9cuk50tdy1.execute-api.us-east-1.amazonaws.com/public/admin/users';


  let organizationAssignment = null;
  if (role.value == 'Driver') {
    if (DesignatedSponsorID.value) {
      organizationAssignment = SponsorList.value.find(sponsor => sponsor.id === DesignatedSponsorID.value).OrgID;
    }
  } else if (role.value == 'Sponsor') {
    organizationAssignment = orgID;
  }

  const body = {
    original: editUser_BeforeEditData,
    changes: {
      userID: editUser_CurrentUser.value.userID,
      username: username.value,
      email: email.value,
      role: role.value,
      organization: user.organization,
      orgID: organizationAssignment,
      sponsorID: DesignatedSponsorID.value
    },
  }; 

  try {
    const response = await fetch(editUsersAPI, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.tokens.idToken}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error('Error updating user:', response);
    }
    success.value = true;
    if (role.value == 'Driver') {
      const sponsor = SponsorList.value.find(sp => sp.id === DesignatedSponsorID.value);
      const sponsorName = sponsor ? sponsor.username : 'Unknown Sponsor';
      message.value = `Driver ${username.value} has been updated successfully!`;
    } else if (role.value == 'Sponsor') {
      const orgData = organizationList.value.find(org => String(org.id) === String(orgID));
      const orgName = orgData ? orgData.name : user.organization;
      message.value = `Sponsor ${username.value} has been updated successfully!`;
    } else {
      message.value = `User ${username.value} updated.`;
    }
    console.log('User updated.');
  } catch (error) {
    console.error('Error updating user:', error);
  }

  handleListUsers();
}

function updateFilterOptions() {
  const options = [{ value: 'all', label: 'Show All Users' }];
  
  if (users.value && users.value.users) {
    users.value.users.forEach(user => {
      options.push({
        value: user.userID,
        label: `${user.username} (${user.role})`
      });
    });
  }
  
  userFilterOptions.value = options;
}

watch(() => users.value, () => {
    updateFilterOptions();
    }, { deep: true });



async function handleForm() {
  const user = await getCurrentUser();
  const session  = await fetchAuthSession();
  if (session) {
    // May not be necessary.
    LoggedInUser.value = user.username;
  
    console.log(session.tokens.accessToken.toString());
    localStorage.setItem('isAuthenticated', 'true');
    const accessToken = session.tokens.idToken
    const payload = accessToken.payload;
    console.log(payload);
    if (payload['cognito:groups'] && Array.isArray(payload['cognito:groups'])) {
      group.value = payload['cognito:groups'][0];
    }
  }
}

async function handleListUsers() {
  const listUsersAPI = 'https://9cuk50tdy1.execute-api.us-east-1.amazonaws.com/public/admin/users';
  const session  = await fetchAuthSession();
  try {
    const response = await fetch(listUsersAPI, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.tokens.idToken}`
      }
    });
    if (!response.ok) {
      throw new Error('Error fetching users:', response);
    }

    users.value = await response.json();

  } catch (error) {
    // TODO (ERROR): Inform the admin that there was an error listing the users, perhaps with UI
    console.error('Error listing users:', error);
    return error;
  }
}
async function handleCreateUser() {
    // Reset message box
    message.value = '';
    success.value = false;

    const session  = await fetchAuthSession();
    const createAdminsAPI = 'https://9cuk50tdy1.execute-api.us-east-1.amazonaws.com/public/admin/users';

    // jafoy Must grab the ID from the list of organizations since they chose from a list of names.
    // Sponsors automatically get their org ID from the DynamoDB table.
    if (group.value == 'Admin') {
    //  orgID = organizationList.value.map(org => org.name == organization.value ? org.id : null).filter(Boolean)[0];
    } else if (group.value == 'Sponsor') {
      DesignatedSponsorID.value = session.tokens.idToken.payload.sub;
      if (!orgID) {
        console.error("No organization ID found for Sponsor user");
        return;
      }
    }
    
    var organizationAssignment = null;
    var body = {
      username: username.value,
      email: email.value,
      role: role.value
    };

    if (role.value == 'Driver') {
      if (DesignatedSponsorID.value) {
        organizationAssignment = SponsorList.value.find(sponsor => sponsor.id === DesignatedSponsorID.value).OrgID;
        body.SponsorID = DesignatedSponsorID.value;
      }
    } else if (role.value == 'Sponsor') {
      organizationAssignment = orgID;
    }

    body.organization = organizationAssignment;

    try {
      const response = await fetch(createAdminsAPI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.tokens.idToken}`
        },
        body: JSON.stringify(body)
      });
      if ((!response.ok) && (response.body !== null)) {
        message.value = 'Error creating user ' + username.value + ' (' + email.value + ') with role ' + role.value + '.\n' + JSON.parse(await response.text()).error;
        throw new Error('Error creating user:', response);

      } else if (response.body !== null) {
        message.value = `Created user ${username.value} (${email.value}) with role ${role.value}.`;
        console.log('User created.');
        
        success.value = true;

        // reset after submit was successful
        username.value = '';
        email.value = '';
        role.value = '';
        await handleListUsers();
      } else {
        //message.value = 'Error creating user ' + username.value + ' (' + email.value + ') with role ' + role.value + '.\n' + JSON.parse(await response.text()).error;
        message.value = 'Error creating user ' + username.value + ' (' + email.value + ') with role ' + role.value + '.\n' + JSON.parse(await response.text()).error;
        throw new Error('Error creating user:', response);
      }
    } catch (error) {
       message.value = 'Unknown error creating user ' + username.value + ' (' + email.value + ') with role ' + role.value + '.\n' + JSON.parse(await response.text()).error;
       console.error('Error creating admin user:', error);
    }
  }

  const TableName = 'Team20_Organization' 
  const DynamoAPI = 'https://g5esy4pnad.execute-api.us-east-1.amazonaws.com/default/Team20DynamoInteract'
  const queryParams = '?TableName=' + TableName 
  
async function handleListOrganizations() {
    const session  = await fetchAuthSession();
    if (group.value == 'Sponsor') {
      try {
        const DynamoAPI = 'https://g5esy4pnad.execute-api.us-east-1.amazonaws.com/default/Team20DynamoInteract';
        
        // Get user's org ID first
        const session = await fetchAuthSession();
        const userID = session.tokens.idToken.payload.sub; // Replace with actual user ID
        const response1 = await fetch(`${DynamoAPI}?TableName=Team20_Sponsors&PartitionKey=SponsorID&PartitionValue=${userID}`);
        const userData = await response1.json();
        orgID = userData.OrgID?.N;
        
        if (!orgID) {
          console.error("No organization ID found for user");
          return;
        }
        
        // Get sponsors list
        const response2 = await fetch(`${DynamoAPI}?TableName=${TableName}&PartitionKey=id&PartitionValue=${orgID}`);
        const orgResponse = await response2.json();
        
        organization.value = orgResponse.name?.S;

        const response = await fetch(DynamoAPI + queryParams);
        if (!response.ok) {
          throw new Error('Error fetching organizations:', response);
        }
        const data = await response.json();
        organizationList.value = data.Items.map(item => ({id: item.id.N, name: item?.name?.S || 'Unnamed Organization ' + (unnamedOrgCount.value = unnamedOrgCount.value + 1)})); 
        
      } catch (error) {
        console.error('Error fetching organization:', error);
      }
    } else {
      try {
        const response = await fetch(DynamoAPI + queryParams);
        if (!response.ok) {
          throw new Error('Error fetching organizations:', response);
        }
        const data = await response.json();
        organizationList.value = data.Items.map(item => ({id: item.id.N, name: item?.name?.S || 'Unnamed Organization ' + (unnamedOrgCount.value = unnamedOrgCount.value + 1)}));

        isLoading.value = false;
        console.log(organizationList.value);
      } catch (error) {
        console.error('Error listing organizations:', error);
      }
    }
  }

  async function handleListSponsors() {
      try {
        const DynamoAPI = 'https://g5esy4pnad.execute-api.us-east-1.amazonaws.com/default/Team20DynamoInteract';
        
        // Get user's org ID first
        const response1 = await fetch(`${DynamoAPI}?TableName=Team20_Sponsors`);
        const userData = await response1.json();
        console.log(userData);

        SponsorList.value = await Promise.all(userData.Items.map(async item => {
          const userTable = await fetch(`${DynamoAPI}?TableName=Team20_Users&PartitionKey=UserID&PartitionValue=${item.SponsorID.S}`);
          const userData2 = await userTable.json();
          if (!userData2) {
            console.error("No user data found for sponsor " + item.SponsorID.S + " in organization " + item.OrgID.N);
            return null;
          }
          return {id: item.SponsorID.S, OrgID: item?.OrgID?.N || 'None', username: userData2.username.S, email: userData2.email.S};
        })).then(results => results.filter(item => item !== null));   
        isLoading2.value = false;
        console.log(SponsorList.value);
        
      } catch (error) {
        console.error('Error fetching Sponsors:', error);
      }
  }
  

  onMounted(async () => {handleListUsers(); await handleForm(); await handleListSponsors(); await handleListOrganizations(); isSponsor.value = ((group.value == 'Sponsor') || (group.value == 'Admin'))});
  </script>
  
  <style scoped>
  .admin-panel {
    font-family: Arial, sans-serif;
  }
  
  .header {
    position: relative;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2c3e50;
    margin-bottom: 30px;
  }
  
  .header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
  }
  
  .header-content {
    position: relative;
    z-index: 2;
    text-align: center;
  }
  
  .header-content h1 {
    font-size: 2.5rem;
    color: white;
    margin-bottom: 10px;
  }
  
  .header-content p {
    font-size: 1.2rem;
    color: #f8f8f8;
    margin: 0;
  }
  
  .content-section {
    padding: 20px;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 25px;
  }
  
  h2 {
    color: #333;
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }
  h4 {
    color: #cbcbcb;
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #555;
  }
  
  .form-control {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  .form-control:focus {
    border-color: #ffcc00;
    outline: none;
  }
  
  .primary-button {
    background: #ffcc00;
    color: #333;
    font-weight: 600;
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
  }
  
  .primary-button:hover {
    background: #e5b700;
  }
  
  .alert {
    margin-top: 20px;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
  }
  
  .alert-success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .alert-error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .table-responsive {
    overflow-x: auto;
  }
  
  .user-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  
  .user-table th {
    background-color: #f8f9fa;
    color: #495057;
    font-weight: 600;
    text-align: left;
    padding: 12px 15px;
    border-bottom: 2px solid #dee2e6;
  }
  
  .user-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #dee2e6;
  }
  
  .user-table tr:hover {
    background-color: #f8f9fa;
  }
  
  .badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  .badge-admin {
    background-color: #cce5ff;
    color: #004085;
  }
  
  .badge-sponsor {
    background-color: #d4edda;
    color: #155724;
  }
  
  .badge-driver {
    background-color: #fff3cd;
    color: #856404;
  }
  
  .action-button {
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    margin-right: 5px;
  }
  
  .edit-button {
    background-color: #e9ecef;
    color: #495057;
  }
  
  .delete-button {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  .edit-button:hover {
    background-color: #dee2e6;
  }
  
  .delete-button:hover {
    background-color: #f5c6cb;
  }
  
  .mt-4 {
    margin-top: 25px;
  }

  .logout-button, .account-button, .cart-button {
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
  }

  .logout-button:hover, .account-button:hover, .cart-button:hover {
    background-color: #c82333;
  }

  .dropdown {
    position: absolute;
    right: 10px; /* Move button 2 inches to the left */
    top: 10px;
    display: inline-block;
  }

  .dropdown-btn {
    padding: 10px 90px;
    font-size: 16px;
    background-color: #ffcc00;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;

  }
  .warning-text {
    color: #dc3545;
    font-size: 0.9rem;
    display: block;
    margin-top: 5px;
  }
  .dropdown-btn:hover {
    background-color: #005ecb;
  }

  .dropdown-content {
    display: none;
    position: absolute;
    background-color: #f1f1f1;
    min-width: 160px;
    z-index: 1;
    border-radius: 8px;
  }

  .dropdown:hover .dropdown-content {
    display: block;
  }

  .dropdown-content button {
    background-color: #dc3545;
    color: white;
    padding: 10px 18px;
    width: 100%;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .dropdown-content button:hover {
    background-color: #c82333;
  }

  .filter-container {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
  }

  .user-filter {
    max-width: 400px;
    flex-grow: 1;
  }

  .filter-container label {
    white-space: nowrap;
    font-weight: 600;
  }
  </style>
