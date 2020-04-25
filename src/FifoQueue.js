
export class Queue {

	constructor() {
	    this.items = [];
  	}

	enqueue(item)	{
		this.items.push(item);
	}

	dequeue() { 
		if(this.isEmpty()) {
			console.log("underflow!");
		    return; 
		}
		    
		return this.items.shift(); 
	} 

	size() 
	{ 
	    return this.items.length; 
	} 

	peek()
	{
		return this.items;
	}

	isEmpty() 
	{ 
	    return this.items.length == 0; 
	} 
}