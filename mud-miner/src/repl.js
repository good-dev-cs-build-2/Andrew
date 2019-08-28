const Player = require('./player');
const axios = require('axios')
let gamePlayer = new Player()
let state = {}
state.roomGraph = {}
BASEURL = "https://lambda-treasure-hunt.herokuapp.com";
AUTHTOKEN = "e837e4ce6747d03d96e727128d9cdc44a4c5cab7";


gameManager = () =>{
    console.log("Inside game manager function")

    init()
}


init = () =>{

    axios({
        method: 'get',
        url: `${BASEURL}/api/adv/init/`,
        headers: {
            "Authorization": `Token ${AUTHTOKEN}`
        }
    })
    .then(res =>{
        state.room_id = res.data.room_id;
        state.room_title = res.data.room_title;
        state.room_description = res.data.description
        state.exits = res.data.exits
        console.log(`Messages: ${res.data.messages}`)
        console.log(`Cooldown: ${state.cooldown}`)

        if (res.data.items){
            state.roomItems = res.data.items
        }
        else{
            state.roomItems = []
        }

        //initilize graph with first room
        state.roomGraph[state.room_id] = {}
        res.data.exits.map(exit =>{
            state.roomGraph[state.room_id][exit] = "?"
        })
        setTimeout(gameManager, res.data.cooldown * 1000)
    })
        .catch(err => console.log(err))
}


init()



// const recursiveTraversal = (previousRoom, player, direction=null) =>{
    
//     const currentRoom = player.room_id

//     const revDirs = {
//         'n': 's',
//         'e': 'w',
//         's': 'n',
//         'w': 'e'
//     }

//     //We need to fill out this part of the graph even when we hit our base case
//     if(direction != null){
//         player.roomGraph[previousRoom][direction] = currentRoom
//         player.roomGraph[currentRoom][revDirs[direction]] = previousRoom
//     }



//     //Check if we have too much stuff:
//     player.cooldownDelay()
//     player.currentStatus()

//     if(player.strength == player.encumbrance){
//         player.returnToShop()
//     }


//     //Pick up anything in the room
//     player.pickUpItems()


//     if(player.gold >= 1000){
//         if(player.room_id != "0"){
//             player.returnHome()
//         }
//         return
//     }

//     if(player.roomGraph[currentRoom].values().indexOf("?") === -1){
//         return
//     }


//     //Sort and reverse to prioritize going west, so we know we hit the shop
//     player.roomGraph[previousRoom].keys().sort().reverse().map(direction =>{
//         if(player.roomGraph[currentRoom][direction] === "?"){
//             player.cooldownDelay()
//             player.move(direction, "?")
//             recursiveTraversal(currentRoom, player, direction)
//             player.cooldownDelay()
//             player.move(revDirs[direction], previousRoom)
//         }
//     })


// }


// const callInit = new Promise(function(resolve, reject){
//     resolve(gamePlayer.init())
// })


// //Init
// callInit.then(() => {
//     setTimeout((() => console.log("This should print after axios return")), 1000)
// })

// gamePlayer.init()

// console.log("This needs to wait for response before printing")

// gamePlayer.cooldownDelay()

// console.log("1")

// setTimeout((() => console.log("2")), 2000)

// console.log("3")



//Go to the shop and store the id
// console.log("Calling recursion")
// recursiveTraversal(gamePlayer.room_id, gamePlayer)
