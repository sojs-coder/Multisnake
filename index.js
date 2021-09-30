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
    "points_to_next_obs": 5,
    "base_points_to_next_obs":5,
    "lastvisited": new Date().getTime(),
    "by": 25,
    "type":"normal"
  }
}
function getName(){
  var start = [
    'flying',
    'blue',
    'pink',
    'jumping',
    'invisible',
    'red',
    'dancing',
    'running',
    'yellow'
  ];
  var end = [
    'Tangerine',
    'Orange',
    'Helicopter',
    'Snake',
    'Toad',
    'Ninja',
    'Goose',
    'Banana',
    'Duck'
  ];
  var ending = start[Math.floor(Math.random()* start.length)] + end[Math.floor(Math.random()*end.length)] + Math.round(Math.random() * 100);
  return ending;
}
initGame()
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('message',(data)=>{
    console.log(data)
    io.to(data.room).emit('message', data.msg);
  })
  socket.on('joining',(data)=>{
    var roomtojoin = (data) ? data.room || "public" : "public";
    var username = (data) ? data.name || getName() : getName();
    var type = (data) ? data.type || "normal" : "normal";
    var by = (data) ? data.by || 25 : 25;
    var towin = (data) ? data.towin || 15 : 15;
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
        "speed":1,
        "by": by,
        "towin": towin
      });
      rooms[roomtojoin].lastvisited = new Date().getTime();
      io.to(roomtojoin).emit('joined',id);
    }else{
      rooms[roomtojoin] = {
        "snakes":['dead_snake'],
        "blocks":[],
        "apple":[10,10],
        "started":false,
        "points_to_next_obs": 5,
        "base_points_to_next_obs":5,
        "lastvisited": new Date().getTime(),
        "type": type,
        "by": by,
        "towin": towin
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
      io.to(roomtojoin).emit('joined',id);
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
function resetRoom(roomkey){
  rooms[roomkey].apple = [10,10];
  rooms[roomkey].blocks = [];
  rooms[roomkey].snakes = ['dead_snake'];
  rooms[roomkey].started = false;
  rooms
}
function initGame(){
    var delta = new Date().getTime();
    var rooms1 = json2array(rooms);
    rooms1.forEach((room)=>{
      if((new Date().getTime() - room.lastvisited)/1000/60 > 1){
        resetRoom(room.key);
      }
      room.snakes.forEach((snake)=>{
        if(snake !== "dead_snake"){
          rooms[room.key].lastvisited = new Date().getTime();
          movePlayers(room.key,snake.id);
          checkwin(room.key, snake.id);
          clearWinBoard(room.key, snake.id);
        }
      })
      sendBoard(room.key);
    })
    
    var delta2 = new Date().getTime();
    var delta3 = delta2-delta;
    setTimeout(initGame, Math.max(100-delta3,10));
  }
  function checkwin(roomkey,id){
          var snake = rooms[roomkey].snakes[id];
          if(snake){
          snake = snake.blocks;
          var snakeHead = snake[0];
          var dead = false;
          var win = false;
          if(
            snakeHead[0] > rooms[roomkey].by - 2 || snakeHead[0] < 1 ||
            snakeHead[1] > rooms[roomkey].by - 2 || snakeHead[1] < 1 
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
          rooms[roomkey].blocks.forEach((block, i)=>{
            if(block[0] == snakeHead[0] && block[1] == snakeHead[1]){
              dead = true;
            }
            
          });
          if(rooms[roomkey].snakes[id].score == rooms[roomkey].towin && !win){
            io.to(roomkey).emit('win',rooms[roomkey].snakes[id]);
            gamesStarted = false;
            rooms[roomkey].win = true;
          }
          rooms[roomkey].snakes.forEach((otherSnake)=>{
            if(otherSnake.blocks){
              if(otherSnake.id !== id){
                otherSnake.blocks.forEach((enemyBlock,enemyBlockNumber)=>{
                  if(enemyBlockNumber == 0 && enemyBlock[0] == snakeHead[0] && enemyBlock[1] == snakeHead[1]){
                    dead = true;
                    io.to(roomkey).emit('death',otherSnake.id);
                    rooms[roomkey].snakes.splice(otherSnake.id,1,'dead_snake');
                  }else if(enemyBlock[0] == snakeHead[0] && enemyBlock[1] == snakeHead[1]){
                    dead = true;
                  }
                })
              }
            }
          });
          if(rooms[roomkey].apple[0] == snakeHead[0] && rooms[roomkey].apple[1] == snakeHead[1]){
            rooms[roomkey].snakes[id].score +=1;
            var newAppleX, newAppleY;
            var applepos = getNewApplePos(roomkey);
            
            rooms[roomkey].apple = applepos;
            if(rooms[roomkey].points_to_next_obs == 0){
              if(rooms[roomkey].type == "normal"){
                spawnBlock(roomkey);
              }
              rooms[roomkey].points_to_next_obs = rooms[roomkey].base_points_to_next_obs
            }else{
              rooms[roomkey].points_to_next_obs -=1;
            }
            rooms[roomkey].snakes[id].eating = true;
          }
          if(dead == true){
            io.to(roomkey).emit('death',id);
            rooms[roomkey].snakes.splice(id,1,'dead_snake');
          }
          }
    
    
  }
  function getNewApplePos(room){
    var newAppleX = Math.round((Math.random() * (rooms[room].by - 2 - 1)) + 1);
    var newAppleY = Math.round((Math.random() * (rooms[room].by - 2 - 1)) + 1);
    if(is_block_occupied([newAppleX,newAppleY],room)){
       return getNewApplePos(room)
    }else{
      return [newAppleX,newAppleY]
    }
    
  }
  function movePlayers(roomkey,id){
          var snake = rooms[roomkey].snakes[id];
          if(snake){
          var dir = snake.dir;

          var toPop = 0;
          if(snake.speed > 1){
            if(snake.blocks.length > 1){
              rooms[roomkey].snakes[id].score -= 1;
              toPop++;
            }else{
              rooms[roomkey].snakes[id].speed = 1;
              snake.speed = 1;
            }
          }
          toPop += snake.speed;
          var speed = snake.speed;
          var snake = snake.blocks;
          
          switch (dir){
            case 1:
            
              
              
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[roomkey].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsY -= 1;
                rooms[roomkey].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
              }
              for(var i = 0; i < toPop; i++){
                if(!rooms[roomkey].snakes[id].eating){
                  rooms[roomkey].snakes[id].blocks.pop();
                }else{
                  rooms[roomkey].snakes[id].eating = false;
                }
                
              }
              
              break;
            case 2:
            
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[roomkey].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsX += 1;
                rooms[roomkey].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
              }
              for(var i = 0; i < toPop; i++){
                if(!rooms[roomkey].snakes[id].eating){
                  rooms[roomkey].snakes[id].blocks.pop();
                }else{
                  rooms[roomkey].snakes[id].eating = false;
                }
                
              }
              
              break;
            case 3:
              
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[roomkey].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsY += 1;
                rooms[roomkey].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
              }
              for(var i = 0; i < toPop; i++){
                if(!rooms[roomkey].snakes[id].eating){
                  rooms[roomkey].snakes[id].blocks.pop();
                }else{
                  rooms[roomkey].snakes[id].eating = false;
                }
                
              }
              
              break;
            case 4:
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[roomkey].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsX -= 1;
                rooms[roomkey].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
              }
              for(var i = 0; i < toPop; i++){
                if(!rooms[roomkey].snakes[id].eating){
                  rooms[roomkey].snakes[id].blocks.pop();
                }else{
                  rooms[roomkey].snakes[id].eating = false;
                }
                
              }
              
              break;
          }
          }
  }

function spawnBlock(room){
  if(rooms[room]){
  if(odds(0.75)){
    if(!rooms[room].blocks[0]){
      var blockX = Math.round((Math.random() * (rooms[room].by - 2 - 1)) + 1);
      var blockY = Math.round((Math.random() * (rooms[room].by - 2 - 1)) + 1);
      if(!is_block_occupied([blockX,blockY],room)){
        rooms[room].blocks.push([blockX,blockY])
      }else{
        spawnBlock(room);
      }
    }else{
      var side = Math.round(Math.random()*3);
      var pickedblock = rooms[room].blocks[Math.floor(Math.random()*rooms[room].blocks.length)];
      var newblock = [];
      switch(side){
        case 0:
          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[1]-1,room);
          if(!is_block_occupied([newblock[0],newblock[1]],room)){
            rooms[room].blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock(room)
          }
          break;
        case 1:

          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[0]-1,room);
          if(!is_block_occupied([newblock[0],newblock[1]],room)){
            rooms[room].blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock(room)
          }
          break;
        case 2:
          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[1]+1,room);
          if(!is_block_occupied([newblock[0],newblock[1]],room)){
            rooms[room].blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock(room);
          }
          break;
        case 3:

          newblock[0] = pickedblock[0];
          newblock[1] = scale2board(pickedblock[0]+1,room);
          if(!is_block_occupied([newblock[0],newblock[1]],room)){
            rooms[room].blocks.push([newblock[0],newblock[1]]);
          }else{
            spawnBlock(room)
          }
          break;
      }
    }
  }else{
    var blockX = Math.round((Math.random() * (rooms[room].by - 2 - 1)) + 1);
    var blockY = Math.round((Math.random() * (rooms[room].by - 2 - 1)) + 1);
    if(!is_block_occupied[blockX,blockY],room){
      rooms[room].blocks.push([blockX,blockY])
    }else{
      spawnBlock(room)
    }
  }
  }
}
function scale2board(number,room){
  return Math.min(Math.max(1,number),rooms[room].by - 2)
}
function odds(odd){
  return (Math.random() < odd)
}
function sendBoard(roomkey){
    io.to(roomkey).emit('board',{
      "snakes":rooms[roomkey].snakes || [],
      "apple":rooms[roomkey].apple || [],
      "walls":rooms[roomkey].blocks || [],
      "type":rooms[roomkey].type || "normal"
    });
    
}
function is_block_occupied(target,room){
  var foundblocks = rooms[room].blocks.find((elem)=>{
    return (
      (target[0] == elem[0] && target[1] == elem[1]) || 
      (target[0] == rooms[room].apple[0] && target[1]==rooms[room].apple[1])
     )
  });
  if((
      ([2,2][0]  ==  target[0] && [2,2][1]  ==  target[1])   || 
      ([3,2][0]  ==  target[0] && [3,2][1]  ==  target[0])   || 
      ([4,2][0]  ==  target[0] && [4,2][1]  ==  target[1])   || 
      ([5,2][0]  ==  target[0] && [5,2][1]  ==  target[1])   || 
      ([6,2][0]  ==  target[0] && [6,2][1]  ==  target[1])   || 
      ([7,2][0]  ==  target[0] && [7,2][1]  ==  target[1])   || 
      ([8,2][0]  ==  target[0] && [8,2][1]  ==  target[1])   || 
      ([9,2][0]  ==  target[0] && [9,2][1]  ==  target[1])   || 
      ([10,2][0] == target[0]  && [10,2][1] ==  target[1])   || 
      ([11,2][0] == target[0]  && [11,2][1] ==  target[1])   || 
      ([12,2][0] == target[0]  && [12,2][1] ==  target[1])
  )){
    return true;
  }else{
    return (foundblocks) ? true : false;
  }
  
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
function clearWinBoard(roomkey,id){
  var room = rooms[roomkey];
    if(room.win){
      rooms[roomkey].snakes = ['dead_snake'];
      rooms[roomkey].blocks = [];
      rooms[roomkey].apple = [10,10];
      rooms[roomkey].win = false;
    }
}
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/play',(req,res)=>{
  res.sendFile(__dirname + '/play.html');
});
app.get('/api/v1/rooms',(req,res)=>{
  var reems = json2array(rooms);
  reems = reems.map((reem)=>{
    var reemSnakes = reem.snakes.filter((snake)=>{
      if(snake !== "dead_snake"){
        return true;
      }else{
        return false;
      }
    });
    return {
      "room_key": reem.key,
      "type":reem.type,
      "lastvisited":reem.lastvisited,
      "alive_snakes":reemSnakes,
      "snake_quantity": reemSnakes.length,
      "points_per_obstacle": reem.base_points_to_next_obs,
      "apple_pos":reem.apple,
      "current_obstacles":reem.obs,
      "room_size":reem.by,
    }
  })
  res.json(reems);
})
server.listen(3000, () => {
  console.log('listening on *:3000');
});
