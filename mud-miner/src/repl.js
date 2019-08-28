const Player = require('./player');
const Queue = require('./queue');
const axios = require('axios')

const rev_dirs = {
    'n': 's',
    's': 'n',
    'e': 'w',
    'w': 'e'
}
let gamePlayer = new Player()
let state = {}
state.needStatusUpdate = true
state.roomGraph = {}
state.returnStack = []
state.shop_id = -1
state.pirate_room_id = -1
state.headingToShop = false
state.returningFromShop = false
state.readyForNameChange = false
state.pathToShop = []
state.pathFromShop = []
BASEURL = "https://lambda-treasure-hunt.herokuapp.com";
AUTHTOKEN = "e837e4ce6747d03d96e727128d9cdc44a4c5cab7";


gameManager = () =>{
    console.log("Inside game manager function")


    if(state.gold >= 1000){
        //don't want to bother updating status, just need to find pirate
        state.needStatusUpdate = false
        state.readyForNameChange = true

        if(state.pirate_room_id == -1){
            //we havent' found the pirate yet, we need to keep traversing
        }
        else{
            //build path to pirate, traverse it
        }
    }

    if(state.needStatusUpdate){
        statusUpdate()
        return
    }


    //pick up items in the room if we want
    // if we're not carrying too much
    if(state.encumbrance < state.strength){

        if(state.roomItems.length != 0){
            //and there are items in the room

            let item = state.roomItems.pop()

            while(!item.includes("treasure")){
                item = state.roomItems.pop()

                if(state.roomItems.length == 0){
                    break
                }
            }

            //we've found the first item that contains the word treasure
            //or we've iterated through and there are no treasures

            if(item.includes("treasure")){
                //pick it up

                pickUp(item)
            }
        }
    }



    //Know when to go to the shop, and when to return

    if(state.encumbrance >= state.strength){
        if(!state.headingToShop){
            //if we aren't heading to shop, we need to be
            buildPath(state.shop_id)
        }

        //if we are heading to shop, don't need to do anything special
    }

    if(state.headingToShop && state.pathToShop.length > 0){
        const next_move = state.pathToShop.shift()
        state.pathFromShop.push(rev_dirs[next_move])

        move(next_move)
        return
    }

    if(state.headingToShop && state.pathToShop.length == 0){
        if(state.inventory.length == 0){
            //return from shop
            state.returningFromShop = true
            state.headingToShop = false
        }
        else{
            const itemToSell = state.inventory.pop()
            sell(itemToSell)
            return
            
        }
    }




    if(state.returningFromShop){
        if(state.pathFromShop.length == 0){
            //we've finished returning from shop
            state.returningFromShop = false
        }
        else{
            const next_move = state.pathFromShop.pop()
            move(next_move)
            return
        }
    }


    
    

    

    if(state.roomId === state.pirate_room_id && state.gold >= 1000){
        //change name
    }

    let graph = state.roomGraph;
    let roomId = state.room_id;

    let exits = Object.values(graph[roomId])
    console.log(exits)
    console.log("State:")
    console.log(state)
    

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

statusUpdate = () =>{
    axios({
        method: 'post',
        url: `${BASEURL}/api/adv/status/`,
        headers: {
            "Content-Type": "Application/json",
            "Authorization": `Token ${AUTHTOKEN}`
        }
    })
        .then(res =>{
            state.encumbrance = res.data.encumbrance
            state.strength = res.data.strength
            state.inventory = res.data.inventory
            state.gold = res.data.gold
            console.log(`Messages: ${res.data.messages}`)
            console.log(`Cooldown: ${res.data.cooldown}`)
            state.needStatusUpdate = false
            setTimeout(gameManager, res.data.cooldown * 1000)
        })
}

move = (direction) =>{

    const requestObject = {
        "direction": direction
    }
    
    axios({
        method: 'post',
        url: `${BASEURL}/api/adv/move/`,
        data: requestObject,
        headers: {
            "Content-Type": "Application/json",
            "Authorization": `Token ${AUTHTOKEN}`
        }
    })
        .then(res =>{
            console.log(`Moving from room ${state.room_id}: ${state.room_title} to room ${res.data.room_id}: ${res.data.room_title}`)

            //Add room to graph if it isn't there
            if(!(res.data.room_id in state.roomGraph)){
                state.roomGraph[res.data.room_id] = {}
                res.data.exits.map(exit =>{
                    state.roomGraph[res.data.room_id][exit] = "?"
                })
            }

            state.roomGraph[state.roomId][direction] = res.data.room_id
            state.roomGraph[res.data.room_id][rev_dirs[direction]] = state.roomId



            fs.appendFile('roomfile.txt', `${res.data.room_id} ${res.data.room_title}`, ()=> {})


            state.roomId = res.data.room_id;
            state.room_title = res.data.room_title;
            state.room_description = res.data.description;
            console.log(`Messages: ${res.data.messages}`)
            console.log(`Cooldown: ${res.data.cooldown}`)

            if(res.data.room_title.toLowerCase() === "shop"){
                state.shop_id = res.data.room_id
                console.log("Found the shop")
            }

            if(res.data.room_title.toLowerCase().includes("pirate")){
                state.pirate_room_id = res.data.room_id
                console.log(`Found the pirate in room ${res.data.room_id}`)
            } 
        })
        .catch(err =>{
            console.log(err)
        })

}

sell = item =>{
    const firstPostObject = {
        "name": item
    }

    axios({
        method: 'post',
        url: `${BASEURL}/api/adv/sell/`,
        headers: {
            "Content-Type": "Application/json",
            "Authorization": `Token ${AUTHTOKEN}`
        },
        data: firstPostObject
    })
        .then(res =>{

            console.log(res.data.messages)

            setTimeout(() => {confirmSale(item)}, res.data.cooldown * 1000)
        })
        .catch(err =>{
            console.log(err)
        })


}

confirmSale = item =>{
    postObject = {
        "name": item,
        "confirm": "yes"
    }

    axios({
        method: 'post',
        url: `${BASEURL}/api/adv/sell/`,
        headers: {
            "Content-Type": "Application/json",
            "Authorization": `Token ${AUTHTOKEN}`
        },
        data: postObject
    }).then(res =>{
        console.log(res.data.messages)
        state.needStatusUpdate = true
        setTimeout(gameManager, res.data.cooldown * 1000)
    })

}

pickUp = item =>{
    const postObject = {
        "name": item
    }

    axios({
        method: 'post',
        url: `${BASEURL}/api/adv/sell/`,
        headers: {
            "Content-Type": "Application/json",
            "Authorization": `Token ${AUTHTOKEN}`
        },
        data: postObject
    })
    .then(res =>{
        console.log(res.data.messages)
        state.needStatusUpdate = true

        setTimeout(gameManager, res.data.cooldown * 1000)
    })
    .catch(err =>{
        console.log(err)
    })
}

buildPath = targetRoom =>{
    let queue = new Queue()
    let visited = [];
    let pathObject = {};
    queue.enqueue(state.roomId);
    pathObject[state.roomId] = []

    while(queue.size() > 0){
        currentRoom = queue.dequeue()

        exits = Object.keys(state.roomGraph[currentRoom])
        exits.map(direction =>{
            room = state.roomGraph[currentRoom][direction]

            if(visited.indexOf(room) === -1 && room != "?"){
                queue.enqueue(room)
                pathObject[room] = [...pathObject[currentRoom]].push(direction)

                if(room == targetRoom){
                    console.log(`Found path to ${target}`)
                    state.headingToShop = true
                    state.pathToShop = pathObject[room]
                    return
                }
            }
        })
    }

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
