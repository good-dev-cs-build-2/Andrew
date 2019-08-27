const Queue = require('./queue');

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

    init = () =>{
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

            if (res.data.items){
                this.roomItems = res.data.items
            }
            else{
                this.roomItems = []
            }

            this.roomGraph[this.room_id] = {}
            res.data.exits.map(exit =>{
                this.roomGraph[this.room_id][exit] = "?"
            })
        })
        .catch(err => console.log(err))
    }

    move = (dir, next) =>{
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
                console.log(`Moving from room ${this.room_id} to room ${res.data.room_id}`)
                this.room_id = res.data.room_id;
                this.room_title = res.data.room_title;
                this.room_description = res.data.description;
                this.cooldown = res.data.cooldown
                this.exits = res.data.exits
                console.log(`Messages: ${res.data.messages}`)

                if(this.room_title.toLowerCase() === "shop"){
                    this.shop_id = res.data.room_id
                    console.log("Found the shop")
                }
            })
            .catch(err =>{
                console.log(err)
            })

    }

    currentStatus = () =>{
        axios({
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
            })
    }

    resetTimer = () =>{
        this.timer = Date.now()
    }

    cooldownDelay = () =>{
        while(Date.now() - this.timer < this.cooldown * 1000){

        }

        //reset cooldown to infinity so we don't 
        //accidentally call next while waiting on server response
        this.cooldown = Infinity

        return
    }

    sellItems = () =>{
        console.log("Selling items not yet implemented")
    }

    //Take shortest path to shop, sell items
    //Return so as to not break recursion function
    returnToShop = () =>{

        pathToShop = bfs(self.shop_id)
        pathBack = [...pathToShop].reverse()

        pathToShop.map(direction =>{
            self.cooldownDelay()
            self.move(direction, self.roomGraph[self.room_id][direction])
        })

        self.sellItems()

        pathBack.map(direction =>{
            self.cooldownDelay()
            self.move(direction, self.roomGraph[self.room_id][direction])            
        })

    }


    bfs = (target) =>{
        visited = []
        path_object = {}
        this.queue.enqueue(this.room_id)
        path_object[this.room_id] = [this.room_id]

        while(this.queue.size() !== 0){
            currentRoom = this.queue.dequeue()
            this.roomGraph[currentRoom].keys().map(room =>{
                if(visited.indexOf(room) === -1){
                    q.enqueue(room)
                    path_object[room] = [...path_object[current]].push(room)
                    if(room === target){
                        return path_object[room]
                    }
                }
            })
        }
    }


}

module.exports = Player