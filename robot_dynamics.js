// Robot class
class Robot extends PIXI.Sprite {
  constructor(x0,y0){
    // Image
    super(PIXI.Texture.fromImage("QuadcopterSide.png"))
    this.pivot.x = 100 ; this.pivot.y = 50
    this.width = 100 ; this.height = 50
    // State
    this.x = x0 ; this.y = y0
    this.vx = 0 ; this.vy = 0
  }
  update(delT,ux,uy){
    // Double Integrator Dynamics
    this.x += this.vx * delT
    this.y += this.vy * delT
    this.vx += ux * delT
    this.vy += uy * delT
  }
}
