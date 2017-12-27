// Safe set 'virtual' class
class SafeSet {
  value(){
    return 0;
  }
}
class DoubleIntegrator_SafeSet extends SafeSet {
  constructor(_leeway,_obP,_obL){
    super()
    this.leeway = _leeway // Should be positive, otherwise system will always crash
    this.obP = _obP
    this.obL = _obL
  }
  // Method for calculating the current value function for the reachable set
  value(p,v){
    if(v*(this.obP-p)<0){
      return Math.abs(p-this.obP)-this.obL;
    }
    else{
      return Math.abs(p-this.obP)-this.obL-Math.pow(v,2)/(2.0*this.leeway)
    }
  }
}
