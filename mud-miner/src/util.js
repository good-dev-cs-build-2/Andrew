class Queue(){
    constructor(){
        this.storage = [];
        this.currentIndex = 0;
        this.size = 0;
    }

    enqueue = value =>{
        this.storage.pop(value);
        this.size ++;
    }

    dequeue = () =>{
        rtnValue = this.storage[this.currentIndex];
        this.currentIndex ++;
        this.size --;
        return rtnValue;
    }

    size = () =>{
        return this.size
    }

}