// Mapper class that scales state space to frame
class FrameXYMap {
  constructor(_Mxx,_Mxy,_Myx,_Myy,_bx,_by){
    // Scaling Matrix
    this.Mxx = _Mxx;
    this.Mxy = _Mxy;
    this.Myx = _Myx;
    this.Myy = _Myy;
    // Origin-defining affine term
    this.bx  = _bx;
    this.by  = _by;
  }
  // Return a 2-tuple of the frame coordinates given x-y coordinates on the
  // state space scale (can be a subset of the state space)
  mapStateToPosition(x,y){
    let x_frame = this.Mxx * x + this.Mxy * y + this.bx;
    let y_frame = this.Myx * x + this.Myy * y + this.by;
    return([x_frame,y_frame]);
  }
  // Returns the equivalent state-space scale coordinates
  // given the frame coordinates
  mapPositionToState(x_frame,y_frame){
    let x = (x_frame - this.bx);
    let y = (y_frame - this.by);
    let determinant = this.Mxx*this.Myy - this.Mxy*this.Myx;
    let x_state = ( this.Myy * x - this.Mxy * y)/determinant;
    let y_state = (-this.Myx * x + this.Mxx * y)/determinant;
    return([x_state,y_state]);
  }
  // Returns a random point on the frame
  randomFrameXY(){
    return [Math.random()*FRAME_WIDTH,Math.random()*FRAME_HEIGHT];
  }
  randomStateXY(){
    let pos = this.randomFrameXY();
    return this.mapPositionToState(pos[0],pos[1]);
  }
}
