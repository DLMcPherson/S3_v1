// Abstract robot class : exposes interface for dynamical updates
class Robot extends PIXI.Sprite {
  // Dynamical update function that realizes the difference equation describing the system
  dynamics(delT,ux,uy){
    this.states[0] += (0) * delT
    this.states[1] += (0) * delT
    this.states[2] += (0) * delT
  }
  // Method that translates states from the state vector into the corresponding
  // position for rendering in the JS
  displayState(){
    this.x = this.states[0]
    this.y = this.states[1]
    this.rotation = this.states[2]
  }
  // Constructor initializes PIXI.Sprite members and sets initial state
  constructor(texture){
    // Image
    super(texture)
    this.pivot.x = 50 ; this.pivot.y = 50
    this.width = 100 ; this.height = 100
    // State Vector
    this.states = [0,0,0];
    // Display State
    this.displayState()
  }
  // Method to be called each loop
  update(delT,ux,uy){
    this.dynamics(delT,ux,uy)
    this.displayState()
  }
}

// Double Integrating simplified Quadrotor
class QuadrotorRobot extends Robot {
  // Dynamical update function that realizes the double integrator Diff. Eq.
  dynamics(delT,ux,uy){
    this.states[0] += this.states[1] * delT
    this.states[1] += ux * delT
    this.states[2] += this.states[3] * delT
    this.states[3] += uy * delT
  }
  // Method that translates states from the state vector into the corresponding
  // position for rendering in the JS
  displayState(){
    this.x = this.states[0] * 70 + 630
    this.y = this.states[2] * 70 + 350
    //this.rotation = this.states[1]/15.0
    this.rotation = 0
  }
  // Constructor initializes PIXI.Sprite members fitting the quadrotor Texture
  // and sets initial state data
  constructor(x0,y0){
    // Image
    super(PIXI.Texture.fromImage("QuadcopterSide.png"))
    this.pivot.x = 100 ; this.pivot.y = 50
    this.width = 100 ; this.height = 50
    // State Vector
    this.states = [x0,0,y0,0];
    // Display State
    this.displayState()
  }
}
