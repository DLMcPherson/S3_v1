"use strict"

const FRAME_WIDTH = 700;
const FRAME_HEIGHT = 700;

class MirrorSprite extends PIXI.Sprite {
  // Constructor initializes PIXI.Sprite members and sets initial state
  constructor(mirroree){
    // Image
    super(mirroree.texture);
    this.mirroree = mirroree
    this.pivot.x = mirroree.pivot.x ; this.pivot.y = mirroree.pivot.y;
    this.width = mirroree.width ; this.height = mirroree.height;
  }
  // Method to be called each loop
  update(){
    this.x = this.mirroree.x
    this.y = this.mirroree.y
    this.rotation = this.mirroree.rotation
  }
}

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

let renderer2 = new PIXI.Renderer({ width: FRAME_WIDTH, height: FRAME_HEIGHT, backgroundColor: 0xffffff })
renderer2.autoResize = true
renderer2.roundPixels = true;

/*
const app = new PIXI.Application({
    width: FRAME_WIDTH, height: FRAME_HEIGHT, backgroundColor: 0xffffff, resolution: window.devicePixelRatio || 1,
});*/

// Optionally connect to Firebase Cloud Database.
// IMPORTANT NOTE: Should only be used for internal test piloting. Results saved
// online are not supported by our IRB (due to possible security issues) and
// therefore would be unethical to publish.
const saveToCloud = 0;
if(saveToCloud){
  let firebase = new Firebase("https://testpilotsuperss.firebaseio.com/");
}

// Standard Frame
let stage = new PIXI.Container();
let headWorld = new PIXI.Container();
  // Graphics object for lines and squares and such...
let graphics = new PIXI.Graphics();
graphics.mapper = new FrameXYMap(70,0,0,70,FRAME_WIDTH/2,FRAME_HEIGHT/2);
stage.addChild(graphics);
// Graphics object for lines and squares and such...
let graphics2 = new PIXI.Graphics();
graphics2.mapper = new FrameXYMap(70,0,0,70,FRAME_WIDTH/2,FRAME_HEIGHT/2);
headWorld.addChild(graphics2);

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
// let dubinsCircles = new LearnedPalette("dubins");
let dubinsCircles = new SweptPalette("DubinsSafesetFullFamily/dubins",[0,125,250,375,500,625,750,875,1000,2000,3000],[0])
let carRadius = 0.55;
let obstacle = new RoundObstacle(0,0,1.8,carRadius,dubinsCircles,graphics);
//let obstacle2 = new RoundObstacle(0,0,1.8,carRadius,dubinsCircles,graphics2);
let ArcadeScore = 0

///* // Dubins Car Robot
// red = 0xFF745A
let robot = new DubinsRobot([-4,3,0],3,0x24EB98);
stage.addChild(robot);
let mirrorRobot = new MirrorSprite(robot)
headWorld.addChild(mirrorRobot);
let intervener = new PaletteIntervention_Contr(robot,
    dubinsCircles,0,
    Umax,0,
    new Dubins_Contr(robot,Umax,[goalX,goalY] ));
    //*/
//intervener.trigger_level = robot.height/(2*graphics.mapper.Mxx) * Math.SQRT2;

/*
let robot2 = new DubinsRobot([4,3,0],3,0x24EB98);
//stage.addChild(robot2);
let intervener2 = new PaletteIntervention_Contr(robot2,
    dubinsCircles,0,
    Umax,0,
    new Dubins_Contr(robot2,Umax,[goalX,goalY]));
*/
//intervener2.trigger_level = robot2.height/(2*graphics.mapper.Mxx) * Math.SQRT2;

// Render the Obstacle
obstacle.renderAugmented(intervener.trigger_level);

// Supervisor overlay
let supervisor = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/HappyHead.png"))
supervisor.x = -100
supervisor.y = -50
supervisor.scale.x = 0.8
supervisor.scale.y = 0.8
supervisor.alpha = 0.5
headWorld.addChild(supervisor)
let supervisorNegative = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/NegativeHead.png"))
supervisorNegative.x = -100
supervisorNegative.y = -50
supervisorNegative.scale.x = 0.8
supervisorNegative.scale.y = 0.8
headWorld.addChild(supervisorNegative)


// Place a slider for interacting with simulation parameters
let sliderBar = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/SliderBar.png"))
sliderBar.x = 30
sliderBar.y = FRAME_HEIGHT - 150
sliderBar.width = 600
headWorld.addChild(sliderBar)
let slider = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/Slider.png"))
slider.interactive = true
slider.buttonMode = true
slider.height = 100
slider.anchor.set(0.5)
slider.x = 30
slider.y = FRAME_HEIGHT - 50
slider.on('pointerdown', onDragStart)
slider.on('pointerup', onDragEnd)
slider.on('pointerupoutside', onDragEnd)
slider.on('pointermove', onDragMove);
headWorld.addChild(slider)
//stage.addChild()

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
  //let u2 = intervener2.u();
  //console.log(clock,u)
  robot.update(delT,u);
  mirrorRobot.update();
  //robot.states = [-5,0,0];
  //robot2.update(delT,u2);

  // Rendering the stage
  graphics.clear();
  obstacle.render();
  //obstacle2.render();
  intervener.intervening_sets.displayGrid(intervener.setID,graphics,0xFF745A,robot.states,0,1);
  //intervener.intervening_set.displayGrid(graphics,0xFF745A,robot.states,0,1);
  //intervener2.intervening_set.displayGrid(graphics,robot2.tint,robot2.states,0,1);
  renderer.render(stage);
  renderer2.render(headWorld);
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
  if (mousePosition.x > 0) {
    let mouseState = graphics.mapper.mapPositionToState(mousePosition.x/stage.scale.x,mousePosition.y/stage.scale.x)
    intervener.tracker.updateSetpoint([mouseState[0],mouseState[1]]);
  }
  // End
})
//document.addEventListener("pointermove",onDragMove)

function onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    this.alpha = 0.8;
    this.dragging = true;
}

function onDragEnd() {
    this.alpha = 1;
    this.dragging = false;
    // set the interaction data to null
    this.data = null;
}

function onDragMove() {
  if(this.dragging) {
    // Pulling the slider
    let mousePosition = renderer2.plugins.interaction.mouse.global;
    let sliderTick = Math.round( (mousePosition.x/headWorld.scale.x - 30)/60)
    if (sliderTick < 0)
      sliderTick = 0
    if (sliderTick > dubinsCircles.safesets.length-1)
      sliderTick = dubinsCircles.safesets.length-1
    intervener.setID = sliderTick
    this.x = sliderTick*60 + 30
  }
}

// Mount the renderer in the website
let mount = document.getElementById("frame");
mount.insertBefore(renderer.view, mount.firstChild);

// Mount the renderer in the website
let mount2 = document.getElementById("frame2");
mount2.insertBefore(renderer2.view, mount2.firstChild);
resize()

// Listen for window resize events
window.addEventListener('resize', resize);
resize()

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
  graphics.mapper.bx = newWidth/2
  graphics.mapper.by = newHeight/2
  sliderBar.y = newHeight - 50
  slider.y = newHeight - 50

  renderer2.resize(renderer2.view.parentNode.clientWidth, renderer2.view.parentNode.clientHeight);

  let scale = newWidth/FRAME_WIDTH
  if(scale > newHeight/FRAME_HEIGHT)
    scale = newHeight/FRAME_HEIGHT

  stage.scale.x = scale
  stage.scale.y = scale
  headWorld.scale.x = scale
  headWorld.scale.y = scale
  graphics.mapper.bx /= scale
  graphics.mapper.by /= scale
}
