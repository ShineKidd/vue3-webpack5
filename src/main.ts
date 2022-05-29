import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './styles/index.less';

createApp(App)
  .use(createPinia())
  .use(router)
  .mount('#app');
