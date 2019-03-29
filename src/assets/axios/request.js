import axios from 'axios'
import server from '../../../static/server.json'

axios.defaults.baseURL=server.serverUrl;

let config = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 20000
};

export default {
  // GET
  AJXAGET: (url, body, callback) => {
    axios.get(url, body, config).then(res => {
      callback(res.data);
    }).catch(res => {
      console.log(res);
    })
  },

  // POST
  AJXAPOST: (url, body, callback) => {
    axios.post(url, body, config).then(res => {
      callback(res.data);
    }).catch(res => {
      console.log(res);
    })
  },
}