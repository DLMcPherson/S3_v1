"use strict"

const FRAME_WIDTH = 700;
const FRAME_HEIGHT = 700;

function drawCircle(linewidth,color,left,top,radius){
  // Set a fill and line style
  graphics.beginFill(color,0.4);
  graphics.lineStyle(linewidth, 0x000000);

  // Draw the circle
  graphics.drawCircle(left,top,radius);
  graphics.endFill();
  return;
}

class PhenotypePopulationSprite extends PIXI.Sprite {
  // Constructor initializes PIXI.Sprite members and sets initial state
  constructor(color,_initialMass){
    // Image
    super(PIXI.Texture.from("http://localhost:3000/S3_v1/Blob.png"));
    this.tint = color
    this.alpha = 0.7
    this.anchor.x = 0.5
    this.anchor.y = 0.5
    // State
    this.mass = 1
    this.updateMass(_initialMass)
  }
  // Method to be called each loop
  updateMass(newMass){
    let ratioChange = newMass/this.mass
    this.mass = newMass
    // we define the state space's unit of area/mass as pi*260^2 due to the size
    // of the sprite's graphic
    this.scale.set(math.sqrt(newMass))
  }
  render(args) {
    super.render(args)
  }
}

class PhenotypePopulationSprawl extends PIXI.Sprite {
  // Constructor initializes PIXI.Sprite members and sets initial state
  constructor(color,_initialMass){
    // Image
    super(PIXI.Texture.from("http://localhost:3000/S3_v1/Blob.png"));
    this.tint = color
    this.alpha = 0.7
    this.anchor.x = 0.5
    this.anchor.y = 0.5
    // The tree
    this.mass = 1
    this.root = new Blob(0,0,color,this.mass)
    // State
    this.updateMass(_initialMass)
    this.populationReadout = new PIXI.Text("POPULATION: "+this.mass,{font : '24px Gill Sans', fill : color})
    stage.addChild(this.populationReadout)
  }
  // Method to be called each loop
  updateMass(newMass){
    let delta = newMass - this.mass
    this.mass = newMass
    this.root.grow(delta)
  }
  render(renderment) {
    this.root.render(this.x,this.y)
    this.populationReadout.text = "POPULATION: "+this.mass
    this.populationReadout.y = this.y-100
    return;
  }
}

class Blob {
  constructor(x,y,color,mass,_parent) {
    this.x = x
    this.y = y
    this.color = color
    this.radius = math.sqrt(260*260*mass)
    this.mass = mass
    this.familyMass = mass
    this.children = []
    this.parent = _parent
  }
  randomOutskirt() {
    return( (Math.random()*2-1) * this.radius)
  }
  deplete() {
    this.mass = 0
    this.children.forEach(child => child.mass = 0);
    this.familyMass = 0
  }
  grow(delta_mass) {
    // we define the state space's unit of area/mass as pi*260^2
    let number_of_mouths = this.children.length+1
    let portion = delta_mass / number_of_mouths
    this.mass += portion
    this.children.forEach(function(item,index) {
      if(item.familyMass + portion > 0) { // if you can handle the portion
        item.grow(portion) // take it
      } else { // if you can't handle the portion:
        item.parent.mass += item.familyMass // I'll swallow you and your portion
        item.parent.mass += portion
        item.deplete() // just take what you can
      }
    });

    // mitosis
    if(this.mass > 1) {
      this.children.push(new Blob(this.randomOutskirt(),this.randomOutskirt(),this.color,0.1,this))
      this.mass = this.mass - 0.1
    }

    // reabsorption
    if(this.mass < 0 && this.children.length > 0) {
      let eaten = this.children.pop()
      this.mass += eaten.familyMass
      eaten.deplete()
    }
    if(this.mass < 0) {
      this.radius = 0
    } else {
      this.radius = math.sqrt(260*260*this.mass)
    }

    // Tally up the whole family's mass recursively
    let tally = this.mass
    this.children.forEach(child => tally += child.familyMass);
    this.familyMass = tally
    //console.log(this.mass,this.familyMass)
  }
  render(rootX,rootY) {
    // Set a fill and line style
    graphics.beginFill(this.color,0.7);
    graphics.lineStyle(0, 0x000000);

    // Draw the circle
    graphics.drawCircle(rootX+this.x,rootY+this.y,this.radius);
    graphics.endFill();

    if(this.mass < 0) {
      this.radius = 0
    } else {
      this.radius = math.sqrt(260*260*this.mass)
    }
    this.children.forEach(item => item.render(rootX+this.x,rootY+this.y));
    return;
  }
}

/* ===================== SETUP ================== */

// Setup the PIXI renderer that handles interactive display and input inside the browser
//let renderer = PIXI.autoDetectRenderer(FRAME_WIDTH, FRAME_HEIGHT);
let renderer = new PIXI.Renderer({ width: FRAME_WIDTH, height: FRAME_HEIGHT, backgroundColor: 0xffffff })
renderer.autoResize = true
renderer.roundPixels = true;

// Standard Frame
let stage = new PIXI.Container();
  // Graphics object for lines and squares and such...
let graphics = new PIXI.Graphics();
let map1 = new FrameXYMap(70,0,0,70,FRAME_WIDTH*3/4,FRAME_HEIGHT/2);
graphics.mapper = map1

// Goal point Marker
const goalX = 1 ; const goalY = -4;

// Robot Object
let Umax = 0.625
// let dubinsCircles = new LearnedPalette("dubins");
let dubinsCircles = new SweptPalette("DubinsSafesetFullFamily/dubins",[0,125,250,375,500,625,750,875,1000,2000,3000],[0])
let carRadius = 0.55;
let obstacle = new RoundObstacle(0,0,1.8,carRadius,dubinsCircles,map1);
let ArcadeScore = 0

//let button = new PIXI.Text("Reveal the Answer",{font : '24px Gill Sans', fill : 0xAD3129})
let buttonDrugP = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/BEZ235andTrametinib.png"))
buttonDrugP.interactive = true;
buttonDrugP.buttonMode = true;
buttonDrugP.x = 740
buttonDrugP.y = 350
buttonDrugP.on('mousedown', applyDrugP)

let buttonDrugB = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/BEZ235.png"))
buttonDrugB.interactive = true;
buttonDrugB.buttonMode = true;
buttonDrugB.x = 40
buttonDrugB.y = 350-35
buttonDrugB.on('mousedown', applyDrugB)


let buttonDrugT = new PIXI.Sprite(PIXI.Texture.from("http://localhost:3000/S3_v1/Trametinib.png"))
buttonDrugT.interactive = true;
buttonDrugT.buttonMode = true;
buttonDrugT.x = 40
buttonDrugT.y = 350+35
buttonDrugT.on('mousedown', applyDrugT)

//stage.addChild()

// Initialize the simulation
let matrixP = math.matrix([[0.755, 0.081],
                           [0.169, 0.843]])
let transitionMatrix = matrixP
let matrixB = math.matrix([[0.896, 0.0],
                           [0.186, 1.083]])
let matrixT = math.matrix([[1.030, 0.231],
                           [0.022, 0.821]])

let currentState = math.matrix([[1],[1]])
let phenotype1 = new PhenotypePopulationSprawl(0x00DD00,currentState._data[0][0])
let phenotype2 = new PhenotypePopulationSprawl(0xDDDD00,currentState._data[1][0])

// Arrange everything on stage
stage.addChild(graphics);
stage.addChild(buttonDrugP);
stage.addChild(buttonDrugB);
stage.addChild(buttonDrugT);
stage.addChild(phenotype1);
stage.addChild(phenotype2);

// ===================== THE MAIN EVENT ================== // 3

// Main Loop
let clock =  0 ;
let supervisorCountdown = 0;
let now = Date.now();
let revealAnswer = false
window.setInterval(function() {
  // Time management
  let delT = Date.now() - now;
  delT *= 0.0005 * 4;
  clock += delT;
  now = Date.now();
  // Dynamics

  // Rendering the stage
  graphics.clear();
  //obstacle.render();

  phenotype1.render(renderer)
  phenotype2.render(renderer)
  renderer.render(stage);
},10)

// ====================== Keyboard Listener Loop ========================= //
let key = null;
document.addEventListener("keydown",function(event) {
  // Log time and key
  key = event.keyCode;
  /*
  // Update level set
  if(intervener.trigger_level < intervener.intervening_set.value(robot.states)){
    intervener.trigger_level = intervener.intervening_set.value(robot.states);
  }
  // Draw level set
  obstacle.renderAugmented(intervener.trigger_level);
  */
  console.log(key);
  if(key == 49){
    applyDrugB()
    //intervener.intervening_set = originalSafeset;
    //intervener = intervenerOri;
  }
  if(key == 50){
    applyDrugT()
  }
  if(key == 51){
    applyDrugP()
  }11
  // End
})

// ====================== Mouse Listener Loop ========================= //
document.addEventListener("mousedown",function(event) {
  let mousePosition = renderer.plugins.interaction.mouse.global;
  let mouseState = map1.mapPositionToState(mousePosition.x/stage.scale.x,mousePosition.y/stage.scale.x)
  //intervener.tracker.updateSetpoint([mouseState[0],mouseState[1]]);
  // End
})
//document.addEventListener("pointermove",onDragMove)

// Mount the renderer in the website
let mount = document.getElementById("partialframe");
mount.insertBefore(renderer.view, mount.firstChild);
resize()

function applyDrugP(event) {
  transitionMatrix = matrixP
  applyDrug(event)
}

function applyDrugB(event) {
  transitionMatrix = matrixB
  applyDrug(event)
}

function applyDrugT(event) {
  transitionMatrix = matrixT
  applyDrug(event)
}

function applyDrug(event) {
    // Step forward the simulation
    currentState = math.multiply(transitionMatrix,currentState)
    console.log(transitionMatrix._data[1][1],currentState._data[1][0])
    phenotype1.updateMass(currentState._data[0][0])
    phenotype2.updateMass(currentState._data[1][0])
}


// Resize function window
function resize() {
  const parent = renderer.view.parentNode;
	// Resize the renderer
  //let newWidth = window.innerWidth
  //let newHeight = window.innerHeight
  let newWidth = parent.clientWidth
  let newHeight = parent.clientHeight

  /*
  // Scaling Matrix
  graphics.mapper.Mxx = 70 * scale
  graphics.mapper.Mxy = 0
  graphics.mapper.Myx = 0
  graphics.mapper.Myy = 70 * scale
  // Origin-defining affine term
  graphics.mapper.bx  = newWidth/2;
  graphics.mapper.by  = newHeight/2;
  */
  renderer.resize(newWidth, newHeight);
  console.log(newWidth, newHeight)
  map1.bx = newWidth*3/4
  map1.by = newHeight/2

  let scale = newWidth/FRAME_WIDTH
  if(scale > newHeight/FRAME_HEIGHT)
    scale = newHeight/FRAME_HEIGHT

  stage.scale.x = scale
  stage.scale.y = scale
  map1.bx /= scale
  map1.by /= scale

  buttonDrugP.x = 140
  buttonDrugP.y = newHeight/scale * 0.5

  buttonDrugB.x = 70
  buttonDrugB.y = newHeight/scale * 0.5
  buttonDrugT.x = 70
  buttonDrugT.y = newHeight/scale * 0.5 + 70

  phenotype1.x = newWidth/scale * 0.5
  phenotype2.x = newWidth/scale * 0.5 + 30
  phenotype1.y = newHeight/scale * 0.5 - 30
  phenotype2.y = newHeight/scale * 0.5
}
