// Controller 'virtual' class
class Controller {
  constructor(_robot){
    this.robot = _robot
  }
  u(){
    return 0
  }
  ux(){
    return 0;
  }
  uy(){
    return 0;
  }
}

// PD Controller class
class PID_Contr extends Controller {
  constructor(_robot,_setX,_setY){
    super(_robot)
    this.setX = _setX
    this.setY = _setY
  }
  PID(z,gz,vz){
    var P = -3*(z-gz)
    var I = 0;
    var D = -2*(vz-0);
    let value = P+I+D;
    if(value==NaN){
      console.log("PID FAIL")
    }
    return(value);
  }
  u(){
    return([this.ux(),this.uy()])
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
    super(_robot)
    this.set = _set
  }
  PID(z,gz,vz){
    var P = -3*(z-gz)
    var I = 0;
    var D = -2*(vz-0);
    let value = P+I+D;
    if(value==NaN){
      console.log("PID FAIL")
    }
    return(value);
  }
  u(){
    return([this.PID(this.robot.states[0],this.set,this.robot.states[1])])
  }
}

// Controller that does nothing
class Zero_Contr extends Controller {
  constructor(_robot){
    super(_robot)
  }
  u(){
    return([0])
  }
}

// Dubins Car steering class
class Dubins_Contr extends Controller {
  constructor(_robot,_Umax,_set){
    super(_robot)
    this.Umax = _Umax
    this.setX = _set[0]
    this.setY = _set[1]
  }
  u(){
    let trackAngle = Math.atan2(this.setY - this.robot.states[1],this.setX - this.robot.states[0])
    if(this.robot.states[2] > Math.PI / +2 && trackAngle < Math.PI / -2) {
      trackAngle += 2*Math.PI
    }
    if(this.robot.states[2] < Math.PI / -2 && trackAngle > Math.PI / +2) {
      trackAngle -= 2*Math.PI
    }
    let Uout = 0
    if(this.robot.states[2]<trackAngle){
      Uout = this.Umax
    }
    if(this.robot.states[2]>trackAngle){
      Uout = -this.Umax
    }
    return([Uout])
  }
}

// Optimally safe controller class
class Safe_Contr extends Controller {
  constructor(_robot,_maxU){
    super(_robot)
    this.maxU = _maxU
  }
  u(momentum){
    let u_out = []
    console.log(momentum)
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
    let sum = 0
    for(var i=0;i<a.length;i++){
      sum += a[i] * b[i]
    }
    return(sum)
  }
}

// Intervention controller that swaps between PD and Safe controls
class Intervention_Contr extends Controller {
  constructor(_robot,_safeset,_maxU,_maxD,_tracker){
    super(_robot)
    this.tracker = _tracker
    this.safer   = new Safe_Contr(_robot,_maxU)
    this.intervening_set = _safeset
    this.trigger_level = 0
  }
  // Methods that return the current input corresponding to the current state
  // Two methods exist due to decoupling this problem along x- and y-axes
  u(){
    if( this.intervening_set.value(this.robot.states) < this.trigger_level ){
      return this.safer.u(this.intervening_set.gradV(this.robot.states) );
    }
    else{
      return this.tracker.u();
    }
  }
}

// DEPRECATED Optimally safe controller class
class OldSafe_Contr extends Controller {
  constructor(_robot,_maxU){
    super(_robot)
    this.maxU = _maxU
  }
  u(){
    return([this.ux(),this.uy()])
  }
  ux(){
    if(this.robot.states[0] > obstacle.ObX){
      return this.maxU;
    }
    else{
      return -this.maxU;
    }
  }
  uy(){
    if(this.robot.states[2] > obstacle.ObY){
      return this.maxU;
    }
    else{
      return -this.maxU;
    }
  }
}

// Decoupled intervention controller that swaps between PD and Safe controls
class decoupledIntervention_Contr extends Controller {
  constructor(_robot,_setX,_setY,_maxU,_maxD){
    super(_robot)
    this.tracker = new PID_Contr(_robot,_setX,_setY)
    this.safer = new OldSafe_Contr(_robot,_maxU)
    this.intervening_setX = new loaded_SafeSet
    this.intervening_setY = new loaded_SafeSet
    //this.intervening_setX = new DoubleIntegrator_SafeSet(_maxU-_maxD,obstacle.ObX,obstacle.ObW)
    //this.intervening_setY = new DoubleIntegrator_SafeSet(_maxU-_maxD,obstacle.ObY,obstacle.ObH)
    this.trigger_level = 0
  }
  // Methods for applying reachable set in both decoupled axes
  SafeSetX(){
    return this.intervening_setX.value([this.robot.states[0],this.robot.states[1]])
  }
  SafeSetY(){
    return this.intervening_setY.value([this.robot.states[2],this.robot.states[3]])
  }
  // Methods that return the current input corresponding to the current state
  u(){
    return([this.ux(),this.uy()])
  }
  // Two methods exist due to decoupling this problem along x- and y-axes
  ux(){
    if( this.SafeSetX() < this.trigger_level && this.SafeSetY() < this.trigger_level && this.SafeSetY() <= this.SafeSetX() ){
      //console.log('X Saf')
      //drawQuadrilateralFromStateCorners(graphics,0,0xb5432e,this.robot.states[0]-0.07,this.robot.states[2]-0.07,this.robot.states[0]+0.07,this.robot.states[2]+0.07)
      return this.safer.ux();
    }
    else{
      //console.log('X Pid')
      return this.tracker.ux();
    }
  }
  uy(){
    if( this.SafeSetX() < this.trigger_level && this.SafeSetY() < this.trigger_level && this.SafeSetX() <= this.SafeSetY() ){
      //console.log('Y Saf')
      //drawQuadrilateralFromStateCorners(graphics,0,0x077f4d,this.robot.states[0]-0.07,this.robot.states[2]-0.07,this.robot.states[0]+0.07,this.robot.states[2]+0.07)
      return this.safer.uy();
    }
    else{
      //console.log('Y Pid')
      return this.tracker.uy();
    }
  }
}
