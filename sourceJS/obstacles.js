class Obstacle {
  render(){
    return;
  }
  renderAugmented(pad){
    return;
  }
  constructor(_ObX,_ObY,avoidSets){
    // save a reference to the reachable set conforming to this shaped obstacle
    this.ObX = _ObX;
    this.ObY = _ObY;
    this.offset = [this.ObX,this.ObY];
    this.avoidSets = avoidSets;
  }
  // Method for transforming global state to obstacle-relative state
  offsetStates(states){
    let offsetS = states.slice();
    for(let curDim = 0; curDim < states.length; curDim++){
      offsetS[curDim] -= this.offset[curDim];
    }
    return offsetS;
  }
  // Passing calls to internalized reachable sets palette
  value(setID,states){
    return this.avoidSets.value(setID,this.offsetStates(states));
  }
  // Method for calculating the gradient
  gradV(setID,states){
    return this.avoidSets.gradV(setID,this.offsetStates(states));
  }
  // Method for displaying the value function on a grid
  displayGrid(setID,graphics,color,currentState,sweptStateX,sweptStateY){
    this.avoidSets.displayGrid(setID,graphics,color,this.offsetStates(currentState),sweptStateX,sweptStateY);
    return 0;
  }
}

class Obstaclescape {
  render(){
    for(let obNum = 0; obNum < this.obstacles.length ; obNum++){
      if(this.obstacleDestroyed[obNum] == false){
        this.obstacles[obNum].render();
      }
    }
    return;
  }
  renderAugmented(pad){
    for(let obNum = 0; obNum < this.obstacles.length ; obNum++){
      if(this.obstacleDestroyed[obNum] == false){
        this.obstacles[obNum].renderAugmented(pad);
      }
    }
    return;
  }
  constructor(_obstacles){
    // save a reference to the reachable set conforming to this shaped obstacle
    this.obstacles = _obstacles;
    this.obstacleDestroyed = [];
    this.obstacleUndetected = [];
    for(let obNum = 0; obNum < this.obstacles.length ; obNum++){
      this.obstacleDestroyed[obNum] = false;
      this.obstacleUndetected[obNum] = false;
    }
  }
  // Passing calls to internalized reachable sets palette
  value(setID,states){
    let curMinValue = 100;
    for(let obNum = 0; obNum < this.obstacles.length ; obNum++){
      if(this.obstacleDestroyed[obNum] == false && this.obstacleUndetected[obNum] == false){
        let obsValue = this.obstacles[obNum].value(setID,states);
        if(obsValue < curMinValue)
          curMinValue = obsValue;
      }
    }
    return curMinValue;
  }
  // Method for calculating the gradient
  gradV(setID,states){
    let curMinValue = 100;
    let dominantObstacle = 0;
    for(let obNum = 0; obNum < this.obstacles.length ; obNum++){
      if(this.obstacleDestroyed[obNum] == false && this.obstacleUndetected[obNum] == false){
        let obsValue = this.obstacles[obNum].value(setID,states);
        if(obsValue < curMinValue){
          curMinValue = obsValue;
          dominantObstacle = obNum;
        }
      }
    }
    return this.obstacles[dominantObstacle].gradV(setID,states);
  }
  // Method for displaying the value function on a grid
  displayGrid(setID,graphics,color,currentState,sweptStateX,sweptStateY){
    for(let obNum = 0; obNum < this.obstacles.length ; obNum++){
      if(this.obstacleDestroyed[obNum] == false && this.obstacleUndetected[obNum] == false){
        this.obstacles[obNum].displayGrid(setID,graphics,color,currentState,sweptStateX,sweptStateY);
      }
    }
    return 0;
  }
}

class BoxObstacle extends Obstacle{
  constructor(_ObX,_ObY,_ObW,_ObH,avoidSets){
    super(_ObX,_ObY,avoidSets);
    this.offset = [this.ObX,0,this.ObY,0];
    this.collisionSet = new twoTwo(new dubIntInterval_Set(_ObW),new dubIntInterval_Set(_ObH) );
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
  constructor(_ObX,_ObY,_ObW,avoidSets){
    super(_ObX,_ObY,avoidSets);
    this.offset = [_ObX,_ObY,0]; // TODO: This is system-specific. Make obstacles system agnostic
    this.collisionSet = new dubinsCircle_Set(_ObW);
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
