"use strict"

// Setup objects
  // Setup the window
var renderer = PIXI.autoDetectRenderer(640, 640)
var stage = new PIXI.Container()
renderer.backgroundColor = 0xffffff
renderer.roundPixels = true
  // Setup the Firebase
var firebase = new Firebase("https://ancaticipation.firebaseio.com")
var graphics = new PIXI.Graphics();
stage.addChild(graphics)
var data = []
$.getJSON("TrajDataC.json",data, function( data ) {
  var items = [];
  $.each( data, function( key, val ) {
    items.push( "<li id='" + key + "'>" + val + "</li>" );
  });

  $( "<ul/>", {
    "class": "my-new-list",
    html: items.join( "" )
  }).appendTo( "body" );
});
console.log(data)


var yay = new PIXI.Container()
var yup = new PIXI.Text('Correct!',{font : '60px Roboto', fill : 0x077f4d});
yup.x = 300
yup.y = 300
yay.addChild(yup)
var nay = new PIXI.Container()
var nope = new PIXI.Text('WRONG!',{font : '60px Roboto', fill : 0xcf4c34});
nope.x = 300
nope.y = 300
nay.addChild(nope)

var tick = 0
var traj = 0

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
      traj+=1
      if(traj>9){
        traj=0
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
var robot = new Robot()
stage.addChild(robot)

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

// Render Loop
var clock =  0
var timeleft = 100
var now = Date.now()
var key = null
var mode = 0
var modeExit = 10
window.setInterval(function() {
  // Time management
  clock += Date.now() - now
  now = Date.now()
  // Trajectory screen
  if(mode==0){
    // Sprite management
    robot.update()
    // Decrease timer
    var temp = 100 - tick
    timer.text = temp.toString()
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
},50)

// Keyboard Listener Loop
document.addEventListener("keydown",function(event) {
  // Log time and key
  key = event.keyCode
  console.log(clock,tick,key)
  var correct = 0
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
      modeExit=10
      tick=100
    }
    if(key==80){
      if(traj<5){
        correct=1
        mode=1
      }
      else {
        correct=0
        mode=2
      }
      modeExit=10
      tick=100
    }
    // Record time and key to Firebase
    if(key==80 || key==81){
      firebase.push({
        date : Date.now(),
        correctness : correct,
        keystroke : key,
        tlength : tick,
      })
    }
  }
  // End
})


// Wrap it up
var mount = document.getElementById("mount")
mount.insertBefore(renderer.view, mount.firstChild)
