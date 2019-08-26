const AUTHTOKEN = "e837e4ce6747d03d96e727128d9cdc44a4c5cab7";
const axios = require('axios');
const BASEURL = "https://lambda-treasure-hunt.herokuapp.com";

const moveRequest = (direction, next=null) =>{
    if(next === null){
        requestObject = {
            direction: direction
        }
    }
    else{
        requestObject = {
            direction: direction,
            next_room_id: next
        }
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
            console.log(res)
        })
        .catch(err =>{
            console.log(err)
        })

}

moveRequest("n")