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
let map1 = new FrameXYMap(70,0,0,70,FRAME_WIDTH/2,FRAME_HEIGHT/2);
graphics.mapper = map1

// Goal point Marker
const goalX = 1 ; const goalY = -4;

// Robot Object
let Umax = 0.625
// let dubinsCircles = new LearnedPalette("dubins");
let curves = [30,6,4,3.5,3,2.65,2.45,2.1,1.9,1.2,0.8]
let dubinsCircles = new SweptPalette("DubinsSafesetFullFamily/dubins",[0,125,250,375,500,625,750,875,1000,2000,3000],[0])
let carRadius = 0.55;
let obstacle = new RoundObstacle(0,0,1.8,carRadius,dubinsCircles,map1);
let ArcadeScore = 0

// Render the Obstacle
obstacle.render();
let currentSetID = 5

// Place a slider for interacting with simulation parameters
let sliderBar = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/SliderBar_v2Basic.png"))
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
slider.x = currentSetID*56 + 35
slider.y = FRAME_HEIGHT - 50
slider.on('pointerdown', onDragStart)
slider.on('pointerup', onDragEnd)
slider.on('pointerupoutside', onDragEnd)
slider.on('pointermove', onDragMove);

//stage.addChild()

// Arrange everything on stage
stage.addChild(graphics);
stage.addChild(sliderBar)
stage.addChild(slider)

let robot = new DubinsRobot([0,0,0],3,0xFF745A,map1);
robot.width = 1.1 * map1.Mxx;
robot.height = 1.1 * map1.Mxx;
let arcTexture = PIXI.Texture.from("http://localhost:3000/S3_v1/Arcs.png")
let pathArcs = new PIXI.Sprite(arcTexture)
pathArcs.x = robot.x
pathArcs.y = robot.y
pathArcs.scale.x = 2
pathArcs.scale.y = 3
pathArcs.anchor.x = 0.5
pathArcs.anchor.y = 1.0
pathArcs.rotation = 3.1415/2
pathArcs.tint = 0xFF745A
pathArcs.alpha = 1

let maxMarker = 40
let marker = []
let pathmArcs = []
for(let ii=0; ii<maxMarker+1; ii++){
  marker[ii] = new DubinsRobot([0,0,0],3,0xFF745A,map1);
  marker[ii].width = 1.1 * map1.Mxx/5;
  marker[ii].height = 1.1 * map1.Mxx/5;
  pathmArcs[ii] = new PIXI.Sprite(arcTexture)
  pathmArcs[ii].x = robot.x
  pathmArcs[ii].y = robot.y
  pathmArcs[ii].scale.x = 2
  pathmArcs[ii].scale.y = 3
  pathmArcs[ii].anchor.x = 0.5
  pathmArcs[ii].anchor.y = 1.0
  pathmArcs[ii].rotation = 3.1415/2
  pathmArcs[ii].tint = 0xFF745A
  pathmArcs[ii].alpha = 1
  stage.addChild(marker[ii])
  stage.addChild(pathmArcs[ii])
}
stage.addChild(robot)
stage.addChild(pathArcs)

// ===================== THE MAIN EVENT ================== // 3

// Main Loop
let curMarker = 0
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

  // Rendering the stage
  graphics.clear();
  obstacle.renderAugmented(carRadius);
  //dubinsCircles.displayGrid(currentSetID,map1,0xFF745A,[-5,0,0],0,1);

  curMarker = 0
  graphics.lineStyle(0, 0x000000);
  let currentSet = dubinsCircles.safesets[currentSetID]
  // Determine which slice of the reachable set to display
  let reachableSet = currentSet.reachset;
  let [lowEdgeIndex,highEdgeIndex] = currentSet.nearIndices([-5,0,0],true);
  let index = lowEdgeIndex;
  // Loop through all gridpoints
  for(let indexX = 0;indexX < reachableSet.gN[0];indexX++){
    for(let indexY = 0;indexY < reachableSet.gN[1];indexY++){
      // Find the value at the current gridpoint
      index[0] = indexX;
      index[1] = indexY;
      let valuation = currentSet.griddedValue(index);
      // Translate grid-coordinates to screen coordinates
      let gX = currentSet.indexToState(indexX,0);
      let gY = currentSet.indexToState(indexY,1);
        // if necessary, offset the state by the given shift
      let mappedState = map1.mapStateToPosition(gX, gY);
      // Display the gridpoint according to the value at this gridpoint
      if(valuation > 0){
        graphics.beginFill(0x24EB98);
        graphics.drawCircle(mappedState[0],mappedState[1],3);
        graphics.endFill();
      }
      else{
        // display the unsafe zone
        graphics.beginFill(0x400C09);
        graphics.drawCircle(mappedState[0],mappedState[1],6);
        graphics.endFill();
        if(valuation > -0.2 && indexX%2 == 0 && indexY%2 == 0) {
          marker[curMarker].states = [gX,gY,0]
          marker[curMarker].displayState()
          pathmArcs[curMarker].x = marker[curMarker].x
          pathmArcs[curMarker].y = marker[curMarker].y
          pathmArcs[curMarker].scale.y = curves[currentSetID]
          curMarker++
          if(curMarker > maxMarker)
            curMarker = maxMarker
        }
      }
    }
  }
  for(let ii = curMarker; ii<=maxMarker; ii++) {
    marker[ii].states = [20,0,0]
    marker[ii].displayState()
    pathmArcs[ii].x = marker[ii].x
    pathmArcs[ii].y = marker[ii].y
  }

  let mousePosition = renderer.plugins.interaction.mouse.global;
  let mouseState = map1.mapPositionToState(mousePosition.x/stage.scale.x,mousePosition.y/stage.scale.x)
  robot.states = [mouseState[0],mouseState[1],0]
  robot.displayState()
  pathArcs.x = robot.x
  pathArcs.y = robot.y
  pathArcs.scale.y = curves[currentSetID]

  renderer.render(stage);
},10)

// ====================== Mouse Listener Loop ========================= //
document.addEventListener("mousedown",function(event) {
  let mousePosition = renderer.plugins.interaction.mouse.global;
  let mouseState = map1.mapPositionToState(mousePosition.x/stage.scale.x,mousePosition.y/stage.scale.x)
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
    currentSetID = sliderTick
    this.x = currentSetID*56 + 35
  }
}

// Mount the renderer in the website
let mount = document.getElementById("partialframe");
mount.insertBefore(renderer.view, mount.firstChild);
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
  map1.bx = newWidth/2
  map1.by = newHeight/2

  let scale = newWidth/FRAME_WIDTH
  if(scale > newHeight/FRAME_HEIGHT)
    scale = newHeight/FRAME_HEIGHT

  stage.scale.x = scale
  stage.scale.y = scale
  map1.bx /= scale
  map1.by /= scale
  sliderBar.y = newHeight/scale - 40
  slider.y = newHeight/scale - 40
}
