"use strict"

// Setup the PIXI renderer that handles interactive display and input inside the browser
var renderer = PIXI.autoDetectRenderer(1400, 768)
renderer.backgroundColor = 0xffffff
renderer.roundPixels = true

// Connect to my Firebase
//var firebase = new Firebase("https://ancaticipation.firebaseio.com")

const clearer = 1

const ObX = 0
const ObY = 0
const ObW = 1
const ObH = 1

const Mxx = 70
const Mxy = 0
const Myx = 0
const Myy = 70
const bx  = 630
const by  = 350

function mapStateToPosition(x,y){
  let x_screen = Mxx * x + Mxy * y + bx
  let y_screen = Myx * x + Myy * y + by
  return([x_screen,y_screen])
}

function mapPositionToState(x_screen,y_screen){
  let x = (x_screen - bx)
  let y = (y_screen - by)
  let determinant = Mxx*Myy - Mxy*Myx
  let x_state = ( Myy * x - Mxy * y)/determinant
  let y_state = (-Myx * x + Mxx * y)/determinant
  return([x_state,y_state])
}

function drawQuadrilateralFromStateCorners(graphics,linewidth,color, left,top,right,bottom){
  let topleft = mapStateToPosition(left,top)
  let bottomright = mapStateToPosition(right,bottom)
  drawQuadrilateral(graphics,linewidth,color, topleft[0],topleft[1],bottomright[0],bottomright[1])
  return
}

function drawQuadrilateral(graphics,linewidth,color, left,top,right,bottom){
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

// ===================== SETUP ================== //

// Standard Screen
var stage = new PIXI.Container()
  // Graphics object for lines and squares and such...
var graphics = new PIXI.Graphics();
stage.addChild(graphics)

// Goal point Marker
var goal = new PIXI.Text('X',{font : '24px Gill Sans', fill : 0x077f4d});
const goalX = 1 ; const goalY = -4
goal.x = mapStateToPosition(goalX,goalY)[0] ; goal.y = mapStateToPosition(goalX,goalY)[1]
goal.pivot.x = 10
goal.pivot.y = 12
stage.addChild(goal)

// Robot Object
var robot = new QuadrotorRobot(-6,3)
stage.addChild(robot)
let Umax = 1
var intervener = new decoupledIntervention_Contr(robot,goalX,goalY,Umax,0)
var leeway = Umax - 0

// Obstacle
  // Calculations
intervener.trigger_level = robot.height/(2*70.0)
intervener.trigger_level = robot.width/(2*70.0)
  // Draw Comfort Augmentation
drawQuadrilateralFromStateCorners(graphics,0,0xcf4c34, ObX-ObW-intervener.trigger_level,ObY-ObH-intervener.trigger_level,ObX+ObW+intervener.trigger_level,ObY+ObH+intervener.trigger_level)
  // Draw Obstacle
drawQuadrilateralFromStateCorners(graphics,5,0x4C1C13, ObX-ObW,ObY-ObH,ObX+ObW,ObY+ObH)

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
  console.log(intervener.trigger_level,intervener.SafeSetX(),intervener.SafeSetY())
  delT *= 0.0005
  robot.update(delT,ux,uy)
  // Render the current safe set
  if(clearer){
    graphics.clear()
    let comfortLeftX   = ObX-ObW-intervener.trigger_level
    let comfortRightX  = ObX+ObW+intervener.trigger_level
    let comfortTopY    = ObY-ObH-intervener.trigger_level
    let comfortBottomY = ObY+ObH+intervener.trigger_level
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
    drawQuadrilateralFromStateCorners(graphics,0,0xff745a, augmentedLeftX,augmentedTopY,augmentedRightX,augmentedBottomY) // Draw reachable set augmentation
    drawQuadrilateralFromStateCorners(graphics,0,0xcf4c34, comfortLeftX,comfortTopY,comfortRightX,comfortBottomY) // Draw Comfort Augmentation
    drawQuadrilateralFromStateCorners(graphics,5,0x4C1C13, ObX-ObW,ObY-ObH,ObX+ObW,ObY+ObH) // Draw Obstacle
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
  intervener.tracker.setX = mapPositionToState(goal.x,goal.y)[0]
  intervener.tracker.setY = mapPositionToState(goal.x,goal.y)[1]
  // End
})


// Wrap it up
var mount = document.getElementById("mount")
mount.insertBefore(renderer.view, mount.firstChild)
