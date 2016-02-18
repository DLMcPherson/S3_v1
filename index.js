"use strict"

// Setup objects
  // Setup the window
var renderer = PIXI.autoDetectRenderer(640, 480)
var stage = new PIXI.Container()
renderer.backgroundColor = 0xffffff
renderer.roundPixels = true
  // Setup the Firebase
var firebase = new Firebase("https://ancaticipation.firebaseio.com")
var graphics = new PIXI.Graphics();
stage.addChild(graphics)

var tick = 0
var traj = 0

// Rendering
class Robot extends PIXI.Sprite {
  constructor(){
    super(PIXI.Texture.fromImage("SmallCookie.png"))
    this.x = 50 ; this.y = 50
    this.pivot.x = 150 ; this.pivot.y = 150
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

var clock =  0
var now = Date.now()
var key = null
window.setInterval(function() {
  // Time management
  clock += Date.now() - now
  now = Date.now()
  //console.log(clock)
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
},50)

// Keyboard Listener
document.addEventListener("keydown",function(event) {
  // Log time and key
  key = event.keyCode
  console.log(clock,key)
  // Record time and key to Firebase
  firebase.push({
    date : Date.now(),
    faveNumber : 5,
    keystroke : key,
    tlength : clock,
  })
  // End
})


// Wrap it up
var mount = document.getElementById("mount")
mount.insertBefore(renderer.view, mount.firstChild)
