const Queue = require('./queue');
var fs = require('fs')
const axios = require('axios')

class Player{
    constructor(){
        this.timer = Date.now()
        this.cooldown = Infinity
        this.roomGraph = {}
        this.queue = new Queue()
        this.BASEURL = "https://lambda-treasure-hunt.herokuapp.com";
        this.AUTHTOKEN = "e837e4ce6747d03d96e727128d9cdc44a4c5cab7";
        this.shop_id = null
        this.name_room_id = null
        this.gold = null
        this.strength = 10
        this.encumbrance = 0
        this.roomItems = []
        this.inventory = []
    }

    init(){
        console.log("inside init function")
        axios({
            method: 'get',
            url: `${this.BASEURL}/api/adv/init/`,
            headers: {
                "Authorization": `Token ${this.AUTHTOKEN}`
            }
        }).then(res => {
            this.resetTimer()
            this.room_id = res.data.room_id;
            this.room_title = res.data.room_title;
            this.room_description = res.data.description;
            this.cooldown = res.data.cooldown
            this.exits = res.data.exits
            console.log(`Messages: ${res.data.messages}`)
            console.log(`Cooldown: ${this.cooldown}`)

            if (res.data.items){
                this.roomItems = res.data.items
            }
            else{
                this.roomItems = []
            }

            //initilize graph with first room
            this.roomGraph[this.room_id] = {}
            res.data.exits.map(exit =>{
                this.roomGraph[this.room_id][exit] = "?"
            })

        })
        .catch(err => console.log(err))
    }

    move(dir, next){
        requestObject = {
            "direction": dir
        }
        //Get the wise traveler bonus if possible
        if(next !== "?"){
            requestObject["next_room_id"] = next
        }


        axios({
            method: 'post',
            url: `${this.BASEURL}/api/adv/move/`,
            data: requestObject,
            headers: {
                "Content-Type": "Application/json",
                "Authorization": `Token ${this.AUTHTOKEN}`
            }
        })
            .then(res =>{
                this.resetTimer()
                console.log(`Moving from room ${this.room_id}: ${this.room_title} to room ${res.data.room_id}: ${res.data.room_title}`)

                //Add room to graph if it isn't there
                //We'll get rid of "?" in the recursive function
                if(!(res.data.room_id in this.roomGraph)){
                    this.roomGraph[res.data.room_id] = {}
                    res.data.exits.map(exit =>{
                        this.roomGraph[res.data.room_id][exit] = "?"
                    })
                }

                fs.appendFile('roomfile.txt', `${res.data.room_id} ${res.data.room_title}`, ()=> {})


                this.room_id = res.data.room_id;
                this.room_title = res.data.room_title;
                this.room_description = res.data.description;
                this.cooldown = res.data.cooldown
                this.exits = res.data.exits
                console.log(`Messages: ${res.data.messages}`)
                console.log(`Cooldown: ${this.cooldown}`)

                if(this.room_title.toLowerCase() === "shop"){
                    this.shop_id = res.data.room_id
                    console.log("Found the shop")
                }
            })
            .catch(err =>{
                console.log(err)
            })

    }

    async currentStatus(){
        await axios({
            method: 'post',
            url: `${this.BASEURL}/api/adv/status/`,
            headers: {
                "Content-Type": "Application/json",
                "Authorization": `Token ${this.AUTHTOKEN}`
            }
        })
            .then(res =>{
                this.resetTimer()
                this.cooldown = res.data.cooldown
                this.encumbrance = res.data.encumbrance
                this.strength = res.data.strength
                this.inventory = res.data.inventory
                this.gold = res.data.gold
                console.log(`Messages: ${res.data.messages}`)
                console.log(`Cooldown: ${this.cooldown}`)
            })
    }

    resetTimer(){
        this.timer = Date.now()
    }

    cooldownDelay(cb, data){

        setTimeout((data) => cb(data), this.cooldown * 1000)

        // console.log(`In cooldown delay, cooldown is ${this.cooldown} seconds`)

        // while(Date.now() - this.timer < this.cooldown * 1000){

        // }

        // //reset cooldown to infinity so we don't 
        // //accidentally call next while waiting on server response
        // this.cooldown = Infinity

        // return
    }

    waitForAxios(){
        const timer = Date.now()
        console.log("Waiting for axios")

        while(Date.now() - timer < 5000){

        }
        console.log("Done waiting for axios")
    }

    async sellItems(){
        this.inventory.map(async (item) =>{
            requestObject = {
                name: item,
                confirm: 'yes'
            }
            this.cooldownDelay()
            await axios({
                method: 'post',
                url: `${this.BASEURL}/api/adv/sell/`,
                data: requestObject,
                headers: {
                    "Content-Type": "Application/json",
                    "Authorization": `Token ${this.AUTHTOKEN}`
                }
            })
                .then(res =>{
                    this.resetTimer()
                    this.cooldown = res.data.cooldown
                    console.log(`Messages: ${res.data.messages}`)
                    console.log(`Cooldown: ${this.cooldown}`)
                })
                .catch(err => console.log(err))
        })



    }

    async pickUpItems(){
        this.roomItems.map(async (item) =>{


            //only picking up treasure
            if (item.includes('treasure')){
                this.cooldownDelay()

                requestObject = {
                    "name": item
                }

                await axios({
                    method: 'post',
                    url: `${this.BASEURL}/api/adv/take/`,
                    data: requestObject,
                    headers: {
                        "Content-Type": "Application/json",
                        "Authorization": `Token ${this.AUTHTOKEN}`
                    }
                })
                    .then(res =>{
                        this.resetTimer()
                        this.cooldown = res.data.cooldown
                        console.log(`Messages: ${res.data.messages}`)
                        console.log(`Cooldown: ${this.cooldown}`)
                    })
                    .catch(err => console.log(err))
    
            }

        })

    }

    //Take shortest path to shop, sell items
    //Return so as to not break recursion function
    returnToShop(){

        console.log("Heading to shop")

        pathToShop = bfs(this.shop_id)
        pathBack = [...pathToShop].reverse()

        pathToShop.map(direction =>{
            this.cooldownDelay()
            this.move(direction, this.roomGraph[this.room_id][direction])
        })

        this.sellItems()

        this.cooldownDelay()
        this.currentStatus()

        console.log(`Sold all items, carrying ${this.gold} gold`)

        pathBack.map(direction =>{
            this.cooldownDelay()
            this.move(direction, this.roomGraph[this.room_id][direction])            
        })


    }

    returnHome(){
        console.log("heading home")

        pathHome = this.bfs("0")


        pathHome.map(direction =>{
            this.cooldownDelay()
            this.move(direction, this.roomGraph[this.room_id][direction])
        })
    }


    bfs(target){
        this.queue.clear()
        visited = []
        path_object = {}
        this.queue.enqueue(this.room_id)
        path_object[this.room_id] = []

        while(this.queue.size() !== 0){
            currentRoom = this.queue.dequeue()
            this.roomGraph[currentRoom].keys().map(direction =>{
                room = this.roomGraph[currentRoom][direction]
                if(visited.indexOf(room) === -1 && room !=="?"){
                    q.enqueue(room)
                    path_object[room] = [...path_object[current]].push(direction)
                    if(room === target){
                        console.log(`Found shortest path to room: ${path_object[room]}`)
                        return path_object[room]
                    }
                }
            })
        }
    }


}

module.exports = Player