"use strict"

const SCREEN_WIDTH = 1400;
const SCREEN_HEIGHT = 768;
const MAXTIME = 123;
const NUMBER_OF_ROBOTS = 2;

// Recording
let unsaved = true;
let record = new Record;
const RECORDING_PERIOD = 10;
let recordCounter = 0;

function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

console.log("Driving style for this game is Number "+drivingStyle)
console.log("Randomization Seed is "+seed)

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
let clock =  0 ;

// Setup the PIXI renderer that handles interactive display and input inside the browser
let renderer = PIXI.autoDetectRenderer(SCREEN_WIDTH, SCREEN_HEIGHT);
renderer.backgroundColor = 0xffffff;
renderer.roundPixels = true;

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
let countdown = new PIXI.Text('3',{font : '80px Gill Sans', fill : 0x555555})
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
  record.obstacles.push({position: [posX,posY], radius: 1.8, radiusTrim: carRadius});
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
for(let robotNum = 0; robotNum < NUMBER_OF_ROBOTS; robotNum++){
  //let pos = graphics.mapper.randomStateXY();
  //robots[robotNum] = new DubinsRobot([-20,robotNum*5-5,0],3,robotTints[robotNum]);
  robots[robotNum] = new DubinsRobot([-20,robotNum*5-5,0],3,0x24EB98);
  robots[robotNum].ID = robotNum;

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

          record.collisionEvents.push({
            "robotID": robotNum,
            "robotState": robots[robotNum].states,
            "timestamp": clock
          })
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
      // Record the robot trajectories
      recordCounter++;
      if(recordCounter == RECORDING_PERIOD){
        recordCounter = 0;
        for(let robotNum = 0; robotNum < robots.length; robotNum++){
          // Record the robot state
          record.robotTraces[robotNum].push(robots[robotNum].states.slice());
            // do we want to record other data for each robot, like spinout?
        }
        // Record the current time
        record.timeTrace.push(clock);
        // Record the current mouse position
        let mousePosition = renderer.plugins.interaction.mouse.global;
        let mouseState = graphics.mapper.mapPositionToState(mousePosition.x,mousePosition.y);
        record.mouseTrace.push(mouseState);
      }
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
          if(obstacles.obstacles[obNum].collisionSetValue(robots[robotNum].states) < 4){
            robotTooClose = true;
          }
        }
        if(robotTooClose == false){
          obstacles.obstacleDestroyed[obNum] = false;
          record.regenEvents.push({timestamp: clock, regeneratedObstacleID: obNum});
          obstacleDeficit--;
          ghostObstacleIds.splice(ii,1);
          console.log("obstacle respawned. Now deficit at "+obstacleDeficit)
        }
      }
      if(obstacleDeficit == 0){
        break;
      }
    }
  }
  // Check if Time has Elapsed
  if(clock > MAXTIME * 1000){
    if(unsaved){
      record.finalScore = ArcadeScore;
      var blob = new Blob([JSON.stringify(record)], {type: "text/plain;charset=utf-8"});
      saveAs(blob, "Subject"+participantNumber+"Game"+gameNumber+".dat");
      unsaved = false;
    }
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

// ====================== Mouse Listener Loop ========================= //
document.addEventListener("mousedown",function(event) {
  let mousePosition = renderer.plugins.interaction.mouse.global;
  let mouseState = graphics.mapper.mapPositionToState(mousePosition.x,mousePosition.y);
  for(let obNum = 0; obNum < obstacles.obstacles.length ; obNum++){
    let curObstacle = obstacles.obstacles[obNum];
    if(obstacles.obstacleDestroyed[obNum] == false){
      if(curObstacle.collisionSetValue([mouseState[0],mouseState[1],0]) < 0){
        obstacles.obstacleDestroyed[obNum] = true;
        obstacleDeficit++;
        console.log("obstacle destroyed. Now deficit at "+obstacleDeficit);
        ghostObstacleIds.push(obNum);
        ArcadeScore -= 10;
        // Log the mouseclick
        let clickRobots = [];
        for(let robotNum = 0; robotNum < robots.length; robotNum++){
          let robotBlinded =
            robotControllers[robotNum].intervening_sets.undetectionscape[obNum];
          clickRobots[robotNum] = {
            "state": robots[robotNum].states.slice(),
            "blindToObstacle": robotBlinded
          };
        }
        record.mouseEvents.push({
          "mouseState": mouseState,
          "destroyedObstacleID": obNum,
          "timestamp": clock,
          "robots": clickRobots
        });
      }
    }
  }
  // End
})


// Mount the renderer in the website
let mount = document.getElementById("mount");
mount.insertBefore(renderer.view, mount.firstChild);
