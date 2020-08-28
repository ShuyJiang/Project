const URL = 'http://localhost:5000/api/values';
// Used to display only one loading layer
var myChart = echarts.init(document.getElementById('main'));
var DivArray = []; // Record the ID of div
var Studys = []; 
var DATASET = {};

$(function(){
  // The register button searches for events
  $('#btnSearch').click(function(event) {
    event.preventDefault();
    var option = {};
    var chemicalid = $('#Chemical').val();
    if(chemicalid && chemicalid.length > 0){
      $.ajax({
        url: URL+'?chemicalid='+chemicalid,
        type: 'get',
        dataType: 'json',
        beforeSend: function(){
          myChart.showLoading();
        },
        success: function(jsondata){
          // 组织option
          if(jsondata.code == '2001'){
            // Real and valid data
            // Group by Study. Create as many divs as there are studies to show the line graph
            let realStudy = [];
            for(let i=0;i<jsondata.chemical.studyViews.length;i++){
              if(jsondata.chemical.studyViews[i].observationViews.length>0){
                // Remove the empty ones
                realStudy.push(jsondata.chemical.studyViews[i]);
              }
            }
            jsondata.chemical.studyViews = realStudy;
            DATASET = jsondata;
            // Group query criteria
            GroupQuery(jsondata.chemical.studyViews);
            CreateDivByCount(jsondata.chemical.studyViews.length);
            DrawEchartWithOption(jsondata.chemical);
          } else {
            alert(jsondata.msg);
          }

          myChart.hideLoading();
          

        }
      });
    }
  });
});

$('#btnGroup').click(function(e){
  e.preventDefault();
  CreateDivByCount(1);
  var studyobj = [DATASET.chemical.studyViews[$('#Study').val()]];
  // Make a deep copy to prevent filtering conditions from corrupting the data source
  var obj = JSON.parse(JSON.stringify(DATASET.chemical));
  obj.studyViews = studyobj;
  var type = $('#TumourType').val();
  var site = $('#TumourSite').val();
  DrawEchartWithOption(obj,type,site);
});



//  Dynamically render configuration items
function DrawEchartWithOption(jsondata,type,site) {
  for(let i = 0;i < jsondata.studyViews.length; i++){
    let studyView = jsondata.studyViews[i];
    let xData = GetXAxisData(studyView,type,site);
    let yData = GetYAxisData(studyView,type,site);
    let options = {
      title: {
        text: "StudyID:"+studyView.studyID+""+studyView.species,
        left: "center",
        top: "center",
        textStyle: {
          fontSize: 20
        }
      },
      tooltip: {
          trigger: 'axis'
      },
      legend: {

      },
      grid: {
          left: '10',
          right: '20',
          bottom: '4%',
          containLabel: true
      },
      toolbox: {
          feature: {
              saveAsImage: {}
          }
      },
      xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xData
      },
      yAxis: {
          type: 'value'
      },
      series: yData
    }
    let myChart = echarts.init(document.getElementById('item'+i));
    myChart.setOption(options);
  }
}

function GetXAxisData(studyView,type,site) {
  let ret = [];
  if(type != null && type != undefined && site != null && site != undefined){
    var temparr = [];
    studyView.observationViews.forEach(function(val) {
      if((val.tumourType == type || type == 'All') && (val.tumourSite == site || site == 'All')){
        temparr.push(val);
      }
    });
    for (let i =0;i < temparr.length;i++){
      let temp = temparr[i];
      for(let j =0;j<temp.doseRespViews.length;j++){
        if(ret.length==0 || ret.toString().indexOf(temp.doseRespViews[j].dose) == -1){
          ret.push(temp.doseRespViews[j].dose);
        }
      }
    }
  } else {
    for (let i =0;i < studyView.observationViews.length;i++){
      let temp = studyView.observationViews[i];
      for(let j =0;j<temp.doseRespViews.length;j++){
        if(ret.length==0 || ret.toString().indexOf(temp.doseRespViews[j].dose) == -1){
          ret.push(temp.doseRespViews[j].dose);
        }
      }
    }
  }
  return ret;
}

function GetYAxisData(studyView,type,site) {
  let ret = [];
  if(type != null && type != undefined && site != null && site != undefined){
    var temparr = [];
    studyView.observationViews.forEach(function(val) {
      if((val.tumourType == type || type == 'All') && (val.tumourSite == site || site == 'All')){
        temparr.push(val);
      }
    });
    for (let i =0;i < temparr.length;i++){
      let temp = temparr[i];
      let arr = [];
      let obj = {};
      for(let j =0;j<temp.doseRespViews.length;j++){
        arr.push(temp.doseRespViews[j].withTumours);
      }
      let color = GetColor();
      obj = {
        name: temp.obsResult,
        type: 'line',
        data: arr,
        smooth: true,
        lineStyle: {
          color: color
        }
      }
      ret.push(obj);
    }
  } else {
    for (let i =0;i < studyView.observationViews.length;i++){
      let temp = studyView.observationViews[i];
      let arr = [];
      let obj = {};
      for(let j =0;j<temp.doseRespViews.length;j++){
        arr.push(temp.doseRespViews[j].withTumours);
      }
      let color = GetColor();
      obj = {
        name: temp.obsResult,
        type: 'line',
        data: arr,
        smooth: true,
        lineStyle: {
          color: color
        }
      }
      ret.push(obj);
    }
  }
  return ret;
}

function GroupQuery(studyView) {
  for(let i = 0;i<studyView.length;i++){
    var tempobj = {'StudyID': studyView[i].studyID,'Types':[],'Sites':[]};
    var TumourTypes = ['All']; // Statistical TumourType
    var TumourSites = ['All']; // Statistical TumourSite
    for(let j =0;j<studyView[i].observationViews.length;j++){
      var type = studyView[i].observationViews[j].tumourType;
      if(TumourTypes.indexOf(type) == -1){
        TumourTypes.push(type);
      }
      var site = studyView[i].observationViews[j].tumourSite;
      if(TumourSites.indexOf(site) == -1){
        TumourSites.push(site)
      }
    }
    tempobj.Types = TumourTypes;
    tempobj.Sites = TumourSites;
    Studys.push(tempobj);
  }

  $('#Study').html('');
  $('#TumourType').html('');
  $('#TumourSite').html('');
  Studys.forEach(function(value,index) {
    $('#Study').append('<option value="'+index+'">'+value.StudyID+'</option>');
    if(index == 0){
      value.Types.forEach(function(type){
        $('#TumourType').append('<option value="'+type+'">'+type+'</option>')
      })
      value.Sites.forEach(function(site){
        $('#TumourSite').append('<option value="'+site+'">'+site+'</option>')
      })
    }
  });
}

$('#Study').change(function (){
  $('#TumourType').html('');
  $('#TumourSite').html('');
  var stuIndex = $('#Study').val();
  Studys[stuIndex].Types.forEach(function(value,i){
    $('#TumourType').append('<option value="'+value+'">'+value+'</option>')
  })
  Studys[stuIndex].Sites.forEach(function(value,i){
    $('#TumourSite').append('<option value="'+value+'">'+value+'</option>')
  })
});

function CreateDivByCount(count) {

  $('#main').html('');
  for(let i =0;i<count;i++){
    $('#main').append('<div class="item" id="item'+i+'"></div>');
    DivArray.push('item'+i);
  }
}

function GetColor (){
  var a,b = [],c="#" ;
  for(var i=0;i<6;i++){
    a = Math.ceil( Math.random()*16).toString(16).toLocaleUpperCase();
    b[i] = a; 
    c += b[i]; 
  } 
  c = c.substr(0,7)
  return c
}

