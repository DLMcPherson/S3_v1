"use strict"

const FRAME_WIDTH = 700;
const FRAME_HEIGHT = 700;

// Mapper class that scales state space to frame
class FrameXYMap {
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
  // Return a 2-tuple of the frame coordinates given x-y coordinates on the
  // state space scale (can be a subset of the state space)
  mapStateToPosition(x,y){
    let x_frame = this.Mxx * x + this.Mxy * y + this.bx;
    let y_frame = this.Myx * x + this.Myy * y + this.by;
    return([x_frame,y_frame]);
  }
  // Returns the equivalent state-space scale coordinates
  // given the frame coordinates
  mapPositionToState(x_frame,y_frame){
    let x = (x_frame - this.bx);
    let y = (y_frame - this.by);
    let determinant = this.Mxx*this.Myy - this.Mxy*this.Myx;
    let x_state = ( this.Myy * x - this.Mxy * y)/determinant;
    let y_state = (-this.Myx * x + this.Mxx * y)/determinant;
    return([x_state,y_state]);
  }
  // Returns a random point on the frame
  randomFrameXY(){
    return [Math.random()*FRAME_WIDTH,Math.random()*FRAME_HEIGHT];
  }
  randomStateXY(){
    let pos = this.randomFrameXY();
    return this.mapPositionToState(pos[0],pos[1]);
  }
}

/* ===================== SETUP ================== */

// Setup the PIXI renderer that handles interactive display and input inside the browser
//let renderer = PIXI.autoDetectRenderer(FRAME_WIDTH, FRAME_HEIGHT);
let renderer = new PIXI.Renderer({ width: FRAME_WIDTH, height: FRAME_HEIGHT, backgroundColor: 0xffffff })
renderer.autoResize = true
renderer.roundPixels = true;

// Standard Frame
let stage = new PIXI.Container();
  // Graphics object for lines and squares and such...
let graphics = new PIXI.Graphics();
let map1 = new FrameXYMap(70,0,0,70,FRAME_WIDTH*3/4,FRAME_HEIGHT/2);
graphics.mapper = map1

// Goal point Marker
const goalX = 1 ; const goalY = -4;

// Robot Object
let Umax = 0.625
// let dubinsCircles = new LearnedPalette("dubins");
let dubinsCircles = new SweptPalette("DubinsSafesetFullFamily/dubins",[0,125,250,375,500,625,750,875,1000,2000,3000],[0])
let carRadius = 0.55;
let obstacle = new RoundObstacle(0,0,1.8,carRadius,dubinsCircles,map1);
let ArcadeScore = 0

///* // Dubins Car Robot
// red = 0xFF745A
let runners = []

let robot = new DubinsRobot([-4,3,0],3,0x24EB98,map1);
let intervener = new PaletteIntervention_Contr(robot,
    dubinsCircles,5,
    Umax,0,
    new Dubins_Contr(robot,Umax,[goalX,goalY] ));
    //*/
intervener.trigger_level = 1.0

runners.push(intervener)

let button = new PIXI.Text("Reveal the Answer",{font : '24px Gill Sans', fill : 0xAD3129})
button.interactive = true;
button.buttonMode = true;
button.x = 700
button.y = 700 - 40
button.on('mousedown', onButtonDown)

//stage.addChild()

// Arrange everything on stage
stage.addChild(graphics);
stage.addChild(robot);
stage.addChild(button);

// ===================== THE MAIN EVENT ================== // 3

// Main Loop
let clock =  0 ;
let supervisorCountdown = 0;
let now = Date.now();
let revealAnswer = false
window.setInterval(function() {
  // Time management
  let delT = Date.now() - now;
  delT *= 0.0005 * 6;
  clock += delT;
  now = Date.now();
  // Robot dynamics
  if(runners.length > 0) {
    for(let ii = 0; ii < runners.length; ii++){
      let u = runners[ii].u();
      runners[ii].robot.update(delT,u);

      if(obstacle.collisionSetValue(runners[ii].robot.states) < 0) {
        runners[ii].robot.spinout = 100
        runners[ii].robot.tint = 0xAD3129
      }
    }
    if(runners[0].robot.states[0] > 5){
      runners.shift()
    }
  }

  // Rendering the stage
  graphics.clear();
  if(revealAnswer)
    intervener.intervening_sets.displayGrid(5,map1,0xFF745A,[-5,0,0],0,1);
  obstacle.render();

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
    intervener.setID = 0;
    //intervener.intervening_set = originalSafeset;
    //intervener = intervenerOri;
  }
  if(key == 50){
    intervener.setID = 1;
    //intervener.intervening_set = pixelwiseSafeset;
    //intervener = intervenerPix;
  }
  if(key == 51){
    intervener.setID = 2;
    //intervener.intervening_set = LSPickerSafeset;
    //intervener = intervenerLSP;
  }
  if(key == 52){
    intervener.setID = 3;
    //intervener.intervening_set = BellmanIteratedSafeset;
    //intervener = intervenerBIt;
  }
  if(key == 53){
    intervener.setID = 4;
    //intervener.intervening_set = MaximumLikelihoodSafeset;
  }
  if(key == 54){
    intervener.setID = 5;
    //intervener.intervening_set = conservativeSafeset;
  }
  // End
})

// ====================== Mouse Listener Loop ========================= //
document.addEventListener("mousedown",function(event) {
  let mousePosition = renderer.plugins.interaction.mouse.global;
  let mouseState = map1.mapPositionToState(mousePosition.x/stage.scale.x,mousePosition.y/stage.scale.x)
  //intervener.tracker.updateSetpoint([mouseState[0],mouseState[1]]);

  // New robot to run out
  let robot = new DubinsRobot([-4,3,0],3,0x24EB98,map1);
  let intervener = new PaletteIntervention_Contr(robot,
      dubinsCircles,5,
      Umax,0,
      new Dubins_Contr(robot,Umax,[10,0] ));
      //*/
  intervener.trigger_level = 1.0
  robot.states = [mouseState[0],mouseState[1],0]
  robot.spinout = 0
  robot.tint = 0xDDDDDD
  runners.push(intervener)
  stage.addChild(robot)

  // Permanent marker of crash or success
  let marker = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/DubinsCarV2.png"))
  marker.width = 1.1 * map1.Mxx/5;
  marker.height = 1.1 * map1.Mxx/5;
  marker.pivot.x = 100 ; marker.pivot.y = 100;
  marker.x = mousePosition.x/stage.scale.x
  marker.y = mousePosition.y/stage.scale.x
  marker.rotation = 3.1415/2
  stage.addChild(marker)
  if (intervener.intervening_sets.value(5,robot.states) < 0) {
    marker.tint = 0xAD3129
  } else {
    marker.tint = 0x24EB98
  }
  // End
})
//document.addEventListener("pointermove",onDragMove)

// Mount the renderer in the website
let mount = document.getElementById("partialframe");
mount.insertBefore(renderer.view, mount.firstChild);
resize()

function onButtonDown(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    if(button.text == "Continue exploring...") {
      document.location.href = "dubinsReachsetExaminer.html";
    } else {
      revealAnswer = true
      button.text = "Continue exploring..."
    }
}


// Resize function window
function resize() {
  const parent = renderer.view.parentNode;
	// Resize the renderer
  //let newWidth = window.innerWidth
  //let newHeight = window.innerHeight
  let newWidth = parent.clientWidth
  let newHeight = parent.clientHeight

  /*
  // Scaling Matrix
  graphics.mapper.Mxx = 70 * scale
  graphics.mapper.Mxy = 0
  graphics.mapper.Myx = 0
  graphics.mapper.Myy = 70 * scale
  // Origin-defining affine term
  graphics.mapper.bx  = newWidth/2;
  graphics.mapper.by  = newHeight/2;
  */
  renderer.resize(newWidth, newHeight);
  console.log(newWidth, newHeight)
  map1.bx = newWidth*3/4
  map1.by = newHeight/2

  let scale = newWidth/FRAME_WIDTH
  if(scale > newHeight/FRAME_HEIGHT)
    scale = newHeight/FRAME_HEIGHT

  stage.scale.x = scale
  stage.scale.y = scale
  map1.bx /= scale
  map1.by /= scale

  button.x = newWidth/scale - 300
  button.y = newHeight/scale - 40
}
