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
    var P = -0.000001*(z-gz)
    var I = 0;
    var D = -0.001*(vz-0);
    return P+I+D;
  }
  ux(){
    return this.PID(this.robot.x,this.setX,this.robot.vx);
  }
  uy(){
    return this.PID(this.robot.y,this.setY,this.robot.vy);
  }
}
// Optimally safe controller class
class Safe_Contr extends Controller {
  constructor(_robot,_maxU){
    super(_robot)
    this.maxU = _maxU
  }
  ux(){
    if(this.robot.x > ObX){
      return this.maxU;
    }
    else{
      return -this.maxU;
    }
  }
  uy(){
    if(this.robot.y > ObY){
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
    this.intervening_setX = new DoubleIntegrator_SafeSet(_maxU-_maxD,ObX,ObW)
    this.intervening_setY = new DoubleIntegrator_SafeSet(_maxU-_maxD,ObY,ObH)
    this.trigger_level = 0
  }
  // Methods for applying reachable set in both decoupled axes
  SafeSetX(){
    return this.intervening_setX.value(this.robot.x,this.robot.vx)
  }
  SafeSetY(){
    return this.intervening_setY.value(this.robot.y,this.robot.vy)
  }
  // Methods that return the current input corresponding to the current state
  // Two methods exist due to decoupling this problem along x- and y-axes
  ux(){
    if( this.SafeSetX() < this.trigger_level && this.SafeSetY() < this.trigger_level && this.SafeSetY() < this.SafeSetX() ){
      graphics.drawRect(this.robot.x,this.robot.y,10,10)
      return this.safer.ux();
    }
    else{
      return this.tracker.ux();
    }
  }
  uy(){
    if( this.SafeSetX() < this.trigger_level && this.SafeSetY() < this.trigger_level && this.SafeSetX() < this.SafeSetY() ){
      return this.safer.uy();
    }
    else{
      return this.tracker.uy();
    }
  }
}
