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
    super()
    this.leeway = _leeway // Should be positive, otherwise system will always crash
    this.obP = _obP
    this.obL = _obL
  }
  // Method for calculating the current value function for the reachable set
  value(states){
    if(states[1]*(this.obP-states[0])<0){
      return Math.abs(states[0]-this.obP)-this.obL;
    }
    else{
      return Math.abs(states[0]-this.obP)-this.obL-Math.pow(states[1],2)/(2.0*this.leeway)
    }
  }
  // Method for calculating the gradient
  gradV(states){
    // NOTE: For these computations I am neglecting the impulse term in the
    // derivatives that arises from differentiating the case structure

    // Compute the gradient with respect to position
    let dVdp = 0
    if((states[0]-this.obP) < 0){
      dVdp = -1
    }
    else{
      dVdp =  1
    }
    // Compute the gradient with respect to velocity
    let dVdv = 0
    if(states[1]*(this.obP-states[0]) < 0){
      dVdv = 0
    }
    else{
      dVdv = -states[1]/this.leeway
    }
    // Return
    return([dVdp,dVdv])
  }
}

// HACK: Class for combining two safe sets of dimension two
// into one safe set of dimension 4
class twoTwo extends SafeSet{
  constructor(_A,_B){
    super()
    this.setA = _A
    this.setB = _B
  }
  statesA(states){
    return([states[0],states[1]])
  }
  statesB(states){
    return([states[2],states[3]])
  }
  // Method for reading the value function at the given decoupled state
  valueA(states){
    return this.setA.value(this.statesA(states))
  }
  valueB(states){
    return this.setB.value(this.statesB(states))
  }
  // Method for reading the value function at the given joint state
  value(states){
    if(this.valueA(states) < this.valueB(states)){
      return(this.valueB(states))
    }
    else{
      return(this.valueA(states))
    }
  }
  // Method for calculating the gradient
  gradV(states){
    let gradient = [0,0,0,0]
    if(this.valueA(states) < this.valueB(states)){
      let gradientB = this.setB.gradV(this.statesB(states) )
      gradient[2] = gradientB[0]
      gradient[3] = gradientB[1]
    }
    else{
      let gradientA = this.setA.gradV(this.statesA(states) )
      gradient[0] = gradientA[0]
      gradient[1] = gradientA[1]
    }
    return(gradient)
  }
}

// Safe Set loaded from MATLAB-dumped JSON in LSToolbox format
class loaded_SafeSet extends SafeSet {
  constructor(name){
    super()
    // Fetch the reachset JSON file from the server
    fetch("reachableSets/"+name+"_reachset.json").then((response) => {
    //fetch("reachableSets/dubIntV2_reachset.json").then((response) => {
    //fetch("reachableSets/dubinsV1_reachset.json").then((response) => {
            // The fetch operation has returned an HTTP response!
            // You can read more about these under the MDN docs:
            // https://developer.mozilla.org/en-US/docs/Web/API/Response
            return response.json()
        }).then((json) => {
            // Load the JSON into a local data member
            console.log(json)
            this.reachset = json
        })
    //fetch("reachableSets/dubIntV2_reachset.json").then(this.foo).then(this.bar)
  }
  // Method for calculating the gradient at the given state
  gradV(states){
    // Find the nearest neighbors
    let [low_index,high_index] = this.nearIndices(states)
    // Calculate the patial along each axis
    let gradient = []
    for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space...
      // Project along the current axis to the hyperplane intersecting the
      // nearest gridpoints on both sides
        // Clone the state vector
      let statesLow = states.slice(0)
      let statesHigh = states.slice(0)
      // Replace the cur_dim-th state with the location of the nearest gridpoint
      statesLow[cur_dim] = this.indexToState(low_index[cur_dim],cur_dim)
      statesHigh[cur_dim] = this.indexToState(high_index[cur_dim],cur_dim)
      // Calculate the slope between the two projected points
      gradient[cur_dim] =  (this.value(statesHigh) - this.value(statesLow))/this.reachset.gdx[cur_dim]
    }
    //
    return(gradient)
  }
  // Method for finding the nearest neighboring gridpoints
  nearIndices(_states){
    let states = _states.slice()
    // If the state is out of the reachset's grid, then round to nearest gridpoint
    for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space
      if(states[cur_dim] < this.reachset.gmin[cur_dim]){
        states[cur_dim] = this.reachset.gmin[cur_dim]
      }
      if(states[cur_dim] > this.reachset.gmax[cur_dim]){
        states[cur_dim] = this.reachset.gmax[cur_dim]
      }
    }
    // Initialize the nearest neighbor index arrays
    let low_index = []
    let high_index = []
    // Find the nearest neighbors by rounding along each axis
    for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space...
      // Find the nearest neighbors
      low_index[cur_dim] =  Math.floor( (states[cur_dim]-this.reachset.gmin[cur_dim])/this.reachset.gdx[cur_dim] )
      high_index[cur_dim] =  Math.ceil( (states[cur_dim]-this.reachset.gmin[cur_dim])/this.reachset.gdx[cur_dim] )
    }
    return([low_index,high_index])
  }
  // Method for taking an index along an axis and mapping it to its position in the state space
  indexToState(index,dim){
    return(index*this.reachset.gdx[dim]+this.reachset.gmin[dim])
  }
  // Method for reading the value function at the given state
  value(states){
    // Find the nearest neighbors
    let [low_index,high_index] = this.nearIndices(states)
    //console.log(high_index)
    // Calculate the hypervolumes between the interpolation point and the nearest neighbors
    let low_distance = []
    let high_distance = []
    for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space...
      // Calculate the distance to each corner of this axis
      low_distance[cur_dim]  =  states[cur_dim] - (low_index[cur_dim]*this.reachset.gdx[cur_dim]+this.reachset.gmin[cur_dim])
      high_distance[cur_dim] = (high_index[cur_dim]*this.reachset.gdx[cur_dim]+this.reachset.gmin[cur_dim]) - states[cur_dim]
      // Catch /edge/ case where interpolation point is on a grid edge
      if(low_index[cur_dim] == high_index[cur_dim]){
        low_distance[cur_dim] = 1
        high_distance[cur_dim] = 0
      }
    }
    // Multilinear interpolation by weighing each corner value by the volume in
    // the cube between the opposite corner and the interpolation point
    let value = 0
    // Iterate over each corner of the cell represented as a binary string
    // a zero in the dth bit represents the lower corner along the dth axis
    for(var corner = 0;corner<Math.pow(2,states.length);corner++){
      let volume = 1 // Initialize volume aggregator: volume is calculated by multiplying the cubes' lengths together
      let corner_subarray = this.reachset.data.slice()
      for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space
        if(corner & Math.pow(2,cur_dim) ){ // Check the cur_dim-th bit
          volume *= low_distance[cur_dim] // multiply in this cell's length along the cur_dim axis
          corner_subarray = corner_subarray[high_index[cur_dim]] // unwrap another layer of referncing the value function
        }
        else{
          volume *= high_distance[cur_dim] // multiply in this cell's length along the cur_dim axis
          corner_subarray = corner_subarray[low_index[cur_dim]] // unwrap another layer of referncing the value function
        }
      }
      value += volume * corner_subarray // Weight the value at this corner by the cell's volume and add to the aggregator
    }
    // Normalize by the total volume
    let total_volume = 1
    for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space
      total_volume *= this.reachset.gdx[cur_dim]
    }
    value = value/total_volume
    // Alternate Method: just use lower-corner value for piecewise constant interpolation
    /*
    let subarray = this.reachset.data
    for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space
      subarray = subarray[low_index[cur_dim]]
    }
    value = subarray
    */
    // Return
    if(value == NaN){
      console.log('Nanned')
    }
    return(value)
  }
}
