"use strict"

//var filesaver = require('file-saver');
//var pixies = require('PIXI');

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

// Setup the PIXI renderer that handles interactive display and input
let renderer = PIXI.autoDetectRenderer(1400, 768);
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
//graphics.mapper = new ScreenXYMap(70,0,0,70,1030,350);
const SCREEN_WIDTH = 1400;
const SCREEN_HEIGHT = 768;
graphics.mapper = new ScreenXYMap(30,0,0,30,SCREEN_WIDTH/2,SCREEN_HEIGHT/2);
stage.addChild(graphics);

// Add the Countdown Timer
let countdown = new PIXI.Text('3',{font : '80px Gill Sans', fill : 0x000000})
countdown.x = SCREEN_WIDTH/2;
countdown.y = SCREEN_HEIGHT/8;
stage.addChild(countdown);

// Robot Object
let Umax = 1
let robotY0 = [-2,1.75,	0.25,	0.50,0, 1.50,	-0.750,	-1.75, 1.75, 1.25,	-1.25,
    0.750,	0.750,	-2.25,	2.25,	-1.50,	-1.750,	-0.25,	-0.50,0,2,-1,0,-2,0,
    1.25,1,-0.750,	0.25,	-1.50,	0.50,0,-1.25,	-1,1.50, 1,-0.50,0,2,-2.25,
    -0.25,	2.25];
let robotX0 = -12;
let curY0 = 0;
let robot = new DubinsRobot([robotX0,robotY0[curY0],0],3,0xDDDDDD);
stage.addChild(robot);
let trigger_level = robot.height/(2*graphics.mapper.Mxx);
let carRadius = 0.55;
let obstacle = new RoundObstacle(0,0,1.8,carRadius);
//obstacle.color = 0xA62F27;

// Render the Obstacle
obstacle.render();

// ===================== THE MAIN EVENT ================== //

// Main Loop
let clock =  0 ;
let counter = -1;
let now = Date.now();
window.setInterval(function() {
  // Time management
  let delT = Date.now() - now;
  clock += delT;
  now = Date.now();
  if(clock > 3000){
    delT *= 0.0005 * 4;
    counter += delT;
    if(counter > 0){
      // Robot dynamics
      let u = [0];
        // Reset robot position after 8 seconds
      if(robot.states[0] > 1 || 3*counter > 2-robotX0){
        curY0++;
        if(curY0 >= robotY0.length){
          curY0 = 0;
          var blob = new Blob([JSON.stringify(flinchData)], {type: "text/plain;charset=utf-8"});
          saveAs(blob, "supervisorFlinches"+Date.now()+".dat");
          document.location.href = "http://localhost:3000/stagePages/donutDeliveryTutorial.html";
        }
        robot.states = [robotX0,robotY0[curY0],0];
        console.log("reset robot state to ",[robotX0,robotY0[curY0],0]);
        robot.speed = 3;
        counter = -1;
      }
      robot.update(delT,u);
      if(obstacle.collisionSetValue(robot.states) < 0){
        robot.speed = 0;
        robot.spinout = 0;
      }
      countdown.text = '';
    }
  }
  else{
    countdown.text = Math.ceil( 3+(3 - clock)/1000 );
  }
  // Rendering the stage
  renderer.render(stage);
},2)

// ====================== Keyboard Listener Loop ========================= //
let key = null;
let flinchData = {
  ip : userip,
  system : 'dubins',
}
flinchData.list = []
document.addEventListener("keydown",function(event) {
  // Log time and key
  key = event.keyCode;
  console.log(key);
  // 'Z' is the save-to-file key
  if(key == 90){
    var blob = new Blob([JSON.stringify(flinchData)], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "supervisorFlinches"+Date.now()+".dat");
  }
  else{
    // Save flinch information
    flinchData.list.push({
      date : Date.now(),
      state : robot.states,
    })
      // Save to cloud database, if enabled (Testing-Only feature)
    if(saveToCloud){
      firebase.push({
        date : Date.now(),
        state : robot.states,
        ip : userip,
      })
    }
    // Reset the game of robot chicken
    curY0++;
    if(curY0 >= robotY0.length){
      var blob = new Blob([JSON.stringify(flinchData)], {type: "text/plain;charset=utf-8"});
      saveAs(blob, "supervisorFlinches"+Date.now()+".dat");
      document.location.href = "http://localhost:3000/stagePages/donutDeliveryTutorial.html";
      curY0 = 0;
    }
    robot.states = [robotX0,robotY0[curY0],0];
    robot.update(0,0);
    console.log("Key-based reset robot state to ",[robotX0,robotY0[curY0],0]);
    counter = -1;
  }
  // End
})

// Mount the renderer in the website
let mount = document.getElementById("mount");
mount.insertBefore(renderer.view, mount.firstChild);
