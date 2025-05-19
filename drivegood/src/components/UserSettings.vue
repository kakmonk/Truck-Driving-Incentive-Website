<template>
    <!-- Dropdown Menu for Logout, Account, and Cart -->
        <div class="admin-panel">
          <section class="header">
            <div class="header-overlay"></div>
            <div class="header-content">
                <h1>Edit User Settings</h1>
              <p>Welcome <b>[{{group.toUpperCase()}}]</b> <b>{{ LoggedInUser }}</b>! Edit your settings here.</p>
            </div>
          </section>
      
          <section class="content-section">
            <div class="container">
              <div class="panel">
                <form @submit.prevent="handleEditSettings">

                <div class="form-group">
                    <label for="name">Name</label>
                    <input id="name" class="form-control" v-model="username" required readonly disabled :placeholder="LoggedInUser" />
                  </div>
                  <div class="form-group">
                    <label for="email">Email</label>
                    <input id="email" v-model="formEmail" type="email" class="form-control" placeholder="Enter user email" :disabled="showResetForm || showEmailVerification" />
                  </div>
                  
                  <!-- Email Verification Form -->
                  <div v-if="showEmailVerification" class="form-group">
                    <label for="emailVerificationCode">Verification Code</label>
                    <input id="emailVerificationCode" v-model="emailVerificationCode" type="text" class="form-control" placeholder="Enter verification code from email" />
                    
                    <div class="button-group">
                      <button type="button" class="action-button edit-button" @click="confirmEmailChange">Verify Email</button>
                      <button type="button" class="action-button delete-button" @click="showEmailVerification = false">Cancel</button>
                    </div>
                  </div>
                  
                  <div class="form-group" v-if="!showResetForm && !showEmailVerification">
                    <button type="button" class="action-button edit-button" @click="handleEditSettings">Update Email</button>  
                  </div>
                  <div class="form-group">
                <label v-if="!showResetForm" for="password">Password</label>
                <h2 v-if="showResetForm">Reset Your Password</h2>
                <button v-if="!showResetForm" type="button" class="action-button edit-button" @click="triggerPasswordReset">Reset Password</button>
                
                <!-- Password Reset Form -->
                <div v-if="showResetForm" class="reset-password-form">
                    <div class="form-group">
                    <label for="confirmationCode">Verification Code</label>
                    <input id="confirmationCode" v-model="confirmationCode" type="text" class="form-control" placeholder="Enter verification code from email" />
                    </div>
                    
                    <div class="form-group">
                    <label for="newPassword">New Password</label>
                    <input id="newPassword" v-model="newPassword" type="password" class="form-control" placeholder="Enter new password" />
                    <small class="warning-text">Password must be at least 8 characters with uppercase, lowercase, number, and special character.</small>
                    </div>
                    
                    <div class="button-group">
                    <button type="button" class="action-button edit-button" @click="completePasswordReset">Set New Password</button>
                    <button type="button" class="action-button delete-button" @click="showResetForm = false">Cancel</button>
                    </div>
                </div>
                </div>
                 <!-- <button v-if="!showResetForm" type="submit" class="primary-button">Update Email</button> -->
                  <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
                  <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
                </form>
              </div>
            </div>
          </section>
        </div>
      </template>
<script setup>

import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import {getCurrentUser, fetchAuthSession, signOut} from 'aws-amplify/auth';
import { updateUserAttributes, confirmUserAttribute } from 'aws-amplify/auth';
import { logAuditEvent } from '../external/auditLogAPI';


const LoggedInUser = ref("");
const group = ref("");
const successMessage = ref("");
const errorMessage = ref("");
const formEmail = ref("");
const email = ref("");
const verificationCode = ref("");
const newPassword = ref("");
const showResetForm = ref(false);
const showEmailVerification = ref(false);
const emailVerificationCode = ref("");
const userID = ref("");

async function triggerPasswordReset() {
  try {
    await resetPassword({ username: LoggedInUser.value });
    successMessage.value = "Password reset code sent! Check your inbox.";
    showResetForm.value = true; // Show the confirmation form
    errorMessage.value = ""; // Clear any previous errors
  } catch (error) {
    errorMessage.value = "Couldn't send password reset: " + error.message;
  }
}

async function completePasswordReset() {
  try {
    await confirmResetPassword({
      username: LoggedInUser.value,
      confirmationCode: confirmationCode.value,
      newPassword: newPassword.value
    });
    successMessage.value = "Password reset successfully!";
    const user = await getCurrentUser();
    const currUsername = user?.signInDetails?.loginId || "Unknown";
    logAuditEvent(
      'passwordchange',
      currUsername,
      currUsername,
      { type: "password reset" }
    );
    showResetForm.value = false;
    confirmationCode.value = "";
    newPassword.value = "";
  } catch (error) {
    errorMessage.value = "Couldn't reset password: " + error.message;
  }
}
async function handleEditSettings () {
    // For all settings that is not resetting password.
  try {
    // Only proceed if email has changed
    const currentEmail = email.value
    if (formEmail.value !== currentEmail && formEmail.value) {
      // Update the email attribute
      await updateUserAttributes({
        userAttributes: {
          email: formEmail.value
        }
      });
      
      // Show success and prompt for verification
      successMessage.value = "Verification code sent to your new email address. Please check your inbox to complete the change.";
      showEmailVerification.value = true;
    } else {
      successMessage.value = "Your current email and new email are the same, and no changes were made.";
    }
  } catch (error) {
    errorMessage.value = "Couldn't update email: " + error.message;
  }
}

async function confirmEmailChange() {
  try {
    await confirmUserAttribute({
      userAttributeKey: 'email',
      confirmationCode: emailVerificationCode.value
    });
    
    await emailDynamoSync();    // sync with dynamo

    successMessage.value = "Email updated successfully!";
    showEmailVerification.value = false;
    
    // Clear the verification code
    emailVerificationCode.value = "";
    email.value = formEmail.value; // Update the email state
    await refreshUserData(); // Refresh user data
    
  } catch (error) {
    errorMessage.value = "Error verifying email: " + error.message;
  }
}

async function emailDynamoSync() {
    // Sync the dynamo email with the cognito email
  const session  = await fetchAuthSession();
  const editUsersAPI = 'https://9cuk50tdy1.execute-api.us-east-1.amazonaws.com/public/admin/users';

  var original = {
    userID: userID.value,
    username: LoggedInUser.value,
    email: email.value,
    role: '',
    organization: '',
    orgID: '',
    sponsorID: ''
  }

  var body = {
    original: original,
    changes: {
      userID: userID.value,
      username: LoggedInUser.value,
      email: formEmail.value,
      role: '',
      organization: '',
      orgID: '',
      sponsorID: ''
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
  } catch (error) {
    console.error('Error updating user:', error);
    errorMessage.value = "Error updating user: " + error.message;
  }
}
async function refreshUserData() {
  try {
    // Small delay to allow Cognito time to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get fresh token
    await fetchAuthSession({ forceRefresh: true });
    await handleAuth();
    
  } catch (error) {
    console.error("Error refreshing user data:", error);
  }
}

async function handleAuth() {
  const user = await getCurrentUser();
  const session  = await fetchAuthSession();
  if (session) {
    LoggedInUser.value = user.username;
  
    console.log(session.tokens.accessToken.toString());
    localStorage.setItem('isAuthenticated', 'true');
    const accessToken = session.tokens.idToken
    const payload = accessToken.payload;
    console.log(payload);
    if (payload['cognito:groups'] && Array.isArray(payload['cognito:groups'])) {
      group.value = payload['cognito:groups'][0];
      formEmail.value = payload.email;
      email.value = payload.email;
      userID.value = payload.sub;
    }
  }
}


onMounted(async () => {await handleAuth();});

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

</style>
