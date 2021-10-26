// install and require dependencies
const axios = require('axios');
const express = require('express');
const { Server } = require("socket.io");

//create app to run requests from.
const app = express();
const http = require('http');
const server = http.createServer(app);

// create a websocket from my server
const io = new Server(server);

// nobody is waiting to join a room yet
var queue = [];

// load static files. 
app.use(express.static('static'));

// game has not started yet
var gamesStarted = false;

// for bots [depracted]
var API_endpoints = [{"endpoint":'https://MultiSnake-R-500.sojs.repl.co/api/endpoint',"username":"R-500#"}];

//initialize rooms object (entire game runs off of this)
var rooms = {
  "classic0":{
    "snakes":{
    },
    "queue":[],
    "blocks":[],
    "apple":[10,10],
    "started":false,
    "points_to_next_obs": 5,
    "base_points_to_next_obs":5,
    "lastvisited": new Date().getTime(),
    "by": 25,
    "type":"normal",
    "towin":10,
  }
}

// generate random names for users
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

// start game loop.
initGame()


io.on('connection', (socket) => {
  //a user connected
  console.log('a user connected');

  // chat message
  socket.on('message',(data)=>{
    if(data){
      if(data.room){
        // make sure message is valid
        data.msg = (data.msg) ? data.msg : {'content': 'Uh-Oh! Somone just tried to hack and failed!','sender': 'ROBOT','color': 'white'}
        // send message to all users.
        io.to(data.room).emit('message', data.msg);
      }
    } 
  });
  socket.on('joining',(data)=>{
    // a user joined.
    // make sure that all users data is in check & assign defualt values.
    var roomtojoin = (data) ? data.room || "classic0" : "classic0";
    var username = (data) ? data.name || getName() : getName();
    var type = (data) ? data.type || "normal" : "normal";
    var by = (data) ? data.by || 25 : 25;
    var towin = (data) ? data.towin || 10 : 10;
    if(rooms[roomtojoin]){
      // the room the snake wants to join exists
      // join the channel for that specific room.
      socket.join(roomtojoin)
      // add the snake to the queue to join the game.
      addToQueue({
        "blocks": [[2,2]],
        "id": Math.random().toString(36).slice(2),
        "score":0,
        "eating":false,
        "dir":2,
        "username": username,
        "speed":1,
        "by": by,
        "towin": towin,
        "type": "PLAYER"
      },roomtojoin)
      // assign a new timestamp to the last time the room was joined.
      rooms[roomtojoin].lastvisited = new Date().getTime();
    }else{
      // the room to join does not exist. create it.
      rooms[roomtojoin] = {
        "snakes":{},
        "blocks":[],
        "apple":[10,10],
        "started":false,
        "points_to_next_obs": 5,
        "base_points_to_next_obs":5,
        "lastvisited": new Date().getTime(),
        "type": type,
        "by": by,
        "towin": towin,
        "queue":[]
      }
      // join the rooms channel.
      socket.join(roomtojoin)
      // add the snake to the queue to join the game.
      addToQueue({
        "blocks": [[2,2]],
        "id": Math.random().toString(36).slice(2),
        "score":0,
        "eating":false,
        "dir":2,
        "username": username,
        "speed":1,
        "by": by,
        "towin": towin,
        "type": "PLAYER"
      },roomtojoin)
    }
  
  });
  socket.on('speed',(data)=>{
    // a user just pressed space or lifted it.
    // ensure the snakes data is in check
    var room = (data) ? data.room || "classic0" : "classic0";
    var id = (data) ?  data.id  || -1 : -1;
    // is he pressing space or did he just lift his fingers from it?
    var press = (data) ? (data.press || false) : false;
    if(rooms[room]){
      // room exists
      if(rooms[room].snakes[id]){
        // snake exists
        if(rooms[room].snakes[id] !== "dead_snake" && rooms[room].snakes[id]){
          // snake is alive (depracted)
          // assign snake new speed based on wether SPACE is pressed. True? speed of 2. False? speed of 1.
          rooms[room].snakes[id].speed = (press) ? 2 : 1;
          
        }
      }
    }
  
  })
  
  socket.on('direction',(data)=>{
    // a snake just changed direction
    // 1 up, 2 right, 3 down, 4 left.
    // ensure snakes data is in check
    var room = (data) ? data.room || "classic0" : "classic0";
    var id = (data) ? data.id || "-1" : "-1";
    var dir = (data) ? data.dir || 1 : 1;

    if(rooms[room]){
      // room exists
      if(rooms[room].snakes[id]){
        // snake exists
        if(rooms[data.room].snakes[id] !== "dead_snake" && rooms[data.room].snakes[id]){
          // snake is alive [depracted]
          //change snakes direction.
          rooms[data.room].snakes[id].dir = data.dir;
          
        }
      }
    }
    
  })
  socket.on('disconnect', () => {
    // user disconnected
    console.log('user disconnected');
  });
  
});
//adds a snake to queue
function addToQueue(snake,room){
  
  rooms[room].queue.push(
    {
      "snake":snake,
      "room":room
    }
  );
}

// spawns the next snake in the queue.
function spawnFromQueue(room){
  var queue = rooms[room].queue;
  var snake = queue[0].snake;
  var room = queue[0].room;
  rooms[room].snakes[snake.id] = snake;
  if(snake.type == "PLAYER"){
    // only send this if the snake is a player and not a bot [depracated]
    io.to(room).emit('joined',snake.id);
  }
  // remove the snake that from the queue
  queue.shift();
}

// spawn a bot [depracted]
function spawnBot(room){
    // choose an AI for it to work off of.
    var chosenBot = API_endpoints[Math.floor(Math.random()*API_endpoints.length)];
    // add the bot to the queue & give it a username
    addToQueue({
        "blocks": [[2,2]],
        "id": Math.random().toString(36).slice(2),
        "score":0,
        "eating":false,
        "dir":2,
        "username": chosenBot.username + Math.round(Math.random()* 999),
        "speed":1,
        "by": 25,
        "towin": 10,
        "type": "BOT",
        "endpoint":chosenBot.endpoint
      },room);
}

// reset a room to defualt values.
function resetRoom(roomkey){
  rooms[roomkey].apple = [10,10];
  rooms[roomkey].blocks = [];
  rooms[roomkey].snakes = {};
  rooms[roomkey].started = false;
}

//game loop
function initGame(){
    // start loop timestamp
    var delta = new Date().getTime();
    // convert rooms object to array
    var rooms1 = json2array(rooms);
    rooms1.forEach((room)=>{
      if(room.queue.length > 0){
        // if snakes are in the queue, spawn one.
        spawnFromQueue(room.key);
      }
      // if more than 1 minute has passed since someone last joined, reset the room.
      if((new Date().getTime() - room.lastvisited)/1000 > 60){
        resetRoom(room.key);
      }else{
        //convert snakes to array
      var snakesArray = json2array(room.snakes);

      if(snakesArray.length < 5){
        // if there are not 5 players, spawn a bot in [depracted]
        // uncomment line below to put bots in.
        //spawnBot(room.key);
      }
      snakesArray.forEach((snake)=>{
        // loop through snakes
        if(snake !== "dead_snake"){
          //snake is alive
          if(snake.type == "BOT"){
            //snake is a bot. uncomment below to add bots in.
            // var time1 = new Date().getTime()
            // axios
            //   .post(snake.endpoint, {
            //     'room':rooms[room.key],
            //     'id':snake.id
            //   })
            //   .then(res => {
            //     if(rooms[room.key].snakes[snake.id]){
            //     rooms[room.key].snakes[snake.id].dir = res.data.dir;
            //     }
            //     console.log(new Date().getTime() - time1)
            //   })
            //   .catch(error => {
                
            //   });
              
          }else{
            // update the last time a person visited.
            rooms[room.key].lastvisited = new Date().getTime();
          }
          // move the player. pass the room and the snakes id.
          movePlayers(room.key,snake.id);
          // hand deaths and winds
          checkwin(room.key, snake.id);
          // clear the board if a win.
          clearWinBoard(room.key, snake.id);
        
        }
      
      });

      }
      // send board ove to clients.
      sendBoard(room.key);
    })
    // end timestamp
    var delta2 = new Date().getTime();
    var delta3 = delta2-delta;
    // ensure consitent game loop time.
    setTimeout(initGame, Math.max(100-delta3,10));
  }
  function checkwin(roomkey,id){
    //get snake object
          var snake = rooms[roomkey].snakes[id];
          if(snake){
            //the snake exists
          snake = snake.blocks;
          var snakeHead = snake[0];
          var dead = false;
          var win = false;
          if(
            snakeHead[0] > rooms[roomkey].by - 2 || snakeHead[0] < 1 ||
            snakeHead[1] > rooms[roomkey].by - 2 || snakeHead[1] < 1 
            ){
              // if it is in a wall block, die.
            dead = true;
          }
          snake.forEach((snakeBlock, i)=>{
            if(i !== 0){
              if(snakeBlock[0] == snakeHead[0] && snakeBlock[1] == snakeHead[1]){
                // the snake ran into itself. idiot.
                dead = true;
              }
            }
          });
        
          rooms[roomkey].blocks.forEach((block, i)=>{
            if(block[0] == snakeHead[0] && block[1] == snakeHead[1]){
              //snake ran into a block.
              dead = true;
            }
            
          });
          if(rooms[roomkey].snakes[id].score == rooms[roomkey].towin && !win){
            //snake got to the needed score to win. tell the clients.
            io.to(roomkey).emit('win',rooms[roomkey].snakes[id]);
            gamesStarted = false;
            rooms[roomkey].win = true;
          }
          var snakesArray = json2array(rooms[roomkey].snakes);
          snakesArray.forEach((otherSnake)=>{
            if(otherSnake.blocks){
              if(otherSnake.id !== id){
                otherSnake.blocks.forEach((enemyBlock,enemyBlockNumber)=>{
                  if(enemyBlockNumber == 0 && enemyBlock[0] == snakeHead[0] && enemyBlock[1] == snakeHead[1]){
                    if(rooms[roomkey].type !== "tag"){             // the type is not tag. collision of snakes head to head. kill both.   
                      dead = true;
                      io.to(roomkey).emit('death',otherSnake.id);
                      delete rooms[roomkey].snakes[otherSnake.id]
                    }
                  }else if(enemyBlock[0] == snakeHead[0] && enemyBlock[1] == snakeHead[1]){
                    if(rooms[roomkey].type !== "tag"){
                      // client snake ran into other snake. kill it.
                      dead = true;
                    }else{
                      // type is tag. 
                      if(rooms[roomkey].snakes[id].it){
                        //if the snake is "it" kill the snake it ran into.
                        io.to(roomkey).emit('death',otherSnake.id);
                        delete rooms[roomkey].snakes[otherSnake.id]
                      }
                    }
                  }
                })
              }
            }
          });
          if(rooms[roomkey].apple[0] == snakeHead[0] && rooms[roomkey].apple[1] == snakeHead[1]){
            // the snake ate an apple
            if(rooms[roomkey].type == "tag"){
              if(!rooms[roomkey].it){
                // room type is tag. the snake is now it.
                rooms[roomkey].it = id;
              }else{
                // room type is tag. remove "it" from old snake that was it.
                if(rooms[roomkey].snakes[rooms[roomkey].it]){
                  rooms[roomkey].snakes[rooms[roomkey].it].it = false;
                }
              }
              // assign "it" to client snake
              rooms[roomkey].snakes[id].it = true;
              rooms[roomkey].it = id;
            }
            // add one to snake score. spawn new apple.
            rooms[roomkey].snakes[id].score +=1;
            var newAppleX, newAppleY;
            var applepos = getNewApplePos(roomkey);
            
            rooms[roomkey].apple = applepos;
            if(rooms[roomkey].points_to_next_obs == 0){
              // time to spawn a block in.
              if(rooms[roomkey].type == "normal"){
                spawnBlock(roomkey);
              }
              // resent block score counter.
              rooms[roomkey].points_to_next_obs = rooms[roomkey].base_points_to_next_obs
            }else{
              // remove one from block score counter
              rooms[roomkey].points_to_next_obs -=1;
            }
            // the snake is eating. tell the code so.
            rooms[roomkey].snakes[id].eating = true;
          }
          if(dead == true){
            // the snake is dead. tell the clients.
            io.to(roomkey).emit('death',id);
            delete rooms[roomkey].snakes[id]
          }
          }
    
    
  }
  // get a new position for the apple.
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
    // move a snake.
          var snake = rooms[roomkey].snakes[id];
          if(snake){
            //the snake exists
          var dir = snake.dir;
          var toPop = 0;
          // change speed depending on length of snake. If it is only one block long, change speed to 1.
          if(snake.speed > 1){
            if(snake.blocks.length > 1){
              rooms[roomkey].snakes[id].score -= 1;
              toPop++;
            }else{
              rooms[roomkey].snakes[id].speed = 1;
              snake.speed = 1;
            }
          }
          // add quantity of blocks to pop depending on speed.
          toPop += snake.speed;
          var speed = snake.speed;
          var snake = snake.blocks;
          
          // append block depending on direction.
          switch (dir){
            case 1:
            
              
              
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[roomkey].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsY -= 1;
                rooms[roomkey].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
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
              
              break;
            case 3:
              
              for(var i = 0; i < speed; i++){
                var snakeHead = rooms[roomkey].snakes[id].blocks[0];
                var newCoordsX = snakeHead[0];
                var newCoordsY = snakeHead[1];
                newCoordsY += 1;
                rooms[roomkey].snakes[id].blocks.unshift([newCoordsX,newCoordsY]);
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

              
              break;
          }
          // pop snake depending on predifined quantity
          for(var i = 0; i < toPop; i++){
                if(!rooms[roomkey].snakes[id].eating){
                  rooms[roomkey].snakes[id].blocks.pop();
                }else{
                  rooms[roomkey].snakes[id].eating = false;
                }
                
              }
          }
  }


// spawn a wall into a room.
function spawnBlock(room){
  if(rooms[room]){
  if(odds(0.75)){
    // spawn block in a random location
    if(!rooms[room].blocks[0]){
      var blockX = Math.round((Math.random() * (rooms[room].by - 2 - 1)) + 1);
      var blockY = Math.round((Math.random() * (rooms[room].by - 2 - 1)) + 1);
      if(!is_block_occupied([blockX,blockY],room)){
        rooms[room].blocks.push([blockX,blockY])
      }else{
        // block already exists. try again.
        spawnBlock(room);
      }
    }else{
      // spawn a block next to an existing block.
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
    // no blocks exist yet... spawn one in a random location
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

// constrain a number according to the maps walls.
function scale2board(number,room){
  return Math.min(Math.max(1,number),rooms[room].by - 2)
}
// return true/false depending on an X% chance
function odds(odd){
  return (Math.random() < odd)
}
// send the board over to the clients listening on a specific channel.
function sendBoard(roomkey){
    io.to(roomkey).emit('board',{
      "snakes":rooms[roomkey].snakes || [],
      "apple":rooms[roomkey].apple || [],
      "walls":rooms[roomkey].blocks || [],
      "type":rooms[roomkey].type || "normal"
    });
    
}

// is a square occupied in a specific room. Determines if it is one of the blocks infront of the spawn, has an apple on it, a snake block, or a wall block. returns true/false.
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
//convert json to array.
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

// somebody won. reset the board.
function clearWinBoard(roomkey,id){
  var room = rooms[roomkey];
    if(room.win){
      rooms[roomkey].snakes = {};
      rooms[roomkey].blocks = [];
      rooms[roomkey].apple = [10,10];
      rooms[roomkey].win = false;
    }
}

// send index index over at root route.
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
// game endpoint
app.get('/play',(req,res)=>{
  res.sendFile(__dirname + '/play.html');
});
// API endpoint
app.get('/api/v1/rooms',(req,res)=>{
  var reems = json2array(rooms);
  reems = reems.map((reem)=>{
    var snakesArray = json2array(reem.snakes);
    var reemSnakes = snakesArray.filter((snake)=>{
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

// listen.
server.listen(3000, () => {
  console.log('listening on *:3000');
});

/*
Art by Marcin Glinski
                            __..._              
                        ..-'      o.            
                     .-'            :           
                 _..'             .'__..--<     
          ...--""                 '-.           
      ..-"                       __.'           
    .'                  ___...--'               
   :        ____....---'                        
  :       .'                                    
 :       :           _____                      
 :      :    _..--"""     """--..__             
:       :  ."                      ""i--.       
:       '.:                         :    '.     
:         '--...___i---""""--..___.'      :     
 :                 ""---...---""          :     
  '.                                     :      
    '-.                                 :       
       '--...                         .'        
         :   ""---....._____.....---""          
         '.    '.                               
           '-..  '.                             
               '.  :                            
                :  .'                            
               /   :                             
             .'   :                             
           .' .--'                              
          '--'
*/
