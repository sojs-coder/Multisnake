const queryString = window.location.search; 
  var searchObj = new URLSearchParams(queryString);
  var username = searchObj.get('username') || "multisnake"
  var room = searchObj.get('room') || "public"
  window.room = room;
  socket.emit('joining',{
    "name":username,
    "room":room
  });


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
  //var end = 
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
    if(cb!== location.reload){

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
      td.style = "width: 20px; height: 10px;";
      if(j == 0 || j == 24 || i==0 || i == 24){
        td.style.backgroundColor = "rgb(28, 49, 35)"
      }
      tr.appendChild(td);
    }
    document.getElementById('table').appendChild(tr)
  }

socket.on('joined',(id)=>{
  if(!joined && !thisSnakeID){
    thisSnakeID = id;

    joined = true;
  }
});
socket.on('death',(id)=>{
  if(id == thisSnakeID){
    window.dead = true;
    alert('<h1>You Died!</h1>',location.reload);
  }
});
socket.on('win',(snake)=>{
  if(snake.id == thisSnakeID){
    alert('<h1>You Win!</h1>',location.reload);
  }else{
    alert('<h1>You Finished '+ (parseInt(currplace)+1).toString() +'</h1>The winner of this round was "'+snake.username+'"<p>', location.reload)
  }
});
socket.on('board',(data)=>{
  clearBoard();




  var allSnakes = data.snakes;
  updateLeaders(allSnakes);
  getBlock(data.apple[0],data.apple[1]).style.backgroundColor = "red";
  allSnakes.forEach((snake)=>{
    if(snake !== "dead_snake"){
      if(snake.id == thisSnakeID){
        propagateSnake(snake.blocks,"darkgreen");
      }else{
        propagateSnake(snake.blocks,"orange");
      }
    }
  });
  data.walls.forEach((wall)=>{
    getBlock(wall[0],wall[1]).style.backgroundColor = "white";
  });
  updateFPS();
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
        currplace = i;
      }
      container.classList.add('leader');
      document.getElementById('leaders').appendChild(container);
      
    }
  })
}
function clearBoard(){
  for(var i = 0; i < by; i++){
    for(var j = 0; j < by; j++){
      if(j == 0 || j == 24 || i==0 || i == 24){
        getBlock(j,i).style.backgroundColor = "white"
      }else{
        getBlock(j,i).style.backgroundColor = "black";
      }
    }
    document.getElementById('table').appendChild(tr)
  }
}
function propagateSnake(blocks,color){
  blocks.forEach((block,i)=>{
    getBlock(block[0],block[1]).style.backgroundColor = color;
  })
}
function getBlock(x,y){
  return document.getElementById(x+'-'+y);
}
document.addEventListener('keydown',(e)=>{
  if(!window.dead){
    if(e.which == 87 || e.which == 38){
      changeDir(1)
    }else if(e.which == 68 || e.which ==39){
      changeDir(2)
    }else if(e.which == 83 || e.which == 40){
      changeDir(3)
    }else if(e.which == 65 || e.which == 37){
      changeDir(4)
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
  })
}

function updateFPS(){
  var currentTime = new Date().getTime();
  var difference = currentTime - window.lastTime;
  var perSeconds = 1000 / difference;
  document.getElementById('fps').innerHTML = perSeconds.toFixed(1);
  window.lastTime = new Date().getTime();
}
