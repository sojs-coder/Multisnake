const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.use(express.static('static'));
var snakes =[];
var apple = [10,10];
var gamesStarted = false;
var blocks = [];
var points_to_next_obs = 20;
var base_points_to_next_obs = 20;

io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('joining',(data)=>{
    var id = snakes.length;
    io.emit('joined',id);
    snakes.push({
      "blocks": [[2,2]],
      "id": id,
      "score":0,
      "eating":false,
      "dir":2,
      "username":data.name,
      "speed":1
    });
    if(!gamesStarted){
      gamesStarted = true;
      initGame();
    }
  });
  socket.on('speed',(data)=>{
    if(snakes[data.id] !== "dead_snake" && snakes[data.id]){
      snakes[data.id].speed = (data.press) ? 2 : 1;
      
    }
  })
  
  socket.on('direction',(data)=>{
    if(snakes[data.id] !== "dead_snake" && snakes[data.id]){
      snakes[data.id].dir = data.dir;
    }
  })
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  
});
function initGame(){
    var delta = new Date().getTime();
    movePlayers();
    checkwin();
    sendBoard();
    var delta2 = new Date().getTime();
    var delta3 = delta2-delta;
    console.log(250-delta3);
    if(gamesStarted){
      setTimeout(initGame, Math.max(250-delta3,10));
    }
  }
  function checkwin(){
    snakes.forEach((snake,id)=>{
      if(snake !== 'dead_snake'){
      snake = snake.blocks;
      var snakeHead = snake[0];
      var dead = false;
      var win = false;
      if(
        snakeHead[0] > 23 || snakeHead[0] < 1 ||
        snakeHead[1] > 23 || snakeHead[1] < 1 
        ){
        dead = true;
      }

      snake.forEach((snakeBlock, i)=>{
        if(i !== 0){
          if(snakeBlock[0] == snakeHead[0] && snakeBlock[1] == snakeHead[1]){
              dead = true;
          }
        }
      });
      blocks.forEach((block, i)=>{
        if(block[0] == snakeHead[0] && block[1] == snakeHead[1]){
           dead = true;
        }
        
      });
      if(snakes[id].score == 50 && !win){
        win = true
      }
      snakes.forEach((otherSnake)=>{
        if(otherSnake.blocks){
          if(otherSnake.id !== id){
            otherSnake.blocks.forEach((enemyBlock,enemyBlockNumber)=>{
              if(enemyBlockNumber == 0 && enemyBlock[0] == snakeHead[0] && enemyBlock[1] == snakeHead[1]){
                dead = true;
                io.emit('death',otherSnake.id);
                snakes.splice(otherSnake.id,1,'dead_snake');
              }else if(enemyBlock[0] == snakeHead[0] && enemyBlock[1] == snakeHead[1]){
                dead = true;
              }
            })
          }
        }
      });
      if(apple[0] == snakeHead[0] && apple[1] == snakeHead[1]){
        snakes[id].score +=1;
        var newAppleX, newAppleY;
        var applepos = getNewApplePos();
        
        apple = applepos;
        if(points_to_next_obs == 0){
          spawnBlock();
          points_to_next_obs = base_points_to_next_obs
        }else{
          points_to_next_obs -=1;
        }
        snakes[id].eating = true;
      }
      if(dead == true){
        io.emit('death',id);
        snakes.splice(id,1,'dead_snake');
      }else if(win == true){
        io.emit('win',snakes[id]);
        gamesStarted = false;

        snakes = [];
      }
      }
    });
    
  }
  function getNewApplePos(){
    var newAppleX = Math.round((Math.random() * (23 - 1)) + 1);
    var newAppleY = Math.round((Math.random() * (23 - 1)) + 1);
    if(is_block_occupied([newAppleX,newAppleY])){
       return getNewApplePos()
    }else{
      return [newAppleX,newAppleY]
    }
    
  }
  function movePlayers(){
    snakes.forEach((snake,id)=>{
      if(snake !== "dead_snake"){
      var dir = snake.dir;
      var toPop = 0;
      if(snake.speed > 1){
        console.log('speeding...')
        if(snake.blocks.length > 1){
          console.log('legal')
          snakes[id].score -= 1;
          toPop++;
        }else{
          console.log('ilegal')
          snakes[id].speed = 1;
          snake.speed = 1;
        }
      }
      toPop += snake.speed;
      var speed = snake.speed;
      var snake = snake.blocks;
      
      switch (dir){
        case 1:
        
          
          
          for(var i = 0; i < speed; i++){
            var snakeHead = snakes[id].blocks[0];
            var newCoordsX = snakeHead[0];
            var newCoordsY = snakeHead[1];
            newCoordsY -= 1;
            snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
          }
          for(var i = 0; i < toPop; i++){
            if(!snakes[id].eating){
              snakes[id].blocks.pop();
            }else{
              snakes[id].eating = false;
            }
            
          }
          
          break;
        case 2:
        
          for(var i = 0; i < speed; i++){
            var snakeHead = snakes[id].blocks[0];
            var newCoordsX = snakeHead[0];
            var newCoordsY = snakeHead[1];
            newCoordsX += 1;
            snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
          }
          for(var i = 0; i < toPop; i++){
            if(!snakes[id].eating){
              snakes[id].blocks.pop();
            }else{
              snakes[id].eating = false;
            }
            
          }
          
          break;
        case 3:
          
          for(var i = 0; i < speed; i++){
            var snakeHead = snakes[id].blocks[0];
            var newCoordsX = snakeHead[0];
            var newCoordsY = snakeHead[1];
            newCoordsY += 1;
            snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
          }
          for(var i = 0; i < toPop; i++){
            if(!snakes[id].eating){
              snakes[id].blocks.pop();
            }else{
              snakes[id].eating = false;
            }
            
          }
          
          break;
        case 4:
          for(var i = 0; i < speed; i++){
            var snakeHead = snakes[id].blocks[0];
            var newCoordsX = snakeHead[0];
            var newCoordsY = snakeHead[1];
            newCoordsX -= 1;
            snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
          }
          for(var i = 0; i < toPop; i++){
            if(!snakes[id].eating){
              snakes[id].blocks.pop();
            }else{
              snakes[id].eating = false;
            }
            
          }
          
          break;
      }
      } 
    });
  }

function spawnBlock(){
  if(odds(0.5)){
    var side = Math.round(Math.random()*3);
    if(!blocks[0]){
      var blockX = Math.round((Math.random() * (23 - 1)) + 1);
      var blockY = Math.round((Math.random() * (23 - 1)) + 1);
      blocks.push([blockX,blockY])
    }else{
        var pickedblock = blocks[Math.floor(Math.random()*blocks.length)];
      var newblock = [];
      switch(side){
        case 0:
          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[1]-1);
          if(!is_block_occupied([newblock[0],newblock[1]])){
          blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock()
          }
          break;
        case 1:

          newblock[0] = scale2board(pickedblock[0]+1);
          newblock[1] = pickedblock[1];
          if(!is_block_occupied([newblock[0],newblock[1]])){
          blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock()
          }
          break;
        case 2:
          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[1]+1);
          if(!is_block_occupied([newblock[0],newblock[1]])){
          blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock()
          }
          break;
        case 3:

          newblock[0] = scale2board(pickedblock[0]-1);
          newblock[1] = pickedblock[1];
          if(!is_block_occupied([newblock[0],newblock[1]])){
          blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock()
          }
          break;
      }
    }
  }else{
    var blockX = Math.round((Math.random() * (23 - 1)) + 1);
    var blockY = Math.round((Math.random() * (23 - 1)) + 1);
    if(!is_block_occupied[blockX,blockY]){
      blocks.push([blockX,blockY])
    }else{
      spawnBlock()
    }
  }
}
function scale2board(number){
  return Math.min(Math.max(1,number),23)
}
function odds(odd){
  return (Math.random() < odd)
}
  function sendBoard(){
    io.emit('board',{
      "snakes":snakes,
      "apple":apple,
      "walls":blocks
    });
  }
function is_block_occupied(target){
  var foundblocks = blocks.find((elem)=>{
    return (target[0] == elem[0] && target[1] == elem[1]) || (target[0] == apple[0] && target[1]==apple[1]);
  });
  return (foundblocks) ? true : false;
}




app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/play',(req,res)=>{
  res.sendFile(__dirname + '/play.html');
});
server.listen(3000, () => {
  console.log('listening on *:3000');
});
