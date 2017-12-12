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
// Controller 'virtual' class
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
// PD Controller class
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
// Optimally safe controller class
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
// Intervention controller that swaps between PD and Safe controls
class decoupledIntervention_Contr extends Controller {
  constructor(_robot,_setX,_setY,_maxU,_maxD){
    super(_robot)
    this.tracker = new PID_Contr(_robot,_setX,_setY)
    this.safer = new Safe_Contr(_robot,_maxU)
    this.intervening_setX = new DoubleIntegrator_SafeSet(_maxU-_maxD,ObX,ObW)
    this.intervening_setY = new DoubleIntegrator_SafeSet(_maxU-_maxD,ObY,ObH)
    this.trigger_level = 0
  }
  // Methods for applying reachable set in both decoupled axes
  SafeSetX(){
    return this.intervening_setX.value(this.robot.x,this.robot.vx)
  }
  SafeSetY(){
    return this.intervening_setY.value(this.robot.y,this.robot.vy)
  }
  // Methods that return the current input corresponding to the current state
  // Two methods exist due to decoupling this problem along x- and y-axes
  ux(){
    if( this.SafeSetX() < this.trigger_level && this.SafeSetY() < this.trigger_level && this.SafeSetY() < this.SafeSetX() ){
      graphics.drawRect(this.robot.x,this.robot.y,10,10)
      return this.safer.ux();
    }
    else{
      return this.tracker.ux();
    }
  }
  uy(){
    if( this.SafeSetX() < this.trigger_level && this.SafeSetY() < this.trigger_level && this.SafeSetX() < this.SafeSetY() ){
      return this.safer.uy();
    }
    else{
      return this.tracker.uy();
    }
  }
}
// Safe set 'virtual' class
class SafeSet {
  value(){
    return 0;
  }
}
class DoubleIntegrator_SafeSet extends SafeSet {
  constructor(_leeway,_obP,_obL){
    super()
    this.leeway = _leeway // Should be positive, otherwise system will always crash
    this.obP = _obP
    this.obL = _obL
  }
  // Method for calculating the current value function for the reachable set
  value(p,v){
    if(v*(this.obP-p)<0){
      return Math.abs(p-this.obP)-this.obL;
    }
    else{
      return Math.abs(p-this.obP)-this.obL-Math.pow(v,2)/(2.0*this.leeway)
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
intervener.level = robot.width/2
intervener.level = robot.height/2
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
  /*
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
  */
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
  if(intervener.trigger_level < intervener.DubIntSafeSetX()){
    intervener.trigger_level = intervener.DubIntSafeSetX()
  }
  if(intervener.trigger_level < intervener.DubIntSafeSetY()){
    intervener.trigger_level = intervener.DubIntSafeSetY()
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
