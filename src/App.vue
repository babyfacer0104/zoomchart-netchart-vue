<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>

<style>

*{
  margin: 0;
  padding: 0;
}

html, body{
  box-sizing: border-box;
  font-size: 16px;
}

.clearfix:after{
  content:'';
  clear: both;
  display: block;
}

</style>
