class Record {
  constructor(){
      // Level Data
    this.seed = seed;
    this.drivingStyle = drivingStyle;
    this.obstacles = [];
      // Telemetry
    this.robotTraces = [];
    for(let robotNum = 0; robotNum < NUMBER_OF_ROBOTS; robotNum++){
      this.robotTraces[robotNum] = [];
    }
    this.timeTrace = [];
    this.mouseTrace = [];
    this.mouseEvents = [];
  }
}
