"use strict"

const SCREEN_WIDTH = 1400;
const SCREEN_HEIGHT = 768;

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
  // Returns a random point on the screen
  randomScreenXY(){
    return [Math.random()*SCREEN_WIDTH,Math.random()*SCREEN_HEIGHT];
  }
  randomStateXY(){
    let pos = this.randomScreenXY();
    return this.mapPositionToState(pos[0],pos[1]);
  }
}

/* ===================== SETUP ================== */

// Setup the PIXI renderer that handles interactive display and input inside the browser
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
graphics.mapper = new ScreenXYMap(70,0,0,70,630,350);
stage.addChild(graphics);

// Goal point Marker
const goalX = 1 ; const goalY = -4;

// Robot Object
let Umax = 1
/* // 2D Quadrotor Robot
let obstacle = new BoxObstacle(0,0,1,1);
let robot = new QuadrotorRobot([-6,0,3,0]);
stage.addChild(robot);
let intervener = new Intervention_Contr(robot,
    new twoTwo(new loaded_SafeSet("dubInt"),new loaded_SafeSet("dubIntV2") ),
    Umax,0,
    new Concat_Contr(robot,[new PD_Contr(robot,goalX,0),new PD_Contr(robot,goalY,2)]) );
intervener.trigger_level = robot.width/(2*graphics.mapper.Myy);
*/
///* // Dubins Car Robot
let robot = new DubinsRobot([-4,3,0],3,0xFF745A);
stage.addChild(robot);
let originalSafeset = new loaded_SafeSet("dubins");
let pixelwiseSafeset = new loaded_SafeSet("dubinsPixelwise");
let LSPickerSafeset = new loaded_SafeSet("dubinsLSPicker");
let BellmanIteratedSafeset = new loaded_SafeSet("dubinsBI");
let intervener = new Intervention_Contr(robot,
    originalSafeset,
    Umax,0,
    new Dubins_Contr(robot,Umax,[goalX,goalY]));
//intervener.trigger_level = robot.height/(2*graphics.mapper.Mxx) * Math.SQRT2;
let carRadius = 0.55;
let obstacle = new RoundObstacle(0,0,1.8,carRadius);

let robot2 = new DubinsRobot([4,3,0],3,0x24EB98);
//stage.addChild(robot2);
let intervener2 = new Intervention_Contr(robot2,
    originalSafeset,
    Umax,0,
    new Dubins_Contr(robot2,Umax,[goalX,goalY]));
//intervener2.trigger_level = robot2.height/(2*graphics.mapper.Mxx) * Math.SQRT2;
//*/
/* // 1D Quadrotor Robot
let robot = new VerticalQuadrotorRobot([3,0]);
stage.addChild(robot);
let intervener = new Intervention_Contr(robot,
  new loaded_SafeSet("dubIntV2"),Umax,0,new PD_Contr(robot,goalY,0) );
intervener.trigger_level = robot.height/(2*graphics.mapper.Mxx);
let obstacle = new BoxObstacle(0,0,1,1);
*/

// Render the Obstacle
obstacle.renderAugmented(intervener.trigger_level);

// ===================== THE MAIN EVENT ================== // 3

// Main Loop
let clock =  0 ;
let now = Date.now();
window.setInterval(function() {
  // Time management
  let delT = Date.now() - now;
  delT *= 0.0005 * 4;
  clock += delT;
  now = Date.now();
  // Robot dynamics
  let u = intervener.u();
  let u2 = intervener2.u();
  //console.log(clock,u)
  robot.update(delT,u);
  robot2.update(delT,u2);
  // Rendering the stage
  graphics.clear();
  obstacle.render();
  intervener.intervening_set.displayGrid(graphics,robot.tint,robot.states,0,1);
  //intervener2.intervening_set.displayGrid(graphics,robot2.tint,robot2.states,0,1);
  renderer.render(stage);
},10)

// ====================== Keyboard Listener Loop ========================= //
let key = null;
document.addEventListener("keydown",function(event) {
  // Log time and key
  key = event.keyCode;
  /*
  // Update level set
  if(intervener.trigger_level < intervener.intervening_set.value(robot.states)){
    intervener.trigger_level = intervener.intervening_set.value(robot.states);
  }
  // Draw level set
  obstacle.renderAugmented(intervener.trigger_level);
  */
  console.log(key);
  if(key == 49){
    intervener.intervening_set = originalSafeset;
    //intervener = intervenerOri;
  }
  if(key == 50){
    intervener.intervening_set = pixelwiseSafeset;
    //intervener = intervenerPix;
  }
  if(key == 51){
    intervener.intervening_set = LSPickerSafeset;
    //intervener = intervenerLSP;
  }
  if(key == 52){
    intervener.intervening_set = BellmanIteratedSafeset;
    //intervener = intervenerBIt;
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

// ====================== Mouse Listener Loop ========================= //
document.addEventListener("mousedown",function(event) {
  let mousePosition = renderer.plugins.interaction.mouse.global;
  intervener.tracker.updateSetpoint([
      graphics.mapper.mapPositionToState(mousePosition.x,mousePosition.y)[0],
      graphics.mapper.mapPositionToState(mousePosition.x,mousePosition.y)[1]]);
  // End
})


// Mount the renderer in the website
let mount = document.getElementById("mount");
mount.insertBefore(renderer.view, mount.firstChild);