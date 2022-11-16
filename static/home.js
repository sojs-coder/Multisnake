window.largeAlert = (html)=>{
  document.getElementById('alert-box').innerHTML = html;
  document.getElementById('alert-box').style.display = "inline";
}
if(window.self !== window.top){
  largeAlert('<h1>This site will preform a lot better <a href = "https://multisnake.sojs.dev/" target = "_blank">when opened in a new window</a>.</h1>')
}
$('#room-box').hide();
window.roomopen = false;
document.getElementById('join').addEventListener('click',(e)=>{
  openRoom();
});
document.addEventListener('keypress',(e)=>{
  if(e.which == 13){
    if(!window.roomopen){
      openRoom();
    }
  }
});
function openRoom(){
  var username = document.getElementById('username').value;
  document.getElementById('username').remove();
  document.getElementById('join').remove();
  document.getElementById('big').remove();
  document.getElementById('room-box').style.display = "block";
  $('#room-box').fadeIn();
  window.roomopen = true;
  fetch("/api/v1/rooms").then(response => response.json())
  .then(json => {

    // use api to see who is online and in what rooms
    var roomsJSON = {};

    // convert to json
    json.forEach(item => roomsJSON[item.room_key] = item); 

    // create UI container
    var classicContainer = document.createElement('fieldset');
    classicContainer.classList.add('mod-container');
    var classiclegend = document.createElement('legend');
    classiclegend.appendChild(document.createTextNode('classic'));
    classicContainer.id = "classic-container"
    classicContainer.appendChild(classiclegend);

    // loop through room creation code and create 3 rooms
    for(var i = 0; i < 3; i++){
      // create a link to the room, use API to see how many people are on. Append to UI container
      var a = document.createElement('a');
      a.href = "/play?username="+username+"&room=classic"+i;
      var online = (roomsJSON["classic"+i]) ? roomsJSON["classic"+i].snake_quantity || 0 : 0;
      linkText = document.createTextNode('Classic-'+i+' | Online: '+ online);
      a.appendChild(linkText);
      a.classList.add('room');
      classicContainer.appendChild(a);
    }

    // append container to DOm
    document.getElementById('rooms-plain').appendChild(classicContainer);

    // Loop through mods
    [
      {
        'name':'Small',
        'type':'small'
      },
      {
        'name':'Fog',
        'type':'fog'
      },
      {
        'name':'Tag',
        'type':'tag'
      },
      {
        'name':'Redlight',
        'type':'redgreen'
      }
    ].forEach((d)=>{
      // create UI container for mod
      var modContainer = document.createElement('fieldset');
      modContainer.classList.add('mod-container');
      var legend = document.createElement('legend');
      legend.appendChild(document.createTextNode(d.name));
      modContainer.id = "mod-container-"+d.type;
      modContainer.appendChild(legend);
      // create 2 rooms per mod
        for(var i = 0; i < 2; i++){
          // create link to room and append to container
          var a = document.createElement('a');
          a.href = "/play?username="+username+"&room="+d.type+i+"&type="+d.type;
          var online = (roomsJSON[d.type+i]) ? roomsJSON[d.type+i].snake_quantity || 0 : 0;
          linkText = document.createTextNode(d.name+'-'+i+' | Online: '+ online);
          a.appendChild(linkText);
          a.classList.add('room');
          modContainer.appendChild(a);
        }
      // append container to DOm
      document.getElementById('rooms-plain').appendChild(modContainer)
    })
    
  });
}

/*
Art by Max Strandberg
      _______
     / _   _ \
    / (.) (.) \
   ( _________ )
    \`-V-|-V-'/
     \   |   /
      \  ^  /
       \    \
        \    `-_
         `-_    -_
            -_    -_
            _-    _-
          _-    _-
        _-    _-
      _-    _-
      -_    -_
        -_    -_
          -_    -_
            -_    -_
            _-    _-
  ,-=:_-_-_-_ _ _-_-_-_:=-.
 /=I=I=I=I=I=I=I=I=I=I=I=I=\
|=I=I=I=I=I=I=I=I=I=I=I=I=I=|
|I=I=I=I=I=I=I=I=I=I=I=I=I=I|
\=I=I=I=I=I=I=I=I=I=I=I=I=I=/
 \=I=I=I=I=I=I=I=I=I=I=I=I=/
  \=I=I=I=I=I=I=I=I=I=I=I=/
   \=I=I=I=I=I=I=I=I=I=I=/
    \=I=I=I=I=I=I=I=I=I=/
     `================='
 */