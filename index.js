"use strict"

// Setup the renderer
var renderer = PIXI.autoDetectRenderer(640, 640)
renderer.backgroundColor = 0xffffff
renderer.roundPixels = true

// Connect to my Firebase
var firebase = new Firebase("https://ancaticipation.firebaseio.com")

// ===================== SETUP SCREENS ================== //

// Standard Screen
var stage = new PIXI.Container()
  // Graphics object for lines and squares and such...
var graphics = new PIXI.Graphics();
stage.addChild(graphics)
  // Text
var instr1 = new PIXI.Text('Press \'Q\' to guess Goal on Left',{font : '12px Roboto', fill : 0x077f4d});
instr1.x = 0
instr1.y = 500
stage.addChild(instr1)
var instr2 = new PIXI.Text('Press \'P\' to guess Goal on Right',{font : '12px Roboto', fill : 0x077f4d});
instr2.x = 400
instr2.y = 500
stage.addChild(instr2)
var timer = new PIXI.Text('+100',{font : '48px Roboto', fill : 0x077f4d, align: 'ceneter'});
timer.x = 250
timer.y = 550
stage.addChild(timer)
var text = new PIXI.Text('Time left :',{font : '24px Roboto', fill : 0x077f4d, align: 'ceneter'});
text.x = 0
text.y = 550
stage.addChild(text)

  // Win screen
var yay = new PIXI.Container()
var yup = new PIXI.Text('Correct!',{font : '60px Roboto', fill : 0x077f4d, align: 'center'});
yup.x = 220
yup.y = 200
yay.addChild(yup)

  // Lose screen
var nay = new PIXI.Container()
var nope = new PIXI.Text('WRONG!',{font : '60px Roboto', fill : 0xcf4c34, align: 'center'});
nope.x = 220
nope.y = 200
nay.addChild(nope)

// Starting screen
var helpStart = new PIXI.Container()
var help = new PIXI.Text('The robot wants you to guess correctly, so it\'s going to try \ngiving different hints in different ways. Guess as soon as \nyou feel confident you know which goal it\'s heading for!',{font : '24px Roboto', fill : 0x077f4d, align: 'center'});
help.x = 0
help.y = 0
helpStart.addChild(help)
var next = new PIXI.Text('Ready? Press any key to continue.',{font : '24px Roboto', fill : 0xcf4c34, align: 'center'});
next.x = 200
next.y = 400
helpStart.addChild(next)

var tLindex = 0
var trajList = [3,2,7,6,8,1]
//var trajList = [3,3,2,3,7,6,8,1]
// Robot class
class Robot extends PIXI.Sprite {
  constructor(){
    super(PIXI.Texture.fromImage("blueRobot.png"))
    this.x = 50 ; this.y = 50
    this.pivot.x = 1000 ; this.pivot.y = 1000
    this.width = 100 ; this.height = 100
  }
  update(){
    tick += 1
    if(tick>=100){
      // Increment trajectory counter
      if(mode==-4){
        if(traj==0){
          traj=5
        }
        else{
          traj=0
        }
      }
      if(mode==0){
        tLindex+=1
        if(tLindex>=6){
          tLindex=0
        }
        traj=trajList[tLindex]
      }
      // Print the trajectory counter descriptor
      if(traj>=0 && traj<5){
        console.log(traj,"Rightwards : ")
      }
      else{
        console.log(traj,"Leftwards : ")
      }
      if(traj%5 == 0) {console.log("Standard")}
      if(traj%5 == 1) {console.log("Avg. Offset")}
      if(traj%5 == 2) {console.log("Keyframe")}
      if(traj%5 == 3) {traj+=1}
      if(traj%5 == 4) {console.log("Baseline")}
      tick=0
    }
    // Update robot position to stay on track
    this.x = 320+(myData.q[traj][0][tick]-5)*53
    this.y = 430-myData.q[traj][1][tick]*53
  }
}


// Globals
var tick = 0
var traj = 0
var mode = -1
var modeExit = 10

var robot = new Robot()
stage.addChild(robot)

// Render Loop
var clock =  0 ; var now = Date.now()
window.setInterval(function() {
  // Time management
  clock += Date.now() - now
  now = Date.now()
  // Trajectory screen
  if(mode==-1){
    // Sprite management
    //robot.update()
    // Decrease timer
    timer.text = ''
    text.text = 'This is our robot'
    instr1.text = 'Press any key to advance'
    instr2.text = 'Press any key to advance'
    tick=-1
  }
  if(mode==-2){
    text.text = 'It will either: move to the goal on the left...'
    traj=5
  }
  if(mode==-3){
    text.text = '...or move to the goal on the right'
    traj=0
  }
  if(mode==-4){
    text.text = 'Guess which goal it\'s heading for ahead \n of time to gain points!'
    instr1.text = 'Press \'Q\' key to guess Goal on Left'
    instr2.text = 'Press \'P\' key to guess Goal on Right'

    instr1.style = {font : '14px Roboto', fill : 0xcf4c34}
    instr2.style = {font : '14px Roboto', fill : 0xcf4c34}
    if(correctQ==1 && correctP==1){
      mode=3
    }
  }
  if(mode==0){
    // Decrease timer
    var temp = 100 - tick
    text.text = 'Time left : '
    timer.text = temp.toString()
  }
  if(mode<1){
    // Sprite management
    robot.update()
    // Path Drawing
    graphics.clear()
    graphics.lineStyle(5, 0x077f4d);
    graphics.moveTo(320,430)
    var i = 0
    for(i=1; i<tick; i++){
      graphics.lineTo(320+(myData.q[traj][0][i]-5)*53,430-myData.q[traj][1][i]*53)
    }
    // Rendering the stage
    renderer.render(stage)
  }
  if(mode==1){
    // Rendering the stage
    renderer.render(yay)
    modeExit+=-1
    if(modeExit==0){
      mode=0
    }
  }
  if(mode==2){
    // Rendering the stage
    renderer.render(nay)
    modeExit+=-1
    if(modeExit==0){
      mode=0
    }
  }
  if(mode==3){
    // Rendering the stage
    instr1.style = {font : '12px Roboto', fill : 0x077f4d}
    instr2.style = {font : '12px Roboto', fill : 0x077f4d}
    renderer.render(helpStart)
  }
  if(mode==4){
    // Rendering the stage
    renderer.render(yay)
    modeExit+=-1
    if(modeExit==0){
      mode=-4
    }
  }
  if(mode==5){
    // Rendering the stage
    renderer.render(nay)
    modeExit+=-1
    if(modeExit==0){
      mode=-4
    }
  }
},50)

// Keyboard Listener Loop
var key = null
var correctP = 0
var correctQ = 0
document.addEventListener("keydown",function(event) {
  // Log time and key
  key = event.keyCode
  console.log(clock,tick,key)
  var correct = 0
  if(mode<0 && mode>-4){
    mode-=1
    tick=0
  }
  if(mode == 3){
    mode=0
    tick=0
    tLindex=0
    traj=trajList[tLindex]
  }
  if(mode==0){
    if(key==81){
      if(traj>=5){
        correct=1
        mode=1
      }
      else {
        correct=0
        mode=2
      }
    }
    else if(key==80){
      if(traj<5){
        correct=1
        mode=1
      }
      else {
        correct=0
        mode=2
      }
    }
    // Record time and key to Firebase
    if(key==80 || key==81){
      modeExit=10
      tick=100
      firebase.push({
        date : Date.now(),
        correctness : correct,
        ip : userip,
        keystroke : key,
        tlength : tick,
      })
    }
  }
  if(mode==-4){
    if(key==80 || key==81){
      modeExit=10
      tick=100
      console.log(correctQ,correctP)
    }
    if(key==81){
      if(traj>=5){
        correctQ=1
        mode=4
      }
      else {
        correctQ=0
        mode=5
      }
    }
    else if(key==80){
      if(traj<5){
        correctP=1
        mode=4
      }
      else {
        correctP=0
        mode=5
      }
    }
  }
  // End
})


// Wrap it up
var mount = document.getElementById("mount")
mount.insertBefore(renderer.view, mount.firstChild)
