import Vue from 'vue'
import Router from 'vue-router'
import index from '../components/index'
import relationChart from '../components/relationChart'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'index',
      component: index
    },
    {
      path: '/relationChart',
      name: 'relationChart',
      component: relationChart
    }
  ]
})
