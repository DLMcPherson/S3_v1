// Controller 'virtual' class
class Controller {
  constructor(_robot){
    this.robot = _robot;
  }
  u(){
    return 0;
  }
}

// PD Controller class
class PID_Contr extends Controller {
  constructor(_robot,_setX,_setY){
    super(_robot);
    this.setX = _setX;
    this.setY = _setY;
  }
  PID(z,gz,vz){
    var P = -3*(z-gz);
    var I = 0;
    var D = -2*(vz-0);
    let value = P+I+D;
    return(value);
  }
  u(){
    return [this.ux(),this.uy()];
  }
  ux(){
    return this.PID(this.robot.states[0],this.setX,this.robot.states[1]);
  }
  uy(){
    return this.PID(this.robot.states[2],this.setY,this.robot.states[3]);
  }
}

// PD Controller class
class PD_Contr extends Controller {
  constructor(_robot,_set){
    super(_robot);
    this.set = _set;
  }
  PID(z,gz,vz){
    var P = -3*(z-gz);
    var D = -2*(vz-0);
    let value = P+D;
    return(value);
  }
  u(){
    return([this.PID(this.robot.states[0],this.set,this.robot.states[1])])
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
