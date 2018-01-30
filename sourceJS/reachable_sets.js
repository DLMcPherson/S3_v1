// Safe set 'virtual' class
class SafeSet {
  value(states){
    return 0;
  }
  // Method for calculating the gradient
  gradV(states){
    return 0;
  }
}
class DoubleIntegrator_SafeSet extends SafeSet {
  constructor(_leeway,_obP,_obL){
    super();
    // Relative strength between control input and disturbance
    this.leeway = _leeway;
    // Obstacle Location
    this.obP = _obP;
    this.obL = _obL;
  }
  // Method for calculating the current value function for the reachable set
  value(states){
    // if the system is not headed towards the obstacle, the no dynamics-based
    // reach-set needs to be augmented to the obstacle
    if(states[1]*(this.obP-states[0])<0){
      return Math.abs(states[0]-this.obP)-this.obL;
    }
    else{
      return Math.abs(states[0]-this.obP)-this.obL
          -Math.pow(states[1],2)/(2.0*this.leeway);
    }
  }
  // Method for calculating the gradient
  gradV(states){
    // NOTE: For these computations I am neglecting the impulse term in the
    // derivatives that arises from differentiating the case structure

    // Compute the gradient with respect to position
    let dVdp = 0;
    if((states[0]-this.obP) < 0){
      dVdp = -1;
    }
    else{
      dVdp =  1;
    }
    // Compute the gradient with respect to velocity
    let dVdv = 0;
    if(states[1]*(this.obP-states[0]) < 0){
      dVdv = 0;
    }
    else{
      dVdv = -states[1]/this.leeway;
    }
    // Return
    return [dVdp,dVdv];
  }
}

// HACK: Class for combining two safe sets of dimension two
// into one safe set of dimension 4
// Can be made less hacky by generalizing into broader safe set coupler by
// editing statesA/statesB and gradV to handle subsystems of arbitrary dimension
class twoTwo extends SafeSet{
  constructor(_A,_B){
    super();
    this.setA = _A;
    this.setB = _B;
  }
  // Dicing functions that access the subset of states to give each subsystem
  statesA(states){
    return [states[0],states[1]];
  }
  statesB(states){
    return [states[2],states[3]];
  }
  // Method for reading the value function at the given decoupled state
  valueA(states){
    return this.setA.value(this.statesA(states));
  }
  valueB(states){
    return this.setB.value(this.statesB(states));
  }
  // Method for reading the value function at the given joint state
  value(states){
    if(this.valueA(states) < this.valueB(states)){
      return this.valueB(states);
    }
    else{
      return this.valueA(states);
    }
  }
  // Method for calculating the gradient
  gradV(states){
    let gradient = [0,0,0,0];
    if(this.valueA(states) < this.valueB(states)){
      let gradientB = this.setB.gradV(this.statesB(states));
      gradient[2] = gradientB[0];
      gradient[3] = gradientB[1];
    }
    else{
      let gradientA = this.setA.gradV(this.statesA(states));
      gradient[0] = gradientA[0];
      gradient[1] = gradientA[1];
    }
    return gradient;
  }
  // Method for displaying the value function = HACK: Assuming is double quadrotor with square obstacle in global reference
  displayGrid(graphics,currentState,sweptStateX,sweptStateY){
    let states = currentState;
    let left = obstacle.ObX-obstacle.ObW;
    let top = obstacle.ObY-obstacle.ObH;
    let right = obstacle.ObX+obstacle.ObW;
    let bottom = obstacle.ObY+obstacle.ObH;
    let leeway = 1 - 0; // is the max control magnitude - the max disturbance magnitude
    let padX = 0;
    if(states[1]*(obstacle.ObX-states[0]) > 0){
      padX = Math.pow(states[1],2)/(2*leeway);
    }
    if( (obstacle.ObX-states[0]) > 0 ){
      left -= padX;
    }
    else{
      right += padX;
    }
    let padY = 0;
    if(states[3]*(obstacle.ObY-states[2]) > 0){
      padY = Math.pow(states[3],2)/(2*leeway);
    }
    if( (obstacle.ObY-states[2]) > 0 ){
      top -= padY;
    }
    else{
      bottom += padY;
    }
    obstacle.drawFromState(graphics,0,0xcf4c34,left,top,right,bottom)
    obstacle.render();
  }
  /*
  displayGrid(graphics,currentState,sweptStateX,sweptStateY){
    let [lowEdgeIndex,highEdgeIndex] = this.nearIndices(currentState,true);
    let index = lowEdgeIndex;
    graphics.lineStyle(0, 0x000000);
    for(let indexX = 0;indexX < this.setA.reachset.gN[sweptStateX];indexX++){
      for(let indexY = 0;indexY < this.setB.reachset.gN[sweptStateY];indexY++){
        index[sweptStateX] = indexX;
        index[sweptStateY] = indexY;
        let valuation = this.griddedValue(index);
        // Display this gridpoint
        let mappedState =
          graphics.mapper.mapStateToPosition(this.setA.indexToState(indexX,0),this.setB.indexToState(indexY,0) );
          // Choose the correct color
        if(valuation > 0){
        }
        else{
          // this is the unsafe zone
          graphics.beginFill(0xFF745A);
            // Draw the circle
          graphics.drawCircle(mappedState[0],mappedState[1],8);
          graphics.endFill();
        }
      }
    }
    //
  }
  */
}

// Safe Set loaded from MATLAB-dumped JSON in LSToolbox format
class loaded_SafeSet extends SafeSet {
  constructor(name){
    super();
    // Fetch the reachset JSON file from the server
    fetch("../reachableSets/"+name+"_reachset.json").then((response) => {
            return response.json();
        }).then((json) => {
            // Load the JSON into a local data member
            console.log(json);
            this.reachset = json;
        })
  }
  // Method for displaying the value function
  displayGrid(graphics,currentState,sweptStateX,sweptStateY){
    let reachableSet = this.reachset;
    let [lowEdgeIndex,highEdgeIndex] = this.nearIndices(currentState,true);
    let index = lowEdgeIndex;
    graphics.lineStyle(0, 0x000000);
    for(let indexX = 0;indexX < reachableSet.gN[sweptStateX];indexX++){
      for(let indexY = 0;indexY < reachableSet.gN[sweptStateY];indexY++){
        index[sweptStateX] = indexX;
        index[sweptStateY] = indexY;
        let valuation = this.griddedValue(index);
        // Display this gridpoint
        let mappedState =
          graphics.mapper.mapStateToPosition(this.indexToState(indexX,sweptStateX),this.indexToState(indexY,sweptStateY) );
          // Choose the correct color
        if(valuation > 0){
        }
        else{
          // this is the unsafe zone
          graphics.beginFill(0xFF745A);
            // Draw the circle
          graphics.drawCircle(mappedState[0],mappedState[1],8);
          graphics.endFill();
        }
      }
    }
    //
  }
  // Method that returns the value at the gridpoint
  griddedValue(index){
    let indexedValue = this.reachset.data.slice();
    for(var xDim=0;xDim<index.length;xDim++){
      // unwrap another layer of referencing the value function
      indexedValue = indexedValue[index[xDim]];
    }
    return indexedValue;
  }
  // Method for calculating the gradient at the given state
  gradV(states){
    return this.gradV2(states);
  }
  gradV2(states){
    // Calculate the patial along each axis
    let gradient = [];
    for(var xDim=0;xDim<states.length;xDim++){
      // Project along the current axis to the hyperplane intersecting the
      // nearest gridpoints on both sides
        // Clone the state vector
      let statesLow = states.slice(0);
      let statesHigh = states.slice(0);
      // Replace the xDim-th state with an offset location
      statesLow[xDim] -= this.reachset.gdx[xDim]/2;
      statesHigh[xDim] += this.reachset.gdx[xDim]/2;
      // Calculate the slope between the two projected points
      gradient[xDim] =  (this.value(statesHigh) - this.value(statesLow))
                              / this.reachset.gdx[xDim];
    }
    //
    return gradient;
  }
  gradV1(states){
    // Find the nearest neighbors
    let [lowEdgeIndex,highEdgeIndex] = this.nearIndices(states,true);
    // Calculate the patial along each axis
    let gradient = [];
    for(var xDim=0;xDim<states.length;xDim++){
      // Project along the current axis to the hyperplane intersecting the
      // nearest gridpoints on both sides
        // Clone the state vector
      let statesLow = states.slice(0);
      let statesHigh = states.slice(0);
      // Replace the xDim-th state with the location of the nearest gridpoint
      console.log(lowEdgeIndex[xDim],highEdgeIndex[xDim])
      statesLow[xDim] = this.indexToState(lowEdgeIndex[xDim],xDim);
      statesHigh[xDim] = this.indexToState(highEdgeIndex[xDim],xDim);
      // Calculate the slope between the two projected points
      gradient[xDim] =  (this.value(statesHigh) - this.value(statesLow))
                              / this.reachset.gdx[xDim];
    }
    //
    return gradient;
  }
  // Method for finding the nearest neighboring gridpoints
  nearIndices(_states,gridwrap){
    // Handle states outside of the grid
    let states = _states.slice(); // only round a clone of the state vector
    /*
    for(var xDim=0;xDim<states.length;xDim++){
      if(states[xDim] < this.reachset.gmin[xDim]){
        if(this.reachset.gperiodicity[xDim]){
          // if axis is periodic, wraparound the state
          states[xDim] += this.reachset.gmax[xDim] - this.reachset.gmin[xDim];
        }
        else{
          // if axis is non-periodic, project onto the nearest gridpoint
          states[xDim] = this.reachset.gmin[xDim];
        }
      }
      if(states[xDim] > this.reachset.gmax[xDim]){
        if(this.reachset.gperiodicity[xDim]){
          // if axis is periodic, wraparound the state
          states[xDim] -= this.reachset.gmax[xDim] - this.reachset.gmin[xDim];
        }
        else{
          // if axis is non-periodic, project onto the nearest gridpoint
          states[xDim] = this.reachset.gmax[xDim];
        }
      }
    }
    */
    // Initialize the nearest neighbor index arrays
    let lowEdgeIndex = [];
    let highEdgeIndex = [];
    // Find the nearest neighbors by rounding along each axis
    for(var xDim=0;xDim<states.length;xDim++){
      // Find the nearest neighbors
      lowEdgeIndex[xDim] = Math.floor(
          (states[xDim]-this.reachset.gmin[xDim])/
              this.reachset.gdx[xDim]
                  );
      highEdgeIndex[xDim] = Math.ceil(
          (states[xDim]-this.reachset.gmin[xDim])/
              this.reachset.gdx[xDim]
                  );
      if(gridwrap){
        if(this.reachset.gperiodicity[xDim]){
          //console.log(xDim,this.reachset.gperiodicity[xDim])
          if(lowEdgeIndex[xDim] < 0){
            //console.log("underflow ",states[xDim],lowEdgeIndex[xDim]);
            lowEdgeIndex[xDim] += this.reachset.gN[xDim];
          }
          if(lowEdgeIndex[xDim] >= this.reachset.gN[xDim]){
            //console.log("overflow",states[xDim],lowEdgeIndex[xDim]);
            lowEdgeIndex[xDim] -= this.reachset.gN[xDim];
          }
          if(highEdgeIndex[xDim] < 0){
            //console.log("underflow ",states[xDim],highEdgeIndex[xDim]);
            highEdgeIndex[xDim] += this.reachset.gN[xDim];
          }
          if(highEdgeIndex[xDim] >= this.reachset.gN[xDim]){
            //console.log("overflow",states[xDim],highEdgeIndex[xDim]);
            highEdgeIndex[xDim] -= this.reachset.gN[xDim];
          }
        }
        else{
          if(lowEdgeIndex[xDim] < 0){
            lowEdgeIndex[xDim] = 0;
            //console.log("underbound");
          }
          if(lowEdgeIndex[xDim] >= this.reachset.gN[xDim]){
            lowEdgeIndex[xDim] = this.reachset.gN[xDim]-1;
            //console.log("overbound");
          }
          if(highEdgeIndex[xDim] < 0){
            highEdgeIndex[xDim] = 0;
            //console.log("underbound");
          }
          if(highEdgeIndex[xDim] >= this.reachset.gN[xDim]){
            highEdgeIndex[xDim] = this.reachset.gN[xDim]-1;
            //console.log("overbound");
          }
        }
      }

    }
    return [lowEdgeIndex,highEdgeIndex];
  }
  // Method for taking an index along an axis
  // and mapping it to its equivalent position in the state space
  indexToState(index,dim){
    return index*this.reachset.gdx[dim]+this.reachset.gmin[dim];
  }
  // Method for reading the value function at the given state
  value(states){
    // Find the nearest neighbors
    let [lowEdgeIndex,highEdgeIndex] = this.nearIndices(states,false);
    // Compute volumes between the interpolation point and its nearest neighbors
    let distanceToLower = [];
    let distanceToHigher = [];
    for(var xDim=0;xDim<states.length;xDim++){
      // Calculate the distance to each corner of this axis
      distanceToLower[xDim]  =  states[xDim]
          - (lowEdgeIndex[xDim]*this.reachset.gdx[xDim]
                +this.reachset.gmin[xDim]);
      distanceToHigher[xDim] = (highEdgeIndex[xDim]*this.reachset.gdx[xDim]
          +this.reachset.gmin[xDim])
            - states[xDim];
      // Catch /edge/ case where interpolation point is on a grid edge
      if(lowEdgeIndex[xDim] == highEdgeIndex[xDim]){
        distanceToLower[xDim] = 1;
        distanceToHigher[xDim] = 0;
      }
    }
    // Wrap indices to stay inside grid. This must be done manually here since
    // periodic wrap-arounds impact calculated distance to each edge
    // and FALSE flag was passed to nearIndices function accordingly
    for(var xDim=0;xDim<states.length;xDim++){
      if(this.reachset.gperiodicity[xDim]){
        //console.log(xDim,this.reachset.gperiodicity[xDim])
        if(lowEdgeIndex[xDim] < 0){
          //console.log("underflow ",states[xDim],lowEdgeIndex[xDim]);
          lowEdgeIndex[xDim] += this.reachset.gN[xDim];
        }
        if(lowEdgeIndex[xDim] >= this.reachset.gN[xDim]){
          //console.log("overflow",states[xDim],lowEdgeIndex[xDim]);
          lowEdgeIndex[xDim] -= this.reachset.gN[xDim];
        }
        if(highEdgeIndex[xDim] < 0){
          //console.log("underflow ",states[xDim],highEdgeIndex[xDim]);
          highEdgeIndex[xDim] += this.reachset.gN[xDim];
        }
        if(highEdgeIndex[xDim] >= this.reachset.gN[xDim]){
          //console.log("overflow",states[xDim],highEdgeIndex[xDim]);
          highEdgeIndex[xDim] -= this.reachset.gN[xDim];
        }
      }
      else{
        if(lowEdgeIndex[xDim] < 0){
          lowEdgeIndex[xDim] = 0;
          //console.log("underbound",lowEdgeIndex[xDim]);
        }
        if(lowEdgeIndex[xDim] >= this.reachset.gN[xDim]){
          lowEdgeIndex[xDim] = this.reachset.gN[xDim]-1;
          //console.log("overbound");
        }
        if(highEdgeIndex[xDim] < 0){
          highEdgeIndex[xDim] = 0;
          //console.log("underbound",highEdgeIndex[xDim]);
        }
        if(highEdgeIndex[xDim] >= this.reachset.gN[xDim]){
          highEdgeIndex[xDim] = this.reachset.gN[xDim]-1;
          //console.log("overbound");
        }
      }
    }
    // Multilinear interpolation by weighing each corner value by the volume in
    // the cube between the opposite corner and the interpolation point
    let value = 0;
    // Iterate over each corner of the cell represented as a binary string
    // a zero in the dth bit represents the lower corner along the dth axis
    for(var corner = 0;corner<Math.pow(2,states.length);corner++){
      // Initialize volume aggregator. Volume is calculated by
      // multiplying the hyper-cubes' edge-lengths together in a running summa
      let volume = 1;
      // Pull the value at the corner-gridpoint out of the nested array by
      // incrementally peeling away nested layers. Initialze with full nest.
      let cornerValue = this.reachset.data.slice();
      // Iterate along each axis in the state space:
      for(var xDim=0;xDim<states.length;xDim++){
        if(corner & Math.pow(2,xDim) ){ // Check the xDim-th bit
          // multiply in this cell's edge length along the xDim-axis
          volume *= distanceToLower[xDim];
          // unwrap another layer of referncing the value function
          cornerValue = cornerValue[highEdgeIndex[xDim]];
        }
        else{
          // multiply in this cell's edge length along the xDim-axis
          volume *= distanceToHigher[xDim];
          // unwrap another layer of referncing the value function
          cornerValue = cornerValue[lowEdgeIndex[xDim]];
        }
      }
      // Weight the value at this corner by the cell's volume and add to the
      // running weighted average
      value += volume * cornerValue;
    }
    // Normalize by the total volume
    {
      let total_volume = 1;
      for(var xDim=0;xDim<states.length;xDim++){
        total_volume *= this.reachset.gdx[xDim];
      }
      value = value/total_volume;
    }
    // Return
    return value;
  }
}
