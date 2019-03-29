<template>
  <div class="tree-container">
    <div ref="treeHorizontal" id="tree-horizontal"></div>
    <!--右键菜单 :style="{top: offsetTop, left: offsetLeft}"-->
    <div v-show="treeMenuHidden" :data="menuList" ref="dealDetails" class="dealDetails" >
      <div @click="userDetailHandle()">账号详情</div>
      <div @click="topNodeHandle()">上游交易对手</div>
      <div @click="bottomNodeHandle()">下游交易对手</div>
      <!-- <div @click="viewMoreHandle()">查看更多</div> -->
      <!-- <div @click="reverseSortHandle()">倒序排列</div> -->
      <!-- <div @click="menuHiddenHandle($data)">隐藏</div> -->
    </div>
    
    <Dialog @closeDialog="closeHandle" v-if="showDialog"></Dialog>
  </div>
</template>
 
<script>
import { NetChart } from '@dvsl/zoomcharts'
import Dialog from './common/dialog.vue'
import server from '../../static/server.json'

export default {
  name: 'relationChart',
  data() {
    return {
      addChartData: '',
      addNodeData: [],
      addLinksData: [],
      chartData: '', //
      chartDataLength: 0, //
      treeMenuHidden: false,
      netchart: '',
      //鼠标定位
      offsetTop: 0,
      offsetLeft: 0,
      menuList: '',
      chartByInitID: [], //存放更多展开的数据
      showMore: false,
      showDialog: false,
      total: 6,//
    }
  },
  components: { 
    NetChart,
    Dialog
  },
  created () {
    this.loadApi('initload');
  },
  mounted() {
  },
  methods: {
    //主路径API
    loadApi(result) {
      let that = this;
      // console.log(server.user);
      //请求主节点的数据 数组类型
      that.requestHttp.AJXAGET('/shortestPath?name='+server.user, {name: server.user},(data)=>{
        let nodes = [], links = [], pageX = 120;
        let chartData = {"nodes": data.nodes, "links": data.links};
        that.chartDataLength = data.nodes.length;

        if(data.nodes.length > 5 && !that.showMore){
          //过滤 插入更多
          chartData.nodes.map((v, i)=>{
            if(i > 3 && v.radius == 20){
              return false;
            }
            else{
              that.chartByInitID.push(v.id);
              if(i == 2){
                nodes.push({"id": "more_"+v.id, "user": "more_"+v.user, "label": "点击展开", "radius": 20, "type": "more", "nodeType": "path", "x": pageX, "y":250 });
              }
              nodes.push({"id": v.id, "user": v.user, "label": v.label, "radius": v.radius, "type": v.type, "nodeType": v.nodeType, "x":pageX, "y":250 });
              pageX = pageX + 100;
            }
          });
          
          //筛选links
          nodes.map((v, i)=>{
            if(i == nodes.length-1){
              return false;
            }
            else{
              let filter = chartData.links.filter((v1, i1)=>{ if(v.id == v1.from){ return v1; } });
              links.push({"id":v.id, "from": v.id, "to": nodes[i+1].id, "shares_perc": filter.length == 0 ? '' : filter[0].shares_perc, "nodeType": v.nodeType });
            }
          });
          that.chartData = {"nodes": nodes, "links": links};
        }
        else{
          chartData.nodes.map((v, i)=>{
            nodes.push({"id": v.id, "user": v.user, "label": v.label, "radius": v.radius, "type": v.type, "nodeType": v.nodeType, "x": pageX, "y": 250 });
            pageX = pageX + 100;
          });
          
          if(that.addNodeData.length > 0 && that.addLinksData.length > 0){
            that.addNodeData.forEach((v, i)=>{
              nodes.push(v);
            });
            that.addLinksData.forEach((v, i)=>{
              data.links.push(v);
            });
            
          }
          that.chartData = {"nodes": nodes, "links": data.links};
        }
        //加载图标 填充
        that.loadChart();
        
      });
    },
    loadChart() {
      let that = this;
      
      that.netchart = new NetChart({
        container: document.getElementById("tree-horizontal"),
        area: { height: 600 },
        data: { preloaded: that.chartData },
        navigation: {
          // mode: "showAll",
          initialNodes: that.chartByInitID
        },
        // layout:{mode:"static"},
        interaction: {
          resizing: { enabled: false },
          zooming: {
            zoomExtent: [0.1, 2],
            autoZoomExtent: [0.1, 1]
          }
        },
        style:{
          node:{display:"image", imageCropping: true},
          nodeStyleFunction: this.nodeStyle,
          linkStyleFunction: this.linkStyle,
        },
        toolbar: {
          enabled: false,
          zoomOut: true,
          zoomControl:false
        },
        credits: {
          enabled: false
        },
        events: {
          onRightClick(event, args) {
            if(args.clickNode && args.clickNode.data.label != '点击展开') {
              this.treeMenuHidden = true;
              that.menuList = event;
              that.menuShowHandle(event);
            } 
            else if(args.clickLink) {
              this.treeMenuHidden = false;
              that.menuHideHandle();
              // that.$refs.dealDetails.innerHTML = "Link menu";
            }
            else{
              this.treeMenuHidden = false;
              that.menuHideHandle();
            }
            that.preventDefault(event);
          },
          onClick(event, args) {
            if(args.clickNode && args.clickNode.data.label == '点击展开'){
              that.showMore = true;
              that.loadApi('reload');
            }
            else if(args.clickNode && event.clickNode.data.type == 'more' && event.clickNode.data.nodeType == 'up'){
              that.clickUpMoreChildHandle(event, args);
            }
            else if(args.clickNode && event.clickNode.data.type == 'more' && event.clickNode.data.nodeType == 'down'){
              that.clickDownMoreChildHandle();
            }
            else{
              this.treeMenuHidden = false;
              that.menuHideHandle();
            }

            if(event.clickLink){
              that.userDetailHandle();
            }
          }
        },
        interaction: { selection: { lockNodesOnMove: false } }
      });
    },
    //上游 第一个节点
    topNodeHandle() {
      let that = this, 
        data = {};

      //请求主节点的数据 数组类型
      that.requestHttp.AJXAGET('/up?name='+that.menuList.clickNode.id+'&type=first', {},(data)=>{
        let total = data.total;
        let menuList = that.menuList;
        data = {"nodes": data.nodes, "links": data.links};
        //为了存储每次新增的值 展开更多的时候使用
        data.nodes.map((v, i)=>{
          that.addNodeData.push(v);
        });
        data.links.map((v, i)=>{
          that.addLinksData.push(v);
        });
        
        if(data.nodes.length > 0 && that.total >= that.total){//显示更多节点
          data.nodes.push({"id":"more_"+menuList.clickNode.id, "user": "more_user_"+menuList.clickNode.id, "label":"更多", "radius": 20, "type": "more", "nodeType": "up" });
          data.links.push({"id":"more_"+menuList.clickNode.id, "from":menuList.clickNode.id, "to":"more_"+menuList.clickNode.id, "shares_perc":"", "nodeType": "up"});
        }
        else{
          data.nodes = [];
          data.links = [];
        }

        that.netchart.addData(data);
        that.menuHideHandle();
      });
    },
    //下游
    bottomNodeHandle() {
      let that = this, 
        data = {};

      //请求主节点的数据 数组类型
      that.requestHttp.AJXAGET('/down?name='+that.menuList.clickNode.id+'&type=first', {},(data)=>{
        let total = data.total;
        let menuList = that.menuList;
        
        data = {"nodes": data.nodes, "links": data.links};
        //为了存储每次新增的值 展开更多的时候使用
        data.nodes.map((v, i)=>{
          that.addNodeData.push(v);
        });
        data.links.map((v, i)=>{
          that.addLinksData.push(v);
        });

        if(data.nodes.length > 0 && that.total >= that.total){//显示更多节点
          data.nodes.push({"id":"more_"+menuList.clickNode.id, "user": "more_user_"+menuList.clickNode.id, "label":"更多", "radius": 20, "type": "more", "nodeType": "up" });
          data.links.push({"id":"more_"+menuList.clickNode.id, "from":menuList.clickNode.id, "to":"more_"+menuList.clickNode.id, "shares_perc":"", "nodeType": "up"});
        }
        else{
          data.nodes = [];
          data.links = [];
        }

        that.netchart.addData(data);
        that.menuHideHandle();
      });
    },
    //上游 点击更多
    clickUpMoreChildHandle(event, args) {
      let that = this, 
        data = {};
      
      //请求主节点的数据 数组类型
      that.requestHttp.AJXAGET('/up?name='+that.menuList.clickNode.id+'&type=last', {},(data)=>{
        this.netchart.removeData({nodes:[{id:event.clickNode.id}]});
        
        data = {"nodes": data.nodes, "links": data.links};

        //为了存储每次新增的值 展开更多的时候使用
        data.nodes.map((v, i)=>{
          that.addNodeData.push(v);
        });
        data.links.map((v, i)=>{
          that.addLinksData.push(v);
        });

        that.netchart.addData(data);
        that.menuHideHandle();
      });
    },
    //下游 点击更多
    clickDownMoreChildHandle(event, args) {
      let that = this, 
        data = {};

      //请求主节点的数据 数组类型
      that.requestHttp.AJXAGET('/down?name='+that.menuList.clickNode.id+'&type=last', {},(data)=>{
        this.netchart.removeData({nodes:[{id:event.clickNode.id}]});
        
        data = {"nodes": data.nodes, "links": data.links};

        //为了存储每次新增的值 展开更多的时候使用
        data.nodes.map((v, i)=>{
          that.addNodeData.push(v);
        });
        data.links.map((v, i)=>{
          that.addLinksData.push(v);
        });

        that.netchart.addData(data);
        that.menuHideHandle();
      });
    },
    nodeStyle(node){
      if(node.data.radius == 35 && node.data.type != "more" && node.data.nodeType == "path"){
        node.image = "../static/" + node.data.nodeType + '_' + node.data.type + "_max.png";
      }
      else if(node.data.radius == 20 && node.data.type != "more" && node.data.nodeType == "path"){
        node.image = "../static/" + node.data.nodeType + '_' + node.data.type + "_min.png";
      }
      else{
        node.image = "../static/" + node.data.nodeType + '_' + node.data.type + ".png";
      }
      
      node.label = node.data.label;
      node.radius = node.data.radius;
      if(node.data.color) {
        node.labelStyle.textStyle.font = "18px Comic Sans";
      }
    },
    linkStyle(link){
      link.radius = 1; // 带箭头线的大小
      link.label = link.data.shares_perc;
      link.labelStyle.backgroundStyle = {fillColor:"#f9f9f9"};//transparent

      //
      if(link.data.nodeType == "up"){
        link.fromDecoration="arrow";
        link.fillColor = "#FBCB56";
      }
      else if(link.data.nodeType == "down"){
        link.toDecoration="arrow";
        link.fillColor = "#9BB5FB";
      }
      else{
        link.toDecoration="arrow";
      }
    },
    menuHideHandle(){
      this.$refs['dealDetails'].style.display = "none";
      this.$refs['dealDetails'].style.left = "0px";
      this.$refs['dealDetails'].style.top = "0px";
    },
    menuShowHandle(event){
      this.menuList = event;
      this.$refs['dealDetails'].style.display = "block";
      this.$refs['dealDetails'].style.left = event.pageX + "px";
      this.$refs['dealDetails'].style.top = event.pageY + "px";
    },    
    userDetailHandle(){
      this.showDialog = true;
      this.menuHideHandle();
    },
    closeHandle(v){
      this.showDialog = v;
    },
    //删除子节点id
    menuHiddenHandle(val){
      let event = val.menuList;
      this.netchart.removeData({nodes:[{id:event.clickNode.id}]});
    },
    preventDefault(e) {
      e.preventDefault();
    }
  }

}
</script>

<style scope>
.tree-container{
  width: 100%;
  margin: 10px 10px;
  /* border: 1px solid #2D2D2D; */
  /* overflow: auto; */
  background-color: #f9f9f9;
}

#tree-horizontal{
  vertical-align: middle;
  text-align: center;
  width: 100%;
}

.treeNode-container{
  width: 150px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
}

/* 右键菜单样式 */
.dealDetails{
  width: 130px;
  position: fixed; 
  text-align: center;
  font-size: .5rem;
  background-color: #FFFFFF;
  border: 1px solid #EAEAEA;
  border-bottom: 0;
  box-shadow: #B0B1B2 0 0 10px;
  z-index: 9999;
  border-radius: 2px; 
}
.dealDetails div{
  color:#FB733E;
  margin: 15px 15px;
  padding: 4px;
  background-color: #FFFFFF;
  border: 1px solid #FB733E;
  border-radius: 2px; 
}
.dealDetails div:hover, .dealDetails div:active{
  cursor: default;
  color:#FFFFFF;
  background-color: #FB733E;
}

/* 弹出title */
.titleDetail{
  position: fixed; 
  font-size: 12px;
  color: #000000;
  background-color: #FEFEFE;
  border: 1px solid #EDF1F1;
  text-align: center;
  z-index: 20;
}

.fullScreenContainer{
  position: fixed;
  width: 100%;
  height: 30px; 
  z-index: 100;
}
.fullScreenContainer .fullScreen{
  background-image: url(../assets/images/full.png);
  width: 30px;
  height: 30px;
  background-size: 100% 100%;    
  float: right;
  margin-right: 10px;
}

.fullScreenContainer .fullScreenNon{
  background-image: url(../assets/images/quitFull.png);
  width: 30px;
  height: 30px;
  background-size: 100% 100%;    
  float: right;
  margin-right: 10px;
}

.modal{
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0; 
  z-index: 9999;
  background-color: #000;
  transition: opacity 0.3s;
}

/* loading */
.el-loading-spinner {
  top: 50%;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 9999;
}
.el-loading-spinner .circular {
  height: 42px;
  width: 42px;
  animation: loading-rotate 2s linear infinite;
}
@keyframes loading-rotate {
  100% {
    transform: rotate(360deg); 
  } 
}
.el-loading-spinner .path {
  animation: loading-dash 1.5s ease-in-out infinite;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-width: 2;
  stroke: #409EFF;
  stroke-linecap: round;
}
@keyframes loading-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0; 
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40px; 
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120px; 
  } 
}

/* 公共样式 */


</style>