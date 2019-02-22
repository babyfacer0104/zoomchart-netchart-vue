<template>
  <div class="tree-container" :style="{height: treeHeight}">
    <div v-if="modalHidden" class="modal" :style="{height: treeHeight}"></div>
    <!-- 点击全屏按钮 -->
    <div class="fullScreenContainer">
       <div :class="fullScreen" @click="clickFullScreenHandle()"></div> 
    </div>

    <div v-if="modalHidden" class="el-loading-spinner"><svg viewBox="25 25 50 50" class="circular"><circle cx="50" cy="50" r="20" fill="none" class="path"></circle></svg></div>

    <div v-if="reFresh" ref="treeHorizontal" class="tree-horizontal" @click="triggerMenuHandle()">

      <div v-for="(item, index) in chartData" :key="item.id">
        <vo-basic v-if="index == 0 || (index+1) == dataLength" ref="treeNode" :data="item" :direction="direction" chartClass="treeNode treeBasic" :toggleCollapse="false"></vo-basic>
        
        <!-- 点击更多展示 -->
        <template v-else-if="!reFreshMore">
          <vo-basic v-if="index == limitCount/2 && dataLength > limitCount" ref="treeNode" nodeTitle="aliasName" :data='item' :direction="direction" chartClass="treeNodeByElse treeBasic fontColor"></vo-basic>   
          <vo-basic v-else-if="index != limitCount/2 && index < limitCount && dataLength > limitCount" ref="treeNode" :data="item" :direction="direction" chartClass="treeNodeByElse treeBasic" :toggleCollapse="false"></vo-basic>               
        </template>

        <!-- 展示中间部分所有路径 -->
        <vo-basic v-else-if="reFreshMore" ref="treeNode" :data="item" :direction="direction" chartClass="treeNodeByElse treeBasic" :toggleCollapse="false"></vo-basic>
      </div>
    </div>

    <!--右键菜单-->
    <div v-if="treeMenuHidden" class="dealDetails" :data="menuList" :style="{top: offseTop, left: offsetLeft}">
      <div @click="userDetailHandle()">账号详情</div>
      <div @click="topNodeHandle($data)">上游交易对手</div>
      <div @click="bottomNodeHandle($data)">下游交易对手</div>
      <div @click="viewMoreHandle()">查看更多</div>
      <div @click="reverseSortHandle()">倒序排列</div>
      <div @click="menuHiddenHandle($data)">隐藏</div>
    </div>

    <!-- title浮窗显示全 -->
    <div v-if="titleDetailHidden && offseTop>0" class="titleDetail" :style="{top: offseTop, left: offsetLeft}">
      <div style="padding: 10px;">{{titleDetail}}</div>
    </div>

  </div>
  
</template>
 
<script>
import { VoBasic } from 'vue-orgchart'

export default {
  name: 'index',
  data() {
    return {
      modalHidden: false,

      fullScreen: 'fullScreen', //fullScreen fullScreenNon
      treeHeight: '400px',

      //title浮窗显示全部
      titleDetail: '',
      titleDetailHidden: false,

      reFresh:true, //强制重新渲染 得改
      // reFresh: [true, true, true, true, true, false],
      
      chartData: {}, //主节点的数据 对象类型
      dataLength: 0,

      chartDataByDown: [], //下节点的数据 数组类型
      chartDataByUp: [], //上节点的数据 数组类型
      childLevelNum: 1,//层级多少层 

      //右键菜单显示/隐藏
      treeMenuHidden: false,

      menuList: '',

      //鼠标定位
      offseTop: 0,
      offseBottom: 0,
      offsetLeft: 0,
      offsetRight: 0,
      
      direction: 't2b', //t2b下 b2t上
      
      moreFlag: '点击更多',//点击更多
      reFreshMore: false,

      limitCount: 4, //只展示五个路径，多得只展示更多。。。
      loading: false,
    }
  },
  components: { 
    VoBasic
  },
  created () {
   this.loadApi();
  },
  mounted() {},
  methods: {
    //数据 图表初始化
    loadInit() {
      let that = this;
      
      setTimeout(()=>{
        let eleNode = document.getElementsByClassName('treeBasic');
        let chartData = that.chartData;

        for(let i=0;i<chartData.length;i++){
          //主节点鼠标右键处理
          eleNode[i].oncontextmenu = (e)=>{
            e.preventDefault();
          };
          eleNode[i].addEventListener('contextmenu', (e) => {
            if(e.target.innerText == "点击更多"){
              return false;
            } 
            that.mouseRightHandle(e);
          }); 
          
          eleNode[i].addEventListener('click', (e) => {
            if(e.target.innerText == "点击更多"){
              that.clickMoreHandle(e);
            }
          });
          
          //浮层-title显示
          document.querySelectorAll('table .title').forEach((v, i)=>{
            v.addEventListener('mouseover', (e) => {
              //title显示和右键菜单有冲突 只能显示一种，把treeMenuHidden去掉再加判断
              if(e.target.innerText != '' && !that.treeMenuHidden){
                that.titleDetail = e.target.innerText;
                that.offseTop = e.clientY+'px';
                that.offsetLeft = e.clientX+'px';
                setTimeout(()=>{
                  that.titleDetailHidden = true;
                }, 500);
              }
            });
          });
          //浮层-title消失
          document.querySelectorAll('table .title').forEach((v, i)=>{
            v.addEventListener('mouseout', (e) => {
              if(!that.treeMenuHidden){
                that.titleDetail = '';
                that.offseTop = 0;
                that.offsetLeft = 0;
                that.titleDetailHidden = false;
              }
            });
          });
          
          //最后一个主节点 不加箭头 跳过
          if(i == eleNode.length-1){
            return false;
          }

          let divLine = document.createElement('div'), divArrow = document.createElement('i');

          //判断图表方向 只有上游和下游 走上游需要换另一个样式 transform
          if(that.direction == 'b2t'){
            divLine.classList.add('treeLineB2t');//添加箭头
          }
          else{
            divLine.classList.add('treeLine');//添加箭头
          }
          divLine.classList.add('treeLine');//添加箭头
          divLine.innerHTML=chartData[i].amount_data[0];//价格填补上去

          divArrow.classList.add('treeLineArrow');

          eleNode[i].append(divLine);
          eleNode[i].append(divArrow);
        }

      }, 300);
    },
    //主路径API
    loadApi() {
      let that = this;
      //请求主节点的数据 数组类型
      that.requestHttp.AJXAGET('../static/json/path_sample.json', {},(data)=>{
        that.chartData = data.shortestPath;
        that.dataLength = data.shortestPath.length;

        //暂时在数据添加更多节点方式 写法添加在vue元素 会有问题，vo-basic自动添加
        if(that.chartData.length > that.limitCount){
          that.chartData[2]['aliasName'] = '点击更多';
        }
        //初始值加载
        that.loadInit();
      });
    },
    //鼠标右键 获取节点具体对象
    mouseRightHandle(v) {
      this.menuList = v.target.parentNode.dataset.source; //存放每个节点的所有children数据
      this.offseTop = v.clientY+'px';
      this.offsetLeft = v.clientX+'px';
      this.treeMenuHidden = true;
    },
    //下游事件
    bottomNodeHandle(event) {
      let that = this;
      let model = JSON.parse(event.menuList);

      //清空之前 下游的children数据
      if(that.direction == 'b2t'){
        that.direction = 't2b';
        that.chartData.map((v, i)=>{
          v.children = [];
        });
      }
      that.treeMenuHidden = false;

      if(model.name == '更多'){
        return false;
      }

      //开发用的 需要删掉
      let api = '../static/json/down_samples.json';
      if(model.parentId > 0){ api = '../static/json/down_samples1.json'; }

      //请求子节点下游数据
      that.requestHttp.AJXAGET(api, {id: model.start_node},(data)=>{
        that.fnLispChartDataByAdd(that.chartData, data.down, model);
      });
    },
    //上游事件
    topNodeHandle(event) {
      let that = this;
      let model = JSON.parse(event.menuList);

      //清空之前 下游的children数据
      if(that.direction == 't2b'){
        that.direction = 'b2t';
        that.chartData.map((v, i)=>{
          v.children = [];
        });
      }
      
      that.treeMenuHidden = false;

      if(model.name == '更多'){
        return false;
      }

      //开发用的 需要删掉
      let api = '../static/json/up_samples.json';
      if(model.parentId > 0){ api = '../static/json/up_samples1.json'; }

      //请求子节点下游数据
      that.requestHttp.AJXAGET(api, {id: model.start_node},(data)=>{
        that.fnLispChartDataByAdd(that.chartData, data.up, model);
      });
    },
    menuHiddenHandle(event) {
      let that = this;
      let model = JSON.parse(event.menuList);

      //删除所有子节点数据
      that.fnLispChartDataByDel(that.chartData, model);
      that.treeMenuHidden = false;//隐藏
    },
    //递归数据 添加
    fnLispChartDataByAdd(chartModel, down, model){
      let that = this;
      that.chartDataByDown = down;

      if(model.parentId == undefined){//最高级别
        chartModel.map((v, i)=>{
          //model.start_node当前点击路径节点！
          if(v.start_node == model.start_node){//主路径点击请求后端直接添加在当前父节点上 判断不了parent_node
            if(v.children.length==0){
              that.childLevelNum++; 
              v.children = that.chartDataByDown;
              v.children.push({'name': '更多', nodeLevel: that.childLevelNum, parent_node: v.start_node, children: []});
              //强制刷新
              that.refreshHandle();
            }
          }
        });
      }
      else if(model.parentId > 0){//递归级别
        //一直递归找到parent_node父级 然后在父级children增加节点
        let parentList = chartModel.filter((v, i)=>{
          if(v.start_node == model.parent_node && v.children.length > 0){
            that.fnLispChartDataByAdd(v.children, down, model);
          }
          else if(v.start_node == model.start_node && v.children.length==0){
            that.childLevelNum++;
            v.children = that.chartDataByDown;
            v.children.push({'name': '更多', nodeLevel: that.childLevelNum, parent_node: v.start_node, children: []});
            //强制刷新
            that.refreshHandle();
          }
        });
      }
    },
    //递归数据 删除
    fnLispChartDataByDel(chartModel, model){
      let that = this;
      if(chartModel.length  == 0){
        return false;
      }
      //递归级别
      //一直递归找到parent_node父级 然后在父级children增加节点
      let parentList = chartModel.filter((v, i)=>{ 
        if(v.start_node == model.parent_node && v.children.length > 0){
          that.childLevelNum = that.childLevelNum - 1;//改成初始化
          v.children = [];
          //强制刷新
          that.refreshHandle();
        }
        else if(v.children.length>0){
          that.fnLispChartDataByDel(v.children, model);
        }
      });
    },
    //点击更多
    clickMoreHandle() {
      this.reFreshMore = true;
      this.refreshHandle();
    },
    //隐藏菜单事件
    triggerMenuHandle() {
      this.treeMenuHidden = false;
    },
    //强制刷新
    refreshHandle(){
      let that = this;
      that.reFresh=false;
      // let tree = document.querySelector('.modalHidden');

      // tree.classList.add('modal');
      that.modalHidden = true;
      that.titleDetailHidden = false;

      let pro = new Promise((resolve, reject)=>{
        setTimeout(()=>{
          that.reFresh= true;
          that.loadInit();
          resolve();   
        }, 300);
        
      }).then((res)=>{
        setTimeout(()=>{
          // tree.classList.remove('modal');
          that.modalHidden = false;
        }, 1000);     
      });
    },
    //全屏 fullScreen fullScreenNon
    clickFullScreenHandle() {
      if(this.fullScreen == 'fullScreen'){
        this.fullScreen = 'fullScreenNon';
        this.treeHeight = window.screen.height+'px';
      }
      else{
        this.fullScreen = 'fullScreen';
        this.treeHeight = '400px';
      }
    }
  }

}
</script>

<style scope>
.tree-container{
  width: 100%;
  margin: 10px 10px;
  border: 1px solid #2D2D2D;
  overflow: auto;
}

.tree-horizontal{
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
/* 父节点 */
.treeNode .node .title{
  width: 75px;
  height: 75px;
  margin: 0 auto;
  line-height: 6.0;
  border-radius: 50px;
  font-weight: bold;
  text-align: center;
  text-decoration: none;
  color: #fff;
  background: #3b9dfb;
}
/* 中间父节点灰色圈 */
.treeNodeByElse .node .title{
  width: 65px;
  height: 65px;
  margin: 0 auto;
  line-height: 5.0;
  border-radius: 50px;
  font-weight: bold;
  text-align: center;
  text-decoration: none;
  color: #fff;
  background: #E4E5E7;
}

/* 子节点 */
.treeNode .nodes .title, .treeNodeByElse .nodes .title{
  width: 40px;
  height: 40px;
  line-height: 3.5;
  border-radius: 50px;
  text-align: center;
  color: #000;
  background: #E4E5E7;
  font-weight: 0;
}

.treeNode .nodes .node .title, .treeNodeByElse .nodes .node .title{
  font-weight: 100;
}

.treeLine{
  width: 150px;
  height: 1px;
  position: relative;
  background-color: #1f2123;
  margin: 55px 0 0 5px;
}
.treeLineB2t{
  width: 100px;
  height: 1px;
  position: relative;
  background-color: #1f2123;
  margin: 55px 0 0 5px;
  transform: rotateX(-180deg); 
}


/* 箭头样式 */
.treeLineArrow{
  width: 0;
  height: 0;
  margin: 51px 0;
  border-width: 4px;
  border-style: solid;
  border-color: transparent transparent transparent #1f2123;
}

/* 右键菜单样式 */
.dealDetails{
  position: fixed; 
  font-size: 12px;
  color: #000000;
  background-color: #FEFEFE;
  border: 1px solid #EDF1F1;
  border-bottom: 0;
  z-index: 100;
  text-align: center;
  box-shadow: #B0B1B2 0 0 10px;
}
.dealDetails div{
  width: 90px;
  border-bottom: 1px solid #EDF1F1;
  padding: 5px 8px;
  color: #7D7F98
}
.dealDetails div:hover{
  cursor: default;
  color:#7EB6EC
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

.fontColor .node .title{
  color: #000;
}

.modal{
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0; 
  background-color: #000;
  /* opacity: 0.8;  */
  z-index: 9999; 
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


/*公共样式  覆盖图表样式 最高节点ID样式 */
#chart-container{
  width: 100%;
  display: flex;
  justify-content: center;
}

.orgchart {
  min-width: 0;
  display: flex;
}

.orgchart.b2t {
  min-width: 0;
  display: flex;
  transform: rotateX(180deg) rotateY(0deg);
}

.orgchart.b2t .node .title{
  transform: rotateX(180deg);
}

.orgchart .node{
  width: 100%;
}

.orgchart.b2t .node .title{
  transform-origin: center;
}

.orgchart .node.focused, .orgchart .node:hover{
  background-color: transparent; 
}

.treeNode .node .title:hover{
  box-shadow: #3b9dfb 0 0 5px;
  opacity: 0.9;
}
.treeNodeByElse .node .title:hover{
  box-shadow: #E4E5E7 0 0 5px;
  opacity: 0.9;
}
.treeNode .nodes .title:hover, .treeNodeByElse .nodes .title:hover{
  box-shadow: #E4E5E7 0 0 10px;
  opacity: 0.9;
}
/*公共样式  覆盖图表样式 最高节点ID样式 END */



</style>