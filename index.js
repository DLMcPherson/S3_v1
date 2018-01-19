"use strict"

// Constant flags for quickly modifying script behavior
const clearer = 0;

// Mapper class that scales state space to screen
class ScreenXYMap {
  constructor(_Mxx,_Mxy,_Myx,_Myy,_bx,_by){
    // Scaling Matrix
    this.Mxx = _Mxx;
    this.Mxy = _Mxy;
    this.Myx = _Myx;
    this.Myy = _Myy;
    // Origin-defining affine term
    this.bx  = _bx;
    this.by  = _by;
  }
  // Return a 2-tuple of the screen coordinates given x-y coordinates on the
  // state space scale (can be a subset of the state space)
  mapStateToPosition(x,y){
    let x_screen = this.Mxx * x + this.Mxy * y + this.bx;
    let y_screen = this.Myx * x + this.Myy * y + this.by;
    return([x_screen,y_screen]);
  }
  // Returns the equivalent state-space scale coordinates
  // given the screen coordinates
  mapPositionToState(x_screen,y_screen){
    let x = (x_screen - this.bx);
    let y = (y_screen - this.by);
    let determinant = this.Mxx*this.Myy - this.Mxy*this.Myx;
    let x_state = ( this.Myy * x - this.Mxy * y)/determinant;
    let y_state = (-this.Myx * x + this.Mxx * y)/determinant;
    return([x_state,y_state]);
  }
}

// Create the object that draws the obstacle
//let obstacle = new BoxObstacle(0,0,1,1)
let obstacle = new RoundObstacle(0,0,1);

/* ===================== SETUP ================== */

// Setup the PIXI renderer that handles interactive display and input inside the browser
let renderer = PIXI.autoDetectRenderer(1400, 768);
renderer.backgroundColor = 0xffffff;
renderer.roundPixels = true;

// Connect to my Firebase
//let firebase = new Firebase("https://ancaticipation.firebaseio.com");

// Standard Screen
let stage = new PIXI.Container();
  // Graphics object for lines and squares and such...
let graphics = new PIXI.Graphics();
graphics.mapper = new ScreenXYMap(70,0,0,70,630,350);
stage.addChild(graphics);

// Goal point Marker
let goal = new PIXI.Text('X',{font : '24px Gill Sans', fill : 0x077f4d});
goal.pivot.x = 10; goal.pivot.y = 12;
const goalX = 1 ; const goalY = -4;
goal.x = graphics.mapper.mapStateToPosition(goalX,goalY)[0];
goal.y = graphics.mapper.mapStateToPosition(goalX,goalY)[1];
stage.addChild(goal);

// Robot Object
/*
let robot = new QuadrotorRobot([-6,0,3,0])
stage.addChild(robot)
let Umax = 1
let intervener = new Intervention_Contr(robot,new twoTwo( new loaded_SafeSet("dubIntV2") , new loaded_SafeSet("dubIntV2") ),Umax,0,new PID_Contr(robot,goalX,goalY))
intervener.trigger_level = robot.width/(2*graphics.mapper.Myy)
// can replace loaded_SafeSet with new DoubleIntegrator_SafeSet(_maxU-_maxD,0,1)
let leeway = Umax - 0
*/
///*
let robot = new DubinsRobot([-4,0,0])
stage.addChild(robot)
let intervener = new Intervention_Contr(robot,new loaded_SafeSet("dubinsV3"),1,0,new Dubins_Contr(robot,1,[goalX,goalY]))
intervener.trigger_level = robot.height/(2*graphics.mapper.Mxx)
//*/
/*
let robot = new VerticalQuadrotorRobot([3,0])
stage.addChild(robot)
let Umax = 1
let intervener = new Intervention_Contr(robot,new loaded_SafeSet("dubIntV2"),Umax,0,new PD_Contr(robot,goalY))
intervener.trigger_level = robot.height/(2*graphics.mapper.Mxx)
// can replace loaded_SafeSet with new DoubleIntegrator_SafeSet(_maxU-_maxD,0,1)
let leeway = Umax - 0
*/

// Obstacle
  // Calculations
obstacle.renderAugmented(intervener.trigger_level)

// ===================== THE MAIN EVENT ================== //

// Main Loop
let clock =  0 ; let now = Date.now()
window.setInterval(function() {
  // Time management
  let delT = Date.now() - now
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
let key = null
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
  let mousePosition = renderer.plugins.interaction.mouse.global;
  goal.x = mousePosition.x
  goal.y = mousePosition.y
  intervener.tracker.setX = graphics.mapper.mapPositionToState(goal.x,goal.y)[0]
  intervener.tracker.setY = graphics.mapper.mapPositionToState(goal.x,goal.y)[1]
  // End
})


// Wrap it up
let mount = document.getElementById("mount")
mount.insertBefore(renderer.view, mount.firstChild)
