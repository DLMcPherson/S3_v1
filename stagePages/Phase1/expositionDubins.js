"use strict"

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

/* ===================== SETUP ================== */

// Setup the PIXI renderer that handles interactive display and input inside the browser
const SCREEN_WIDTH = 1400;
const SCREEN_HEIGHT = 768;
let renderer = PIXI.autoDetectRenderer(SCREEN_WIDTH, SCREEN_HEIGHT);
renderer.backgroundColor = 0xffffff;
renderer.roundPixels = true;

// Optionally connect to Firebase Cloud Database.
// IMPORTANT NOTE: Should only be used for internal test piloting. Results saved
// online are not supported by our IRB (due to possible security issues) and
// therefore would be unethical to publish.
const saveToCloud = 0;
if(saveToCloud){
  let firebase = new Firebase("https://testpilotsuperss.firebaseio.com/");
}

// Standard Screen
let stage = new PIXI.Container();
  // Graphics object for lines and squares and such...
let graphics = new PIXI.Graphics();
//graphics.mapper = new ScreenXYMap(70,0,0,70,630,350);
let map = new ScreenXYMap(30,0,0,30,SCREEN_WIDTH/2,SCREEN_HEIGHT/2)
graphics.mapper = map;
stage.addChild(graphics);

// Robot Object
let Umax = 1
///* // Dubins Car Robot
let robot = new DubinsRobot([-8,-1,0],3,0x24EB98,map);
let dubinsCircles = new SweptPalette("DubinsSafesetFullFamily/dubins",[0,125,250,375,500,625,750,875,1000,2000,3000],[0])
stage.addChild(robot);
let carRadius = 0.55;
let obstacle = new RoundObstacle(0,0,1.8,carRadius,dubinsCircles,map);

// Render the Obstacle
obstacle.render();

// ===================== THE MAIN EVENT ================== //

// Main Loop
let control = [0];
let clock =  0 ;
let now = Date.now();
window.setInterval(function() {
  // Time management
  let delT = Date.now() - now;
  //delT *= 0.0005 * 2;
  clock += delT;
  delT *= 0.0005 * 4;
  now = Date.now();
  // Robot dynamics
  let u = control.slice();
  //console.log(clock,u)
  robot.update(delT,u);
  let robotScreenPosition = graphics.mapper.mapStateToPosition(robot.states[0],robot.states[1]);
  if(robotScreenPosition[0] > SCREEN_WIDTH || robotScreenPosition[0] < 0 || robotScreenPosition[1] > SCREEN_HEIGHT || robotScreenPosition[1] < 0){
    robot.states = [-8,-1,0];
  }
  // End this phase after 1 Minute
  if(clock > 60*1000){
    document.location.href = "../Phase2/";
  }
  // Rendering the stage
  graphics.clear();
  obstacle.render(0);
  renderer.render(stage);
},2)

// ====================== Keyboard Listener Loop ========================= //
let key = null;
document.addEventListener("keydown",function(event) {
  // Log time and key
  key = event.keyCode;
  console.log(key);
  if(key == 37 || key == 65){
    control = [-1];
  }
  /*
  if(key == 38 || key == 40 || key == 87 || key == 83){
    control = [0];
  }
  */
  if(key == 39 || key == 68){
    control = [1];
  }
  // Debugging report
  if(saveToCloud){
    firebase.push({
      date : Date.now(),
      state : robot.states,
      ip : userip,
    })
  }
  // End
})
document.addEventListener("keyup",function(event) {
  // Log time and key
  key = event.keyCode;
  console.log(key);
  if((key == 37 || key == 65) && control[0] == -1){
    control = [0];
  }
  /*
  if((key == 38 || key == 40 || key == 87 || key == 83) && control == [0]){
    control = [0];
  }
  */
  if((key == 39 || key == 68) && control[0] == 1){
    control = [0];
  }
  // End
})

// Mount the renderer in the website
let mount = document.getElementById("mount");
mount.insertBefore(renderer.view, mount.firstChild);
resize()

// Listen for window resize events
window.addEventListener('resize', resize);
resize()

// Resize function window
function resize() {
  const parent = renderer.view.parentNode;
	// Resize the renderer
  let newWidth = window.innerWidth - 100
  let newHeight = window.innerHeight - 100
  //let newWidth = parent.clientWidth
  //let newHeight = parent.clientHeight

  renderer.resize(newWidth, newHeight);
  console.log(newWidth, newHeight)
  map.bx = newWidth/2
  map.by = newHeight/2

  let scale = newWidth/FRAME_WIDTH
  if(scale > newHeight/FRAME_HEIGHT)
    scale = newHeight/FRAME_HEIGHT

  stage.scale.x = scale
  stage.scale.y = scale
  map.bx /= scale
  map.by /= scale
}
