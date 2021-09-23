window.largeAlert = (html)=>{
  document.getElementById('alert-box').innerHTML = html;
  document.getElementById('alert-box').style.display = "block";
}
if(window.self !== window.top){
  largeAlert('<h1>This site will preform a lot better <a href = "https://multisnake.sojs.dev/" target = "_blank">when opened in a new window</a>.</h1>',)
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
      location.replace("https://multisnake.sojs.dev/play?username="+username+"&room="+room);
    }else{
      openRoom();
    }
  }
});
document.getElementById('submit').addEventListener('click',(e)=>{
  var username = document.getElementById('username').value;
  var room = document.getElementById('room').value;
  location.replace("https://multisnake.sojs.dev/play?username="+username+"&room="+room);
})
function openRoom(){
  $('#room-box').fadeIn();
  $('#room-box input').focus()
  window.roomopen = true;
}