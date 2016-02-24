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
      if(traj>9)
        traj=0
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
