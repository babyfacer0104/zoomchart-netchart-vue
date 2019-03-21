
<template>
  <div id="dialog">
    <div class="border">
      <div style="width:100%; height: 20px;">
        <div @click="closeDialog" class="closeImg">x</div>
      </div>
      <div class="message">账号详情信息</div>
    </div>
  </div>
</template>
<script>
  export default {
    name: "dialog",
    data(){
      return {}
    },
    methods:{
      closeDialog(){
         this.$emit('closeDialog', false);
      }
    }
  }
</script>
 
<style scoped>
  #dialog{
    position: fixed;
    top: 0;
    left: 0;
    background: rgba(0,0,0,0.3);
    width: 100%;
    height: 100%;
  }
  .message{
    position: relative;
    font-size: 14px;
    text-align: center;
    padding: 80px;
  }
  .closeImg{
    width: 20px;
    height: 20px;
    float: right;
    margin-right: 10px;
    margin-top: 5px;
    cursor: pointer;
    /* background-image: url(../../assets/close.png); */
    /* background-size: cover;
    background-repeat: no-repeat; */
  }
  .border{
    width: 300px;
    height: 200px;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    text-align: center;
    background-color: white;
    border-radius: 2px;
  }
</style>