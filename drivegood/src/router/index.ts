

import { createRouter, createWebHistory } from 'vue-router';
import AboutUs from '../components/AboutUs.vue';
import { cognitoCheckGroupAuth, Admin, Sponsor } from './auth';
import { fetchAuthSession } from 'aws-amplify/auth';

const routes = [
 { path: '/', component: () => import('../components/Home.vue') },
 { path: '/about', component: AboutUs },
 { path: '/login', component: () => import('../components/Login.vue') },
 { path: '/application', component: () => import('../components/Application.vue') },
 { path: '/points', component: () => import('../components/Points.vue') },
 { path: '/manage-points', component: () => import('../components/PointsManager.vue') },
 { path: '/settings', component: () => import('../components/UserSettings.vue') },
 {path: '/order-history', component: () => import('../components/OrderHistory.vue') },
 {
   path: '/create-user',
   component: () => import('../components/AdminCreateUser.vue'),
   meta: { requiresAuth: true },
 },
 {
   path: '/applicationmanager',
   component: () => import('../components/ApplicationManager.vue'),
   meta: { requiresAuth: true },
 },
 {
   path: '/dashboard',
   component: () => import('../components/Dashboard.vue'),
   meta: { requiresAuth: true }
 },
 { path: '/cart', component: () => import('../components/Cart.vue'),
  },
  { path: '/checkout', component: () => import('../components/Checkout.vue') },
  { path: '/audit-log-report', component: () => import('../components/AuditLogReport.vue') }
];


const router = createRouter({
 history: createWebHistory(),
 routes,
});


router.beforeEach(async (to, from, next) => {
 if (to.meta.requiresAuth) {
   try {
     const authSession = await fetchAuthSession();
     if (to.path === '/create-user' || to.path === '/applicationmanager') {
       if (authSession.tokens) {
         const payload = authSession.tokens.accessToken.payload;
         const userGroups = payload['cognito:groups'];
        
         const isAuthorizedGroup = Array.isArray(userGroups)
           ? userGroups.some(group =>
               typeof group === 'string' && [Admin, Sponsor].includes(group)
             )
           : false;
        
         if (isAuthorizedGroup) {
           next();
         } else {
           next('/login');
         }
       } else {
         next('/login');
       }
     }
     else {
       if (authSession.tokens) {
         next();
       } else {
         next('/login');
       }
     }
   } catch (error) {
     console.error('Authentication check failed:', error);
     next('/login');
   }
 } else {
   next();
 }
});


export default router;
