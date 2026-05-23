import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPersistedstate from 'pinia-plugin-persistedstate';
import 'virtual:uno.css';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersistedstate);
app.use(pinia);
app.mount('#app');
