//
//  main.js
//
//  A project template for using arbor.js
//
$(function(){  
  
    var currentValue = $('#currentValue');  
  
    $('#defaultSlider').change(function(){  
        currentValue.html(this.value);  
    });  
  
    // Trigger the event on load, so  
    // the value field is populated:  
  
    $('#defaultSlider').change();  
  
});  
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
          var w = 50
          ctx.beginPath();
          ctx.arc(pt.x,pt.y,w/2,0,360,false);
          ctx.fillStyle=(node.data.alone) ? "orange" : "grey";//填充颜色,默认是黑色
          ctx.fill();//画实心圆
          ctx.closePath();
          gfx.text('H', pt.x, pt.y+7, {color:"black", align:"center", font:"Arial", size:10})
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
              if(nearest.node.name!=_section){
                console.log('1');
              _section = nearest.node
              Edge = sys.addEdge(_section,11)
              Edge1 = sys.addEdge(_section,12)
              //Edge2 = sys.addEdge(_section,13)
              //Edge3 = sys.addEdge(_section,14)
              
            }
              //sys.pruneNode(11);
            }
            else{
              for(var i = 11; i <= 12 ;i++)
                  sys.pruneNode(i);
            }
           /* if (nearest.node.data.shape !='ndot'){
              console.log('dot');
              selected = (nearest.distance < 50) ? nearest : null
              if (selected){
                dom.addClass('linkable')
                 window.status = selected.node.data.link.replace(/^\//,"http://"+window.location.host+"/").replace(/^#/,'')
              //Edge = sys.addEdge(1,11)
              }
              else{
                 dom.removeClass('linkable')
                 window.status = ''
              }
            }
            else if ($.inArray(nearest.node.name, ['arbor.js','code','docs','demos']) >=0 ){
              console.log('dot');
              if (nearest.node.name!=_section){
                _section = nearest.node
                that.switchSection(_section)
                //Edge = sys.addEdge(_section,11)
              }
              dom.removeClass('linkable')
              window.status = ''
              //sys.pruneEdge(Edge);
            }*/
            
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
    return that
  }    
/*$("Button").click(function(){
  sys.pruneNode(10)
  sys.pruneNode(9)
  });*/
/*$(viewport).hover(
  function(){
  Edge = sys.addEdge(1,11)
  Edge1 = sys.addEdge(1,12)
},
function(){
 // Edge = getEdges(1,2);
  sys.pruneNode(11)
  sys.pruneNode(12)
}
);*/
  $(document).ready(function(){
    sys = arbor.ParticleSystem(100, 15, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

    // add some nodes to the graph and watch it go...
    //sys.addEdge('a','b')
    //sys.addEdge('a','c')
    //sys.addEdge('a','d')
    //sys.addEdge('a','e')
    //sys.addNode('f', {alone:false, mass:.25})
    //sys.addNode('f', {alone:false, mass:.25})
    //sys.addNode('f', {alone:false, mass:.25})
    // or, equivalently:
    //

    var n = 5;
    for(var i = 1; i <= n ;i ++){
      sys.addNode(i,{alone:true, mass:.85,shape:"dot"})
    }
    //sys.addEdge(3,4)
     /*sys.graft({
       nodes:{
         for(var i = 1; i <= 10 ; i++)
          i:{alone:true, mass:.55},
       } */
       /*edges:{
         a:{ b:{},
             c:{},
             d:{},
             e:{}
         }
       }
     })*/
    
  })

})(this.jQuery)