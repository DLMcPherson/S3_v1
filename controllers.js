// Controller 'virtual' class
class Controller {
  constructor(_robot){
    this.robot = _robot
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
  ux(){
    return this.PID(this.robot.states[0],this.setX,this.robot.states[1]);
  }
  uy(){
    return this.PID(this.robot.states[2],this.setY,this.robot.states[3]);
  }
}
// Optimally safe controller class
class Safe_Contr extends Controller {
  constructor(_robot,_maxU){
    super(_robot)
    this.maxU = _maxU
  }
  ux(){
    if(this.robot.states[0] > ObX){
      return this.maxU;
    }
    else{
      return -this.maxU;
    }
  }
  uy(){
    if(this.robot.states[2] > ObY){
      return this.maxU;
    }
    else{
      return -this.maxU;
    }
  }
}
// Intervention controller that swaps between PD and Safe controls
class decoupledIntervention_Contr extends Controller {
  constructor(_robot,_setX,_setY,_maxU,_maxD){
    super(_robot)
    this.tracker = new PID_Contr(_robot,_setX,_setY)
    this.safer = new Safe_Contr(_robot,_maxU)
    this.intervening_setX = new loaded_SafeSet
    this.intervening_setY = new loaded_SafeSet
    //this.intervening_setX = new DoubleIntegrator_SafeSet(_maxU-_maxD,ObX,ObW)
    //this.intervening_setY = new DoubleIntegrator_SafeSet(_maxU-_maxD,ObY,ObH)
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
