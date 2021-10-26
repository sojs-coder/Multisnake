// give loading screen time to display
window.addEventListener('load',()=>{
  setTimeout(initGame, 1000);
})

// initGame
function initGame(){
  // choose color for chat
  var colors = ['red','purple','orange','green','yellow', 'blue','pink'];
  window.color = colors[Math.floor(Math.random() * colors.length)]

  // find out mod and username
  const queryString = window.location.search; 
  var searchObj = new URLSearchParams(queryString);
  var username = searchObj.get('username') || getRandomName()
  var room = searchObj.get('room') || "public0"
  var type = searchObj.get('type') || "normal";

  // how wide is our map?
  var by = (type == "small") ? 15 : 25;
  // how many apples to win?
  var towin = (type == "small") ? 5 : 10
  // this is all handled server-side... hack proof.
  // dont ask me why hack is that color.

  // append to window object so they are accessible throughout the code and files.
  window.by = by;
  window.room = room;
  window.game = {}
  window.direction = 2;
 
 // tell the server to append us to the queue of people waiting to join room
  socket.emit('joining',{
    "name":username,
    "room":room,
    "type":type,
    "by":by,
    "towin":towin
  });

  // set up defualt values.
  var oldsnakes = [];
  var oldapple = "start";
  var sessionapple = [10,10];

  // get chat DOM values
    var messages = document.getElementById('chatbox');
var form = document.getElementById('form');
var input = document.getElementById('input');


// listen for message in chat
form.addEventListener('submit', function(e) {
  // dont refresh the page
  e.preventDefault();
  // if something in text box
  if (input.value) {
    // send message to server. Send over room, and message content.
    socket.emit('message', {
      'room': window.room,
      'msg':{
        'content': input.value,
        'sender': username,
        'color': window.color
      }
    });
    // clear input box
    input.value = '';
  }
});

// the chat is not focused
window.chatFocused = false;
document.addEventListener('keypress',(e)=>{
  // if ENTER key is pressed...
  if(e.which == 13){
    // if the chat is not focused, focus. if it is focused, unfocus.
    if(!window.chatFocused){
      input.focus();
      window.chatFocused = true;
    }else{
      input.blur();
      window.chatFocused = false;
    }
  }
});
//     fog     ///
// is an element (coords: [x,y]) in an array (coords: [[x,y],[x,y]])
function inFog(array, element){
  var yes = false;
  array.forEach(elem =>{
    if(element[0] == elem[0] && element[1] == elem[1]){
      yes = true;
    }
  });

  // return true/false depending on result
  return yes;
}

// no fog currently on map
window.fog = [];


/* 
      1
      ^
      |
4 <---+---> 2
      |
      v
      3
Reverse direction. if 1, 3, if 2, 4, etc..

*/
function reverse(num){
  if(num+2 > 4){
    return num - 2 
  }else{
    return num+2;
  }
}

// start timer for game
function startTimer(){
  window.game.started = new Date().getTime();
}

// find difference (milliseconds) between start and end of game.
function endTimer(){
  return (new Date().getTime() - window.game.started);
}

// generate a random name for the user
function getRandomName(){
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

// no idea
window.lastTime = new Date().getTime();

// current place (on leaderboard) of user
var currplace = 0;

// snake ID (random alphanumeric string) and wether the snake has joined the game yet
var thisSnakeID = false,joined=false;

// the snake is not dead
window.dead = false;

// change defualt alert to custom full-screen one
window.alert = (html,cb)=>{
  document.getElementById('alert-box').innerHTML = html;
  document.getElementById('alert-box').style.display = "block";
  document.getElementById('alert-box').innerHTML+="<p>Click anywhere to continue</p>";
  document.getElementById('alert-box').onclick = (e)=>{
    document.getElementById('alert-box').style.display = "none";
    if(cb !== location.reload){

     cb()
    }else{
      location.reload()
    }
  }
  
}

// generate map
  for(var i = 0; i < by; i++){
    var tr = document.createElement('tr');
    for(var j = 0; j < by; j++){
      
      var td = document.createElement('td');
      td.id = j+'-'+i;
      td.innerHTML = "&nbsp;"
      if(j == 0 || j == window.by - 1 || i==0 || i == window.by - 1){
        // this is a border block
        td.style.backgroundColor = "white"
      }else{
        td.classList.add('td');
      }
      if(j == 2 && i == 2){
        td.classList.add('spawn');
      }
      tr.appendChild(td);
    }
    document.getElementById('table').appendChild(tr)
  }

// the server has let a snake join
socket.on('joined',(id)=>{
  // if the snake is already in the game, and has an ID, do nothing. Else, clear the loading screen, and change all values to positive
  if(!joined && !window.thisSnakeID){
    document.getElementById('loading').style.display = "none";
    clearInterval(window.tipinterval)
    window.thisSnakeID = id;
    startTimer();
    joined = true;
  }
});

// the server recieved a chat message. Append it to the chat.
socket.on('message', (msg)=>{
  var item = document.createElement('div');
  item.classList.add('msg');
  var username = document.createElement('span');
  username.appendChild(document.createTextNode(msg.sender+ ': '));;
  username.style.color = msg.color;
  username.classList.add('chat-username');
  item.appendChild(username);
  var message = document.createElement('span');
  message.appendChild(document.createTextNode(msg.content));
  item.appendChild(message);
  messages.appendChild(item);
  // scroll to top, so the new message is displayed
  messages.scrollTo(0, messages.scrollHeight);
});

// convert endtime to seconds
function getFormatGameTime(){
  return Math.round(endTimer()/1000);
}

// a snake died
socket.on('death',(id)=>{
  // if the snake is the user, tell him he died, his score, and time.
  if(id == window.thisSnakeID){
    window.dead = true;
    var time = getFormatGameTime()
    alert(`<h1>You Died!</h1><p>Your final score was ${window.game.score}. Your time was ${time} seconds. Nice Job</p><h3>Share your score...</h3>
    <a href = "https://socialrumbles.com/post/s/new/?text=In%20MultiSnake%20,%20I%20got%20a%20score%20of%20${window.game.score}%20in%20${time}%20seconds%2C%20beat%20me!&url=https://multisnake.xyz&item=24"><img src = '/social_rumbles_promo.png' alt = "social  rumbles"></a> <h3>Remember to Join our community...</h3>
      <div style = "font-size:50px">
        <a style = "padding: 25px" href = "https://discord.gg/Np7vBvEtp2"><i class="fab fa-discord"></i></a>
        <a style = "padding: 25px" href = "https://github.com/sojs-coder/Multisnake"><i class="fab fa-github"></i></a>
      </div>`,location.reload);
  }
});

// a snake just won the game.
socket.on('win',(snake)=>{
  // if the snake is the user, tell him so.
  if(snake.id == window.thisSnakeID){
    var time = getFormatGameTime()
    alert(`<h1>You Win!</h1><p>You won in  ${time} seconds. <b>Nice Job</b></p><h3>Share your win...</h3>
    <a href = "https://socialrumbles.com/post/s/new/?text=In%20MultiSnake%20,%20I%20got%20a%20score%20of%20${window.game.score}%20in%20${time}%20seconds%2C%20beat%20me!&url=https://multisnake.xyz&item=24"><img src = '/social_rumbles_promo.png' alt = "social  rumbles"></a> <h3>Remember to Join our community...</h3>
      <div style = "font-size:50px">
        <a style = "padding: 25px" href = "https://discord.gg/Np7vBvEtp2"><i class="fab fa-discord"></i></a>
        <a style = "padding: 25px" href = "https://github.com/sojs-coder/Multisnake"><i class="fab fa-github"></i></a>
      </div>`,location.reload);
  }else{
    // the snake is not the user. tell him who won and what place he got.
    var time = getFormatGameTime()
    alert(`<h1>You Finished ${(parseInt(currplace)+1).toString()}</h1>The winner of this round was "${snake.username}"<p><p>Your final score was ${window.game.score}. Your time was ${time} seconds. Nice Job...</p><h3>Share your score...</h3>
    <a href = "https://socialrumbles.com/post/s/new/?text=In%20MultiSnake%20,%20I%20got%20a%20score%20of%20${window.game.score}%20in%20${time}%20seconds%2C%20beat%20me!&url=https://multisnake.xyz&item=24"><img src = '/social_rumbles_promo.png' alt = "social  rumbles"></a> <h3>Remember to Join our community...</h3>
      <div style = "font-size:50px">
        <a style = "padding: 25px" href = "https://discord.gg/Np7vBvEtp2"><i class="fab fa-discord"></i></a>
        <a style = "padding: 25px" href = "https://github.com/sojs-coder/Multisnake"><i class="fab fa-github"></i></a>
      </div>`, location.reload)
  }
});

// the board has been updated. what to do
socket.on('board',(data)=>{
  
  // call clear board (updated board)
  clearBoard(data.snakes,data.apple);

  //      fog        //
  if(data.type == "fog"){
    // if the type is fog, generate fog only if there is less than 400 fog already on the board.
   if(window.fog.length < 400){
     // for fun.
    if(Math.random() < 0.9){
      // spwn next to an already existing block or create a new patch
      if(Math.random() < 0.8){
        // pick a fog to spawn next to, as well as a side.
          var pickedFog = window.fog[Math.floor(Math.random()*window.fog.length)];
          if(pickedFog){
          var side = Math.round(Math.random() * 3);
            switch(side){
              case 0:
                var x = pickedFog[0] + 1;
                var y = pickedFog[1];
                x = Math.min(
                      Math.max(
                        x,
                        1
                      ),
                      window.by - 2
                    )
                y = Math.min(
                      Math.max(
                        y,
                        1
                      ),
                      window.by - 2
                    )
                var newBlock = [x,y];
                window.fog.push(newBlock);
                break;
              case 1:
                var x = pickedFog[0] - 1;
                var y = pickedFog[1];
                x = Math.min(
                      Math.max(
                        x,
                        1
                      ),
                      window.by - 2
                    )
                y = Math.min(
                      Math.max(
                        y,
                        1
                      ),
                      window.by - 2
                    )
                var newBlock = [x,y];
                window.fog.push(newBlock);
                break;
              case 2:
                var x = pickedFog[0];
                var y = pickedFog[1] + 1;
                x = Math.min(
                      Math.max(
                        x,
                        1
                      ),
                      window.by - 2
                    )
                y = Math.min(
                      Math.max(
                        y,
                        1
                      ),
                      window.by - 2
                    )
                var newBlock = [x,y];
                window.fog.push(newBlock);
                break;
              case 3:
                var x = pickedFog[0];
                var y = pickedFog[1] - 1;
                x = Math.min(
                      Math.max(
                        x,
                        1
                      ),
                      window.by - 2
                    )
                y = Math.min(
                      Math.max(
                        y,
                        1
                      ),
                      window.by - 2
                    )
                var newBlock = [x,y];
                window.fog.push(newBlock);
                break;
            }
          }
      }else{
        // pick a random square on the map to spawn a block.
        var x = Math.round(
          Math.min(
            Math.max(
              Math.random()*window.by,
              1
            ),
            window.by - 2
          )
        )
        var y = Math.round(
          Math.min(
            Math.max(
              Math.random()*window.by,
              1
            ),
            window.by - 2
          )
        )
        var newBlock = [x,y];
        window.fog.push(newBlock);
      }
    }
   }
  }
  // spawn all the fog. this can be made more efficient. [update]
  window.fog.forEach((fog)=>{
    getBlock(fog[0],fog[1]).style.backgroundColor = "#aaaaaa55";
  });
  // ----- end------ //

  // create array of snakes from json
  var allSnakes = json2array(data.snakes);
  // update leaderboard
  updateLeaders(allSnakes);

  // update apple position
  getBlock(data.apple[0],data.apple[1]).innerHTML = "🍎";

  // spawn snake blocks.
  allSnakes.forEach((snake)=>{
    // the snake is not dead [depracted]
    if(snake !== "dead_snake"){
      if(snake.it){
        // we are in tag mod. the snake is it. turn it yellow
        propagateSnake(snake.blocks,"yellow", true);
      }else{
        if(snake.id == window.thisSnakeID){
          // the snake is the user. turn it green.
          propagateSnake(snake.blocks,"green", true);
        }else{
          // the snake is another user. turn it orange.
          propagateSnake(snake.blocks,"orange",false);
        }
      }
    }
  });

  // spawn wall blocks.
  data.walls.forEach((wall)=>{
    getBlock(wall[0],wall[1]).style.backgroundColor = "white";
  });
});

// update leaders
function updateLeaders(snakes){
  // convert to array
  snakes = json2array(snakes)

  //loop through and filter uneeded data.
  snakes = snakes.map((snake)=>{
    // snake is not dead [depracted]
    if(snake !== "dead_snake"){
      return {"username":snake.username,"score":snake.score,"id":snake.id,"type":snake.type}
    }
  });
  // sort snakes based off of score.
  snakes.sort((a,b)=>{
    if (a.score > b.score) {
      return -1;
    }
    if (a.score < b.score) {
      return 1;
    }
    return 0;
  });

  // clear current leaders
  document.getElementById('leaders').innerHTML = "";
  // update leaers
  snakes.forEach((snake,i)=>{
    if(snake){
      var leader = false;
      var leaderText = "";
      if(i == 0){
        //this snake is first place. give him a crown.
        leader = true;
        leaderText = "👑"
      }
      //append to leaderboard.
      var container = document.createElement('p');
      container.appendChild(document.createTextNode(snake.username +" ["+ snake.type +"]: "+snake.score+ leaderText));
      if(snake.id == window.thisSnakeID){
        document.getElementById('score').innerHTML = snake.score;
        container.id = "player";
        window.game.score = snake.score
        currplace = i;
      }
      container.classList.add('leader');
      document.getElementById('leaders').appendChild(container);
      
    }
  })
}

// clear unused blocks.
function clearBoard(snakes,apple){
  snakes = json2array(snakes)
  if(oldapple !== "start"){
    if(apple !== oldapple){
      getBlock(oldapple[0],oldapple[1]).innerHTML = "&nbsp;";
      oldapple = apple;
    }
  }else{
    oldapple = apple;
  }
  if(oldsnakes !== "start"){
    if(snakes !== oldsnakes){
      oldsnakes.forEach((oldsnake)=>{
        if(oldsnake !== "dead_snake"){
          oldsnake.blocks.forEach((block)=>{
            getBlock(block[0],block[1]).style.backgroundColor = "black";
          });
        }
      });
    }
  }else{
    oldapple = apple;
  }
  oldsnakes =  snakes
}

// color a list of blocks (coords: [[x,y],[x,y]])
function propagateSnake(blocks, color, ally){
blocks.forEach((block,i)=>{
    if(ally){
      getBlock(block[0],block[1]).style.backgroundColor = color;
    }else if(!ally && !inFog(window.fog,[block[0],block[1]])){
      getBlock(block[0],block[1]).style.backgroundColor = color;
    }
  })
}

// return DOM of block, given coordinates
function getBlock(x,y){
  return document.getElementById(x+'-'+y);
}

//listen for change of direction
document.addEventListener('keydown',(e)=>{
  //snake is not dead
  if(!window.dead){
    /* 
      1
      ^
      |
4 <---+---> 2
      |
      v
      3
      */
    if(e.which == 87 || e.which == 38){

      // up
        if(reverse(window.direction) !== 1){
          // he is not going back on himself
          changeDir(1)
          window.direction = 1;

        }
    }else if(e.which == 68 || e.which ==39){
      // right
        if(reverse(window.direction) !== 2){
          //not going back on himself
          changeDir(2)
          window.direction = 2;

        }  
    }else if(e.which == 83 || e.which == 40){
      //down
        if(reverse(window.direction) !== 3){
          
          changeDir(3)
          window.direction = 3;
        }
      
    }else if(e.which == 65 || e.which == 37){
      // left
        if(reverse(window.direction) !== 4){
          window.direction = 4;
          changeDir(4)
        }
    }
  }
});

// is the spacebar down? yes? tell the server to speed up the snake. no? slow it down.
document.addEventListener('keydown',(e)=>{
  if(e.which == 32){
    socket.emit('speed',{
      "id":window.thisSnakeID,
      "press": true,
      "room":window.room
    });
  }
});
document.addEventListener('keyup',(e)=>{
  if(e.which == 32){
    socket.emit('speed',{
      "id":window.thisSnakeID,
      "press": false,
      "room":window.room
    })
  }
})

// tell the server to change snake direction.
function changeDir(dir){
    console.log('ID: '+window.thisSnakeID);
    socket.emit('direction',{
      "id": window.thisSnakeID.toString(),
      "dir":dir,
      "room":window.room
    });
}

// convert json object to array.
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
}
/*
    Y
  .-^-.
 /     \      .- ~ ~ -.
()     ()    /   _ _   `.                     _ _ _
 \_   _/    /  /     \   \                . ~  _ _  ~ .
   | |     /  /       \   \             .' .~       ~-. `.
   | |    /  /         )   )           /  /             `.`.
   \ \_ _/  /         /   /           /  /                `'
    \_ _ _.'         /   /           (  (
                    /   /             \  \
                   /   /               \  \
                  /   /                 )  )
                 (   (                 /  /
                  `.  `.             .'  /
                    `.   ~ - - - - ~   .'
                       ~ . _ _ _ _ . ~
 */