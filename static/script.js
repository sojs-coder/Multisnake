window.addEventListener('load', ()=>{
  var colors = ['red','purple','orange','green','yellow', 'blue','pink'];
  window.color = colors[Math.floor(Math.random() * colors.length)]
  const queryString = window.location.search; 
  var searchObj = new URLSearchParams(queryString);
  var username = searchObj.get('username') || getRandomName()
  var room = searchObj.get('room') || "public"
  var type = searchObj.get('type') || "normal"
  window.room = room;
  window.game = {}
  window.direction = 2;
  socket.emit('joining',{
    "name":username,
    "room":room,
    "type":type
  });
  var oldsnakes = [];
  var oldapple = "start";
  var sessionapple = [10,10];
    var messages = document.getElementById('chatbox');
var form = document.getElementById('form');
var input = document.getElementById('input');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('message', {
      'room': window.room,
      'msg':{
        'content': input.value,
        'sender': username,
        'color': window.color
      }
    });
    input.value = '';
  }
});


window.chatFocused = false;
document.addEventListener('keypress',(e)=>{
  if(e.which == 13){
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
function inFog(array, element){
  var yes = false;
  array.forEach(elem =>{
    console.log(element[0], elem[0])
    console.log((element[0] == elem[0] && element[1] == elem[1]))
    if(element[0] == elem[0] && element[1] == elem[1]){
      yes = true;
    }
  });
  return yes;
}
window.fog = [];


function reverse(num){
  if(num+2 > 4){
    return num - 2 
  }else{
    return num+2;
  }
}
function startTimer(){
  window.game.started = new Date().getTime();
}
function endTimer(){
  return (new Date().getTime() - window.game.started);
}
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
window.lastTime = new Date().getTime()
var by = 25;
var currplace = 0;
var thisSnakeID = false,joined=false;
window.dead = false;
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
  for(var i = 0; i < by; i++){
    var tr = document.createElement('tr');
    for(var j = 0; j < by; j++){
      
      var td = document.createElement('td');
      td.id = j+'-'+i;
      td.innerHTML = "&nbsp;"
      if(j == 0 || j == 24 || i==0 || i == 24){
        td.style.backgroundColor = "white"
      }else{
        td.classList.add('td');
      }
      tr.appendChild(td);
    }
    document.getElementById('table').appendChild(tr)
  }

socket.on('joined',(id)=>{
  if(!joined && !thisSnakeID){
    document.getElementById('loading').style.display = "none";
    thisSnakeID = id;
    startTimer();
    joined = true;
  }
});
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
  messages.scrollTo(0, messages.scrollHeight);
});
function getFormatGameTime(){
  return Math.round(endTimer()/1000);
}
socket.on('death',(id)=>{
  if(id == thisSnakeID){
    window.dead = true;
    var time = getFormatGameTime()
    alert(`<h1>You Died!</h1><p>Your final score was ${window.game.score}. Your time was ${time} seconds. Nice Job</p><h2>Share your score...</h2>
    <a href = "https://socialrumbles.com/post/s/new/?text=In%20MultiSnake%20,%20I%20got%20a%20score%20of%20${window.game.score}%20in%20${time}%20seconds%2C%20beat%20me!&url=https://multisnake.sojs.dev&item=24"><img src = '/social_rumbles_promo.png' alt = "social  rumbles"></a> <h1>Remember to Join our community...</h1>
      <div style = "font-size:50px">
        <a style = "padding: 25px" href = "https://discord.gg/Np7vBvEtp2"><i class="fab fa-discord"></i></a>
        <a style = "padding: 25px" href = "https://github.com/sojs-coder/Multisnake"><i class="fab fa-github"></i></a>
      </div>`,location.reload);
  }
});
socket.on('win',(snake)=>{
  if(snake.id == thisSnakeID){
    var time = getFormatGameTime()
    alert(`<h1>You Win!</h1><p>You won in  ${time} seconds. <b>Nice Job</b></p><h2>Share your win...</h2>
    <a href = "https://socialrumbles.com/post/s/new/?text=In%20MultiSnake%20,%20I%20got%20a%20score%20of%20${window.game.score}%20in%20${time}%20seconds%2C%20beat%20me!&url=https://multisnake.sojs.dev&item=24"><img src = '/social_rumbles_promo.png' alt = "social  rumbles"></a> <h1>Remember to Join our community...</h1>
      <div style = "font-size:50px">
        <a style = "padding: 25px" href = "https://discord.gg/Np7vBvEtp2"><i class="fab fa-discord"></i></a>
        <a style = "padding: 25px" href = "https://github.com/sojs-coder/Multisnake"><i class="fab fa-github"></i></a>
      </div>`,location.reload);
  }else{
    var time = getFormatGameTime()
    alert(`<h1>You Finished ${(parseInt(currplace)+1).toString()}</h1>The winner of this round was "${snake.username}"<p><p>Your final score was ${window.game.score}. Your time was ${time} seconds. Nice Job...</p><h2>Share your score...</h2>
    <a href = "https://socialrumbles.com/post/s/new/?text=In%20MultiSnake%20,%20I%20got%20a%20score%20of%20${window.game.score}%20in%20${time}%20seconds%2C%20beat%20me!&url=https://multisnake.sojs.dev&item=24"><img src = '/social_rumbles_promo.png' alt = "social  rumbles"></a> <h1>Remember to Join our community...</h1>
      <div style = "font-size:50px">
        <a style = "padding: 25px" href = "https://discord.gg/Np7vBvEtp2"><i class="fab fa-discord"></i></a>
        <a style = "padding: 25px" href = "https://github.com/sojs-coder/Multisnake"><i class="fab fa-github"></i></a>
      </div>`, location.reload)
  }
});
socket.on('board',(data)=>{
  
  
  clearBoard(data.snakes,data.apple);

  //      fog        //
  if(data.type == "fog"){
   if(window.fog.length < 250){
    if(Math.random() < 0.9){
      if(Math.random() < 0.8){
          var pickedFog = window.fog[Math.floor(Math.random()*window.fog.length - 1)];
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
                    23
                  )
              y = Math.min(
                    Math.max(
                      y,
                      1
                    ),
                    23
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
                    23
                  )
              y = Math.min(
                    Math.max(
                      y,
                      1
                    ),
                    23
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
                    23
                  )
              y = Math.min(
                    Math.max(
                      y,
                      1
                    ),
                    23
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
                    23
                  )
              y = Math.min(
                    Math.max(
                      y,
                      1
                    ),
                    23
                  )
              var newBlock = [x,y];
              window.fog.push(newBlock);
              break;
          }
      }else{
        var x = Math.round(
          Math.min(
            Math.max(
              Math.random()*25,
              1
            ),
            23
          )
        )
        var y = Math.round(
          Math.min(
            Math.max(
              Math.random()*25,
              1
            ),
            23
          )
        )
        var newBlock = [x,y];
        window.fog.push(newBlock);
      }
    }
   }
  }
  window.fog.forEach((fog)=>{
    getBlock(fog[0],fog[1]).style.backgroundColor = "#aaaaaa55";
  });
  // ----- end------ //
  var allSnakes = data.snakes;
  updateLeaders(allSnakes);
  getBlock(data.apple[0],data.apple[1]).innerHTML = "🍎";
  allSnakes.forEach((snake)=>{
    if(snake !== "dead_snake"){
      if(snake.id == thisSnakeID){
        propagateSnake(snake.blocks,"darkgreen", true);
      }else{
        propagateSnake(snake.blocks,"orange",false);
      }
    }
  });
  data.walls.forEach((wall)=>{
    getBlock(wall[0],wall[1]).style.backgroundColor = "white";
  });
});
function updateLeaders(snakes){
  snakes = snakes.map((snake)=>{
    if(snake !== "dead_snake"){
      return {"username":snake.username,"score":snake.score,"id":snake.id}
    }
  });
  snakes.sort((a,b)=>{
    if (a.score > b.score) {
      return -1;
    }
    if (a.score < b.score) {
      return 1;
    }
    return 0;
  });

  document.getElementById('leaders').innerHTML = ""
  snakes.forEach((snake,i)=>{
    if(snake){
      var leader = false;
      var leaderText = "";
      if(i == 0){
        leader = true;
        leaderText = "👑"
      }
      

      var container = document.createElement('p');
      container.appendChild(document.createTextNode(snake.username+ ": "+snake.score+ leaderText));
      if(snake.id == thisSnakeID){
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
function clearBoard(snakes,apple){
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
  oldsnakes = snakes;
}
function propagateSnake(blocks, color, ally){
blocks.forEach((block,i)=>{
    if(ally){
      getBlock(block[0],block[1]).style.backgroundColor = color;
    }else if(!ally && !inFog(window.fog,[block[0],block[1]])){
      getBlock(block[0],block[1]).style.backgroundColor = color;
    }
  })
}
function getBlock(x,y){
  return document.getElementById(x+'-'+y);
}
document.addEventListener('keydown',(e)=>{
  if(!window.dead){
    if(e.which == 87 || e.which == 38){
      if(reverse(window.direction) !== 1){
        changeDir(1)
        window.direction = 1;

      }
      
    }else if(e.which == 68 || e.which ==39){
      if(reverse(window.direction) !== 2){
        changeDir(2)
        window.direction = 2;

      }      
    }else if(e.which == 83 || e.which == 40){
      if(reverse(window.direction) !== 3){
        
        changeDir(3)
        window.direction = 3;
      }
      
    }else if(e.which == 65 || e.which == 37){
      if(reverse(window.direction) !== 4){
        window.direction = 4;
        changeDir(4)
      }
    }
  }
});
document.addEventListener('keydown',(e)=>{
  if(e.which == 32){
    socket.emit('speed',{
      "id":thisSnakeID,
      "press": true,
      "room":window.room
    });
  }
});
document.addEventListener('keyup',(e)=>{
  if(e.which == 32){
    socket.emit('speed',{
      "id":thisSnakeID,
      "press": false,
      "room":window.room
    })
  }
})
function changeDir(dir){
    socket.emit('direction',{
      "id": thisSnakeID,
      "dir":dir,
      "room":window.room
    });
}
});
