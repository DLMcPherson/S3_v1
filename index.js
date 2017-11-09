"use strict"

// Setup the renderer
var renderer = PIXI.autoDetectRenderer(640, 640)
renderer.backgroundColor = 0xffffff
renderer.roundPixels = true

// Connect to my Firebase
//var firebase = new Firebase("https://ancaticipation.firebaseio.com")

const ObX = 300
const ObY = 300
const ObW = 70
const ObH = 70

// ===================== CLASSES ======================== //
// Robot class
class Robot extends PIXI.Sprite {
  constructor(x0,y0){
    // Image
    super(PIXI.Texture.fromImage("QuadcopterSide.png"))
    this.pivot.x = 100 ; this.pivot.y = 50
    this.width = 100 ; this.height = 50
    // State
    this.x = x0 ; this.y = y0
    this.vx = 0 ; this.vy = 0
  }
  update(delT,ux,uy){
    // Double Integrator Dynamics
    this.x += this.vx * delT
    this.y += this.vy * delT
    this.vx += ux * delT
    this.vy += uy * delT
  }
}

class Controller {
  constructor(_robot){
    this.robot = _robot
  }
  ux(){
    return 0;
  }
  uy(){
    return 0;
  }
}

class PID_Contr extends Controller {
  constructor(_robot,_setX,_setY){
    super(_robot)
    this.setX = _setX
    this.setY = _setY
  }
  PID(z,gz,vz){
    var P = -0.000001*(z-gz)
    var I = 0;
    var D = -0.001*(vz-0);
    return P+I+D;
  }
  ux(){
    return this.PID(this.robot.x,this.setX,this.robot.vx);
  }
  uy(){
    return this.PID(this.robot.y,this.setY,this.robot.vy);
  }
}

class Safe_Contr extends Controller {
  constructor(_robot,_maxU){
    super(_robot)
    this.maxU = _maxU
  }
  ux(){
    if(this.robot.x > ObX){
      return this.maxU;
    }
    else{
      return -this.maxU;
    }
  }
  uy(){
    if(this.robot.y > ObY){
      return this.maxU;
    }
    else{
      return -this.maxU;
    }
  }
}

class Intervention_Contr extends Controller {
  constructor(_robot,_setX,_setY,_maxU,_maxD){
    super(_robot)
    this.tracker = new PID_Contr(_robot,_setX,_setY)
    this.safer = new Safe_Contr(_robot,_maxU)
    this.leeway = _maxU - _maxD // Should be positive, otherwise system will always crash
    this.xalpha = 0 // Intervention level set along X-direction
    this.yalpha = 0 // Intervention level set along Y-direction
  }
  DubIntSafeSet(obP,obL,p,v,l){
    if(v*(obP-p)<0){
      return Math.abs(p-obP)-obL;
    }
    else{
      return Math.abs(p-obP)-obL-Math.pow(v,2)/(2.0*l)
    }
  }
  DubIntSafeSetX(){
    return this.DubIntSafeSet(ObX,ObW,this.robot.x,this.robot.vx,this.leeway)
  }
  DubIntSafeSetY(){
    return this.DubIntSafeSet(ObY,ObH,this.robot.y,this.robot.vy,this.leeway)
  }
  ux(){
    if( this.DubIntSafeSetX() < this.xalpha && this.DubIntSafeSetY() < this.yalpha && this.DubIntSafeSetY() - this.yalpha < this.DubIntSafeSetX() - this.xalpha ){
      graphics.drawRect(this.robot.x,this.robot.y,10,10)
      return this.safer.ux();
    }
    else{
      return this.tracker.ux();
    }
  }
  uy(){
    if( this.DubIntSafeSetX() < this.xalpha && this.DubIntSafeSetY() < this.yalpha && this.DubIntSafeSetX() - this.xalpha < this.DubIntSafeSetY() - this.yalpha ){
      return this.safer.uy();
    }
    else{
      return this.tracker.uy();
    }
  }
}

// ===================== SETUP ================== //

// Standard Screen
var stage = new PIXI.Container()
  // Graphics object for lines and squares and such...
var graphics = new PIXI.Graphics();
stage.addChild(graphics)

// Goal point Marker
var goal = new PIXI.Text('X',{font : '24px Gill Sans', fill : 0x077f4d});
goal.x = 450
goal.y = 50
goal.pivot.x = 10
goal.pivot.y = 12
stage.addChild(goal)

// Robot Object
var robot = new Robot(0,440)
stage.addChild(robot)
var tracker = new PID_Contr(robot,goal.x,goal.y)
var intervener = new Intervention_Contr(robot,goal.x,goal.y,0.0004,0)

// Obstacle
//graphics.beginFill(0x077f4d)
graphics.lineStyle(0,0x000000)
graphics.beginFill(0xcf4c34)
intervener.xalpha = robot.width/2
intervener.yalpha = robot.height/2
graphics.drawRect(ObX-ObW-intervener.xalpha,ObY-ObH-intervener.yalpha,(ObW+intervener.xalpha)*2,(ObH+intervener.yalpha)*2)
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
  var ux = 0
  var uy = 0
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
  // Rendering the stage
  renderer.render(stage)
},2)

// ====================== Keyboard Listener Loop ========================= //
var key = null
document.addEventListener("keydown",function(event) {
  // Log time and key
  key = event.keyCode
  // Update level set
  if(intervener.xalpha < intervener.DubIntSafeSetX()){
    intervener.xalpha = intervener.DubIntSafeSetX()
  }
  if(intervener.yalpha < intervener.DubIntSafeSetY()){
    intervener.yalpha = intervener.DubIntSafeSetY()
  }
  // Debugging report
  console.log(clock,key,intervener.xalpha,intervener.yalpha)
  // Render new safety bubble
  graphics.lineStyle(0,0x000000)
  graphics.beginFill(0xcf4c34)
  graphics.drawRect(ObX-ObW-intervener.xalpha,ObY-ObH-intervener.yalpha,(ObW+intervener.xalpha)*2,(ObH+intervener.yalpha)*2)

  graphics.lineStyle(5,0x000000)
  graphics.beginFill(0x4C1C13)
  graphics.drawRect(ObX-ObW,ObY-ObH,ObW*2,ObH*2)
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


// Wrap it up
var mount = document.getElementById("mount")
mount.insertBefore(renderer.view, mount.firstChild)
