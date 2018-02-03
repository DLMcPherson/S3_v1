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
graphics.mapper = new ScreenXYMap(30,0,0,30,630,350);
stage.addChild(graphics);

let ArcadeScore = 0;
let arcadeScore = new PIXI.Text('0',{font : '40px Gill Sans', fill : 0x000000})
arcadeScore.text = 'SCORE: '+ ArcadeScore;
stage.addChild(arcadeScore);

// Obstacles
let dubinsCircles = new LearnedPalette("dubins");
let obstacleList = [];
for(let ii = 0; ii < 20; ii++){
  let pos = graphics.mapper.randomStateXY();
  obstacleList.push(new RoundObstacle(pos[0],pos[1],1,dubinsCircles))
}
let obstacles = new Obstaclescape(obstacleList)
for(let ii = 0; ii < 20; ii++){
  if(ii % 2 == 0)
    obstacles.obstacleUndetected[ii] = true;
}

// Robot Object
let Umax = 1;
///* // Dubins Car Robot
let robots = [];
let robotControllers = [];
//robots.push(new DubinsRobot([-4,3,0],3,0xFF745A));
for(let robotNum = 0; robotNum < 6; robotNum++){
  let pos = graphics.mapper.randomStateXY();
  robots[robotNum] = new DubinsRobot([pos[0],pos[1],0],3,0x24EB98);

  robots[robotNum].width /= 2;
  robots[robotNum].height /= 2;

  stage.addChild(robots[robotNum]);

  let intervener = new PaletteIntervention_Contr(robots[robotNum],
      obstacles,0,
      Umax,0,
      new Dubins_Contr(robots[robotNum],Umax,graphics.mapper.randomStateXY() ));
  intervener.trigger_level = robots[robotNum].height/(2*graphics.mapper.Mxx) * Math.SQRT2;
  robotControllers[robotNum] = intervener;
}
robotControllers[2].setID = 2; robots[2].tint = 0xFF745A;
robotControllers[3].setID = 2; robots[3].tint = 0xFF745A;

robotControllers[4].setID = 3; robots[4].tint = 0x6333ed;
robotControllers[5].setID = 3; robots[5].tint = 0x6333ed;

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
  for(let robotNum = 0; robotNum < robots.length; robotNum++){
    if(robots[robotNum].destroyed) continue;
    robots[robotNum].update(delT,robotControllers[robotNum].u() );
    // Check if the robot ran into an obstacle
    for(let obNum = 0; obNum < obstacles.obstacles.length ; obNum++){
      let curObstacle = obstacles.obstacles[obNum];
      if(obstacles.obstacleDestroyed[obNum] == false){
        if(curObstacle.collisionSetValue(robots[robotNum].states) < 0){
          obstacles.obstacleDestroyed[obNum] = true;
          robots[robotNum].destroyed = true;
          robots[robotNum].speed = 0;
          robots[robotNum].tint = 0x999999;
          console.log('robot destroyed')
          ArcadeScore -= 100;
        }
      }
    }
  }
  // Rendering the stage
  graphics.clear();
  obstacles.render();
  //intervener.intervening_sets.displayGrid(intervener.setID,graphics,robot.tint,robot.states,0,1);
  //intervener2.intervening_sets.displayGrid(intervener2.setID,graphics,robot2.tint,robot2.states,0,1);
  //obstacles.displayGrid(0,graphics,robots[0].tint,robots[0].states,0,1);
  arcadeScore.text = 'SCORE: '+ ArcadeScore;
  renderer.render(stage);
},2)

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
  // End
})

// ====================== Mouse Listener Loop ========================= //
document.addEventListener("mousedown",function(event) {
  let mousePosition = renderer.plugins.interaction.mouse.global;
  let mouseState = graphics.mapper.mapPositionToState(mousePosition.x,mousePosition.y);
  for(let obNum = 0; obNum < obstacles.obstacles.length ; obNum++){
    let curObstacle = obstacles.obstacles[obNum];
    if(obstacles.obstacleDestroyed[obNum] == false){
      if(curObstacle.collisionSetValue([mouseState[0],mouseState[1],0]) < 0){
        obstacles.obstacleDestroyed[obNum] = true;
        console.log('obstacle destroyed')
        ArcadeScore -= 50;
      }
    }
  }
  // End
})


// Mount the renderer in the website
let mount = document.getElementById("mount");
mount.insertBefore(renderer.view, mount.firstChild);
