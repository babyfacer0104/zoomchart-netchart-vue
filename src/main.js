
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import axios from 'axios'

axios.defaults.withCredentials = true
Vue.config.productionTip = false


import 'vue-orgchart/dist/style.min.css'

// ajax
import requestApi from './assets/axios/request.js'
Vue.prototype.requestHttp = requestApi

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
