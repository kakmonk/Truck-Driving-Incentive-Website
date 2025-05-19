<script setup>
  import { Authenticator } from '@aws-amplify/ui-vue';
  import { cognitoCheckGroupAuth, Admin, Sponsor, Driver } from '../router/auth';
  import { useRouter } from 'vue-router';
  import { logAuditEvent } from '../external/auditLogAPI';
  import { ref, watch } from 'vue';


  const router = useRouter();
  const signedInUser = ref(null);


  watch(signedInUser, async (user) => {
    if (user) {
      const authStatus = await cognitoCheckGroupAuth([Admin]);
      await logAuditEvent("login", user.username, user.username, {
        success: true,
        groups: authStatus.groups || []
      });

      if (authStatus.isAuthorized) {
        router.push('/create-user');
      } else {
        router.push('/dashboard');
      }
    }
  });
</script>

<template>
  <Authenticator>
    <template v-slot="{ user }">
      <div v-if="user" style="display: none;">
        {{ signedInUser = user }}
      </div>
    </template>
  </Authenticator>
</template>


<style>
  @import '@aws-amplify/ui-vue/styles.css';


  /* Style for the header image */
  .image-container {
    text-align: center;
    margin-bottom: 20px;
  }


  .header-image {
    max-width: 100%;
    height: auto;
  }


  /* Override the Amplify Authenticator button styles globally */
  .amplify-authenticator .amplify-button {
    background-color: #ebd002 !important;
    color: white !important;
    padding: 12px 20px;
    border-radius: 8px;
  }


  [data-amplify-authenticator] {
    --amplify-components-authenticator-form-background-color: rgb(233, 192, 30);
    --amplify-components-authenticator-form-padding: var(--amplify-space-medium) var(--amplify-space-xl) var(--amplify-space-xl);
    --amplify-components-authenticator-form-border-radius: 15px;
    --amplify-components-button-primary-background-color: #bbb200; /* Red */


    --amplify-components-fieldcontrol-focus-box-shadow: 0 0 0 2px var(--amplify-colors-red-60);
    --amplify-components-tabs-item-active-border-color: var(--amplify-colors-neutral-100);
    --amplify-components-tabs-item-color: var(--amplify-colors-neutral-80);
    --amplify-components-tabs-item-active-color: var(--amplify-colors-red-100); /* Red active color */
  }




    [data-amplify-authenticator] .amplify-authenticator-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: var(--amplify-components-authenticator-form-background-color); /* Apply the red background */
      background-size: cover;
      background-position: center;
    }
</style>
