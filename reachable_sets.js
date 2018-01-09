// Safe set 'virtual' class
class SafeSet {
  value(states){
    return 0;
  }
}
class DoubleIntegrator_SafeSet extends SafeSet {
  constructor(_leeway,_obP,_obL){
    super()
    this.leeway = _leeway // Should be positive, otherwise system will always crash
    this.obP = _obP
    this.obL = _obL
    console.log(reachset.gdim)
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
}

class loaded_SafeSet extends SafeSet {
  constructor(){
    super()
  }
  value(states){
    // Initialize the nearest neighbor index arrays
    let low_index = []
    let high_index = []
    // Initialize the lengths arrays
    let low_distance = []
    let high_distance = []
    // Calculate the hypervolumes between the interpolation point and the nearest neighbors
    for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space...
      // Find the nearest neighbors
      low_index[cur_dim] =  Math.floor( (states[cur_dim]-reachset.gmin[cur_dim])/reachset.gdx[cur_dim] )
      high_index[cur_dim] =  Math.ceil( (states[cur_dim]-reachset.gmin[cur_dim])/reachset.gdx[cur_dim] )
      // Constrain the high_index to be within referencing bounds
      if(high_index[cur_dim] < 0)
        high_index[cur_dim] = 0
      if(high_index[cur_dim] > reachset.gN-1)
        high_index[cur_dim] = reachset.gN-1
      // Constrain the low_index to be within referncing bounds
      if(low_index[cur_dim] < 0)
        low_index[cur_dim] = 0
      if(low_index[cur_dim] > reachset.gN-1)
        low_index[cur_dim] = reachset.gN-1
      // Calculate the distance to each corner of this axis
      low_distance[cur_dim]  =  states[cur_dim] - (low_index[cur_dim]*reachset.gdx[cur_dim]+reachset.gmin[cur_dim])
      high_distance[cur_dim] = (high_index[cur_dim]*reachset.gdx[cur_dim]+reachset.gmin[cur_dim]) - states[cur_dim]
    }
    // Multilinear interpolation by weighing each corner value by the volume in
    // the cube between that corner and the interpolation point
    let value = 0
    // Iterate over each corner of the cell represented as a binary string
    // a zero in the dth bit represents the lower corner along the dth axis
    for(var corner = 0;corner<Math.pow(2,states.length);corner++){
      let volume = 1 // Initialize volume aggregator: volume is calculated by multiplying the cubes' lengths together
      let corner_subarray = reachset.data
      for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space
        if(corner & Math.pow(2,cur_dim) ){ // Check the cur_dim-th bit
          volume *= high_distance[cur_dim] // multiply in this cell's length along the cur_dim axis
          corner_subarray = corner_subarray[high_index[cur_dim]] // unwrap another layer of referncing the value function
        }
        else{
          volume *= low_distance[cur_dim] // multiply in this cell's length along the cur_dim axis
          corner_subarray = corner_subarray[low_index[cur_dim]] // unwrap another layer of referncing the value function
        }
      }
      value += volume * corner_subarray // Weight the value at this corner by the cell's volume and add to the aggregator
    }
    // Normalize by the total volume
    let total_volume = 1
    for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space
      total_volume *= reachset.gdx[cur_dim]
    }
    value = value/total_volume
    // Alternate Method: just use lower-corner value for piecewise constant interpolation
    /*
    let subarray = reachset.data
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
