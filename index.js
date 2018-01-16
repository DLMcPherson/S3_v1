"use strict"

// Setup the PIXI renderer that handles interactive display and input inside the browser
var renderer = PIXI.autoDetectRenderer(1400, 768)
renderer.backgroundColor = 0xffffff
renderer.roundPixels = true

// Connect to my Firebase
//var firebase = new Firebase("https://ancaticipation.firebaseio.com")

const clearer = 0

class ScreenXYMap {
  constructor(_Mxx,_Mxy,_Myx,_Myy,_bx,_by){
    this.Mxx = _Mxx
    this.Mxy = _Mxy
    this.Myx = _Myx
    this.Myy = _Myy
    this.bx  = _bx
    this.by  = _by
  }
  mapStateToPosition(x,y){
    let x_screen = this.Mxx * x + this.Mxy * y + this.bx
    let y_screen = this.Myx * x + this.Myy * y + this.by
    return([x_screen,y_screen])
  }
  mapPositionToState(x_screen,y_screen){
    let x = (x_screen - this.bx)
    let y = (y_screen - this.by)
    let determinant = this.Mxx*this.Myy - this.Mxy*this.Myx
    let x_state = ( this.Myy * x - this.Mxy * y)/determinant
    let y_state = (-this.Myx * x + this.Mxx * y)/determinant
    return([x_state,y_state])
  }
}

class Obstacle {
  render(){
    return
  }
}

class BoxObstacle extends Obstacle{
  constructor(_ObX,_ObY,_ObW,_ObH){
    super()
    this.ObX = _ObX
    this.ObY = _ObY
    this.ObW = _ObW
    this.ObH = _ObH
  }
  render(){
    this.drawQuadrilateralFromStateCorners(graphics,5,0x4C1C13, this.ObX-this.ObW,this.ObY-this.ObH,this.ObX+this.ObW,this.ObY+this.ObH)
    return
  }
  renderAugmented(pad){
    this.drawQuadrilateralFromStateCorners(graphics,0,0xcf4c34, this.ObX-this.ObW-pad,this.ObY-this.ObH-pad,this.ObX+this.ObW+pad,this.ObY+this.ObH+pad)
    this.render()
    return
  }
  drawQuadrilateralFromStateCorners(graphics,linewidth,color, left,top,right,bottom){
    let topleft = graphics.mapper.mapStateToPosition(left,top)
    let bottomright = graphics.mapper.mapStateToPosition(right,bottom)
    this.drawQuadrilateral(graphics,linewidth,color, topleft[0],topleft[1],bottomright[0],bottomright[1])
    return
  }
  drawQuadrilateral(graphics,linewidth,color, left,top,right,bottom){
    // Set a fill and line style
    graphics.beginFill(color);
    graphics.lineStyle(linewidth, 0x000000);

    // Draw the quadrilateral
    graphics.moveTo(left,top);
    graphics.lineTo(right,top);
    graphics.lineTo(right,bottom);
    graphics.lineTo(left,bottom);
    graphics.endFill();
    return
  }
}

class CircleObstacle extends Obstacle{
  constructor(_ObX,_ObY,_ObR){
    super()
    this.ObX = _ObX
    this.ObY = _ObY
    this.ObR = _ObR
  }
  render(){
    let center = graphics.mapper.mapStateToPosition(this.ObX,this.ObY)
    let rightPoint = graphics.mapper.mapStateToPosition(this.ObX+this.ObR,this.ObY)
    graphics.drawCircle(center[0],center[1],rightPoint[0]-center[0])
  }
}

let obstacle = new BoxObstacle(0,0,1,1)

// ===================== SETUP ================== //

// Standard Screen
var stage = new PIXI.Container()
  // Graphics object for lines and squares and such...
var graphics = new PIXI.Graphics();
graphics.mapper = new ScreenXYMap(70,0,0,70,630,350)
stage.addChild(graphics)

// Goal point Marker
var goal = new PIXI.Text('X',{font : '24px Gill Sans', fill : 0x077f4d});
const goalX = 1 ; const goalY = -4
goal.x = graphics.mapper.mapStateToPosition(goalX,goalY)[0] ; goal.y = graphics.mapper.mapStateToPosition(goalX,goalY)[1]
goal.pivot.x = 10
goal.pivot.y = 12
stage.addChild(goal)

// Robot Object
var robot = new QuadrotorRobot(-6,3)
stage.addChild(robot)
let Umax = 1
var intervener = new Intervention_Contr(robot,goalX,goalY,Umax,0)
var leeway = Umax - 0

// Obstacle
  // Calculations
intervener.trigger_level = robot.height/(2*graphics.mapper.Mxx)
intervener.trigger_level = robot.width/(2*graphics.mapper.Myy)
obstacle.renderAugmented(intervener.trigger_level)

// ===================== THE MAIN EVENT ================== //

// Main Loop
var clock =  0 ; var now = Date.now()
window.setInterval(function() {
  // Time management
  var delT = Date.now() - now
  clock += delT
  now = Date.now()
  // Robot dynamics
  let u = intervener.u()
  //console.log(clock,u)
  //console.log(intervener.trigger_level,intervener.SafeSetX(),intervener.SafeSetY())
  delT *= 0.0005
  robot.update(delT,u)
  // Render the current safe set
  if(clearer){
    graphics.clear()
    let comfortLeftX   = obstacle.ObX-obstacle.ObW-intervener.trigger_level
    let comfortRightX  = obstacle.ObX+obstacle.ObW+intervener.trigger_level
    let comfortTopY    = obstacle.ObY-obstacle.ObH-intervener.trigger_level
    let comfortBottomY = obstacle.ObY+obstacle.ObH+intervener.trigger_level
      // Draw Velocity-dependent safe set
    let augmentedLeftX   = comfortLeftX
    let augmentedRightX  = comfortRightX
    let augmentedTopY    = comfortTopY
    let augmentedBottomY = comfortBottomY
    let padX = Math.pow(robot.states[1],2)/(2.0*leeway)
    let padY = Math.pow(robot.states[3],2)/(2.0*leeway)
    if(Math.sign(robot.states[1])>0)
      augmentedLeftX  -= padX
    else
      augmentedRightX += padX
    if(Math.sign(robot.states[3])>0)
      augmentedTopY    -= padY
    else
      augmentedBottomY += padY
    //drawQuadrilateralFromStateCorners(graphics,0,0xff745a, augmentedLeftX,augmentedTopY,augmentedRightX,augmentedBottomY) // Draw reachable set augmentation
    //drawQuadrilateralFromStateCorners(graphics,0,0xcf4c34, comfortLeftX,comfortTopY,comfortRightX,comfortBottomY) // Draw Comfort Augmentation
    //drawQuadrilateralFromStateCorners(graphics,5,0x4C1C13, ObX-ObW,ObY-ObH,ObX+ObW,ObY+ObH) // Draw Obstacle
    obstacle.renderAugmented(intervener.trigger_level)
  }
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
  // Draw level set
  if(clearer==0){
    obstacle.renderAugmented(intervener.trigger_level)
  }
  // Debugging report
  //console.log(clock,key,intervener.trigger_level,intervener.trigger_level)
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
  intervener.tracker.setX = graphics.mapper.mapPositionToState(goal.x,goal.y)[0]
  intervener.tracker.setY = graphics.mapper.mapPositionToState(goal.x,goal.y)[1]
  // End
})


// Wrap it up
var mount = document.getElementById("mount")
mount.insertBefore(renderer.view, mount.firstChild)
