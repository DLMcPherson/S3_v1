// Controller 'virtual' class
class Controller {
  constructor(_robot){
    this.robot = _robot;
  }
  // Returns the current control value responding to the robot's state
  u(){
    return [0];
  }
}

// Controller class that takes in a list of small 1D controllers, and
// concatenates them into one multi-dimensional control output
class Concat_Contr extends Controller {
  // Pass in an array of 1D controller objects
  constructor(_robot,_controllerArray){
    super(_robot);
    this.robot = _robot;
    this.controllers = _controllerArray;
  }
  // Method for updating the setpoint to be tracked
  updateSetpoint(_set){
    for(let curU = 0; curU < this.controllers.length; curU++){
      // HACK: Hardcodes which setpoints are governed by which controller
      // Should make a generalized index or something that will send these
      // setpoints to update the correct controller's setpoint
      (this.controllers[curU]).updateSetpoint(_set[curU])
    }
  }
  // Returns the current control value responding to the robot's state
  u(){
    let uResultant = [];
    for(let curU = 0; curU < this.controllers.length; curU++){
      uResultant[curU] = (this.controllers[curU]).u()[0]
    }
    return uResultant;
  }
}

// PD Controller class
class PD_Contr extends Controller {
  constructor(_robot,_set,_controlledState){
    super(_robot);
    this.setpoint = _set;
    this.K_P = -2;
    this.K_D = -2;
    this.controlledState = _controlledState;
    // Memory variables
    this.lastU = 0;
  }
  // Method for updating the setpoint to be tracked
  updateSetpoint(_set){
    this.setpoint = _set;
  }
  // Returns the current control value responding to the robot's state
  u(){
    // Calculate the components of the PD Controller
    let P = this.K_P * (this.robot.states[this.controlledState] - this.setpoint);
    let D = this.K_D * (this.robot.dynamics(this.lastU,this.controlledState));
    let resultU = P + D;
    // Store and send the resultant control
    this.lastU = resultU;
    return [resultU];
    //return [this.PID(this.robot.states[0],this.set,this.robot.states[1])];
  }
}

// Controller that does nothing
class Zero_Contr extends Controller {
  constructor(_robot){
    super(_robot);
  }
  // Returns the current control value responding to the robot's state
  u(){
    return [0];
  }
}

// Dubins Car steering class
class Dubins_Contr extends Controller {
  constructor(_robot,_Umax,_set){
    super(_robot);
    this.Umax = _Umax;
    this.set = _set;
  }
  // Method for updating the setpoint to be tracked
  updateSetpoint(_set){
    this.set = _set;
  }
  // Returns the current control value responding to the robot's state
  u(){
    let trackAngle = Math.atan2(this.set[1] - this.robot.states[1],
        this.set[0] - this.robot.states[0]);
    /*
    if(this.robot.states[2] > Math.PI / +2 && trackAngle < Math.PI / -2) {
      trackAngle += 2*Math.PI;
    }
    if(this.robot.states[2] < Math.PI / -2 && trackAngle > Math.PI / +2) {
      trackAngle -= 2*Math.PI;
    }
    let angleDifference = this.robot.states[2] - trackAngle;
    */
    let angleDifference = this.robot.states[2] - trackAngle;
    angleDifference = Math.atan2(Math.sin(angleDifference),Math.cos(angleDifference));
    let Uout = 0
    if(angleDifference < 0){
      Uout = this.Umax;
    }
    if(angleDifference > 0){
      Uout = -this.Umax;
    }
    return [Uout];
  }
}

// Optimally safe controller class
class Safe_Contr extends Controller {
  constructor(_robot,_maxU){
    super(_robot);
    this.maxU = _maxU;
  }
  // Returns the current control value responding to the robot's state
  u(momentum){
    let u_out = [];
    console.log(momentum);
    // For each control output...
    for(var curU=0;curU<this.robot.controlCoefficient().length;curU++){
      // maximize the Hamiltonian (f^T p) within the maximum output afforded
      if(this.dotProduct(this.robot.controlCoefficient()[curU], momentum)  > 0.1){
        u_out[curU] = this.maxU;
      }
      if(this.dotProduct(this.robot.controlCoefficient()[curU], momentum)  < -0.1){
        u_out[curU] = -this.maxU;
      }
    }
    return(u_out);
  }
  // Returns the inner product of two equal length arrays
  dotProduct(a,b){
    let sum = 0;
    for(var i=0;i<a.length;i++){
      sum += a[i] * b[i];
    }
    return(sum);
  }
}

// Intervention controller that swaps between PD and Safe controls
class Intervention_Contr extends Controller {
  constructor(_robot,_safeset,_maxU,_maxD,_tracker){
    super(_robot);
    this.tracker = _tracker;
    this.safer   = new Safe_Contr(_robot,_maxU);
    this.intervening_set = _safeset;
    this.trigger_level = 0;
  }
  // Method that returns the current input responding to the current state
  u(){
    // Check if the reachset value function is below the triggering level set
    if( this.intervening_set.value(this.robot.states) < this.trigger_level ){
      //console.log(this.intervening_set.value(this.robot.states),this.trigger_level);
      // If we have trespassed the reachset, interrupt with the safe policy
      return this.safer.u(this.intervening_set.gradV(this.robot.states) );
    }
    else{
      // If we're still safe, continue with the default tracking behavior
      return this.tracker.u();
    }
  }
}
