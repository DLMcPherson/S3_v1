"use strict"

const FRAME_WIDTH = 700;
const FRAME_HEIGHT = 700;

class MirrorRobot extends PIXI.Sprite {
  // Constructor initializes PIXI.Sprite members and sets initial state
  constructor(mirroree,map){
    // Image
    super(mirroree.texture);
    this.mirroree = mirroree
    this.map = map
    this.pivot.x = mirroree.pivot.x ; this.pivot.y = mirroree.pivot.y;
    this.width = mirroree.width ; this.height = mirroree.height;

    this.states = this.mirroree.states
  }
  displayState(){
    let mappedState =
        this.map.mapStateToPosition(this.states[0],this.states[1]);
    this.x =  mappedState[0];
    this.y =  mappedState[1];
    if(this.spinout > 0){
      this.rotation += 6.2830/100;
      this.spinout -= 1;
    }
    else{
      this.rotation = this.states[2] + 3.1415/2;
    }
  }
  // Method to be called each loop
  update(){
    //this.x = this.mirroree.x
    //this.y = this.mirroree.y
    //this.rotation = this.mirroree.rotation
    this.states = this.mirroree.states;
    this.displayState();
  }
}

/* ===================== SETUP ================== */

// Setup the PIXI renderer that handles interactive display and input inside the browser
//let renderer = PIXI.autoDetectRenderer(FRAME_WIDTH, FRAME_HEIGHT);
let renderer = new PIXI.Renderer({ width: FRAME_WIDTH, height: FRAME_HEIGHT, backgroundColor: 0xffffff })
renderer.autoResize = true
renderer.roundPixels = true;

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
  // Graphics object for lines and squares and such...
let graphics = new PIXI.Graphics();
let map1 = new FrameXYMap(30,0,0,30,FRAME_WIDTH*3/4,FRAME_HEIGHT/2);
let map2 = new FrameXYMap(30,0,0,30,FRAME_WIDTH*1/4,FRAME_HEIGHT/2);
graphics.mapper = map1

// Goal point Marker
const goalX = 1 ; const goalY = -4;

// Robot Object
let Umax = 1
// let dubinsCircles = new LearnedPalette("dubins");
let dubinsCircles = new SweptPalette("DubinsSafesetFullFamily/dubins",[0,125,250,375,500,625,750,875,1000,2000,3000],[0])
let carRadius = 0.55;
let obstacle = new RoundObstacle(0,0,1.8,carRadius,dubinsCircles,map1);
let obstacle2 = new RoundObstacle(0,0,1.8,carRadius,dubinsCircles,map2);
let ArcadeScore = 0

///* // Dubins Car Robot
// red = 0xFF745A
let robot = new DubinsRobot([-4,3,0],3,0x24EB98,map1);
let mirrorRobot = new MirrorRobot(robot,map2)
let intervener = new PaletteIntervention_Contr(robot,
    dubinsCircles,8,
    Umax,0,
    new Dubins_Contr(robot,Umax,[goalX,goalY] ));
    //*/

// Render the Obstacle
obstacle.renderAugmented(intervener.trigger_level);

// Supervisor overlay
let headPosition = map2.mapStateToPosition(0,0)
let happyHead = PIXI.Texture.from("http://localhost:3000/S3_v1/HappyHead.png")
let sadHead = PIXI.Texture.from("http://localhost:3000/S3_v1/SadHead.png")
let supervisor = new PIXI.Sprite(happyHead)
supervisor.x = headPosition[0]
supervisor.y = headPosition[1]
supervisor.anchor.x = 0.5
supervisor.anchor.y = 0.5
supervisor.scale.x = 0.5
supervisor.scale.y = 0.5
supervisor.alpha = 0.5
let supervisorNegative = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/NegativeHead.png"))
supervisorNegative.x = headPosition[0]
supervisorNegative.y = headPosition[1]
supervisorNegative.anchor.x = 0.5
supervisorNegative.anchor.y = 0.5
supervisorNegative.scale.x = 0.5
supervisorNegative.scale.y = 0.5
//supervisorNegative.tint = 0xEEEEEE
let supervisorSetID = 3

// Place a slider for interacting with simulation parameters
let sliderBar = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/SliderBar_v2.png"))
sliderBar.x = 30
sliderBar.y = FRAME_HEIGHT - 50
sliderBar.width = 600
sliderBar.height = 211 * 600/1076
sliderBar.anchor.y = 0.7
let slider = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/Slider.png"))
slider.interactive = true
slider.buttonMode = true
slider.height = 100
slider.anchor.y = 0.5
slider.x = intervener.setID*56 + 35
slider.y = FRAME_HEIGHT - 50
slider.on('pointerdown', onDragStart)
slider.on('pointerup', onDragEnd)
slider.on('pointerupoutside', onDragEnd)
slider.on('pointermove', onDragMove);

//stage.addChild()

// Arrange everything on stage
// Head world
stage.addChild(mirrorRobot);
stage.addChild(graphics);
stage.addChild(supervisorNegative)
stage.addChild(supervisor)
// Real world
stage.addChild(robot);
stage.addChild(sliderBar)
stage.addChild(slider)
stage.addChild(intervener.tracker.goal);

// ===================== THE MAIN EVENT ================== // 3

// Main Loop
let clock =  0 ;
let supervisorCountdown = 0;
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
  intervener.intervening_sets.displayGrid(supervisorSetID,map2,0x40120A,robot.states,0,1);
  obstacle2.render();
  graphics.lineStyle(0, 0x000000);
  graphics.beginFill(0xFFFFFF)
  graphics.drawRect(supervisorNegative.x+supervisorNegative.width*supervisorNegative.scale.x,0,FRAME_WIDTH+100,FRAME_HEIGHT)
  graphics.drawRect(0,supervisorNegative.y+supervisorNegative.height*supervisorNegative.scale.y,FRAME_WIDTH+100,FRAME_HEIGHT)
  graphics.drawRect(0,supervisorNegative.y-supervisorNegative.height*supervisorNegative.scale.y-FRAME_HEIGHT,FRAME_WIDTH+100,FRAME_HEIGHT)
  graphics.endFill()
  intervener.intervening_sets.displayGrid(supervisorSetID,map1,0x40120A,robot.states,0,1);
  intervener.intervening_sets.displayGrid(intervener.setID,map1,0xFF745A,robot.states,0,1);
  obstacle.render();

  if(obstacle.collisionSetValue(robot.states) < 0) {
    robot.spinout = 100
  }

  if (intervener.intervening_sets.value(supervisorSetID,robot.states) < 0) {
    supervisor.texture = sadHead
    supervisorCountdown = 150
    console.log("OHNO")
  }
  if (supervisorCountdown > 0) {
    supervisorCountdown--
    if (supervisorCountdown < 1) {
      supervisor.texture = happyHead
    }
  }

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
  let mouseState = map1.mapPositionToState(mousePosition.x/stage.scale.x,mousePosition.y/stage.scale.x)
  if (mouseState[0] > -10) {
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
    let mousePosition = renderer.plugins.interaction.mouse.global;
    let sliderTick = Math.round( (mousePosition.x/stage.scale.x - 30)/60)
    if (sliderTick < 0)
      sliderTick = 0
    if (sliderTick > dubinsCircles.safesets.length-1)
      sliderTick = dubinsCircles.safesets.length-1
    intervener.setID = sliderTick
    this.x = intervener.setID*56 + 35
  }
}

// Mount the renderer in the website
let mount = document.getElementById("frame");
mount.insertBefore(renderer.view, mount.firstChild);
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
  map1.bx = newWidth*3/4
  map1.by = newHeight/3
  map2.bx = newWidth*1/4
  map2.by = newHeight/3

  let scale = newWidth/FRAME_WIDTH
  if(scale > newHeight/FRAME_HEIGHT)
    scale = newHeight/FRAME_HEIGHT

  stage.scale.x = scale
  stage.scale.y = scale
  map1.bx /= scale
  map1.by /= scale
  map2.bx /= scale
  map2.by /= scale
  sliderBar.y = newHeight/scale - 40
  slider.y = newHeight/scale - 40

  let headPosition = map2.mapStateToPosition(0,0)
  supervisor.x = headPosition[0]
  supervisor.y = headPosition[1]
  supervisorNegative.x = headPosition[0]
  supervisorNegative.y = headPosition[1]
}
