1. convert to rooms. CTRL+F through room objects and just add `rooms[room.key].*`
2. speed. sort through rooms and snakes in `init()`.
```js
rooms.forEach((room,i)=>{
  room.snakes.forEach((snake,j)=>{
    checkwin(room,j);
    moveplayer(snake,j);
    ...
  })
})
```
3. change `speed` so that it goes 2x fast not jumps 2.