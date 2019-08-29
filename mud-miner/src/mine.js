const axios = require('axios')
const sha256 = require('js-sha256')
const BASEURL = "https://lambda-treasure-hunt.herokuapp.com"
const AUTHTOKEN = "e837e4ce6747d03d96e727128d9cdc44a4c5cab7"
const compareString = "000000000000000"
let state = {}



generateProof = () =>{
    let attempt
    if(state.rolling){
        attempt = state.rollingAttempt
        state.rolling = false
    }
    else{
        attempt = state.prevProof + 1
    }
    const startTime = Date.now()
    state.proofHash = sha256(`${state.prevProof}${attempt}`)

    while(!validProof()){
        attempt++
        state.proofHash = sha256(`${state.prevProof}${attempt}`)


        if(Date.now() - startTime > 35000){
            state.rollingAttempt = attempt
            state.rolling = true
            getProof()
            return
        }
    }

    console.log(`Difficulty: ${state.difficulty}, attempt: ${state.proofHash} in ${(Date.now() - startTime) / 1000} seconds`)
    submitProof(attempt)
    
}

validProof = () =>{
    if(compareString.includes(state.proofHash.substring(0, state.difficulty))){
        return true
    }
    else{
        return false
    }
}

getProof = () =>{
    axios({
        method: 'get',
        url: `${BASEURL}/api/bc/last_proof/`,
        headers: {
            "Authorization": `Token ${AUTHTOKEN}`
        }
    })
    .then(res =>{
        state.prevProof = res.data.proof
        state.difficulty = res.data.difficulty
        console.log(`Difficulty: ${res.data.difficulty}`)
        console.log(`Previous proof: ${res.data.proof}`)

        setTimeout(generateProof, res.data.cooldown * 1000)

    })
    .catch(err => console.log(err))
}

submitProof = attempt =>{
    const proofObject = {
        "proof": attempt
    }

    axios({
        method: 'post',
        url: `${BASEURL}/api/bc/mine/`,
        headers: {
            "Authorization": `Token ${AUTHTOKEN}`,
            "Content-Type": "application/json"
        },
        data: proofObject
    })
    .then(res =>{
        console.log(res.data)

        setTimeout(getProof, res.data.cooldown * 1000)
    })
    .catch(err =>{
        console.log(err)
    })
}

getProof()