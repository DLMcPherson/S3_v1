// Controller 'virtual' class
class Controller {
  constructor(_robot){
    this.robot = _robot;
  }
  u(){
    return [0];
  }
}

// Concatenated controllers class
class Concat_Contr extends Controller {
  constructor(_robot,_controllerArray){
    super(_robot);
    this.robot = _robot;
    this.controllers = _controllerArray;
  }
  u(){
    let uResultant = [];
    for(let uNum = 0; uNum < this.controllers.length; uNum++){
      uResultant[uNum] = (this.controllers[uNum]).u()[0]
    }
    return uResultant;
  }
}

// PD Controller class
class PD_Contr extends Controller {
  constructor(_robot,_set,_controlledState){
    super(_robot);
    this.setpoint = _set;
    this.K_P = -3; // const
    this.K_D = -2; // const

    this.controlledState = _controlledState; // const

    this.lastU = 0;
  }
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
  u(){
    return [0];
  }
}

// Dubins Car steering class
class Dubins_Contr extends Controller {
  constructor(_robot,_Umax,_set){
    super(_robot);
    this.Umax = _Umax;
    this.setX = _set[0];
    this.setY = _set[1];
  }
  u(){
    let trackAngle = Math.atan2(this.setY - this.robot.states[1],this.setX - this.robot.states[0])
    if(this.robot.states[2] > Math.PI / +2 && trackAngle < Math.PI / -2) {
      trackAngle += 2*Math.PI;
    }
    if(this.robot.states[2] < Math.PI / -2 && trackAngle > Math.PI / +2) {
      trackAngle -= 2*Math.PI;
    }
    let Uout = 0
    if(this.robot.states[2]<trackAngle){
      Uout = this.Umax;
    }
    if(this.robot.states[2]>trackAngle){
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
  u(momentum){
    let u_out = [];
    console.log(momentum);
    for(var cur_control=0;cur_control<this.robot.controlCoefficient().length;cur_control++){ // Iterate along each axis in the control space
      if(this.innerProduct(this.robot.controlCoefficient()[cur_control] , momentum)  > 0){
        u_out[cur_control] = this.maxU;
      }
      else{
        u_out[cur_control] = -this.maxU;
      }
    }
    return(u_out);
  }
  // Returns the inner product of two equal length arrays
  innerProduct(a,b){
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
    if( this.intervening_set.value(this.robot.states) < this.trigger_level ){
      return this.safer.u(this.intervening_set.gradV(this.robot.states) );
    }
    else{
      return this.tracker.u();
    }
  }
}
