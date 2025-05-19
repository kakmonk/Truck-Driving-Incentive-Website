<template>
  <div class="driver-application">
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>Driver Sponsorship Application</h1>
        <p>Complete the form to apply for a sponsorship opportunity.</p>
      </div>
    </section>

    <section class="form-section">
      <div class="container">
        <form @submit.prevent="submitForm">
          <!-- Personal Information -->
          <h4>Personal Information</h4>
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" class="form-control" id="name" v-model="form.name" placeholder="Enter your name" required>
          </div>
          <div class="form-group">
            <label for="dob">Date of Birth</label>
            <input type="date" class="form-control" id="dob" v-model="form.dob" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" class="form-control" id="email" v-model="form.email" placeholder="Enter your email" required>
          </div>
          <div class="form-group">
            <label for="phone">Phone</label>
            <input type="tel" class="form-control" id="phone" v-model="form.phone" placeholder="Enter your phone number" required>
          </div>
          <!-- Driver Details -->
          <h4>Driver Details</h4>
          <div class="form-group">
            <label for="licenseNumber">License Number</label>
            <input type="text" class="form-control" id="licenseNumber" v-model="form.licenseNumber" placeholder="Enter your license number" required>
          </div>

          <!-- Sponsor Selection -->
          <h4>Organization</h4>
          <div class="form-group">
            <label for="organization">Select Organization</label>
            <select class="form-control" id="organization" v-model="form.organization" required>
              <option disabled value="">Please select one</option>
              <option v-if="isLoading" value="" disabled>Loading organizations...</option>
              <option v-else-if="organizationList.length === 0" value="" disabled>No organizations available</option>
              <option v-for="org in organizationList" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
          </div>
          <button type="submit" class="primary-button mt-3">Submit Application</button>
        </form>
      </div>
    </section>
  </div>
</template>

<script>
  import { fetchAuthSession } from '@aws-amplify/auth';
  import { postRequest, table } from '../external/api-requests'
export default {
  data() {
    return {
      form: {
        name: '',
        dob: '',
        email: '',
        phone: '',
        licenseNumber: '',
        organization: '',
        timestamp: ''
      },
      organizationList: [],
      userOrgID: null,
      isLoading: true
    };
  },

  async mounted() {
      await this.fetchOrgs();
    },
  methods: {
    async fetchOrgs() {
      // Gathers the sponsors that match the Driver's organization ID.
      try {
        this.isLoading = true;
        const DynamoAPI = 'https://g5esy4pnad.execute-api.us-east-1.amazonaws.com/default/Team20DynamoInteract';
        
        // Get user's org ID first
        const session = await fetchAuthSession();
        const userID = session.tokens.idToken.payload.sub; // more reliable method
        const response1 = await fetch(`${DynamoAPI}?TableName=Team20_Organization`);
        const data = await response1.json();

        // Tell others they cannot submit applications so that the rest doesn't error.
        if (!response1 || this.isSponsor) {
          console.error("No organization data found");
          alert("Only Drivers can submit applications. You are currently authenticated as " + (session.tokens.idToken.payload.name || "Unknown")); 
          return;
        }

    
          this.organizationList = data.Items.map(item => ({id: item.id.N, name: item?.name?.S || 'Unnamed Organization ' + (unnamedOrgCount.value = unnamedOrgCount.value + 1)}));

          this.isLoading = false;
          console.log(this.organizationList);
        } catch (error) {
          console.error('Error listing organizations:', error);
        }
    },
    async submitForm() {
      if (!this.validateForm()) {
        alert('Please fill out all required fields.');
        return;
      }

      try {
        const session = await fetchAuthSession();
        const driverID = session.tokens.idToken.payload.sub;
        const applicationID = `APP-${Date.now()}`;

        const applicationData = {
          ApplicationID: { S: applicationID },
          DriverID: { S: driverID },
          Name: { S: this.form.name },
          DOB: { S: this.form.dob },
          Email: { S: this.form.email },
          Phone: { S: this.form.phone },
          LicenseNumber: { S: this.form.licenseNumber },
          OrgID: { N: String(this.form.organization) },
          Status: { S: "Pending" }, // Default status for new applications
          Timestamp: { S: new Date().toISOString() }
        };

        console.log("Form before submission:", this.form);
        await postRequest(table.applications, applicationData);
        alert('Application submitted successfully.');
        this.resetForm();

      } catch (error) {
        console.error('Error submitting form:', error);
        alert('An error occurred. Please check your network and try again.');
      }
    },

    validateForm() {
      const requiredFields = ['name', 'dob', 'email', 'phone', 'licenseNumber', 'organization'];
      return requiredFields.every(field => {
        const value = this.form[field];
        return value !== '' && value !== null && value !== undefined;
      });
    },

    resetForm() {
      this.form = {
        name: '',
        dob: '',
        email: '',
        phone: '',
        licenseNumber: '',
        organization: '',
        timestamp: ''
      };
    },

    handleFileUpload(field, event) {
      const file = event.target.files[0];
      if (file) {
        this.form[field] = file;
      }
    },
  },
};
</script>

<style scoped>
.driver-application {
  font-family: Arial, sans-serif;
}

.hero {
  position: relative;
  height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('../../public/trucks.jpg') no-repeat center center/cover;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 600px;
  color: white;
}

.form-section {
  background: #f8f8f8;
  padding: 40px;
}

h4 {
  font-size: 1.8rem;
  margin-top: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-control {
  padding: 10px;
  font-size: 1rem;
  width: 100%;
  margin-top: 5px;
}

.primary-button {
  background: #ffcc00;
  color: black;
  font-weight: bold;
  padding: 12px 20px;
  border: none;
  cursor: pointer;
  margin-top: 20px;
  border-radius: 5px;
}

.primary-button:hover {
  background-color: #e5b700;
}
</style>
