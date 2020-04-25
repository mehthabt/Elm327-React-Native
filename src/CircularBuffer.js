
export class CircularBuffer {

	constructor() {
	    this.items = [];
	    this.itemsLimit = 3;
  	}

  	init(size) {
	    this.items = [];
	    this.itemsLimit = size;
  	}

	push(item)	{
		if(this.items.length >= this.itemsLimit) 
		{
		  this.items.shift();
		}

		this.items.push(item);
	}

	getItems()	{
		return this.items;
	}
}