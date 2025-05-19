import { createApp } from 'vue'
import App from './App.vue'
import router from './router' 
import { Amplify } from 'aws-amplify';
import awsmobile from './aws-exports'

const app = createApp(App)
Amplify.configure(awsmobile)

app.use(router) 
app.mount('#app')