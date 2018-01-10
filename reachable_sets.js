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
  foo(response) {
          // The fetch operation has returned an HTTP response!
          // You can read more about these under the MDN docs:
          // https://developer.mozilla.org/en-US/docs/Web/API/Response
          return response.json()
      }
  bar(json) {
          console.log(json)
          reachset = json
          // TODO: Figure out how to put loaded reachable set into this.reachset
      }
  constructor(){
    super()
    //this.reachset = reachset
    fetch("reachableSets/dubIntV2_reachset.json").then((response) => {
            // The fetch operation has returned an HTTP response!
            // You can read more about these under the MDN docs:
            // https://developer.mozilla.org/en-US/docs/Web/API/Response
            return response.json()
        }).then((json) => {
            console.log(json)
            this.reachset = json
            // TODO: Figure out how to put loaded reachable set into this.reachset
        })
    //fetch("reachableSets/dubIntV2_reachset.json").then(this.foo).then(this.bar)
  }
  value(states){
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
    // Initialize the lengths arrays
    let low_distance = []
    let high_distance = []
    // Calculate the hypervolumes between the interpolation point and the nearest neighbors
    for(var cur_dim=0;cur_dim<states.length;cur_dim++){ // Iterate along each axis in the state space...
      // Find the nearest neighbors
      low_index[cur_dim] =  Math.floor( (states[cur_dim]-this.reachset.gmin[cur_dim])/this.reachset.gdx[cur_dim] )
      high_index[cur_dim] =  Math.ceil( (states[cur_dim]-this.reachset.gmin[cur_dim])/this.reachset.gdx[cur_dim] )
      // Calculate the distance to each corner of this axis
      low_distance[cur_dim]  =  states[cur_dim] - (low_index[cur_dim]*this.reachset.gdx[cur_dim]+this.reachset.gmin[cur_dim])
      high_distance[cur_dim] = (high_index[cur_dim]*this.reachset.gdx[cur_dim]+this.reachset.gmin[cur_dim]) - states[cur_dim]
    }
    // Multilinear interpolation by weighing each corner value by the volume in
    // the cube between the opposite corner and the interpolation point
    let value = 0
    // Iterate over each corner of the cell represented as a binary string
    // a zero in the dth bit represents the lower corner along the dth axis
    for(var corner = 0;corner<Math.pow(2,states.length);corner++){
      let volume = 1 // Initialize volume aggregator: volume is calculated by multiplying the cubes' lengths together
      let corner_subarray = this.reachset.data
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
