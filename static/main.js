//
//  main.js
//
//  A project template for using arbor.js
//
// Instantiate a slider

var changehide= function(){
    $("#viewport").show();
    $(".slider").show();
    $("#search_show").hide();
}
$("#search_button").click(function(){

  var search_text = $("#search_text").val(); ;
  console.log(search_text);
    $("#viewport").hide();
    $(".slider").hide();
    $("#search_show").show();
  $.ajax({
            url: '/search',
            data: {keyword:search_text},
            datatype : 'json',
            type: 'post',
            success: function(response) {
                console.log(response);
            },
            error: function(error) {
                console.log(error);
            }
        });
});
var changetime = function(value) {
  
  if(slider.getValue() != v){
    console.log(v);
    for(var j = (v-1)*8+1; j <= v*8; j++)
      sys.pruneNode(j);
  v = slider.getValue();
  console.log(v);
  for(var j = (v-1)*8+1; j <= v*8; j++)
    sys.addNode(j,{alone:true, mass:.85,shape:"dot",heat:hot_topic.heat[j],topicname:hot_topic.topic[j]});
  console.log(v);
  /*$.ajax({
            url: '/',
            data: v,
            type: 'POST',
            success: function(response) {
                console.log(response);
            },
            error: function(error) {
                console.log(error);
            }
        });*/
  }
};
var slider = new Slider("#ex11", {
  step: 1,
  min: 1,
  max: 6,
  value: 1,
  tooltip: 'show',
  handle:'custom',
  formatter: function(value) {
    if(value == 1)return 'One Year ' ;
    else if(value == 2) return 'Half A Year'
    else if(value == 3) return 'Three Months';
    else if(value == 4) return 'One Month'
    else if(value == 5) return 'Two Weeks'
    else if(value == 6) return 'One Week'
  },

})
    .on('slide', changetime);



    
(function($){

  var Renderer = function(canvas){
    var canvas = $(canvas).get(0)
    var ctx = canvas.getContext("2d");
    var gfx = arbor.Graphics(canvas)
    var particleSystem


    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(canvas.width, canvas.height) 
        particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side
        
        // set up some event handlers to allow for node-dragging
        that.initMouseHandling()
      },
      
      redraw:function(){
        // 
        // redraw will be called repeatedly during the run whenever the node positions
        // change. the new positions for the nodes can be accessed by looking at the
        // .p attribute of a given node. however the p.x & p.y values are in the coordinates
        // of the particle system rather than the screen. you can either map them to
        // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
        // which allow you to step through the actual node objects but also pass an
        // x,y point in the screen's coordinate system
        // 
        ctx.fillStyle = "white"
        ctx.fillRect(0,0, canvas.width, canvas.height)
        
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          // draw a line from pt1 to pt2
          ctx.strokeStyle = "rgba(0,0,0, .333)"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pt1.x, pt1.y)
          ctx.lineTo(pt2.x, pt2.y)
          ctx.stroke()
        })

        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords

          // draw a rectangle centered at pt
          var w = node.data.heat*4 + 40;
          ctx.beginPath();
          ctx.arc(pt.x,pt.y,w/2,0,360,false);
          ctx.fillStyle=(node.data.alone) ? "orange" : "grey";//填充颜色,默认是黑色
          ctx.fill();//画实心圆
          ctx.closePath();
          gfx.text(node.data.topicname, pt.x, pt.y+7, {color:"white", align:"center", font:"Arial", size:10})
          //ctx.fillStyle = (node.data.alone) ? "orange" : "black"
          //ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w)
        })          
      },
       switchMode:function(e){
        console.log('swm');
        if (e.mode=='hidden'){
          dom.stop(true).fadeTo(e.dt,0, function(){
            if (sys) sys.stop()
            $(this).hide()
          })
        }else if (e.mode=='visible'){
          dom.stop(true).css('opacity',0).show().fadeTo(e.dt,1,function(){
            that.resize()
          })
          if (sys) sys.start()
        }
      },
      
      switchSection:function(newSection){
        var parent = sys.getEdgesFrom(newSection)[0].source
        var children = $.map(sys.getEdgesFrom(newSection), function(edge){
          return edge.target
        })
        
        sys.eachNode(function(node){
          if (node.data.shape=='dot') return // skip all but leafnodes

          var nowVisible = ($.inArray(node, children)>=0)
          var newAlpha = (nowVisible) ? 1 : 0
          var dt = (nowVisible) ? .5 : .5
          sys.tweenNode(node, dt, {alpha:newAlpha})

          if (newAlpha==1){
            node.p.x = parent.p.x + .05*Math.random() - .025
            node.p.y = parent.p.y + .05*Math.random() - .025
            node.tempMass = .001
          }
        })
      },
      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;
        selected = null;
        nearest = null;
        var ppoint=null;
        var dragged = null;
        var oldmass = 1;
        var _section = null;
        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
        
          moved:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            nearest = sys.nearest(_mouseP);
            
            if (!nearest.node) return false
            selected = (nearest.distance < 50) ? nearest : null
            if(selected){
              
             // $.ajax({
                //console.log('2');
            //url: '/index',
            //data: nearest.node.name
            //type: 'POST',
            //success: function(response) {
            //    console.log(response);
            //},
            //error: function(error) {
            //    console.log(error);
            //}
        //});

              if(nearest.node.name!=_section){
                console.log('1');
              _section = nearest.node
              var count = nearest.node.name
              console.log(count)
              for(var j= 11; j<= 12; j++)
                {
                  sys.addNode(j,{alone:false, mass:.85,shape:"dot",heat:related_topic.heat[j-10],topicname:related_topic.name[j-10]});
                  sys.addEdge(j,count)
                }
              //Edge2 = sys.addEdge(_section,13)
              //Edge3 = sys.addEdge(_section,14)
              
            }
              //sys.pruneNode(11);
              

            }
            else{
              for(var j= 11; j<= 12 ; j++)
                sys.pruneNode(j);
                }
          
            return false
          },
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true
            }

            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dragged:function(e){
            //console.log('1');
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }
        
        // start listening
        $(canvas).mousemove(handler.moved);
        $(canvas).mousedown(handler.clicked);

      },
      
    }
    //$("#ex11").slider({step: 20000, min: 0, max: 200000});
    return that;
  }    

  $(document).ready(function(){
    sys = arbor.ParticleSystem(100, 15, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport")
    $("#search_show").hide();
     // our newly created renderer will have its .init() method called shortly by sys...
    var n = 8;
    for( i = 1; i <= 8 ;i ++){
      sys.addNode(i,{alone:true, mass:.85,shape:"dot",heat:hot_topic.heat[i],topicname:hot_topic.topic[i]});
    }
    v=1;
    //sys.addEdge(3,4)
     /*sys.graft({
       nodes:{
         for(var i = 1; i <= 10 ; i++)
          i:{alone:true, mass:.55},
       }
       edges:{
         a:{ b:{},
             c:{},
             d:{},
             e:{}
         }
       }
     })*/
    
  })

})(this.jQuery)
var hot_topic = {
    topic : new Array(),
    heat: new Array(),
    related_topic_num :new Array(),
  }
  hot_topic.topic = [0,"1212",2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
  hot_topic.heat = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
  hot_topic.related_topic_num[0,3,4]
var related_topic ={
  name: new Array(),
  heat: new Array(),
}
related_topic.name = [0,1,1,1,null,null,2,2,2,2,null];
related_topic.heat = [0,1,1,1,null,null,2,2,2,2,null];
var changedata = function(){
  var hot_topic = {
    topic : new Array(),
    heat: new Array(),
    related_topic_num: new Array(),
    related_topic:new Array(),
  }
  topic = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
  heat = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
  related_topic_num = [];
  related_topic = [];
}