"use strict"

var renderer = PIXI.autoDetectRenderer(640, 480)
renderer.backgroundColor = 0x222222
renderer.roundPixels = true

var firebase = new Firebase("https://ancaticipation.firebaseio.com")

// Rendering
class Robot extends PIXI.Sprite {
  constructor(){
    super(PIXI.Texture.fromImage("SmallCookie.png"))
    this.x = 0
    this.y = 0
    this.width = 100
    this.height = 100
  }
  update(){
    this.x += 1
    if(this.x>640){
      this.x=-100
      this.y+=100
    }
    if(this.y>480)
    {
      this.y=0
    }
  }
}
var robot = new Robot()

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
  renderer.render(robot)
},10)

document.addEventListener("keydown",function(event) {
  console.log(clock,event.keyCode)
  key = event.keyCode
  firebase.push({
    date : Date.now(),
    faveNumber : 5,
    keystroke : key,
    tlength : clock,
  })
})


// ending stuff
var mount = document.getElementById("mount")
mount.insertBefore(renderer.view, mount.firstChild)
