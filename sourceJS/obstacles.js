class Obstacle {
  render(){
    return;
  }
  renderAugmented(pad){
    return;
  }
}

class BoxObstacle extends Obstacle{
  constructor(_ObX,_ObY,_ObW,_ObH){
    super();
    this.ObX = _ObX;
    this.ObY = _ObY;
    this.ObW = _ObW;
    this.ObH = _ObH;
  }
  // Rendering standard obstacle
  render(){
    this.drawFromState(graphics,5,0x4C1C13, this.ObX-this.ObW,this.ObY-this.ObH,this.ObX+this.ObW,this.ObY+this.ObH);
    return;
  }
  // Rendering an obstacle with extra buffer distance added to all sides
  renderAugmented(pad){
    this.drawFromState(graphics,0,0xcf4c34, this.ObX-this.ObW-pad,this.ObY-this.ObH-pad,this.ObX+this.ObW+pad,this.ObY+this.ObH+pad);
    this.render();
    return;
  }
  // Draw a quadrilateral given the state coordinates of the edges
  drawFromState(graphics,linewidth,color, left,top,right,bottom){
    let topleft = graphics.mapper.mapStateToPosition(left,top);
    let bottomright = graphics.mapper.mapStateToPosition(right,bottom);
    this.drawQuadrilateral(graphics,linewidth,color, topleft[0],topleft[1],bottomright[0],bottomright[1]);
    return;
  }
  // Draw a quadrilateral using PIXI.graphics
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
    return;
  }
}

class RoundObstacle extends Obstacle{
  constructor(_ObX,_ObY,_ObW){
    super();
    this.ObX = _ObX;
    this.ObY = _ObY;
    this.ObW = _ObW;
    this.ObH = _ObW;
  }
  // Rendering standard obstacle
  render(){
    this.drawFromState(graphics,5,0x4C1C13, this.ObX,this.ObY,1);
    return;
  }
  // Rendering an obstacle with extra buffer distance added to all sides
  renderAugmented(pad){
    this.drawFromState(graphics,0,0xcf4c34, this.ObX,this.ObY,1+pad);
    this.render();
    return;
  }
  // Draw a circle given the state coordinates of its center and radius
  drawFromState(graphics,linewidth,color, _x,_y,radius){
    let center = graphics.mapper.mapStateToPosition(_x,_y);
    this.drawCircle(graphics,linewidth,color, center[0],center[1],radius*graphics.mapper.Mxx);
    return;
  }
  // Draw a circle using PIXI.graphics
  drawCircle(graphics,linewidth,color,left,top,radius){
    // Set a fill and line style
    graphics.beginFill(color);
    graphics.lineStyle(linewidth, 0x000000);

    // Draw the circle
    graphics.drawCircle(left,top,radius);
    graphics.endFill();
    return;
  }
}
