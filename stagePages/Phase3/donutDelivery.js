"use strict"

const SCREEN_WIDTH = 1400;
const SCREEN_HEIGHT = 768;
const MAXTIME = 120;

function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

console.log("Driving style for this game is "+thisDrivingStyle+" = "+drivingStyle)

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
  // Returns a random point on the screen as a X-Y tuple
  randomScreenXY(){
    return [random()*SCREEN_WIDTH,random()*(SCREEN_HEIGHT-120)+60];
  }
  randomStateXY(){
    let pos = this.randomScreenXY();
    //return this.mapPositionToState(pos[0],pos[1]);
    let posX = random()*30 - 15;
    let posY = random()*20 - 10;
    return [posX,posY];
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
graphics.mapper = new ScreenXYMap(30,0,0,30,SCREEN_WIDTH/2,SCREEN_HEIGHT/2);
stage.addChild(graphics);

// Scoreboard
let ArcadeScore = 0;
let arcadeScore = new PIXI.Text('0',{font : '40px Gill Sans', fill : 0x000000})
arcadeScore.text = 'SCORE: '+ ArcadeScore;
stage.addChild(arcadeScore);
let timerDisplay = new PIXI.Text('TIME: 240 sec',{font : '30px Gill Sans', fill : 0x000000})
timerDisplay.y = 60;
stage.addChild(timerDisplay);

// Add the Countdown Timer
let countdown = new PIXI.Text('3',{font : '80px Gill Sans', fill : 0x000000})
countdown.x = SCREEN_WIDTH/2;
countdown.y = SCREEN_HEIGHT/2;
stage.addChild(countdown);

// Obstacles
let dubinsCircles = new TestTrifectaPalette("dubins");
let dubinsWalls = new CopiedPalette("dubinsWall");
let obstacleList = [];
let carRadius = 0.55;
for(let ii = 0; ii < 15; ii++){
  //let pos = graphics.mapper.randomStateXY();
  let posX = random()*30 - 15;
  let posY = random()*18 - 9;
  let blocked = false;
  do {
    posX = random()*30 - 15;
    posY = random()*18 - 9;
    blocked = false;
    for(let obNum = 0; obNum < obstacleList.length; obNum++){
      if( Math.pow((obstacleList[obNum].ObX - posX),2)
            + Math.pow((obstacleList[obNum].ObY - posY),2)
                < Math.pow((3 * obstacleList[obNum].ObR),2) ){
        blocked = true;
      }
    }
  }while(blocked)
  obstacleList.push(new RoundObstacle(posX,posY,1.8,carRadius,dubinsCircles))
}
//let wall = new RoundObstacle(0,-12.5,0.1,0,dubinsWalls);
//wall.color = 0xEEEEEE;
//obstacleList.push(wall )
let obstacles = new Obstaclescape(obstacleList)
for(let ii = 0; ii < 15; ii++){
  if(ii % 2 == 0)
    obstacles.obstacleUndetected[ii] = true;
}
// Clear out some obstacles to begin with
let ghostObstacleIds = [];
for(let ii = 10; ii < 15; ii++){
  obstacles.obstacleDestroyed[ii] = true;
  ghostObstacleIds.push(ii);
}

// Robot Object
let Umax = 1;
///* // Dubins Car Robot
let robots = [];
let robotControllers = [];
let robotTints = [0x24EB98, 0xFF745A, 0x6333ed];
//robots.push(new DubinsRobot([-4,3,0],3,0xFF745A));
for(let robotNum = 0; robotNum < 2; robotNum++){
  //let pos = graphics.mapper.randomStateXY();
  //robots[robotNum] = new DubinsRobot([-20,robotNum*5-5,0],3,robotTints[robotNum]);
  robots[robotNum] = new DubinsRobot([-20,robotNum*5-5,0],3,0x24EB98);

  stage.addChild(robots[robotNum]);

  let goalPoint = graphics.mapper.randomStateXY();
  goalPoint[0] = 20;

  let intervener = new PaletteIntervention_Contr(robots[robotNum],
      new maskedObstaclescape(obstacles),0,
      Umax,0,
      new Dubins_Contr(robots[robotNum],Umax,goalPoint ));
  //intervener.trigger_level = robots[robotNum].height/(2*graphics.mapper.Mxx) * Math.SQRT2;
  robotControllers[robotNum] = intervener;
  robotControllers[robotNum].setID = drivingStyle;
}
/*
robotControllers[0].setID = 0;
//robotControllers[3].setID = 0; robots[3].tint = 0x24EB98;
robotControllers[1].setID = 1;
//robotControllers[4].setID = 2; robots[4].tint = 0xFF745A;
robotControllers[2].setID = 2;
//robotControllers[5].setID = 3; robots[5].tint = 0x6333ed;
*/

// ===================== THE MAIN EVENT ================== // 3
let leftX;
let rightX;
[leftX,] = graphics.mapper.mapStateToPosition(-20,0);
[rightX,] = graphics.mapper.mapStateToPosition(20,0);

// Main Loop
let clock =  0 ;
let now = Date.now();
let obstacleDeficit = 0;
window.setInterval(function() {
  // Clear the stage
  graphics.clear();
  // Time management
  let delT = Date.now() - now;
  clock += delT;
  timerDisplay.text = 'TIME: '+(MAXTIME-Math.floor(clock/1000))+' sec';
  now = Date.now();
  if(clock > 3000){
    delT *= 0.0005 * 4;
    // Robot dynamics
    for(let robotNum = 0; robotNum < robots.length; robotNum++){
      if(robots[robotNum].destroyed) continue;
      robots[robotNum].update(delT,robotControllers[robotNum].u() );
      // Check if the robot ran into an obstacle
      if(obstacles.collisionSetValue(robots[robotNum].states) < 0){
        if(robots[robotNum].spinout == 0){
          /*
          obstacles.obstacleDestroyed[obNum] = true;
          robots[robotNum].destroyed = true;
          robots[robotNum].speed = 0;
          */
          //robots[robotNum].tint = 0x999999;

          ArcadeScore -= 20;
          console.log('robot mistake!');
        }
        robots[robotNum].spinout = 100;
      }
      // Draw goal rays
      graphics.beginFill(0x222222);
      graphics.lineStyle(2,0xDDEEDD);
      let robotPos = graphics.mapper.mapStateToPosition(robots[robotNum].states[0],robots[robotNum].states[1]);
      graphics.moveTo(robotPos[0],robotPos[1]);
      //let goalPos = graphics.mapper.mapStateToPosition(robotControllers[robotNum].tracker.set);
      let goalPos = [robotControllers[robotNum].tracker.goal.x,robotControllers[robotNum].tracker.goal.y];
      graphics.lineTo(goalPos[0],goalPos[1]);
      graphics.endFill();
    }
    countdown.text = '';
  }
  else{
    countdown.text = Math.ceil( 3+(3 - clock)/1000 );
  }
  // Obstacle regeneration
  if(obstacleDeficit > 0){
    //for(let obNum = 0; obNum < obstacles.obstacles.length; obNum++){
    //  if(obstacles.obstacleDestroyed[obNum]){
    for(let ii = 0; ii < ghostObstacleIds.length; ii++){
      let obNum = ghostObstacleIds[ii];
      {
        let robotTooClose = false;
        for(let robotNum = 0; robotNum < robots.length; robotNum++){
          if(obstacles.obstacles[obNum].collisionSetValue(robots[robotNum].states) < 2){
            robotTooClose = true;
          }
        }
        if(robotTooClose == false){
          obstacles.obstacleDestroyed[obNum] = false;
          obstacleDeficit--;
          ghostObstacleIds.shift();
          console.log("obstacle respawned")
        }
      }
      if(obstacleDeficit == 0){
        break;
      }
    }
  }
  // Check if Time has Elapsed
  if(clock > MAXTIME * 1000){
    if(gameNumber<5){
      document.location.href = "buffer.html#" + gameNumber;
    }
    else{
      document.location.href = "../completed.html";
    }
  }
    // Draw the goal lines
  graphics.beginFill(0xEEEEEE);
  graphics.lineStyle(0,0x000000);
  graphics.drawRect(0,0,leftX,SCREEN_HEIGHT);
  graphics.drawRect(rightX,0,SCREEN_WIDTH-rightX,SCREEN_HEIGHT);
  graphics.endFill();
    // Render the obstacles
  obstacles.render();
  //intervener.intervening_sets.displayGrid(intervener.setID,graphics,robot.tint,robot.states,0,1);
  //intervener2.intervening_sets.displayGrid(intervener2.setID,graphics,robot2.tint,robot2.states,0,1);
  //obstacles.displayGrid(0,graphics,robots[0].tint,robots[0].states,0,1);
  arcadeScore.text = 'SCORE: '+ ArcadeScore;
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
        obstacleDeficit++;
        ghostObstacleIds.push(obNum);
        ArcadeScore -= 10;
      }
    }
  }
  // End
})


// Mount the renderer in the website
let mount = document.getElementById("mount");
mount.insertBefore(renderer.view, mount.firstChild);
