"use strict"

const SCREEN_WIDTH = 1400;
const SCREEN_HEIGHT = 768;
const MAXTIME = 123;
const NUMBER_OF_ROBOTS = 2;

function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

let record = -1;
/*
function loadJSON(callback) {

   var xobj = new XMLHttpRequest();
       xobj.overrideMimeType("application/json");
   xobj.open('GET', "http://localhost:3000/Experiments/2/Subject2Game0.dat", false);
   xobj.onreadystatechange = function () {
         if (xobj.readyState == 4 && xobj.status == "200") {
           // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
           callback(xobj.responseText);
         }
   };
   xobj.send(null);
}

loadJSON(function(response) {
  // Parse JSON string into object
    var record = JSON.parse(response);
 });
 */

console.log("Driving style for this game is Number "+drivingStyle)

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
let wallClock = 0;
let clock =  0;

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

// Emulated mouse
let emulatedMouse = new PIXI.Sprite.fromImage('mouse.png');
stage.addChild(emulatedMouse);

let dubinsCircles = new TestTrifectaPalette("dubins");
let ghostObstacleIds = [];
let obstacleList = [];
let obstacles = {};
let robots = [];
let robotGoals = [];
let robotTints = [0x24EB98, 0xFF745A, 0x6333ed];

fetch("http://localhost:3000/Experiments/"+participantNumber+"/Subject"+participantNumber+"Game"+gameNumber+".dat").then((response) => {
       return response.json();
   }).then((json) => {
       // Load the JSON into a local data member
       console.log("loaded http://localhost:3000/Experiments/"+participantNumber+"/Subject"+participantNumber+"Game"+gameNumber+".dat")
       console.log(json);
       record = json;

      // Obstacles
      for(let ii = 0; ii < 15; ii++){
        let obstacleInit = record.obstacles[ii];
        let posX = obstacleInit.position[0];
        let posY = obstacleInit.position[1];
        //obstacleList.push(new RoundObstacle(posX,posY,obstacleInit.radius,obstacleInit.radiumTrim,dubinsCircles));
        obstacleList.push(new RoundObstacle(posX,posY,1.8,0.55,dubinsCircles));
      }
      obstacles = new Obstaclescape(obstacleList);
      //let wall = new RoundObstacle(0,-12.5,0.1,0,dubinsWalls);
      //wall.color = 0xEEEEEE;
      //obstacleList.push(wall )
      for(let ii = 0; ii < 15; ii++){
        obstacles.obstacleUndetected[ii] = false;
      }
      // Clear out some obstacles to begin with
      for(let ii = 10; ii < 15; ii++){
        obstacles.obstacleDestroyed[ii] = true;
        ghostObstacleIds.push(ii);
      }

      // Robot Object
      let Umax = 1;
      ///* // Dubins Car Robot
      //robots.push(new DubinsRobot([-4,3,0],3,0xFF745A));
      for(let robotNum = 0; robotNum < NUMBER_OF_ROBOTS; robotNum++){
        //let pos = graphics.mapper.randomStateXY();
        //robots[robotNum] = new DubinsRobot([-20,robotNum*5-5,0],3,robotTints[robotNum]);
        robots[robotNum] = new DubinsRobot([-20,robotNum*5-5,0],3,0x24EB98);
        robots[robotNum].ID = robotNum;

        stage.addChild(robots[robotNum]);

        // Set their goals
        robotGoals[robotNum] = [-20,0];
      }
      /*
      robotControllers[0].setID = 0;
      //robotControllers[3].setID = 0; robots[3].tint = 0x24EB98;
      robotControllers[1].setID = 1;
      //robotControllers[4].setID = 2; robots[4].tint = 0xFF745A;
      robotControllers[2].setID = 2;
      //robotControllers[5].setID = 3; robots[5].tint = 0x6333ed;
      */

  })

// ===================== THE MAIN EVENT ================== // 3
let leftX;
let rightX;
[leftX,] = graphics.mapper.mapStateToPosition(-20,0);
[rightX,] = graphics.mapper.mapStateToPosition(20,0);

// Playback management variables
let curTick = 0;
let curMouseEvent = 0;
let curRegenEvent = 0;
let curGoalSetEvent = 0;
let curCollisionEvent = 0;

// Main Loop
let now = Date.now();
let obstacleDeficit = 0;
window.setInterval(function() {
  // Clear the stage
  graphics.clear();
  // Time management
  let delT = Date.now() - now;
  wallClock += delT;
  timerDisplay.text = 'TIME: '+(MAXTIME-Math.floor(clock/1000))+' sec';
  now = Date.now();
  delT *= 0.0005 * 4;
  // Check if the game is over
  if(curTick+1 >= record.robotTraces[0].length){
    if(gameNumber<5){
      document.location.href = "buffer.html#" + gameNumber;
    }
    else{
      document.location.href = "../completed.html";
    }
  }
  // Increment the current tick
  if(wallClock > record.timeTrace[curTick+1]){
    clock = record.timeTrace[curTick+1];
    curTick++;
    for(let robotNum = 0; robotNum < robots.length; robotNum++){
      // Set the robot state to that from the record
      robots[robotNum].states = record.robotTraces[robotNum][curTick].slice();
    }
    let mouseState = record.mouseTrace[curTick].slice();
    let mousePosition = graphics.mapper.mapStateToPosition(mouseState[0],mouseState[1]);
    emulatedMouse.x = mousePosition[0];
    emulatedMouse.y = mousePosition[1];
    //console.log(curTick,record.robotTraces[0][curTick]);
  }
  // Robot dynamics
  for(let robotNum = 0; robotNum < robots.length; robotNum++){
    /*/ Check if the robot ran into an obstacle
    if(obstacles.collisionSetValue(robots[robotNum].states) < 0){
      if(robots[robotNum].spinout == 0){
        //robots[robotNum].tint = 0x999999;

        ArcadeScore -= 20;
        console.log('robot mistake!');
      }
      robots[robotNum].spinout = 100;
    }
    */
    robots[robotNum].displayState();
    // Draw goal rays
    graphics.beginFill(0x222222);
    graphics.lineStyle(2,0xDDEEDD);
    let robotPos = graphics.mapper.mapStateToPosition(robots[robotNum].states[0],robots[robotNum].states[1]);
    graphics.moveTo(robotPos[0],robotPos[1]);
    let goalState = robotGoals[robotNum].slice();
    let goalPos = graphics.mapper.mapStateToPosition(goalState[0],goalState[1]);
    graphics.lineTo(goalPos[0],goalPos[1]);
    graphics.endFill();
  }
  // Obstacle destruction (playing back and emulating mouseclicks)
  if(curMouseEvent < record.mouseEvents.length){
    if(clock > record.mouseEvents[curMouseEvent].timestamp){
      let obNum = record.mouseEvents[curMouseEvent].destroyedObstacleID;
      if(obNum > -1){
        obstacles.obstacleDestroyed[obNum] = true;
        console.log('obstacle destroyed')
        obstacleDeficit++;
        ghostObstacleIds.push(obNum);
        ArcadeScore -= 10;
        curMouseEvent++;
      }
    }
  }
  // Obstacle regeneration
  if(curRegenEvent < record.regenEvents.length){
    if(clock > record.regenEvents[curRegenEvent].timestamp){
      let obNum = record.regenEvents[curRegenEvent].regeneratedObstacleID;
      obstacles.obstacleDestroyed[obNum] = false;
      console.log('obstacle respawned');
      obstacleDeficit--;
      ghostObstacleIds.shift();
      curRegenEvent++;
    }
  }
  // Obstacle collision
  if(curCollisionEvent < record.collisionEvents.length){
    if(clock > record.collisionEvents[curCollisionEvent].timestamp){
      let robotNum = record.collisionEvents[curCollisionEvent].robotID;
      ArcadeScore -= 20;
      console.log('robot mistake!');
      robots[robotNum].spinout = 100;
      curCollisionEvent++;
    }
  }
  // Goal set resetting
  if(curGoalSetEvent < record.goalSetEvents.length){
    if(clock > record.goalSetEvents[curGoalSetEvent].timestamp){
      robotGoals[record.goalSetEvents[curGoalSetEvent].robotID]
          = record.goalSetEvents[curGoalSetEvent].goal.slice();
      curGoalSetEvent++;
      ArcadeScore += 20;
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


// Mount the renderer in the website
let mount = document.getElementById("mount");
mount.insertBefore(renderer.view, mount.firstChild);
