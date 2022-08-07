// P5 documentation at https://p5js.org/reference/
//header('Access-Control-Allow-Origin: *');

let resolution = {x: window.innerWidth, y: window.innerHeight};
let frame = 0;
let colorNum = 0;
let colors = {r: 0 , g: 0, b: 0};
let g;

let backgroundImage;
let backgroundImageCopy;
let gameScreenImage;
let aspectRatio = 3/4;

let ballImage;
let ballStartPosition = {x: .025, y: .05};
let gameBallRatio = .05;
let ballAcc = .00015;
let gravity = .0006;
let maxFallSpeed = .0175;
let maxMoveSpeed = .006;
let ballFric = .94;
let airFric = 1;
let ballFricConst = .0004;
let ballBounce = .009;
let floorEffectSpeed = 1;

let floors = [];
let numOfFloors = 10;
let holesize = gameBallRatio * 3;
let floorSpeed = .0001;

let walls = [];
let wallHeight = .04;
let wallwidth = .03;

class gameSystem{
    constructor(aspectRatio){
      this.recalcScreen();
    }
  
    recalcScreen(){
      this.widthOfGameScreen = aspectRatio * resolution.y;
      this.heightOfGameScreen = resolution.y; 
  
      this.position = {
        startX: (resolution.x/2) - (this.widthOfGameScreen/2), 
        startY: 0, 
        endX: (resolution.x/2) + (this.widthOfGameScreen/2),
        endY: resolution.y
      }
    }
  
    displayGameScreen(){
      this.recalcScreen()
      image(gameScreenImage, this.position.startX, this.position.startY, this.widthOfGameScreen, this.heightOfGameScreen)
    }
  
    resetImage(images){
      return images.copy(backgroundImageCopy, 0, 0, backgroundImageCopy.width, backgroundImageCopy.height, 0, 0, backgroundImageCopy.width, backgroundImageCopy.height);
    }
    
    displayGameBackground(){
        let currentWidth = 140;
        let currentHeight = 0;

        brickCanvas.clear();
        while(currentHeight <= this.position.endY){
            
            brickCanvas.image(backgroundImage, this.position.startX - currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
            currentWidth += 140;

            while(this.position.startX - currentWidth > -140){
                brickCanvas.image(backgroundImage, this.position.startX - currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
                currentWidth += 140;
            }
            currentWidth = 140;
            currentHeight += 100 - 5;
        }

        currentHeight = 0;

        currentWidth = this.position.endX;
        while(currentHeight <= this.position.endY){
            brickCanvas.image(backgroundImage, currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
            
            while(currentWidth < resolution.x ){
                brickCanvas.image(backgroundImage, currentWidth + 140, currentHeight, 140, 100, 58, 78, 140, 137);
                currentWidth += 140;
            }
            currentWidth = this.position.endX;
            currentHeight += 100 - 5;
        }
    }
  
    coordToScreen(position){
      let Coordinate = {
        x: this.position.startX + this.perToPx(position.x), 
        y: this.position.startY + this.perToPx(position.y)};
      return Coordinate;
    }
  
    perToPx(percent){
      return percent * this.widthOfGameScreen;
    }
    
    LineColor(colorNum){
      colorNum = colorNum % 1529;
      if(colorNum <= 255){ //0 - 255
          stroke(255, colorNum, 0);
        }else if(colorNum <= 510){ // 256 - 510
          stroke(510 - colorNum, 255, 0);
        }else if (colorNum <= 765){ // 511 - 765
          stroke(0, 255, colorNum - 510);
        }else if(colorNum <= 1020){ //766 - 1020
          stroke(0, 1020 - colorNum, 255);
        }else if(colorNum <= 1275){ // 1021 - 1275
          stroke(colorNum - 1020, 0, 255);
        }else if(colorNum <= 1529){ //1276 - 1529
          stroke(255, 0, 1529 - colorNum);
        }else{
          stroke(255, colorNum, 0);
        }
        colorNum += 5;
        return colorNum;
      }
    
      //floors[floorIndex].displayFloor(game.c(floors[floorIndex].StartPosition), game.c(floors[floorIndex].EndPosition));
      //walls[wallIndex].displayWall(game.c(walls[wallIndex].StartPosition), game.c(walls[wallIndex].EndPosition));
      //gameBall.displayBall(game.c(gameBall.BallPosition), (gameBallRatio * game.widthOfGameScreen));
  
    displayWall(wall){
      wall.colorNum = this.LineColor(wall.colorNum);
      let startPosition = g.c(wall.topPosition);
      let endPosition = g.c(wall.bottomPosition);
  
      line(startPosition.x, startPosition.y, endPosition.x, endPosition.y);
    }
    
    displayFloor(floor){
      floor.colorNum = this.LineColor(floor.colorNum);
      let startPosition = g.c(floor.startPosition);
      let endOfLine = {x: floor.startPosition.x + floor.length, y: floor.startPosition.y};
      let endPosition = g.c(endOfLine);
  
      line(startPosition.x, startPosition.y, endPosition.x, endPosition.y);
    }
  
    displayBall(ball){
      let position = g.c(ball.BallPosition);
      let ballDiameter = this.perToPx(ball.ballDiameter);
  
      translate(position.x, position.y);
      rotate(ball.rotation);
      image(ballImage, -(ballDiameter / 2), -(ballDiameter / 2), ballDiameter, ballDiameter);
      resetMatrix();
  
      if(position.x - (ballDiameter / 2) < this.position.startX){
        translate(this.position.endX + (position.x -  this.position.startX), position.y);
        rotate(ball.rotation);
        image(ballImage, -(ballDiameter / 2) , -(ballDiameter / 2), ballDiameter, ballDiameter);
        resetMatrix();
      }else if(position.x + (ballDiameter / 2) > this.position.endX){
        translate(this.position.startX - (this.position.endX - position.x), position.y);
        rotate(ball.rotation);
        image(ballImage,  -(ballDiameter / 2) , -(ballDiameter / 2), ballDiameter, ballDiameter);
        resetMatrix();
      }
    }
  
    createFloorsNWalls(placeFloors = true, placeWalls = true){
  
      let floorindex = 0;
      let wallIndex = 0;
  
      for(let floorNum = 0; floorNum < numOfFloors; floorNum++){
        let colorNum = {one: (floorindex + 1) * 20, two: (floorindex + 2) * 20, three: (floorindex + 3) * 20};
        let begHole = random(1 - holesize);
        let begWall = begHole;
    
        while(
          (begWall >= begHole && begWall <= begHole + holesize) || 
          (begWall + holesize >= begHole && begWall + holesize <= begHole + holesize) || 
          begWall + holesize > 1){
          begWall = random()
        }
    
        let floorStartPosition = {x: 0, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
        let floorEndPosition = {x: begHole, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
        
        if(placeFloors){
          floors[floorindex++] = new floor(floorStartPosition, floorEndPosition, colorNum.one);
          
          floorStartPosition = {x: begHole + holesize, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
          floorEndPosition = {x: 1, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
          floors[floorindex++] = new floor(floorStartPosition, floorEndPosition, colorNum.two);
        }
  
        let wallStartPosition = {x: begWall, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
        let wallEndPosition = {x: begWall, y: (((1 / aspectRatio) / numOfFloors) * (floorNum + 1)) - wallHeight};
  
        if(placeWalls){
          walls[wallIndex++] = new wall(wallStartPosition, wallEndPosition, colorNum.three);
  
          floorStartPosition = {x: begWall, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1) - wallHeight};
          floorEndPosition = {x: begWall + wallwidth, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1) - wallHeight};
  
          floors[floorindex++] = new floor(floorStartPosition, floorEndPosition, colorNum.three);
  
          wallStartPosition = {x: begWall + wallwidth, y: ((1 / aspectRatio) / numOfFloors) * (floorNum + 1)};
          wallEndPosition = {x: begWall + wallwidth, y: (((1 / aspectRatio) / numOfFloors) * (floorNum + 1)) - wallHeight};
  
          walls[wallIndex++] = new wall(wallStartPosition, wallEndPosition, colorNum.three);
        }
      }
    }
}

class shortHand{
    constructor(game){
        this.g = game;
    }

    c(position){
        return this.g.coordToScreen(position);
    }

}

class floor{
    constructor(startPosition, length, colorNum, moveVars, moveFunc){
      this.startPosition = {x: startPosition.x, y: startPosition.y};
      this.length = length;
      this.colorNum = colorNum;
      this.ball = false;
      this.moveFunc = moveFunc;
      if(moveVars){
        this.moveVars = moveVars;
      }else{
        this.moveVars = false;
      }
    }
    
}


function preload(){
  
    ballImage = loadImage('./images/toyStoryBall1.png');
    backgroundImage = loadImage('./images/black-brickwall-better.jpg');
    backgroundImageCopy = loadImage('./images/black-brickwall-better.jpg');
    transparentImage = loadImage('./images/transparent.png')
    gameScreenImage = loadImage('./images/gray.jpg');
}

function setup(){
    rainbowCanvas = createGraphics(resolution.x, resolution.y);
    window.theWholeCanvas = createCanvas(resolution.x, resolution.y);
    brickCanvas = createGraphics(resolution.x, resolution.y);
    
    blendMode(REPLACE);

    rainbowCanvas.show();
    brickCanvas.show();
    rainbowCanvas.style("z-index", "-5");
    brickCanvas.style("z-index", "3");
    rainbowCanvas.style("position", "absolute");
    brickCanvas.style("position", "absolute");

    angleMode(DEGREES);
    textAlign(CENTER);
    textSize(64);
  
    game = new gameSystem(aspectRatio);
    g = new shortHand(game);

    game.displayGameBackground();
}

draw = function(){

    if (frame == 360){
        frame = 0;
    }
    background(colors.r, colors.g, colors.b);

    game.displayGameScreen();

    frame++;
}