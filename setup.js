
// Setup the renderer
var renderer = PIXI.autoDetectRenderer(640, 640)
renderer.backgroundColor = 0xffffff
renderer.roundPixels = true

// Connect to my Firebase
var firebase = new Firebase("https://ancaticipation.firebaseio.com")

// ===================== SETUP SCREENS ================== //

// Standard Screen
var stage = new PIXI.Container()
  // Graphics object for lines and squares and such...
var graphics = new PIXI.Graphics();
stage.addChild(graphics)
  // Text
var instr1 = new PIXI.Text('Press \'Q\' to guess Goal on Left',{font : '12px Roboto', fill : 0x077f4d});
instr1.x = 0
instr1.y = 500
stage.addChild(instr1)
var instr2 = new PIXI.Text('Press \'P\' to guess Goal on Right',{font : '12px Roboto', fill : 0x077f4d});
instr2.x = 400
instr2.y = 500
stage.addChild(instr2)
var timer = new PIXI.Text('+100',{font : '48px Roboto', fill : 0x077f4d, align: 'ceneter'});
timer.x = 250
timer.y = 550
stage.addChild(timer)

  // Win screen
var yay = new PIXI.Container()
var yup = new PIXI.Text('Correct!',{font : '60px Roboto', fill : 0x077f4d});
yup.x = 300
yup.y = 300
yay.addChild(yup)

  // Lose screen
var nay = new PIXI.Container()
var nope = new PIXI.Text('WRONG!',{font : '60px Roboto', fill : 0xcf4c34});
nope.x = 300
nope.y = 300
nay.addChild(nope)
