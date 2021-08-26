const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.use(express.static('static'));
var gamesStarted = false;

var rooms = {
  "public":{
    "snakes":['dead_snake'],
    "blocks":[],
    "apple":[10,10],
    "started":false,
    "points_to_next_obs": 20,
    "base_points_to_next_obs":20
  }
}
function getName(){
  return "Multisnake"
}
io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('joining',(data)=>{
    
    var roomtojoin = (data) ? data.room || "public" : "public";
    var username = (data) ? data.name || getName() : getName();
    if(rooms[roomtojoin]){
      socket.join(roomtojoin)
      var id = rooms[roomtojoin].snakes.length;
      rooms[roomtojoin].snakes.push({
        "blocks": [[2,2]],
        "id": id,
        "score":0,
        "eating":false,
        "dir":2,
        "username": username,
        "speed":1
      });
      io.emit('joined',id);
    }else{
      rooms[roomtojoin] = {
        "snakes":['dead_snake'],
        "blocks":[],
        "apple":[10,10],
        "started":false,
        "points_to_next_obs": 20,
        "base_points_to_next_obs":20
      }
      socket.join(roomtojoin)
      var id = rooms[roomtojoin].snakes.length;
      rooms[roomtojoin].snakes.push({
        "blocks": [[2,2]],
        "id": id,
        "score":0,
        "eating":false,
        "dir":2,
        "username":data.name,
        "speed":1
      });
      io.emit('joined',id);
    }
    
    if(!rooms["public"].started){
      rooms[roomtojoin].started = true;
      initGame();
    }
  });
  socket.on('speed',(data)=>{
    var room = (data) ? data.room || "public" : "public";
    var id = (data) ?  data.id  || " " : " ";
    var press = (data) ? (data.press || false) : false;
    if(rooms[room]){
      if(rooms[room].snakes[id]){
        if(rooms[room].snakes[id] !== "dead_snake" && rooms[room].snakes[id]){
          rooms[room].snakes[id].speed = (press) ? 2 : 1;
          
        }
      }
    }
    
  })
  
  socket.on('direction',(data)=>{
    var room = (data) ? data.room || "public" : "public";
    var id = (data) ? data.id || " " : " ";
    var dir = (data) ? data.dir || 1 : 1;
    if(rooms[room]){
      if(rooms[room].snakes[id]){
        if(rooms[data.room].snakes[data.id] !== "dead_snake" && rooms[data.room].snakes[data.id]){
          rooms[data.room].snakes[data.id].dir = data.dir;
        }
      }
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
    clearWinBoard();
    var delta2 = new Date().getTime();
    var delta3 = delta2-delta;
    setTimeout(initGame, Math.max(250-delta3,10));
  }
  function checkwin(){
    var rooms1 = json2array(rooms);
    rooms1.forEach((room)=>{
      rooms[room.key].snakes.forEach((snake,id)=>{
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
          rooms[room.key].blocks.forEach((block, i)=>{
            if(block[0] == snakeHead[0] && block[1] == snakeHead[1]){
              dead = true;
            }
            
          });
          if(rooms[room.key].snakes[id].score == 15 && !win){
            io.to(room.key).emit('win',rooms[room.key].snakes[id]);
            gamesStarted = false;
            rooms[room.key].win = true
          }
          rooms[room.key].snakes.forEach((otherSnake)=>{
            if(otherSnake.blocks){
              if(otherSnake.id !== id){
                otherSnake.blocks.forEach((enemyBlock,enemyBlockNumber)=>{
                  if(enemyBlockNumber == 0 && enemyBlock[0] == snakeHead[0] && enemyBlock[1] == snakeHead[1]){
                    dead = true;
                    io.emit('death',otherSnake.id);
                    rooms[room.key].snakes.splice(otherSnake.id,1,'dead_snake');
                  }else if(enemyBlock[0] == snakeHead[0] && enemyBlock[1] == snakeHead[1]){
                    dead = true;
                  }
                })
              }
            }
          });
          if(rooms[room.key].apple[0] == snakeHead[0] && rooms[room.key].apple[1] == snakeHead[1]){
            rooms[room.key].snakes[id].score +=1;
            var newAppleX, newAppleY;
            var applepos = getNewApplePos(room.key);
            
            rooms[room.key].apple = applepos;
            if(rooms[room.key].points_to_next_obs == 0){
              spawnBlock(room.key);
              rooms[room.key].points_to_next_obs = rooms[room.key].base_points_to_next_obs
            }else{
              rooms[room.key].points_to_next_obs -=1;
            }
            rooms[room.key].snakes[id].eating = true;
          }
          if(dead == true){
            io.to(room.key).emit('death',id);
            rooms[room.key].snakes.splice(id,1,'dead_snake');
          }
          }
        });
    })
    
    
  }
  function getNewApplePos(room){
    var newAppleX = Math.round((Math.random() * (23 - 1)) + 1);
    var newAppleY = Math.round((Math.random() * (23 - 1)) + 1);
    if(is_block_occupied([newAppleX,newAppleY],room)){
       return getNewApplePos(room)
    }else{
      return [newAppleX,newAppleY]
    }
    
  }
  function movePlayers(){
    var rooms1 = json2array(rooms);
    rooms1.forEach((room)=>{
      rooms[room.key].snakes.forEach((snake,id)=>{
        if(snake !== "dead_snake"){
          var dir = snake.dir;
          var toPop = 0;
          if(snake.speed > 1){
            if(snake.blocks.length > 1){
              rooms[room.key].snakes[id].score -= 1;
              toPop++;
            }else{
              rooms[room.key].snakes[id].speed = 1;
              snake.speed = 1;
            }
          }
          toPop += snake.speed;
          var speed = snake.speed;
          var snake = snake.blocks;
          
          switch (dir){
            case 1:
            
              
              
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[room.key].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsY -= 1;
                rooms[room.key].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
              }
              for(var i = 0; i < toPop; i++){
                if(!rooms[room.key].snakes[id].eating){
                  rooms[room.key].snakes[id].blocks.pop();
                }else{
                  rooms[room.key].snakes[id].eating = false;
                }
                
              }
              
              break;
            case 2:
            
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[room.key].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsX += 1;
                rooms[room.key].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
              }
              for(var i = 0; i < toPop; i++){
                if(!rooms[room.key].snakes[id].eating){
                  rooms[room.key].snakes[id].blocks.pop();
                }else{
                  rooms[room.key].snakes[id].eating = false;
                }
                
              }
              
              break;
            case 3:
              
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[room.key].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsY += 1;
                rooms[room.key].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
              }
              for(var i = 0; i < toPop; i++){
                if(!rooms[room.key].snakes[id].eating){
                  rooms[room.key].snakes[id].blocks.pop();
                }else{
                  rooms[room.key].snakes[id].eating = false;
                }
                
              }
              
              break;
            case 4:
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[room.key].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsX -= 1;
                rooms[room.key].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
              }
              for(var i = 0; i < toPop; i++){
                if(!rooms[room.key].snakes[id].eating){
                  rooms[room.key].snakes[id].blocks.pop();
                }else{
                  rooms[room.key].snakes[id].eating = false;
                }
                
              }
              
              break;
          }
          } 
        });
    })
  }

function spawnBlock(room){
  if(rooms[room]){
  if(odds(0.5)){
    var side = Math.round(Math.random()*3);
    if(!rooms[room].blocks[0]){
      var blockX = Math.round((Math.random() * (23 - 1)) + 1);
      var blockY = Math.round((Math.random() * (23 - 1)) + 1);
      rooms[room].blocks.push([blockX,blockY])
    }else{
        var pickedblock = rooms[room].blocks[Math.floor(Math.random()*rooms[room].blocks.length)];
      var newblock = [];
      switch(side){
        case 0:
          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[1]-1);
          if(!is_block_occupied([newblock[0],newblock[1]],room)){
            rooms[room].blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock(room)
          }
          break;
        case 1:

          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[0]-1);
          if(!is_block_occupied([newblock[0],newblock[1]],room)){
            rooms[room].blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock(room)
          }
          break;
        case 2:
          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[1]+1);
          if(!is_block_occupied([newblock[0],newblock[1]],room)){
            rooms[room].blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock()
          }
          break;
        case 3:

          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[0]+1);
          if(!is_block_occupied([newblock[0],newblock[1]],room)){
            rooms[room].blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock(room)
          }
          break;
      }
    }
  }else{
    var blockX = Math.round((Math.random() * (23 - 1)) + 1);
    var blockY = Math.round((Math.random() * (23 - 1)) + 1);
    if(!is_block_occupied[blockX,blockY],room){
      rooms[room].blocks.push([blockX,blockY])
    }else{
      spawnBlock(room)
    }
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
  var rooms2send2 = json2array(rooms);
  rooms2send2.forEach((room)=>{
    io.to(room.key).emit('board',{
      "snakes":rooms[room.key].snakes,
      "apple":rooms[room.key].apple,
      "walls":rooms[room.key].blocks
    });
  })
    
  }
function is_block_occupied(target,room){
  var foundblocks = rooms[room].blocks.find((elem)=>{
    return (target[0] == elem[0] && target[1] == elem[1]) || (target[0] == rooms[room].apple[0] && target[1]==rooms[room].apple[1] || [2,2][0] == elem[0] && [2,2][1] == elem[1]);
  });
  return (foundblocks) ? true : false;
}
function json2array(json){
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function(key){
        var endJSON = json[key];
        endJSON.key = key
        result.push(endJSON);
    });
    return result;
}
function clearWinBoard(){
  var rooms1 = json2array(rooms);
  rooms1.forEach((room)=>{
    if(room.win){
      rooms[room.key].snakes = [];
      rooms[room.key].blocks = [];
      rooms[room.key].win = false;
    }
  })
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
