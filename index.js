"use strict"

// Setup the PIXI renderer that handles interactive display and input inside the browser
var renderer = PIXI.autoDetectRenderer(1400, 768)
renderer.backgroundColor = 0xffffff
renderer.roundPixels = true

// Connect to my Firebase
//var firebase = new Firebase("https://ancaticipation.firebaseio.com")

const ObX = 600
const ObY = 350
const ObW = 70
const ObH = 70

// ===================== SETUP ================== //

// Standard Screen
var stage = new PIXI.Container()
  // Graphics object for lines and squares and such...
var graphics = new PIXI.Graphics();
stage.addChild(graphics)

// Goal point Marker
var goal = new PIXI.Text('X',{font : '24px Gill Sans', fill : 0x077f4d});
goal.x = 700
goal.y = 50
goal.pivot.x = 10
goal.pivot.y = 12
stage.addChild(goal)

// Robot Object
var robot = new Robot(200,670)
stage.addChild(robot)
var intervener = new decoupledIntervention_Contr(robot,goal.x,goal.y,0.0004,0)
var leeway = 0.0004 - 0

// Obstacle
  // Calculations
intervener.trigger_level = robot.width/2
intervener.trigger_level = robot.height/2
  // Draw Velocity-dependent safe set
graphics.lineStyle(0,0x000000)
graphics.beginFill(0xff745a)
graphics.drawRect(ObX-ObW-intervener.trigger_level,ObY-ObH-intervener.trigger_level,(ObW+intervener.trigger_level)*2,(ObH+intervener.trigger_level)*2)
  // Draw Comfort Augmentation
graphics.lineStyle(0,0x000000)
graphics.beginFill(0xcf4c34)
graphics.drawRect(ObX-ObW-intervener.trigger_level,ObY-ObH-intervener.trigger_level,(ObW+intervener.trigger_level)*2,(ObH+intervener.trigger_level)*2)
  // Draw Obstacle
graphics.lineStyle(5,0x000000)
graphics.beginFill(0x4C1C13)
graphics.drawRect(ObX-ObW,ObY-ObH,ObW*2,ObH*2)


// ===================== THE MAIN EVENT ================== //

// Main Loop
var clock =  0 ; var now = Date.now()
window.setInterval(function() {
  // Time management
  var delT = Date.now() - now
  clock += delT
  now = Date.now()
  // Robot dynamics
  let ux = 0
  let uy = 0
  ux = intervener.ux()
  uy = intervener.uy()
  //console.log(clock,ux,uy)
  robot.update(delT,ux,uy)
  // Path Drawing
  /*
  graphics.clear()
  graphics.lineStyle(5, 0x077f4d);
  graphics.moveTo(320,300)
  var i = 0
  for(i=1; i<tick; i++){
    graphics.lineTo(320+(robot.traj[i][0])*53,300-robot.traj[i][1]*9)
  }
  */
  // Render the current safe set
  graphics.clear()
  ///*
    // Draw Velocity-dependent safe set
  let padx = Math.pow(robot.vx,2)/(2.0*leeway)
  let pady = Math.pow(robot.vy,2)/(2.0*leeway)
  let offx = 0
  if(Math.sign(robot.vx)>0)
    offx = -padx
  let offy = 0
  if(Math.sign(robot.vy)>0)
    offy = -pady
  graphics.lineStyle(0,0x000000)
  graphics.beginFill(0xff745a)
  graphics.drawRect(ObX-ObW-intervener.trigger_level+offx,ObY-ObH-intervener.trigger_level+offy,(ObW+intervener.trigger_level)*2+padx,(ObH+intervener.trigger_level)*2+pady )
  //*/
    // Draw Comfort Augmentation
  graphics.lineStyle(0,0x000000)
  graphics.beginFill(0xcf4c34)
  graphics.drawRect(ObX-ObW-intervener.trigger_level,ObY-ObH-intervener.trigger_level,(ObW+intervener.trigger_level)*2,(ObH+intervener.trigger_level)*2)
    // Draw Obstacle
  graphics.lineStyle(5,0x000000)
  graphics.beginFill(0x4C1C13)
  graphics.drawRect(ObX-ObW,ObY-ObH,ObW*2,ObH*2)
  // Rendering the stage
  renderer.render(stage)
},2)

// ====================== Keyboard Listener Loop ========================= //
var key = null
document.addEventListener("keydown",function(event) {
  // Log time and key
  key = event.keyCode
  // Update level set
  if(intervener.trigger_level < intervener.SafeSetX()){
    intervener.trigger_level = intervener.SafeSetX()
  }
  if(intervener.trigger_level < intervener.SafeSetY()){
    intervener.trigger_level = intervener.SafeSetY()
  }
  // Debugging report
  console.log(clock,key,intervener.trigger_level,intervener.trigger_level)
  /*
  if(key==80 || key==81){
    firebase.push({
      date : Date.now(),
      correctness : correct,
      ip : userip,
      keystroke : key,
    })
  }
  */
  // End
})

// ====================== Mouse Listener Loop ========================= //
document.addEventListener("mousedown",function(event) {
  var mousePosition = renderer.plugins.interaction.mouse.global;
  goal.x = mousePosition.x
  goal.y = mousePosition.y
  intervener.tracker.setX = goal.x
  intervener.tracker.setY = goal.y
  // End
})


// Wrap it up
var mount = document.getElementById("mount")
mount.insertBefore(renderer.view, mount.firstChild)
