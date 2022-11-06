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
let heightOfGameScreen;
let scrollSpeed = 0.002;//.0005;
let fallingGameSpeed = .02;
let gameScore = 0;
let gameScoreSpeed = 1;
let resetgameScoreSpeed = gameScoreSpeed;
let maxScrollSpeed = .004;
let scrollAcc = .0005;
let resetScrollSpeed = scrollSpeed;
let gameMode = {maze: false, both: false, fall: false};
let generatedGame = false;
let popGame = false;
let poppedGame = false;
let frameSize = 4;
let totalFrames = 4; // Maximum of 2 pages worth of frame
let scoreMult = 5;
let lvl0 = .3;
let lvl1 = .7; // maybe .8
let lvl2 = .9;
let lvl3 = 1;
// 0-.3 .3-.5 .5-.7 .7-1

let ballImage;
let ballStartPosition = {x: .5, y: .4};
let gameBallRatio = .05; // Should this be called ballDiameter instead?
let ballAcc = .0002;
let gravity = .0006;
let maxFallSpeed = 1 //.0175;
let maxMoveSpeed = .006;
let ballFric = .97;
let airFric = .99;
let ballFricConst = .00018;
let ballBounce = .009;
let bounceFric = -.0008;
let floorEffectSpeed = 1;
let furthestY = 0;

let floors = [];
let holesize = gameBallRatio * 3;
let floorSpeed = .0001;
let mazeGap = .2;
let moveGap = (frameSize * mazeGap) / 3;
let popNextFloor = 0;
let popNextF = 0;

let walls = [];
let poppingWalls = [];
let wallHeight = -.06;
let wallwidth = .03;
let wallSlide = .005;


//Whenever the window resizes, this function is called with the resolution variable already updated.
function onWindowResize() {
  game.recalcScreen(); //Recalculate the positioning of the game
  game.displayGameBackground(); //Redraw the bricks
  game.drawRainbowCanvas(); //Redraw the rainbow background canvas
  //Anything else you'd want to do...
}

class gameSystem{
  constructor(aspectRatio){
    this.recalcScreen();
    this.fall = false;
    this.scrollPos = 0;
    this.prevHole = -1;
    this.bottomOfFrame = 0;
    this.prevFrame = {maze: false};
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

  drawRainbowCanvas(){
    let colorVal = 0;
    let RBGColors = {r: 0, g: 0, b: 0};
    for(let lineHeight = 1; lineHeight <= resolution.y; lineHeight += 2){
      RBGColors = colorFunc(colorVal);
      rainbowCanvas.stroke(RBGColors.r, RBGColors.g, RBGColors.b);
      rainbowCanvas.line(0, lineHeight, resolution.x, lineHeight);
      colorVal += 5;
    }
  }

  displayGameScreen(){
    image(gameScreenImage, this.position.startX, this.position.startY, this.widthOfGameScreen, this.heightOfGameScreen);
  }

  resetImage(images){
    return images.copy(backgroundImageCopy, 0, 0, backgroundImageCopy.width, backgroundImageCopy.height, 0, 0, backgroundImageCopy.width, backgroundImageCopy.height);
  }
  
  displayGameBackground(){
    let currentWidth = 139;
    let currentHeight = 0;

    brickCanvas.clear();
    while(currentHeight <= this.position.endY){
        
      brickCanvas.image(backgroundImage, this.position.startX - currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
      currentWidth += 139;

      while(this.position.startX - currentWidth > -139){
        brickCanvas.image(backgroundImage, this.position.startX - currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
        currentWidth += 139;
      }
      currentWidth = 139;
      currentHeight += 100 - 5;
    }

    currentHeight = 0;

    currentWidth = this.position.endX - 1;
    while(currentHeight <= this.position.endY){
      brickCanvas.image(backgroundImage, currentWidth, currentHeight, 140, 100, 58, 78, 140, 137);
      
      while(currentWidth < resolution.x ){
        brickCanvas.image(backgroundImage, currentWidth + 139, currentHeight, 140, 100, 58, 78, 140, 137);
        currentWidth += 139;
      }
      currentWidth = this.position.endX - 1;
      currentHeight += 100 - 5;
    }
  }

  coordToScreen(position){
    let Coordinate = {
      x: this.position.startX + this.perToPx(position.x),
      y: this.position.startY + this.perToPx(position.y - this.scrollPos)};
    return Coordinate;
  }

  perToPx(percent){
    return percent * this.widthOfGameScreen;
  }

  displayWall(wall){
    let bottomPosition = g.c(wall.bottomPosition);
    let topPosition = {x: wall.bottomPosition.x, y: wall.bottomPosition.y + wall.height}
    topPosition = g.c(topPosition);

    if(wall.popEffect){
      //console.log("doing pop effect")
      strokeWeight(wall.popEffect.duration/15);
      wall.popEffect.particles.forEach((particle, ind, arr) => {
        let partPos = g.c(particle.position);
        let partVel = {x: this.perToPx(particle.velocity.x), y: this.perToPx(particle.velocity.y)};
        stroke(particle.color.r, particle.color.g, particle.color.b);
        line(partPos.x, partPos.y, partPos.x + partVel.x, partPos.y + partVel.y);
        arr[ind].position.x += particle.velocity.x;
        arr[ind].position.y += particle.velocity.y;
        arr[ind].velocity.y += 0.00015;
      });
      //let effectPos = g.c(ball.popEffect.position);
      //ellipse(effectPos.x, effectPos.y - 20 + ball.popEffect.duration, ballDiameter+1 + 20 - ball.popEffect.duration, ballDiameter+1 + 20 - ball.popEffect.duration * 2);
      wall.popEffect.duration -= 1;
      if(wall.popEffect.duration == 0){
        wall.popEffect = false;
        wall.finishedPop = true;
      }
      strokeWeight(1);  
    }else{
      if(!poppedGame){
        erase();
        line(bottomPosition.x, bottomPosition.y, topPosition.x, topPosition.y);
        noErase();
      }
    }
  }
  
  displayFloor(floor){
    let startPosition = g.c(floor.startPosition);
    let endPosition = {x: floor.startPosition.x + floor.length, y: startPosition.y};
    endPosition = g.c(endPosition);

    if(floor.popEffect){
      //console.log("doing pop effect")
      strokeWeight(floor.popEffect.duration/15);
      floor.popEffect.particles.forEach((particle, ind, arr) => {
        let partPos = g.c(particle.position);
        let partVel = {x: this.perToPx(particle.velocity.x), y: this.perToPx(particle.velocity.y)};
        stroke(particle.color.r, particle.color.g, particle.color.b);
        line(partPos.x, partPos.y, partPos.x + partVel.x, partPos.y + partVel.y);
        arr[ind].position.x += particle.velocity.x;
        arr[ind].position.y += particle.velocity.y;
        arr[ind].velocity.y += 0.00015;
      });
      //let effectPos = g.c(ball.popEffect.position);
      //ellipse(effectPos.x, effectPos.y - 20 + ball.popEffect.duration, ballDiameter+1 + 20 - ball.popEffect.duration, ballDiameter+1 + 20 - ball.popEffect.duration * 2);
      floor.popEffect.duration -= 1;
      if(floor.popEffect.duration == 0){
        floor.popEffect = false;
        floor.finishedPop = true;
      }
      strokeWeight(1);
    }else{
      if(!floor.finishedPop){
        //console.log("showing lines")
        erase();
        line(startPosition.x, startPosition.y, endPosition.x, startPosition.y);
        noErase();
      }
    }
  }

  displayBall(ball){
    let tempPosition = {x: ball.ballPosition.x, y: ball.ballPosition.y - .0025};
    if(ball.wallHit.left) tempPosition.x -= .005;
    if(ball.wallHit.right) tempPosition.x += .005;
    if(!ball.wallHit.left && ball.prevHit.left){
      ball.ballPosition.x -= .005;
      tempPosition.x -= .005;
    }else if(!ball.wallHit.right && ball.prevHit.right){
      ball.ballPosition.x += .005;
      tempPosition.x += .005;
    }

    if(ball.popEffect){
      //console.log("doing pop effect")
      strokeWeight(ball.popEffect.duration/15);
      ball.popEffect.particles.forEach((particle, ind, arr) => {
        let partPos = g.c(particle.position);
        let partVel = {x: this.perToPx(particle.velocity.x), y: this.perToPx(particle.velocity.y)};
        stroke(particle.color.r, particle.color.g, particle.color.b);
        line(partPos.x, partPos.y, partPos.x + partVel.x, partPos.y + partVel.y);
        arr[ind].position.x += particle.velocity.x;
        arr[ind].position.y += particle.velocity.y;
        arr[ind].velocity.y += 0.00015;
      });
      //let effectPos = g.c(ball.popEffect.position);
      //ellipse(effectPos.x, effectPos.y - 20 + ball.popEffect.duration, ballDiameter+1 + 20 - ball.popEffect.duration, ballDiameter+1 + 20 - ball.popEffect.duration * 2);
      ball.popEffect.duration -= 1;
      if(ball.popEffect.duration == 0){
        ball.popEffect = false;
        ball.finishedPop = true;
      }
      strokeWeight(1);
    }else{
      if(!ball.finishedPop){
        let position = g.c(tempPosition);
        let ballDiameter = this.perToPx(ball.ballDiameter);
  
        translate(position.x, position.y);
        rotate(ball.rotation);
        image(ballImage, -(ballDiameter / 2), -(ballDiameter / 2), ballDiameter, ballDiameter);
        stroke(255,255,0);
        strokeWeight(2);
        noFill();
        if(ball.bounce){
          ellipse(0, 0, ballDiameter+1 + ball.justGotBounce, ballDiameter+1 + ball.justGotBounce);
          if(ball.justGotBounce > 1){
            ball.justGotBounce /= 1.17;
          } else {
            ball.justGotBounce = 0;
          }
        }
        resetMatrix();
  
        if(position.x - (ballDiameter / 2) < this.position.startX){
          translate(this.position.endX + (position.x -  this.position.startX), position.y);
          rotate(ball.rotation);
          stroke(255,255,0);
          strokeWeight(2);
          noFill();
          if(ball.bounce){
            ellipse(0, 0, ballDiameter+1 + ball.justGotBounce, ballDiameter+1 + ball.justGotBounce);
            if(ball.justGotBounce > 1){
              ball.justGotBounce /= 1.17;
            } else {
              ball.justGotBounce = 0;
            }
          }
          image(ballImage, -(ballDiameter / 2) , -(ballDiameter / 2), ballDiameter, ballDiameter);
          resetMatrix();
        }else if(position.x + (ballDiameter / 2) > this.position.endX){
          translate(this.position.startX - (this.position.endX - position.x), position.y);
          rotate(ball.rotation);
          stroke(255,255,0);
          strokeWeight(2);
          noFill();
          if(ball.bounce){
            ellipse(0, 0, ballDiameter+1 + ball.justGotBounce, ballDiameter+1 + ball.justGotBounce);
            if(ball.justGotBounce > 1){
              ball.justGotBounce /= 1.17;
            } else {
              ball.justGotBounce = 0;
            }
          }
          image(ballImage,  -(ballDiameter / 2) , -(ballDiameter / 2), ballDiameter, ballDiameter);
          resetMatrix();
        }
        
        if(ball.bounceEffect){
          strokeWeight(ball.bounceEffect.duration/15);
          ball.bounceEffect.particles.forEach((particle, ind, arr) => {
            let partPos = g.c(particle.position);
            let partVel = {x: this.perToPx(particle.velocity.x), y: this.perToPx(particle.velocity.y)};
            stroke(particle.color.r, particle.color.g, particle.color.b);
            line(partPos.x, partPos.y, partPos.x + partVel.x, partPos.y + partVel.y);
            arr[ind].position.x += particle.velocity.x;
            arr[ind].position.y += particle.velocity.y;
            arr[ind].velocity.y += 0.00015;
          });
          //let effectPos = g.c(ball.bounceEffect.position);
          //ellipse(effectPos.x, effectPos.y - 20 + ball.bounceEffect.duration, ballDiameter+1 + 20 - ball.bounceEffect.duration, ballDiameter+1 + 20 - ball.bounceEffect.duration * 2);
          ball.bounceEffect.duration -= 1;
          if(ball.bounceEffect.duration == 0){
            ball.bounceEffect = false;
          }
        }
        strokeWeight(1);
      }
    }
  }

  gameFall(ball, floors, walls){
    ball.ballPosition.y += fallingGameSpeed;
    
    for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
      if(floors[floorIndex].moveVars){
        floors[floorIndex].moveVars.floorVelocity.x = 0;
        floors[floorIndex].moveVars.floorVelocity.y = 0;
      }
      floors[floorIndex].startPosition.y += fallingGameSpeed;
    }
    
    for(let wallIndex = 0; wallIndex < walls.length; wallIndex++){
      if(walls[wallIndex].moveVars){
        walls[wallIndex].moveVars.wallVelocity.x = 0;
        walls[wallIndex].moveVars.wallVelocity.y = 0;
      }
      walls[wallIndex].bottomPosition.y += fallingGameSpeed;
    }
  }

  popThing(thing, type){
    if(type == "floor"){
      thing.playPopEffect(60, 20, .03, {x: thing.startPosition.x + (thing.length / 2), y: thing.startPosition.y}, {x: thing.length, y: -0.3});
    }else if(type == "wall" ){
      thing.playPopEffect(60, 20, .03, {x: thing.bottomPosition.x, y: thing.bottomPosition.y}, {x: 0.5, y: -0.3});
    }else{
      thing.playPopEffect(60, 20, .03, {x: thing.ballPosition.x, y: thing.ballPosition.y}, {x: 0.5, y: -0.3});
    }
  }

  generateGame(ball){
    if(gameScore >= 0){
      gameScore = 0;
      gameScoreSpeed = resetgameScoreSpeed;
      scrollSpeed = resetScrollSpeed;
      this.scrollPos = 0;
      furthestY = 0;
    }
    //*
    ball.regenerate(ballStartPosition);
    while(floors.length > 0){
      delete floors[0];
      floors.splice(0, 1);
    }
    while(walls.length > 0){
      delete walls[0];
      walls.splice(0, 1);
    }
    //*/
    let startPosition = {x: .4, y: .5};
    let floorLength = .2;
    let moveVars = false;
    let insideMoveFun = function(){}
    floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));

    let numOfFrames = (Math.floor(Math.random() * (totalFrames)) + 1);
    //console.log("numOfFrames: " + numOfFrames);
    if(gameMode.maze){
      this.createMazeFrame(startPosition.y + mazeGap, 1);
    }else if(gameMode.both){
      let randFrame = (Math.floor(Math.random() * 2));
      if(randFrame){
        game.createMazeFrame(floors[floors.length - 1].startPosition.y + mazeGap, numOfFrames);
        game.prevFrame.maze = true;
      }else{
        game.createMoveFrame(floors[floors.length - 1].startPosition.y, numOfFrames);
      }
    }else{
      game.createMoveFrame(floors[floors.length - 1].startPosition.y, 1);
    }
  }

  createMazeFrame(floorLevel, numOfFrames){
    for(let frameIndex = 0; frameIndex < numOfFrames; frameIndex++){
        this.createMazeRow(floorLevel + (frameIndex * (mazeGap * frameSize)), frameSize);
    }
    this.bottomOfFrame = floors[floors.length - 1].startPosition.y;
  }

  createMazeRow(floorLevel, numOfFloors){
    //addWallMov = 1; //FOR TESTING PURPOSES
    let begHole = random(1 - holesize);
    let begWall = begHole;
    for(let floorNum = 0; floorNum < numOfFloors; floorNum++){
      let addWallMov;
      let scoreVal = Math.min(gameScore / 100, 1);
      let randLvlProb = Math.random();
      //console.log("scoreVal: " + scoreVal)
      //console.log("randLvlProb: " + randLvlProb)
      randLvlProb = (randLvlProb + scoreVal) / 2;
      //console.log("randLvlProb: " + randLvlProb)

      if(randLvlProb >= 0 && randLvlProb < lvl0){
        addWallMov = 0;
      }else if(randLvlProb >= lvl0 && randLvlProb < lvl1){
        addWallMov = 1;
      }else if(randLvlProb >= lvl1 && randLvlProb < lvl2){
        addWallMov = 2;
      }else{
        addWallMov = 3;
      }
      //console.log("addWallMov:::::: " + addWallMov)

      while(((begHole >= this.prevHole && begHole <= this.prevHole + holesize) ||
            (begHole + holesize >= this.prevHole && begHole + holesize <= this.prevHole + holesize))){
        begHole = random(1 - holesize);
      }
      begWall = begHole;
      this.prevHole = begHole;
  
      let startPosition = {x: 0, y: floorLevel + (floorNum * mazeGap)};
      let floorLength = begHole;
      let moveVars = false;
      let insideMoveFun = function(){}
      floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));

      startPosition = {x: begHole + holesize, y: floorLevel + (floorNum * mazeGap)}; 
      floorLength = 1 - (begHole + holesize);
      moveVars = false;
      insideMoveFun = function(){}
      floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));

      if(addWallMov == 0 || addWallMov == 1 || addWallMov == 3){
        while((begWall >= begHole && begWall <= begHole + holesize) || begWall == .05 || begWall < .003 || begWall > .997 ||
              (begWall + holesize >= begHole && begWall + holesize <= begHole + holesize) || begWall + holesize > 1){
          begWall = random()
        }
        let bottomPosition = {x: begWall, y: floorLevel + (floorNum * mazeGap)};
        let height = wallHeight;
        moveVars = false;
        insideMoveFun = function(){}
        walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
        if(addWallMov == 3){
          addWallMov--;
        }
      }
      
      if(addWallMov > 0){
        let dir = 1;
        let wallVelocity = {x: 0.005, y: 0};
        let velocityDir = (Math.floor(Math.random() * 2));
        if(!velocityDir){
          wallVelocity.x *= -1;
          dir = 0;
        }
        while((begWall >= begHole && begWall <= begHole + holesize) || begWall == .05 || begWall < .003 || begWall > .997 ||
              (begWall + holesize >= begHole && begWall + holesize <= begHole + holesize) || begWall + holesize > 1){
          begWall = random()
        }
        while(addWallMov > 0){

          let bottomPosition = {x: begWall, y: floorLevel + (floorNum * mazeGap)};
          let height = wallHeight;
          let beginNEndPositionX = {begin: 0, end: 1};
          let beginNEndPosition = {begin: 0, end: heightOfGameScreen};
          moveVars = {wallVelocity: wallVelocity, beginNEndPositionX: beginNEndPositionX, beginNEndPosition: beginNEndPosition};
          insideMoveFun = function(){
            this.moveVertically();
    
            this.moveHorizontally();
            
            if(this.bottomPosition.y <= this.moveVars.beginNEndPosition.begin || this.bottomPosition.y >= this.moveVars.beginNEndPosition.end){
              this.moveVars.wallVelocity.y *= -1;
            }
    
            if(this.moveVars.wallVelocity.x > 0){
              if(this.bottomPosition.x > this.moveVars.beginNEndPositionX.end){
                this.moveVars.wallVelocity.x *= -1;
              }
            }else if(this.moveVars.wallVelocity.x < 0){
              if(this.bottomPosition.x < this.moveVars.beginNEndPositionX.begin){
                this.moveVars.wallVelocity.x *= -1;
              }
            }
          }
          walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));

          if(dir){
            wallVelocity = {x: -0.005, y: 0};
            dir = 0;
          }else{
            wallVelocity = {x: 0.005, y: 0};
            dir = 1;
          }
          if(begWall + .5 > 1){
            begWall = (begWall + .5) - 1;
          }else{
            begWall += .5;
          }
          addWallMov--;
        }
      }

      
      /*
      if(!addWallMov){
        moveVars = false;
        insideMoveFun = function(){}
        walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
      }else{
        let velocityDir = (Math.floor(Math.random() * 2));
        if(!velocityDir){
          wallVelocity.x *= -1;
          dir = 1;
        }
        let beginNEndPositionX = {begin: 0, end: 1};
        let beginNEndPosition = {begin: 0, end: heightOfGameScreen};
        moveVars = {wallVelocity: wallVelocity, beginNEndPositionX: beginNEndPositionX, beginNEndPosition: beginNEndPosition};
        insideMoveFun = function(){
          this.moveVertically();
  
          this.moveHorizontally();
          
          if(this.bottomPosition.y <= this.moveVars.beginNEndPosition.begin || this.bottomPosition.y >= this.moveVars.beginNEndPosition.end){
            this.moveVars.wallVelocity.y *= -1;
          }
  
          if(this.moveVars.wallVelocity.x > 0){
            if(this.bottomPosition.x > this.moveVars.beginNEndPositionX.end){
              this.moveVars.wallVelocity.x *= -1;
            }
          }else if(this.moveVars.wallVelocity.x < 0){
            if(this.bottomPosition.x < this.moveVars.beginNEndPositionX.begin){
              this.moveVars.wallVelocity.x *= -1;
            }
          }
        }
        walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
        
        //bottomPosition = {x: .997, y: floorLevel + (floorNum * mazeGap)}; //FOR TESTING PURPOSES .003 .997
        height = wallHeight;
        if(addWallMov == 1){
          begWall = random()
          while((begWall >= begHole && begWall <= begHole + holesize) || begWall == .05 || begWall < .003 || begWall > .997 ||
          (begWall + holesize >= begHole && begWall + holesize <= begHole + holesize) || begWall + holesize > 1){
            begWall = random()
          }
          bottomPosition = {x: begWall, y: floorLevel + (floorNum * mazeGap)};
          moveVars = false;
          insideMoveFun = function(){}
          walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
        }else{
          if(begWall + .5 > 1){
            begWall = (begWall + .5) - 1;
          }else{
            begWall += .5;
          }
          bottomPosition = {x: begWall, y: floorLevel + (floorNum * mazeGap)};
          let wallVelocity = {x: 0.005, y: 0};
          if(!dir){
            wallVelocity.x *= -1;
          }
          let beginNEndPositionX = {begin: 0, end: 1};
          let beginNEndPosition = {begin: 0, end: heightOfGameScreen};
          moveVars = {wallVelocity: wallVelocity, beginNEndPositionX: beginNEndPositionX, beginNEndPosition: beginNEndPosition};
          insideMoveFun = function(){
            this.moveVertically();
    
            this.moveHorizontally();
            
            if(this.bottomPosition.y <= this.moveVars.beginNEndPosition.begin || this.bottomPosition.y >= this.moveVars.beginNEndPosition.end){
              this.moveVars.wallVelocity.y *= -1;
            }
    
            if(this.moveVars.wallVelocity.x > 0){
              if(this.bottomPosition.x > this.moveVars.beginNEndPositionX.end){
                this.moveVars.wallVelocity.x *= -1;
              }
            }else if(this.moveVars.wallVelocity.x < 0){
              if(this.bottomPosition.x < this.moveVars.beginNEndPositionX.begin){
                this.moveVars.wallVelocity.x *= -1;
              }
            }
          }
          walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
          if(addWallMov == 3){
            height = wallHeight;
            begWall = random()
            while((begWall >= begHole && begWall <= begHole + holesize) || begWall == .05 || begWall < .003 || begWall > .997 ||
            (begWall + holesize >= begHole && begWall + holesize <= begHole + holesize) || begWall + holesize > 1){
              begWall = random()
            }  
            bottomPosition = {x: begWall, y: floorLevel + (floorNum * mazeGap)};
            moveVars = false;
            insideMoveFun = function(){}
            walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
          }
        }
      }
      //*/
    }
  }
  
  createMoveFrame(floorLevel, numOfFrames){
    //let spacing1 = ((mazeGap * frameSize) * numOfFrames);
    //let spacing2 = floorLevel + (mazeGap * frameSize);
    //let spacing3 = (mazeGap * frameSize); // I think this one = .2 * 4 = .8 now is moveGap
    //spacing3 /= 3; // 1 frame = .26
    floorLevel += moveGap;
    //*
    for(let frameIndex = 0; frameIndex < numOfFrames; frameIndex++){
      this.createMoveRow(floorLevel + (frameIndex * (moveGap * frameSize)), moveGap, frameSize);
    }
    this.bottomOfFrame = floorLevel + ((moveGap * frameSize) * numOfFrames);
    //*/
    /* below is used for testing move frame boundaries
    let startPosition = {x: 0, y: floorLevel}; 
    let floorLength = .1;
    let moveVars = false;
    let insideMoveFun = function(){}
    floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
    
    startPosition = {x: .1, y: floorLevel +  (moveGap * 1)}; 
    floorLength = .1;
    moveVars = false;
    insideMoveFun = function(){}
    floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
    
    startPosition = {x: .2, y: floorLevel +  (moveGap * 2)}; 
    floorLength = .1;
    moveVars = false;
    insideMoveFun = function(){}
    floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
    
    startPosition = {x: .3, y: floorLevel +  (moveGap * 3)}; 
    floorLength = .1;
    moveVars = false;
    insideMoveFun = function(){}
    floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
    
    this.bottomOfFrame = floorLevel + (moveGap * 3);
    //*/
  }

  createMoveRow(floorLevel, moveGap, numOfFloors){
    let newFloorsSet = []
    let newFloorCoordR = []
    let newFloorCoordC = []
    // Index            0      1      2      3
    // FloorType:       0      1      1      2
    // FloorName:       V      H      H      S
    newFloorsSet.push(false, false, false, false);
    newFloorCoordR.push(-1, -1, -1, -1);
    newFloorCoordC.push(-1, -1, -1, -1);


    for(let i = 0; i < numOfFloors; i++){
      let coord = {r: Math.floor(Math.random() * 4), c: Math.floor(Math.random() * 3)}; // 0-3, 0-2
      let floorType = Math.floor(Math.random() * 3); // 0-2
      while((floorType == 0 && newFloorsSet[0]) || (floorType == 1 && newFloorsSet[2]) || (floorType == 2 && newFloorsSet[3])){
        floorType = Math.floor(Math.random() * 3);
      }

      if(floorType == 0 && !newFloorsSet[0]){
        while(newFloorsSet[3] && newFloorCoordC[3] == coord.c){
          coord.c = Math.floor(Math.random() * 3);
        }
        
        let floorLength = .25;
        let floorXPos = (coord.c * .33) + .16 - (floorLength / 2);
        let startPosition = {x: floorXPos, y: floorLevel + (coord.r * moveGap)}; 
        let floorVelocity = {x: 0, y: -.005};
        let beginNEndPosition = {begin: floorLevel, end: floorLevel + (moveGap * numOfFloors)};
        let moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
        let insideMoveFun = function(){
          this.moveVertically();
      
          if(this.startPosition.y < this.moveVars.beginNEndPosition.begin || this.startPosition.y > this.moveVars.beginNEndPosition.end){
            this.moveVars.floorVelocity.y *= -1;
          }
        }

        //console.log("created floor 1")
        floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
        newFloorsSet[0] = true;
        newFloorCoordC[0] = coord.c;
        newFloorCoordR[0] = coord.r;

      }else if(floorType == 1 && (!newFloorsSet[1] || !newFloorsSet[2])){        
        while((newFloorsSet[1] && newFloorCoordR[1] == coord.r) || (newFloorsSet[3] && newFloorCoordR[3] == coord.r)){
          coord.r = Math.floor(Math.random() * 4);
        }

        let floorLength = .25;
        let floorXPos = (coord.c * .33) + .16 - (floorLength / 2);
        let startPosition = {x: floorXPos, y: floorLevel + (coord.r * moveGap)}; 
        let floorVelocity = {x: 0.005, y: 0};
        if(newFloorsSet[1]) floorVelocity.x *= -1;
        let beginNEndPosition = {begin: 0, end: 1};
        let moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
        let insideMoveFun = function(){
          this.moveHorizontally();

          if(this.moveVars.floorVelocity.x > 0){
            if(this.startPosition.x + this.length > this.moveVars.beginNEndPosition.end){
              this.moveVars.floorVelocity.x *= -1;
              this.startPosition.x = (this.moveVars.beginNEndPosition.end - ((this.startPosition.x + this.length) - this.moveVars.beginNEndPosition.end)) - this.length;
            }
          }else if(this.moveVars.floorVelocity.x < 0){
            if(this.startPosition.x < this.moveVars.beginNEndPosition.begin){
              this.moveVars.floorVelocity.x *= -1;
              this.startPosition.x = this.moveVars.beginNEndPosition.begin + (this.moveVars.beginNEndPosition.begin - this.startPosition.x);
            }
          }
        }
        //console.log("created floor 2")
        floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
        if(newFloorsSet[1]){
          newFloorsSet[2] = true;
          newFloorCoordC[2] = coord.c;
          newFloorCoordR[2] = coord.r;
        }else{
          newFloorsSet[1] = true;
          newFloorCoordC[1] = coord.c;
          newFloorCoordR[1] = coord.r;
        }
      }else if(floorType == 2 && !newFloorsSet[3]){
        
        while((newFloorsSet[1] && newFloorCoordR[1] == coord.r) || (newFloorsSet[2] && newFloorCoordR[2] == coord.r)){
          coord.r = Math.floor(Math.random() * 4);
        }

        let floorLength = .25;
        let floorXPos = (coord.c * .33) + .16 - (floorLength / 2);
        let startPosition = {x: floorXPos, y: floorLevel + (coord.r * moveGap)}; 
        let moveVars = false;
        let insideMoveFun = function(){}

        //console.log("created floor 3")
        floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
        newFloorsSet[3] = true;
        newFloorCoordC[3] = coord.c;
        newFloorCoordR[3] = coord.r;
      }      
    }
    //console.log("FINISHED")

    /*
    for(let moveIndex = 0; moveIndex < numOfFloors; moveIndex++){
      let startPosition = {x: .3, y: floorLevel + (moveIndex * moveGap)}; 
      let floorLength = .4;
      let moveVars = false;
      let insideMoveFun = function(){}
      floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
    }
    //*/
  }
  
  createFloorsNWalls(floorLevel){

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

  displayScore(){
    this.displayGameBackground()
    brickCanvas.textSize(32);    
    brickCanvas.stroke(255,255,0);
    brickCanvas.text('Score', (((resolution.x - this.position.endX) / 2) + this.position.endX) , (resolution.y / 6))
    brickCanvas.text(Math.floor(gameScore), (((resolution.x - this.position.endX) / 2) + this.position.endX) , (resolution.y / 6) + 50)
    brickCanvas.noFill()    
  }

  scroll(ball){
    this.scrollPos += scrollSpeed;
    if(ball.ballPosition.y - this.scrollPos > heightOfGameScreen - .2){
      scrollSpeed += scrollAcc;
      scrollSpeed = Math.min(scrollSpeed, maxScrollSpeed);
    }else if(scrollSpeed > resetScrollSpeed){
      //console.log("scrolling back to speed")
      scrollSpeed -= scrollAcc;
      scrollSpeed = Math.max(scrollSpeed, resetScrollSpeed);
    }
  }

  deleteFloorsNWallsOffGame(){
    for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
      if(floors[floorIndex].startPosition.y - game.scrollPos <= 0 || floors[floorIndex].startPosition.y - game.scrollPos >= heightOfGameScreen){
       delete floors[floorIndex];
       floors.splice(floorIndex, 1);
       floorIndex--;
      }
    }
    for(let wallIndex = 0; wallIndex < walls.length; wallIndex++){
      if(walls[wallIndex].bottomPosition.y - game.scrollPos <= 0 || walls[wallIndex].bottomPosition.y - game.scrollPos >= heightOfGameScreen){
       delete walls[wallIndex];
       walls.splice(wallIndex, 1);
       wallIndex--;
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
  constructor(startPosition, length, moveVars, moveFunc){
    this.startPosition = {x: startPosition.x, y: startPosition.y};
    this.length = length;
    this.ball = false;
    this.moveFunc = moveFunc;
    if(moveVars){
      this.moveVars = moveVars;
    }else{
      this.moveVars = false;
    }
    this.prevPosition = false;
    this.hasWall = false;
    this.finishedPop = false;
  }
    
  moveVertically(){
    this.startPosition.y += this.moveVars.floorVelocity.y;
  }

  moveHorizontally(){
    if(this.moveVars.floorVelocity.x != 0){
      this.startPosition.x += this.moveVars.floorVelocity.x
    }
  }

  setBallOnFloor(ball){
    this.ball = ball;
    ball.onFloor = this;
    ball.ballVelocity.y = 0;
    ball.ballPosition.y = this.startPosition.y - (ball.ballDiameter / 2);
  }

  checkIfBallHitFloor(ball, nextBallPosition){
    if(nextBallPosition.x >= this.startPosition.x && nextBallPosition.x <= this.startPosition.x + this.length){
      if(ball.onFloor != this){
        if(ball.ballPosition.y  + (ball.ballDiameter / 2) <= this.prevPosition.y && nextBallPosition.y + (ball.ballDiameter / 2) >= this.startPosition.y && this.startPosition.y - game.scrollPos > -.2){
          return true;
        }else{
          return false;
        }
      }else{
        return true;
      }
    }else{
      return false;
    }
  }

  isSlowerFloor(ball, newFloor){
    if(ball.ballPosition.x >= newFloor.startPosition.x && ball.ballPosition.x <= newFloor.startPosition.x + newFloor.length && this != newFloor){
      if(newFloor.prevPosition.y >= this.prevPosition.y && newFloor.startPosition.y <= this.startPosition.y){
        return true;
      }else{
        return false;
      }
    }else{
      return false;
    }
  }

  doMovement(){
    this.prevPosition = {x: this.startPosition.x, y: this.startPosition.y};
    this.moveFunc();
  }

  playPopEffect(duration, numParticles, strength, position, scale){
    let particles = [];
    for(var i = 0; i < numParticles; i++){
      particles.push({position: {x: position.x, y: position.y}, 
                      velocity: {x: (Math.random() - 0.5) * strength * scale.x, y: Math.random() * strength * scale.y},
                      color: {r: Math.random() * 135 + 120, g: Math.random() * 135 + 120, b: Math.random() * 135 + 120}});
    }
    this.popEffect = {particles: particles, duration: duration};
  }
}

class wall{
  constructor(bottomPosition, height, moveVars, moveFunc){
    this.bottomPosition = {x: bottomPosition.x, y: bottomPosition.y};
    this.height = height;
    this.moveFunc = moveFunc;
    if(moveVars){
      this.moveVars = moveVars;
    }else{
      this.moveVars = false;
    }
    this.prevPosition = false;
    this.opp = {left: false, right: false};
    this.finishedPop = false;
  }

  moveVertically(){
    this.bottomPosition.y += this.moveVars.wallVelocity.y;
  }

  moveHorizontally(){
    if(this.moveVars.wallVelocity.x != 0){
      this.bottomPosition.x += this.moveVars.wallVelocity.x
    }
  }

  checkIfBallHitWallMovingLeft(prevPosition, ball){
    if(ball.ballPosition.y <= this.bottomPosition.y && ball.ballPosition.y + (ball.ballDiameter / 2) >= this.bottomPosition.y + this.height){
      let prevRightSideOfBall = prevPosition.x + (ball.ballDiameter / 2);
      let currRightSideOfBall =  ball.ballPosition.x + (ball.ballDiameter / 2);
      if((prevRightSideOfBall <= this.prevPosition.x - 1 && currRightSideOfBall >= this.bottomPosition.x - 1) ||
         (prevRightSideOfBall <= this.prevPosition.x && currRightSideOfBall >= this.bottomPosition.x && currRightSideOfBall <= 1) ||
         (prevRightSideOfBall <= this.prevPosition.x + 1 && currRightSideOfBall >= this.bottomPosition.x + 1)){
          console.log("WallMovingLeft1")
          return true;
      }else if(ball.onFloor && ball.onFloor.startPosition.x - ball.onFloor.prevPosition.x != 0){
        let floorMovement = ball.onFloor.startPosition.x - ball.onFloor.prevPosition.x;
        let prevRightSideOfBall = prevPosition.x + (ball.ballDiameter / 2) - floorMovement;
        let currRightSideOfBall =  ball.ballPosition.x + (ball.ballDiameter / 2) - floorMovement;
        if((prevRightSideOfBall <= this.prevPosition.x - 1 && currRightSideOfBall >= this.bottomPosition.x - 1) ||
           (prevRightSideOfBall <= this.prevPosition.x && currRightSideOfBall >= this.bottomPosition.x && currRightSideOfBall <= 1) ||
           (prevRightSideOfBall <= this.prevPosition.x + 1 && currRightSideOfBall >= this.bottomPosition.x + 1)){
            console.log("WallMovingLeft2")
            return true;
          }else{
            return false;
          }
      }else{
        return false;
      }
    }
  }

  checkIfBallHitWallMovingRight(prevPosition, ball){
    if(ball.ballPosition.y <= this.bottomPosition.y && ball.ballPosition.y + (ball.ballDiameter / 2) >= this.bottomPosition.y + this.height){
      //console.log(this.bottomPosition.y)
      let prevLeftSideOfBall = prevPosition.x - (ball.ballDiameter / 2);
      let currLeftSideOfBall = ball.ballPosition.x - (ball.ballDiameter / 2);
      if((prevLeftSideOfBall  >= this.prevPosition.x - 1 && currLeftSideOfBall  <= this.bottomPosition.x - 1) ||
         (prevLeftSideOfBall  >= this.prevPosition.x && currLeftSideOfBall  <= this.bottomPosition.x && currLeftSideOfBall >= 0) ||
         (prevLeftSideOfBall  >= this.prevPosition.x + 1 && currLeftSideOfBall  <= this.bottomPosition.x + 1)){
          console.log("WallMovingRight1")
          //console.log(prevLeftSideOfBall)
          //console.log(this.prevPosition.x)
          //console.log(currLeftSideOfBall)
          //console.log("Inside Bottom: " + this.bottomPosition.x)
          return true;
        }else if(ball.onFloor && ball.onFloor.startPosition.x - ball.onFloor.prevPosition.x != 0){
          console.log("WallMovingRight2")
          let floorMovement = ball.onFloor.startPosition.x - ball.onFloor.prevPosition.x;
          let prevLeftSideOfBall = prevPosition.x - (ball.ballDiameter / 2) - floorMovement;
          let currLeftSideOfBall = ball.ballPosition.x - (ball.ballDiameter / 2) - floorMovement;
          if((prevLeftSideOfBall >= this.prevPosition.x - 1 && currLeftSideOfBall <= this.bottomPosition.x - 1) ||
             (prevLeftSideOfBall >= this.prevPosition.x && currLeftSideOfBall <= this.bottomPosition.x && currLeftSideOfBall >= 0) ||
             (prevLeftSideOfBall >= this.prevPosition.x + 1 && currLeftSideOfBall <= this.bottomPosition.x + 1)){
              return true;
            }else{
              return false;
            }
        }else{
          return false;
        }
      }
    }

    checkIfBallHitWallVertically(prevPosition, ball){
      if(ball.ballPosition.x - (ball.ballDiameter / 2) < this.bottomPosition.x && ball.ballPosition.x + (ball.ballDiameter / 2) > this.bottomPosition.x){
        if(ball.ballPosition.y + (ball.ballDiameter / 2) >= this.bottomPosition.y + this.height &&
        prevPosition.y + (ball.ballDiameter / 2) <= this.bottomPosition.y - this.height && 
        ball.ballPosition.y - (ball.ballDiameter / 2) <= this.bottomPosition.y + this.height){
          return true;
        }
      }
      return false;
    }

  doMovement(){
    this.prevPosition = {x: this.bottomPosition.x, y: this.bottomPosition.y};
    this.moveFunc();
  }
  
  playPopEffect(duration, numParticles, strength, position, scale){
    let particles = [];
    for(var i = 0; i < numParticles; i++){
      particles.push({position: {x: position.x, y: position.y}, 
                      velocity: {x: (Math.random() - 0.5) * strength * scale.x, y: Math.random() * strength * scale.y},
                      color: {r: Math.random() * 135 + 120, g: Math.random() * 135 + 120, b: Math.random() * 135 + 120}});
    }
    this.popEffect = {particles: particles, duration: duration};
  }

  WallInsideBall(xPos, yPos, ballDiameter){
    if(yPos + (ballDiameter / 2) >= this.bottomPosition.y + this.height &&
       yPos - (ballDiameter / 2) <= this.bottomPosition.y &&
       xPos + (ballDiameter / 2)  >= this.bottomPosition.x && 
       xPos - (ballDiameter / 2)  <= this.bottomPosition.x
    ){
      return true;
    }
    return false;
  }
}

class ball{
  constructor(ballDiameter, ballStartPosition){
      this.ballDiameter = ballDiameter;
      this.prevPosition = {x: ballStartPosition.x, y: ballStartPosition.y};
      this.ballPosition = {x: ballStartPosition.x, y: ballStartPosition.y};
      this.ballVelocity = {x: 0, y: 0};
      this.onFloor = false;
      this.rotation = 0;
      this.totalBallRoll = 0;
      this.addFloorVelocity = {x: 0, y: 0};
      this.justGotBounce = 0;
      this.bounce = true;
      this.bounceFric = false;
      this.wallHit = {left: false, right: false, vertical: false};
      this.prevHit = {left: false, right: false}
      this.reflected = false;
      this.finishedPop = false;
      this.readyToJumpInc = 0;
  }

  moveHorizontally(nextXPosition){
    if(keyIsDown(LEFT_ARROW)){
      if(this.ballVelocity.x > -maxMoveSpeed){
        this.ballVelocity.x -= ballAcc;
      }

      if(this.ballVelocity.x > 0){
        this.ballVelocity.x -= ballAcc;
      }
      if(this.wallHit.right){
        this.ballVelocity.x = 0;
      }

    }else if(keyIsDown(RIGHT_ARROW)){
      if(this.ballVelocity.x < maxMoveSpeed){
        this.ballVelocity.x += ballAcc;
      }

      if(this.ballVelocity.x < 0){
        this.ballVelocity.x += ballAcc;
      }
      if(this.wallHit.left){
        this.ballVelocity.x = 0;
      }

    }else{
      if(this.onFloor){
        if(this.ballVelocity.x > 0){
          this.ballVelocity.x *= ballFric;
          this.ballVelocity.x -= ballFricConst;
          if(this.ballVelocity.x < 0){
            this.ballVelocity.x = 0;
          }
        }else if(this.ballVelocity.x < 0){
          this.ballVelocity.x *= ballFric;
          this.ballVelocity.x += ballFricConst;
          if(this.ballVelocity.x > 0){
            this.ballVelocity.x = 0;
          }
        }
      }else{//Less friction
        this.ballVelocity.x *= airFric;
      }
    }

    return nextXPosition += this.ballVelocity.x;
  }
  
  ifBallOutOfGame(nextXPosition){
    if(nextXPosition < 0){
      nextXPosition += 1;
      this.reflected = true;
    }else if(nextXPosition > 1){
      nextXPosition -= 1;
      this.reflected = true;
    }else{
      this.reflected = false;}
    return nextXPosition;
  }

  moveVertically(nextYPosition){
    if(!this.onFloor){//gravity
      this.ballVelocity.y += gravity;
      this.ballVelocity.y = Math.min(maxFallSpeed, this.ballVelocity.y);
      nextYPosition += this.ballVelocity.y;
    }
    return nextYPosition;
  }

  playBounceEffect(duration, numParticles, strength, position, scale){
    let particles = [];
    for(var i = 0; i < numParticles; i++){
      particles.push({position: {x: position.x, y: position.y}, 
                      velocity: {x: (Math.random() - 0.5) * strength * scale.x, y: Math.random() * strength * scale.y},
                      color: {r: Math.random() * 135 + 120, g: Math.random() * 135 + 120, b: Math.random() * 135 + 120}});
    }
    this.bounceEffect = {particles: particles, duration: duration};
  }

  playPopEffect(duration, numParticles, strength, position, scale){
    let particles = [];
    for(var i = 0; i < numParticles; i++){
      particles.push({position: {x: position.x, y: position.y}, 
                      velocity: {x: (Math.random() - 0.5) * strength * scale.x, y: Math.random() * strength * scale.y},
                      color: {r: Math.random() * 135 + 120, g: Math.random() * 135 + 120, b: Math.random() * 135 + 120}});
    }
    this.popEffect = {particles: particles, duration: duration};
  }

  bounceOnFloor(floor, nextBallPosition){
    let floorVelocity = {x: floor.startPosition.x - floor.prevPosition.x, y: floor.startPosition.y - floor.prevPosition.y};
    let relativeVal = {x: this.ballVelocity.x - floorVelocity.x, y: this.ballVelocity.y - floorVelocity.y};
    let absoluteVal = -relativeVal.y + floorVelocity.y;
    if(relativeVal.y > .009){
      nextBallPosition.y = floor.startPosition.y - (this.ballDiameter / 2);
      this.ballVelocity.y = (absoluteVal) * ((keyIsDown(UP_ARROW) && this.bounce) ? 1.1 : .5);
      if(keyIsDown(UP_ARROW) && this.bounce){
        this.playBounceEffect(60, 20, relativeVal.y, {x: nextBallPosition.x, y: floor.startPosition.y}, {x: 0.5, y: -0.3})
      }
      nextBallPosition.y += this.ballVelocity.y;
      this.ballVelocity.x = floorVelocity.x + (relativeVal.x * .5);
      nextBallPosition.x += this.ballVelocity.x;
      this.bounce = false;
    }else{
      floor.setBallOnFloor(this);
      nextBallPosition.y = this.ballPosition.y;
      this.bounce = true;
      this.justGotBounce = 80;
      this.readyToJump = false;
      this.readyToJumpInc = 0;
    }
  }

  doMovement(game, floors, walls){
    let nextBallPosition = {x: this.ballPosition.x, y: this.ballPosition.y};

    nextBallPosition.x = this.moveHorizontally(nextBallPosition.x);
    this.totalBallRoll = nextBallPosition.x - this.ballPosition.x;
    nextBallPosition.x = this.ifBallOutOfGame(nextBallPosition.x)

    nextBallPosition.y = this.moveVertically(nextBallPosition.y);
    
    let prevFloor = 0;
    if(this.onFloor){
      prevFloor = this.onFloor;
      this.readyToJumpInc++;
      if(keyIsDown(UP_ARROW) && this.readyToJumpInc > 20){
        this.ballVelocity.y = (this.onFloor.startPosition.y - this.onFloor.prevPosition.y) - .0125;
        this.playBounceEffect(60, 20, .03, {x: nextBallPosition.x, y: this.onFloor.startPosition.y}, {x: 0.5, y: -0.3})
        nextBallPosition.y += this.ballVelocity.y;
        this.readyToJumpInc = 0;
        this.onFloor = false;
        this.bounce = false;
      }else{
        let floorVelocity = {x: this.onFloor.startPosition.x - this.onFloor.prevPosition.x, y: this.onFloor.startPosition.y - this.onFloor.prevPosition.y};
        nextBallPosition.x += floorVelocity.x;
        nextBallPosition.y += floorVelocity.y;

        if(!this.onFloor.checkIfBallHitFloor(this, nextBallPosition)){
          this.ballVelocity.x += floorVelocity.x;
          this.ballVelocity.y += floorVelocity.y;
          this.onFloor.ball = false;
          this.onFloor = false;
        }
      }
    }
    if(!this.onFloor){
      let hitFloors = [];
      for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
        if(floors[floorIndex].checkIfBallHitFloor(this, nextBallPosition)){
          hitFloors.push(floors[floorIndex]);
        }
      }
      if(hitFloors[0]){
        let highestFloor = hitFloors[0];
        for(let floorIndex = 1; floorIndex < hitFloors.length; floorIndex++){
          if(hitFloors[floorIndex].startPosition.y < highestFloor.startPosition.y){
            highestFloor = hitFloors[floorIndex];
          }
        }
        if(prevFloor && prevFloor != highestFloor && highestFloor.startPosition.y == prevFloor.startPosition.y){
          highestFloor.setBallOnFloor(this);
          nextBallPosition.y = highestFloor.startPosition.y - (this.ballDiameter / 2);
        }else{
          this.bounceOnFloor(highestFloor, nextBallPosition);
        }
      }
    }
    
    this.prevPosition = {x: this.ballPosition.x, y: this.ballPosition.y};
    this.ballPosition.x = nextBallPosition.x;
    this.ballPosition.y = nextBallPosition.y;
    //this.rotation += ((40 * (totalBallRoll)) / (PI * this.ballDiameter)) * 2 * PI;
    //console.log("///////////////////////////")
  }

  regenerate(){
    this.prevPosition = {x: ballStartPosition.x, y: ballStartPosition.y};
    this.ballPosition = {x: ballStartPosition.x, y: ballStartPosition.y};
    this.ballVelocity = {x: 0, y: 0};
    this.onFloor = false;
    this.rotation = 0;
    this.addFloorVelocity = {x: 0, y: 0};
    this.justGotBounce = 0;
    this.bounce = true;
    this.bounceFric = false;
    this.wallHit = {left: false, right: false};
    this.reflected = false;
    this.finishedPop = false;
  }
}

function colorFunc(colorNum){
  colorNum = colorNum % 1529;
  if(colorNum <= 255){ //0 - 255
      return colors = {r: 255, g: colorNum, b: 0};
    }else if(colorNum <= 510){ // 256 - 510
      return colors = {r: 510 - colorNum, g: 255, b: 0};
    }else if (colorNum <= 765){ // 511 - 765
      return colors = {r: 0, g: 255, b: colorNum - 510};
    }else if(colorNum <= 1020){ //766 - 1020
      return colors = {r: 0, g: 1020 - colorNum, b: 255};
    }else if(colorNum <= 1275){ // 1021 - 1275
      return colors = {r: colorNum - 1020, g: 0, b: 255};
    }else if(colorNum <= 1529){ //1276 - 1529
      return colors = {r: 255, g: 0, b: 1529 - colorNum};
    }else{
      return colors = {r: 255, g: colorNum, b: 0};
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

  rainbowCanvas.show();
  brickCanvas.show();
  rainbowCanvas.style("z-index", "-5");
  brickCanvas.style("z-index", "3");
  rainbowCanvas.style("position", "absolute");
  brickCanvas.style("position", "absolute");

  angleMode(DEGREES);
  textAlign(CENTER);
  brickCanvas.textAlign(CENTER);
  textSize(64);

  game = new gameSystem(aspectRatio);
  g = new shortHand(game);
  heightOfGameScreen = game.heightOfGameScreen / game.widthOfGameScreen;

  game.drawRainbowCanvas();
  game.displayGameBackground();

  //gameBall = new ball(gameBallRatio, ballStartPosition);
  //game.generateGame(gameBall);
  //generatedGame = true;
  gameMode.maze = false;
  /*
  // Make function a function object to pass in with wall as well. Need to reconstruct allllll objects
  //Floor moving up, down, left, and right. Contains a beginning and end position. Stays in the game screen
  let startPosition = {x: 0, y: heightOfGameScreen};
  let floorVelocity = {x: 0.005, y: -.001};
  let beginNEndPositionX = {begin: 0.2, end: .8};
  let beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  let floorLength = .2;
  let moveVars = {floorVelocity: floorVelocity, beginNEndPositionX: beginNEndPositionX, beginNEndPosition: beginNEndPosition};
  let insideMoveFun = function(){
    this.moveVertically();

    this.moveHorizontally();
    
    if(this.startPosition.y <= this.moveVars.beginNEndPosition.begin || this.startPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.floorVelocity.y *= -1;
    }

    if(this.moveVars.floorVelocity.x > 0){
      if(this.startPosition.x + this.length > this.moveVars.beginNEndPositionX.end){
        this.moveVars.floorVelocity.x *= -1;
      }
    }else if(this.moveVars.floorVelocity.x < 0){
      if(this.startPosition.x < this.moveVars.beginNEndPositionX.begin){
        this.moveVars.floorVelocity.x *= -1;
      }
    }
  }
  floors.push(new floor(startPosition, floorLength, moveVars, insideMoveFun));
  
  let bottomPosition = {x: 0, y: heightOfGameScreen};
  wallVelocity = {x: 0.005, y: -.001};
  beginNEndPositionX = {begin: 0.2, end: .8};
  beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  moveVars = {wallVelocity: wallVelocity, beginNEndPositionX: beginNEndPositionX, beginNEndPosition: beginNEndPosition};
  let height = wallHeight;
  insideMoveFun = function(){
    this.moveVertically();

    this.moveHorizontally();
    
    if(this.bottomPosition.y <= this.moveVars.beginNEndPosition.begin || this.bottomPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.wallVelocity.y *= -1;
    }

    if(this.moveVars.wallVelocity.x > 0){
      if(this.bottomPosition.x + floorLength > this.moveVars.beginNEndPositionX.end){
        this.moveVars.wallVelocity.x *= -1;
      }
    }else if(this.moveVars.wallVelocity.x < 0){
      if(this.bottomPosition.x < this.moveVars.beginNEndPositionX.begin){
        this.moveVars.wallVelocity.x *= -1;
      }
    }
  }
  //walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
  
  bottomPosition = {x: floorLength, y: heightOfGameScreen};
  wallVelocity = {x: 0.005, y: -.001};
  beginNEndPositionX = {begin: floorLength + floorLength, end: .8};
  beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  moveVars = {wallVelocity: wallVelocity, beginNEndPositionX: beginNEndPositionX, beginNEndPosition: beginNEndPosition};
  height = wallHeight;
  insideMoveFun = function(){
    this.moveVertically();

    this.moveHorizontally();
    
    if(this.bottomPosition.y <= this.moveVars.beginNEndPosition.begin || this.bottomPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.wallVelocity.y *= -1;
    }

    if(this.moveVars.wallVelocity.x > 0){
      if(this.bottomPosition.x > this.moveVars.beginNEndPositionX.end){
        this.moveVars.wallVelocity.x *= -1;
      }
    }else if(this.moveVars.wallVelocity.x < 0){
      if(this.bottomPosition.x < this.moveVars.beginNEndPositionX.begin){
        this.moveVars.wallVelocity.x *= -1;
      }
    }    
  }
 // walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));

  //Floor moving only left and right with a beginning and end position
  startPosition = {x: 0, y: heightOfGameScreen / 2};
  floorVelocity = {x: 0.005, y: 0};
  beginNEndPosition = {begin: 0.2, end: .8};
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  insideMoveFun = function(){
    this.moveHorizontally();

    if(this.moveVars.floorVelocity.x > 0){
      if(this.startPosition.x + this.length > this.moveVars.beginNEndPosition.end){
        this.moveVars.floorVelocity.x *= -1;
        this.startPosition.x = (this.moveVars.beginNEndPosition.end - ((this.startPosition.x + this.length) - this.moveVars.beginNEndPosition.end)) - this.length;
      }
    }else if(this.moveVars.floorVelocity.x < 0){
      if(this.startPosition.x < this.moveVars.beginNEndPosition.begin){
        this.moveVars.floorVelocity.x *= -1;
        this.startPosition.x = this.moveVars.beginNEndPosition.begin + (this.moveVars.beginNEndPosition.begin - this.startPosition.x);
      }
    }
  }
  floors.push(new floor(startPosition, .2, moveVars, insideMoveFun));

  //Floor on top left corner to test ball
  startPosition = {x: -1, y: .2};
  floorVelocity = {x: 0, y: 0}; //.005
  beginNEndPosition = false;
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  insideMoveFun = function(){

    this.moveHorizontally();

    if(this.startPosition.x + 3 >= 2.5 || this.startPosition.x <= -1.5){
      this.moveVars.floorVelocity.x *= -1;
    }
  }
  floors.push(new floor(startPosition, 3, moveVars, insideMoveFun));
  
  bottomPosition = {x: .2, y: .2};
  wallVelocity = {x: 0.005, y: 0};
  beginNEndPosition = {begin: 0, end: 1};
  moveVars = {wallVelocity: wallVelocity, beginNEndPosition: beginNEndPosition};
  height = wallHeight;
  insideMoveFun = function(){

    this.moveHorizontally();

    if(this.moveVars.wallVelocity.x > 0){
      if(this.bottomPosition.x > this.moveVars.beginNEndPosition.end){
        this.moveVars.wallVelocity.x *= -1;
      }
    }else if(this.moveVars.wallVelocity.x < 0){
      if(this.bottomPosition.x <= this.moveVars.beginNEndPosition.begin){
        this.moveVars.wallVelocity.x *= -1;
      }
    }
  }
  walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));

  //Floor on right side that moves only vertically. Is created to test ball
  startPosition = {x: .8, y: heightOfGameScreen};
  floorVelocity = {x: 0, y: -.005};
  beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  insideMoveFun = function(){
    this.moveVertically();

    if(this.startPosition.y <= this.moveVars.beginNEndPosition.begin || this.startPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.floorVelocity.y *= -1;
    }
  }
  floors.push(new floor(startPosition, .2, moveVars, insideMoveFun));
  
  //Floor on right side that moves only vertically. Is created to test ball
  startPosition = {x: .8, y: .1};
  floorVelocity = {x: 0, y: .005};
  beginNEndPosition = {begin: 0, end: heightOfGameScreen};
  moveVars = {floorVelocity: floorVelocity, beginNEndPosition: beginNEndPosition};
  insideMoveFun = function(){
    this.moveVertically();

    if(this.startPosition.y <= this.moveVars.beginNEndPosition.begin || this.startPosition.y >= this.moveVars.beginNEndPosition.end){
      this.moveVars.floorVelocity.y *= -1;
    }    
  }
  floors.push(new floor(startPosition, .2, moveVars, insideMoveFun));
  
  bottomPosition = {x: 0.2, y: heightOfGameScreen};
  wallVelocity = {x: 0, y: 0};
  beginNEndPosition = {begin: 0, end: 0};
  moveVars = {wallVelocity: wallVelocity, beginNEndPosition: beginNEndPosition};
  height = -heightOfGameScreen + .2;
  insideMoveFun = function(){}
  walls.push(new wall(bottomPosition, height, moveVars, insideMoveFun));
  //*/
}

draw = function(){
  if (frame == 360){
      frame = 0;
  }
  background(colors.r, colors.g, colors.b);

  game.displayGameScreen();

  if(!generatedGame && !(gameMode.maze || gameMode.both || gameMode.fall)){
    textSize(32);
    stroke(255,255,0);
    text('Select Game Mode', resolution.x / 2, (resolution.y / 3))
    noFill()
    let fullText = 'Maze     Both     Hop';
    let fullTextWidth = textWidth(fullText)
    if(mouseX >=  (resolution.x / 2) - (fullTextWidth / 2) - (textWidth('Maze') / 2) && mouseX <= (resolution.x / 2) - (fullTextWidth / 2) + (textWidth('Maze') / 2) && mouseY >= (resolution.y / 2.25) - 32 && mouseY <= (resolution.y / 2.25)){
      fill(247, 82, 121)
      if(mouseIsPressed){
        gameMode.maze = true;
      }
    }
    text('Maze', (resolution.x / 2) - (fullTextWidth / 2), (resolution.y / 2.25))
    noFill()
    if(mouseX >= (resolution.x / 2) - (textWidth('Both') / 2) && mouseX <= (resolution.x / 2) + (textWidth('Both') / 2) && mouseY >= (resolution.y / 2.25) - 32 && mouseY <= (resolution.y / 2.25)){
      fill(247, 82, 121)
      if(mouseIsPressed){
        gameMode.both = true;
      }
    }
    text('Both', resolution.x / 2, (resolution.y / 2.25))
    noFill()
    if(mouseX >= (resolution.x / 2) + (fullTextWidth / 2) - (textWidth('Hop') / 2) && mouseX <= (resolution.x / 2) + (fullTextWidth / 2) + (textWidth('Hop') / 2) && mouseY >= (resolution.y / 2.25) - 32 && mouseY <= (resolution.y / 2.25)){
      fill(247, 82, 121)
      if(mouseIsPressed){
        gameMode.fall = true;
      }
    }
    text('Hop', (resolution.x / 2) + (fullTextWidth / 2), (resolution.y / 2.25))
    noFill()
    if(gameMode.maze || gameMode.both || gameMode.fall){
      gameBall = new ball(gameBallRatio, ballStartPosition);
      game.generateGame(gameBall);
      generatedGame = true;
    }
  }

  if(generatedGame && (gameMode.maze || gameMode.both || gameMode.fall)){
    for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
      if(!popGame){
        floors[floorIndex].doMovement(gameBall);
        if(floors[floorIndex].startPosition.y - game.scrollPos <= -.9){
          delete floors[floorIndex];
          floors.splice(floorIndex, 1);
          floorIndex--;
        }else{
          game.displayFloor(floors[floorIndex]);
        }
      }else{
        if(!floors[floorIndex].finishedPop){
          game.displayFloor(floors[floorIndex]);
        }
      }
    }
  
    if(gameBall.onFloor){
      for(let floorIndex = 0; floorIndex < floors.length && !popGame; floorIndex++){
        if(gameBall.onFloor.isSlowerFloor(gameBall, floors[floorIndex])){
          gameBall.onFloor.ball = false;
          floors[floorIndex].setBallOnFloor(gameBall);
          gameBall.ballPosition.y -= floors[floorIndex].startPosition.y - floors[floorIndex].prevPosition.y;
          this.bounce = true;
        }
      }
    }
  
    if(!popGame){      
      if(game.bottomOfFrame - game.scrollPos <= heightOfGameScreen - (mazeGap / 2)){
        if(gameMode.maze){
          game.createMazeFrame(game.bottomOfFrame + mazeGap, 1);
        }else if(gameMode.both){
          let randFrame = (Math.floor(Math.random() * 2));
          if(randFrame){
            game.createMazeFrame(game.bottomOfFrame + (game.prevFrame.maze ? mazeGap : moveGap), 1);
            game.prevFrame.maze = true;
          }else{
            game.createMoveFrame(game.bottomOfFrame, 1);
            game.prevFrame.maze = false;
          }
        }else{
          game.createMoveFrame(game.bottomOfFrame, 1);
        }
      }      
      gameBall.doMovement(game, floors, walls);
    } 
  
    if(gameBall.wallHit.left){
      gameBall.prevHit.left = true;
    }else{
      gameBall.prevHit.left = false;
    }
    if(gameBall.wallHit.right){
      gameBall.prevHit.right = true;
    }else{
      gameBall.prevHit.right = false;
    }
    gameBall.wallHit = {left: 0, right: 0, vertical: 0};
    let wallsTouched = {left: 0, right: 0};

    for(let wallIndex = 0; wallIndex < walls.length; wallIndex++){
      if(!popGame){
        walls[wallIndex].doMovement();
        //*
        if(walls[wallIndex].WallInsideBall(gameBall.ballPosition.x, gameBall.ballPosition.y, gameBall.ballDiameter)){
          if(gameBall.ballPosition.x > walls[wallIndex].bottomPosition.x){
            //console.log("added 1")
            if((gameBall.wallHit.left && (gameBall.wallHit.left.bottomPosition.x - gameBall.wallHit.left.prevPosition.x) == 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) < 0) ||
              (gameBall.wallHit.left && (gameBall.wallHit.left.bottomPosition.x - gameBall.wallHit.left.prevPosition.x) > 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) == 0) ||
              (gameBall.wallHit.left && (gameBall.wallHit.left.bottomPosition.x - gameBall.wallHit.left.prevPosition.x) > 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) < 0)){
                //console.log("INSIDE 1")
                gameBall.ballVelocity.x = 0;
                gameBall.ballVelocity.y = 0;
            }else{
              gameBall.totalBallRoll -= gameBall.ballPosition.x - (walls[wallIndex].bottomPosition.x + (gameBall.ballDiameter / 2));
              gameBall.ballPosition.x =  walls[wallIndex].bottomPosition.x + (gameBall.ballDiameter / 2);
              gameBall.wallHit.right = walls[wallIndex];
              wallsTouched.right++;
            }
          }else{
            //console.log("added 2")
            if((gameBall.wallHit.right && (gameBall.wallHit.right.bottomPosition.x - gameBall.wallHit.right.prevPosition.x) == 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) > 0) ||
            (gameBall.wallHit.right && (gameBall.wallHit.right.bottomPosition.x - gameBall.wallHit.right.prevPosition.x) < 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) == 0) ||
            (gameBall.wallHit.right && (gameBall.wallHit.right.bottomPosition.x - gameBall.wallHit.right.prevPosition.x) < 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) > 0)){
              //console.log("INSIDE 2")
              gameBall.ballVelocity.x = 0;
              gameBall.ballVelocity.y = 0;
            }else{
              gameBall.totalBallRoll -= gameBall.ballPosition.x - (walls[wallIndex].bottomPosition.x - (gameBall.ballDiameter / 2));
              gameBall.ballPosition.x =  walls[wallIndex].bottomPosition.x - (gameBall.ballDiameter / 2);
              gameBall.wallHit.left = walls[wallIndex];
              wallsTouched.left++;
            }
          }
        }else if(gameBall.ballPosition.x - (gameBall.ballDiameter / 2) < 0){
          //console.log("inside here 1")
          if(walls[wallIndex].WallInsideBall(1 + gameBall.ballPosition.x, gameBall.ballPosition.y, gameBall.ballDiameter)){
            //console.log("inside again 1")
            if((gameBall.wallHit.left && (gameBall.wallHit.left.bottomPosition.x - gameBall.wallHit.left.prevPosition.x) == 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) < 0) ||
               (gameBall.wallHit.left && (gameBall.wallHit.left.bottomPosition.x - gameBall.wallHit.left.prevPosition.x) > 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) == 0) ||
               (gameBall.wallHit.left && (gameBall.wallHit.left.bottomPosition.x - gameBall.wallHit.left.prevPosition.x) > 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) < 0)){
              //console.log("INSIDE 11")
              gameBall.ballVelocity.x = 0;
              gameBall.ballVelocity.y = 0;
            }else{
              gameBall.totalBallRoll -= (gameBall.ballPosition.x + 1) - (walls[wallIndex].bottomPosition.x + (gameBall.ballDiameter / 2));
              gameBall.ballPosition.x =  (walls[wallIndex].bottomPosition.x + (gameBall.ballDiameter / 2)) - 1;
              gameBall.wallHit.right = walls[wallIndex];
              wallsTouched.right++;
            }
          }
        }else if(gameBall.ballPosition.x + (gameBall.ballDiameter / 2) > 1){
          //console.log("inside here 2")
          if(walls[wallIndex].WallInsideBall(gameBall.ballPosition.x - 1, gameBall.ballPosition.y, gameBall.ballDiameter)){
            //console.log("inside again 2")
            if((gameBall.wallHit.right && (gameBall.wallHit.right.bottomPosition.x - gameBall.wallHit.right.prevPosition.x) == 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) > 0) ||
               (gameBall.wallHit.right && (gameBall.wallHit.right.bottomPosition.x - gameBall.wallHit.right.prevPosition.x) < 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) == 0) ||
               (gameBall.wallHit.right && (gameBall.wallHit.right.bottomPosition.x - gameBall.wallHit.right.prevPosition.x) < 0 && (walls[wallIndex].bottomPosition.x - walls[wallIndex].prevPosition.x) > 0)){
              //console.log("INSIDE 22")
              gameBall.ballVelocity.x = 0;
              gameBall.ballVelocity.y = 0;
            }else{
              gameBall.totalBallRoll -= (gameBall.ballPosition.x - 1) - (walls[wallIndex].bottomPosition.x - (gameBall.ballDiameter / 2));
              gameBall.ballPosition.x =  (walls[wallIndex].bottomPosition.x - (gameBall.ballDiameter / 2)) + 1;
              gameBall.wallHit.left = walls[wallIndex];
              wallsTouched.left++;
            }
          }
        }
        //*/
        if(walls[wallIndex].bottomPosition.y - game.scrollPos <= -.1){
          delete walls[wallIndex];
          walls.splice(wallIndex, 1);
          wallIndex--;
        }else{
          game.displayWall(walls[wallIndex]);
        }
      }else{
        if(!walls[wallIndex].finishedPop){
          game.displayWall(walls[wallIndex]);
        }
      }
    }

    if(wallsTouched.left > 0 && wallsTouched.right > 0){
      console.log("FINAL")
      game.fall = true;
      popGame = true;
      game.deleteFloorsNWallsOffGame();
      popNextF = floors.length - 1;
      game.popThing(gameBall, "ball");
    }
    
    if(!popGame){
      //console.log("left: " + wallsTouched.left + " right: " + wallsTouched.right)
      gameBall.finishedPop = false;
      gameBall.rotation += ((40 * (gameBall.totalBallRoll)) / (PI * gameBall.ballDiameter)) * 2 * PI;
      game.displayBall(gameBall);
      game.scroll(gameBall);
    }else{
      if(!gameBall.finishedPop){
        //console.log("displaying pop")
        game.displayBall(gameBall);
      }
    }
  
    if(((gameBall.ballPosition.y + gameBall.ballDiameter - game.scrollPos <= 0 && gameBall.onFloor)|| gameBall.ballPosition.y - gameBall.ballDiameter - game.scrollPos >= heightOfGameScreen) && !popGame){
      game.fall = true;
      popGame = true;
      game.deleteFloorsNWallsOffGame();
      popNextF = floors.length - 1;
    }
  
    if(game.fall || popGame){
      //game.gameFall(gameBall, floors, walls);
      if(!poppedGame){
        if(gameBall.ballPosition.y - game.scrollPos <= 0 || gameBall.ballPosition.y - game.scrollPos >= heightOfGameScreen){
          gameBall.finishedPop = true;
        }

        if(popNextF < 0){
          poppedGame = true;
        }else{
          if(popNextFloor == 45){
            while(popNextF >= 0 && (floors[popNextF].popEffect || floors[popNextF].finishedPop)){
              popNextF--;
            }
            if(popNextF < 0){
              poppedGame = true;
            }else{
              let tempPopNextF = popNextF;
              for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
                if(floors[floorIndex].startPosition.y > floors[tempPopNextF].startPosition.y && !(floors[floorIndex].popEffect || floors[floorIndex].finishedPop)){
                  tempPopNextF = floorIndex;
                }
              }

              game.popThing(floors[tempPopNextF], "floor");
              for(let floorIndex = 0; floorIndex < floors.length; floorIndex++){
                if(floors[floorIndex].startPosition.y == floors[tempPopNextF].startPosition.y && !(floors[floorIndex].popEffect || floors[floorIndex].finishedPop)){
                  game.popThing(floors[floorIndex], "floor");
                }
              }
              for(let wallIndex = 0; wallIndex < walls.length; wallIndex++){
                if(walls[wallIndex].bottomPosition.y == floors[tempPopNextF].startPosition.y && !(walls[wallIndex].popEffect || walls[wallIndex].finishedPop)){
                  game.popThing(walls[wallIndex], "wall");
                }
              }
              popNextFloor = 0;
            }
          }
        }
        popNextFloor++;
      }
      
  
      textSize(32);
      stroke(255,255,0);
      text('Game Over', resolution.x / 2, (resolution.y / 3))
      if((mouseX >= (resolution.x / 2) - (textWidth('Retry') / 2) && mouseX <= (resolution.x / 2) + (textWidth('Retry') / 2) && mouseY >= (resolution.y / 1.5) - 32 && mouseY <= (resolution.y / 1.5)) || keyIsDown(DOWN_ARROW)){
        fill(247, 82, 121)
        if(mouseIsPressed || keyIsDown(DOWN_ARROW)){
          game.generateGame(gameBall);
          game.fall = false;
          popGame = false;
          poppedGame = false;
          game.prevFrame.maze = false;
          popNextFloor = 0;
        }
      }
      text('Retry', resolution.x / 2, (resolution.y / 1.5))
      noFill()
      
      if(mouseX >= (resolution.x / 2) - (textWidth('Change Mode') / 2) && mouseX <= (resolution.x / 2) + (textWidth('Change Mode') / 2) && mouseY >= (resolution.y / 1.25) - 32 && mouseY <= (resolution.y / 1.25)){
        fill(247, 82, 121)
        if(mouseIsPressed){
          generatedGame = false;
          game.fall = false;
          popGame = false;
          poppedGame = false;
          game.prevFrame.maze = false;
          gameMode.maze = false;
          gameMode.both = false;
          gameMode.fall = false;
          delete gameBall;
          popNextFloor = 0;
        }
      }
      text('Change Mode', (resolution.x / 2), (resolution.y / 1.25))
      noFill()

      game.displayGameBackground()
      text('Score',resolution.x / 2, (resolution.y / 2.25))
      fill(247, 82, 121)
      text(Math.floor(gameScore), resolution.x / 2, (resolution.y / 2))
      noFill()
    }else{
      let ballDiff = 0;
      if(gameBall.prevPosition.y < gameBall.ballPosition.y && furthestY < gameBall.ballPosition.y){
        ballDiff = gameBall.ballPosition.y - gameBall.prevPosition.y;
        furthestY = gameBall.ballPosition.y;
      }
      gameScore += ballDiff * scoreMult;
      game.displayScore();
    }
  }

  //delete floors[index];
  //floors.splice(index, 1)

  frame++;
}

/*
http://localhost:8000/main.html
*/
