window.largeAlert = (html)=>{
  document.getElementById('alert-box').innerHTML = html;
  document.getElementById('alert-box').style.display = "block";
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
    if(window.roomopen){
      var username = document.getElementById('username').value;
      var room = document.getElementById('room').value;
      location.replace("https://multisnake.xyz/play?username="+username+"&room="+room);
    }else{
      openRoom();
    }
  }
});
function openRoom(){
    var username = document.getElementById('username').value;
  document.getElementById('username').remove();
  document.getElementById('join').remove();
  document.getElementById('big').remove();
  $('#room-box').fadeIn();
  window.roomopen = true;
  fetch("/api/v1/rooms").then(response => response.json())
  .then(json => {
    var roomsJSON = json.reduce(function(result, item, index, array) {
      result[item.key] = item;
      return result;
    }, {});

    for(var i = 0; i < 5; i++){
      var a = document.createElement('a');
      a.href = "/play?username="+username+"&room=public"+i;
      var online = (roomsJSON["public"+i]) ? roomsJSON["public"+i].snake_quantity || 0 : 0;
      linkText = document.createTextNode('Public-'+i+' | Online: '+ online);
      a.appendChild(linkText);
      a.classList.add('room');
      document.getElementById('rooms-plain').appendChild(a);
    }
    ['small','fog'].forEach((d)=>{
        for(var i = 0; i < 2; i++){

          var a = document.createElement('a');
          a.href = "/play?username="+username+"&room="+d+i+"&type="+d;
          var online = (roomsJSON["public"+i]) ? roomsJSON["public"+i].snake_quantity || 0 : 0;
          linkText = document.createTextNode(d+'-'+i+' | Online: '+ online);
          a.appendChild(linkText);
          a.classList.add('room');
          document.getElementById('rooms-mods').appendChild(a);
        }
    })
    
  });
}
