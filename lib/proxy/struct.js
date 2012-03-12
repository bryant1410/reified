var Type = require('../genesis').Type;
var Data = require('../genesis').Data;

var isbuffer = require('./mapped-buffer').isbuffer;

// A shared private hash for storing the interneal properties for each interface instance
var internals = new WeakMap;


// Multistate meta-handler that affords the ability to implement branching functionality for an
// interface based on what state it's currently in. In this case we use the states to represent the
// differences between an interface to allocated buffer and one that describes the data types.

StructHandler = Proxy({},{
  get: function(t, trap, r){
    return function(t){
      var props = internals.get(t);
      var state = props.state;
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
  __proto__: Reflect.VirtualHandler,

  construct: function(t, args){
    var target = eval('(function '+args.shift()+'(){})');
    target.__proto__ = t.prototype;
    fields = args.shift();

    internals.set(target, {
      dataType: 'struct',
      state: 'free',
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




// The free form is used pre-allocation or as an examplar for the constructor interface
// to produce instance versions from. It has no mapping to any real buffer.

states.free = {
  getOwnPropertyDescriptor: function(t, name){
    if (name in this.fields) {
      return EWC(Reflect.get(this.fields, name));
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
  apply: function(t, recvr, args){
    var self = this;
    this.buffer = args[0];
    this.bytes = Object.keys(this.fields).reduce(function(offset, field){
      var handler = self.fields[field](self.buffer, offset);

      self.fields[field] = {
        get: function( ){ return handler.read() },
        set: function(v){ handler.write(v) },
        type: self.fields[field]
      };

      return offset + field.bytes;
    }.bind(this), 0);
    this.state = 'allocated';
  },
  //preventExtensions: function(t){ },
  //freeze: function(t){ },
  //seal: function(t){ }
};



// The allocated version is similar semantically but it actually is responsible for
// a chunk of allocated buffer and provides the interface to access it.

states.allocated = {
  getOwnPropertyDescriptor: function(t, name){
    if (name in this.fields) {
      return EWC(this.fields[name].get());
    }
  },
  defineProperty: function(t, name, desc){
    if (name in this.fields) {
      this.fields[name].set(desc.value);
      return true;
    }
  },
  deleteProperty: function(t, name){
    if (name in this.fields) {
      this.fields[name].set(null);
    }
    return true;
  },
  get: function(t, name, recvr){
    if (name in this.fields) {
      return this.fields[name].get();
    }
  },
  set: function(t, name, val, recvr){
    if (name in this.fields) {
      this.fields[name].set(val);
    }
  },
  //TODO the next four
  //apply: function(t, recvr, args){ },
  //preventExtensions: function(t){ },
  //freeze: function(t){ },
  //seal: function(t){ }
}


function EWC(v){ return { value: v, enumerable: true, writable: true, configurable: true } }

