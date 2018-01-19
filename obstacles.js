class Obstacle {
  render(){
    return
  }
  renderAugmented(pad){
    return
  }
}

class BoxObstacle extends Obstacle{
  constructor(_ObX,_ObY,_ObW,_ObH){
    super()
    this.ObX = _ObX
    this.ObY = _ObY
    this.ObW = _ObW
    this.ObH = _ObH
  }
  render(){
    this.drawQuadrilateralFromStateCorners(graphics,5,0x4C1C13, this.ObX-this.ObW,this.ObY-this.ObH,this.ObX+this.ObW,this.ObY+this.ObH)
    return
  }
  renderAugmented(pad){
    this.drawQuadrilateralFromStateCorners(graphics,0,0xcf4c34, this.ObX-this.ObW-pad,this.ObY-this.ObH-pad,this.ObX+this.ObW+pad,this.ObY+this.ObH+pad)
    this.render()
    return
  }
  drawQuadrilateralFromStateCorners(graphics,linewidth,color, left,top,right,bottom){
    let topleft = graphics.mapper.mapStateToPosition(left,top)
    let bottomright = graphics.mapper.mapStateToPosition(right,bottom)
    this.drawQuadrilateral(graphics,linewidth,color, topleft[0],topleft[1],bottomright[0],bottomright[1])
    return
  }
  drawQuadrilateral(graphics,linewidth,color,left,top,right,bottom){
    // Set a fill and line style
    graphics.beginFill(color);
    graphics.lineStyle(linewidth, 0x000000);

    // Draw the quadrilateral
    graphics.moveTo(left,top);
    graphics.lineTo(right,top);
    graphics.lineTo(right,bottom);
    graphics.lineTo(left,bottom);
    graphics.endFill();
    return
  }
}

class RoundObstacle extends Obstacle{
  constructor(_ObX,_ObY,_ObW){
    super()
    this.ObX = _ObX
    this.ObY = _ObY
    this.ObW = _ObW
    this.ObH = _ObW
  }
  render(){
    this.drawFromState(graphics,5,0x4C1C13, this.ObX,this.ObY,1)
    return
  }
  renderAugmented(pad){
    this.drawFromState(graphics,0,0xcf4c34, this.ObX,this.ObY,1+pad)
    this.render()
    return
  }
  drawFromState(graphics,linewidth,color, left,top,radius){
    let topleft = graphics.mapper.mapStateToPosition(left,top)
    this.drawCircle(graphics,linewidth,color, topleft[0],topleft[1],radius*graphics.mapper.Mxx)
    return
  }
  drawCircle(graphics,linewidth,color,left,top,radius){
    // Set a fill and line style
    graphics.beginFill(color);
    graphics.lineStyle(linewidth, 0x000000);

    // Draw the quadrilateral
    graphics.drawCircle(left,top,radius)
    graphics.endFill();
    return
  }
}
