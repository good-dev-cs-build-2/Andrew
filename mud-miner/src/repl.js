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
state.pathToPirate = []
state.room_title = ""
state.players = []
state.roomItems = []
BASEURL = "https://lambda-treasure-hunt.herokuapp.com";
AUTHTOKEN = "e837e4ce6747d03d96e727128d9cdc44a4c5cab7";

let miningRoom = 250


gameManager = () =>{
    
    console.log("\n\n")


    //pick up items in the room if we want
    // if we're not carrying too much
    // and we don't have enough gold yet
    // if(state.encumbrance < state.strength && state.gold < 1000){

    if(state.roomItems.length != 0){
        //and there are items in the room

        console.log(`Room Items: ${state.roomItems}`)

        let item = state.roomItems.pop()

        while(!item.includes("egg")){
            item = state.roomItems.pop()

            if(state.roomItems.length == 0){
                break
            }
        }

        //we've found the first item that contains the word treasure
        //or we've iterated through and there are no treasures
        if(item !== undefined){
            if(item.includes("egg")){
                //pick it up
                console.log(`Attempting to pick up ${item}`)
                pickUp(item)
                return
            }
        }
    }
    // }



    //Know when to go to the shop, and when to return

    // if(state.encumbrance >= state.strength){
    //     if(!state.headingToShop){
    //         console.log("Creating path to shop")
    //         //if we aren't heading to shop, we need to be
    //         buildPath(state.shop_id)
    //         return
    //     }

    //     //if we are heading to shop, don't need to do anything special
    // }

    // if(state.headingToShop && state.pathToShop.length > 0){
    //     const next_move = state.pathToShop.shift()
    //     state.pathFromShop.push(rev_dirs[next_move])
    //     console.log(`Moving ${next_move} from heading to shop traversal`)
    //     move(next_move)
    //     return
    // }

    // if(state.headingToShop && state.pathToShop.length == 0){
    //     //we're in the shop
    //     if(state.inventory.length == 0){
    //         //return from shop
    //         state.returningFromShop = true
    //         state.headingToShop = false
    //     }
    //     else{
    //         const itemToSell = state.inventory.pop()
    //         sell(itemToSell)
    //         return
            
    //     }
    // }


    // if(state.returningFromShop){
    //     if(state.pathFromShop.length == 0){
    //         //we've finished returning from shop
    //         state.returningFromShop = false
    //     }
    //     else{
    //         const next_move = state.pathFromShop.pop()
    //         console.log(`Moving ${next_move} from return from shop traversal`)
    //         move(next_move)
    //         return
    //     }
    // }


    // if(state.readyForNameChange && state.pirate_room_id != -1){
    //     //We're ready to change name and we know where to go

    //     if(state.room_id == state.pirate_room_id){
    //         //We're here!

    //         changeName()
    //         return
    //     }
    //     else{
    //         if(state.pathToPirate.length == 0){
    //             //we haven't built a path yet
    //             buildPath(state.pirate_room_id, false)
    //             return
    //         }
    //         else{
    //             //We have a path, just need to follow it
    //             const moveToPirate = state.pathToPirate.shift()
    //             console.log(`Moving ${moveToPirate} from pirate path traversal`)
    //             move(moveToPirate)
    //             return
    //         }
    //     }
    // }


    //We get here if: Not overencumbered, 
    //not going to/from shop, 
    //not ready to change name or just don't know where yet

    let graph = state.roomGraph;
    let roomId = state.room_id;

    // if(roomId == 250 || roomId == "250"){
    //     console.log('FOUND THE MINING ROOM BAYBAY')
    //     console.log(`People in mining room: `)
    //     return
    // }

    //prioritize south and east, since that's where the pirate is
    let exits = Object.keys(graph[roomId])
    if(exits.includes("n")){
        //West is an exit
        if(graph[roomId]["n"] == "?"){
            //West is unexplored
            move("n")
            state.returnStack.push("s")
            return
        }
    }

    if(exits.includes("w")){
        //east is an exit
        if(graph[roomId]["w"] == "?"){
            //east is unexplored
            move("w")
            state.returnStack.push("e")
            return
        }
    }

    if(exits.includes("e")){
        //south is an exit
        if(graph[roomId]["e"] == "?"){
            //south is unexplored
            move("e")
            state.returnStack.push("w")
            return
        }
    }

    if(exits.includes("s")){
        //north is an exit
        if(graph[roomId]["s"] == "?"){
            //north is unexplored
            move("s")
            state.returnStack.push("n")
            return
        }
    }

    //If we got here, everywhere was explored, time to turn back

    if(state.returnStack.length > 0){
        const retrace_move = state.returnStack.pop()
        move(retrace_move)
        return
    }

    
    

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
        state.room_title = res.data.title;
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
            "Content-Type": "application/json",
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
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${AUTHTOKEN}`
        },
        data: requestObject
        
    })
        .then(res =>{
            console.log(`Moving from room ${state.room_id} to room ${res.data.room_id}\n`)

            //Add room to graph if it isn't there
            if(!(res.data.room_id in state.roomGraph)){
                state.roomGraph[res.data.room_id] = {}
                res.data.exits.map(exit =>{
                    state.roomGraph[res.data.room_id][exit] = "?"
                })
            }

            console.log(`Exits: ${res.data.exits}`)

            state.roomGraph[state.room_id][direction] = res.data.room_id
            state.roomGraph[res.data.room_id][rev_dirs[direction]] = state.room_id


            console.log(`Items: ${res.data.items}`)

            state.room_id = res.data.room_id;
            state.room_title = res.data.title;
            state.room_description = res.data.description;
            state.roomItems = res.data.items
            console.log(`Coordinates: ${res.data.coordinates}`)
            state.players = res.data.players

            if(res.data.title.toLowerCase() === "shop"){
                state.shop_id = res.data.room_id
                console.log("Found the shop")
            }

            if(res.data.title.toLowerCase().includes("pirate")){
                state.pirate_room_id = res.data.room_id
                console.log(`Found the pirate in room ${res.data.room_id}`)
            } 

            setTimeout(gameManager, res.data.cooldown * 1000)
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
            "Content-Type": "application/json",
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
            "Content-Type": "application/json",
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
        url: `${BASEURL}/api/adv/take/`,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${AUTHTOKEN}`
        },
        data: postObject
    })
    .then(res =>{
        console.log(res.data)
        state.needStatusUpdate = true

        setTimeout(gameManager, res.data.cooldown * 1000)
    })
    .catch(err =>{
        console.log(err)
    })
}

buildPath = (targetRoom, shop = true) =>{
    let queue = new Queue()
    let visited = [];
    let pathObject = {};
    queue.enqueue(state.room_id);
    pathObject[state.room_id] = []

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
                    if(shop){
                        state.pathToShop = pathObject[room]
                    }
                    else{
                        //pirate
                        state.pathToPirate = pathObject[room]
                    }
                    
                    gameManager()
                    return
                }
            }
        })
    }


}

changeName = () =>{
    console.log("Going to attempt name change now")
    const postObject = {
        "name": "AWSafran"
    }

    axios({
        method: 'post',
        url: `${BASEURL}/api/adv/change_name/`,
        headers: {
            "Content-Type": "application/json",
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


init()

