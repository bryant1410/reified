var Type = require('../genesis').Type;
var Data = require('../genesis').Data;
var Proxy = require('direct-proxies').Proxy;
var VirtualHandler = Reflect.VirtualHandler;



// A shared private hash for storing the interneal properties for each interface instance
var internals = new WeakMap;


// Multistate meta-handler that allows the ability to implement branching functionality for an
// interface based on what state it's currently in. In this case we use the states to represent the
// differences between an interface to allocated memory and one that describes the data types.

StructHandler = Proxy({},{
  get: function(t, trap, r){
    return function(t){
      var props = internals.get(t);
      var state = props.currentState;
      if (!(trap in states[state])) {
        state = 'shared';
      }
      return states[state][trap].apply(props, arguments);
    }
  }
});

var states = {};

// A top level prototype function that will be the initial template

function StructType(){};
StructType.prototype.__proto__ = Type.prototype;
StructType.prototype.prototype = Object.create(Data.prototype);

module.exports = Proxy(StructType, StructHandler);



// Shared handlers for the properties which don't vary between states


states.shared = {
  __proto__: VirtualHandler,

  construct: function(t, args){
    var target = eval('(function '+args.shift()+'(){})');
    target.__proto__ = t.prototype;
    fields = args.shift();
    Object.defineProperty(fields, 'name', Object.getOwnPropertyDescriptor(target, 'name'));

    internals.set(target, {
      dataType: 'struct',
      currentState: 'free',
      fields: fields
    });
    return Proxy(target, StructHandler);
  },
  getOwnPropertyNames: function(t){
    return Reflect.getOwnPropertyNames(this.fields);
  },
  keys: function(t){
    return Reflect.keys(this.fields);
  },
  hasOwn: function(t, name){
    return name in this.fields;
  },
  has: function(t, name){
    return name in this.fields || name in Object.prototype;
  },
  enumerate: function(t){
    return Reflect.keys(this.fields);
  }
  //iterate: function(t){}
};

// The idle form is used pre-allocation or as an examplar for the constructor interface
// to produce instances versions of. It has no mapping to any real memory.

states.free = {
  getOwnPropertyDescriptor: function(t, name){
    if (name in this.fields) {
      return normal(Reflect.get(this.fields, name));
    }
  },
  defineProperty: function(t, name, desc){
    return Reflect.defineProperty(this.fields, name, desc);
  },
  deleteProperty: function(t, name){
    return Reflect.deleteProperty(this.fields, name);
  },
  get: function(t, name, recvr){
    return Reflect.get(this.fields, name, recvr);
  },
  set: function(t, name, val, recvr){
    return Reflect.set(this.fields, name, val, recvr);
  },
  //TODO the next four
  //apply: function(t, recvr, args){ },
  //preventExtensions: function(t){ },
  //freeze: function(t){ },
  //seal: function(t){ }
};



// The allocated version is similar semantically but it actually is responsible for
// a chunk of allocated memory and provides the interface to access it.

states.allocated = {
  getOwnPropertyDescriptor: function(t, name){
    if (name in this.fields) {
      return normal(props.buffer.get(props[name]));
    }
  },
  defineProperty: function(t, name, desc){
    if (name in this.fields) {
      this.buffer.set(this.fields[name], desc.value);
      return true;
    }
  },
  deleteProperty: function(t, name){
    if (name in this.fields) {
      this.buffer.set(this.fields[name], null);
    }
    return true;
  },
  get: function(t, name, recvr){
    if (name in this.fields) {
      return this.buffer.get(this.fields[name]);
    }
  },
  set: function(t, name, val, recvr){
    if (name in this.fields) {
      this.buffer.set(this.fields[name], val);
    }
  },
  //TODO the next four
  //apply: function(t, recvr, args){ },
  //preventExtensions: function(t){ },
  //freeze: function(t){ },
  //seal: function(t){ }
}


function normal(v){ return { value: v, enumerable: true, writable: true, configurable: true } }

