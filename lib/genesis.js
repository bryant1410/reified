"use strict";

var DataBuffer  = require('../lib/buffer');
var utility    = require('./utility');
var isObject   = utility.isObject;
var inspectors = utility.inspectors;
var EventEmitter = require('events').EventEmitter;

var hasProto = !!Function.__proto__;
var types = {};


module.exports = {
  Type: Type,
  Subtype: Subtype,
  lookupType: lookupType,
  registerType: registerType,
  types: types,
  isBuffer: function(o){
    return Buffer.isBuffer(o) || DataBuffer.isDataBuffer(o);
  },
  api: api,
  nullable: function(object, key){
    Object.defineProperty(object, key, nullable);
    delete object[key];
  }
};

var nullable = { value: undefined, writable: true, configurable: true };
var hidden = { configurable: true, writable: true, value: 0 };

function api(o, n, v){
  if (Object(n) === n) {
    Object.keys(n).forEach(function(k){
      api(o, k, n[k]);
    });
  } else {
    hidden.value = v;
    Object.defineProperty(o, n, hidden);
  }
}

function registerType(name, type){
  if (name in types) return types[name];
  if (name.length) return types[name] = type;
  return type;
}

function lookupType(name, label){
  if (typeof name === 'string') {
    if (name[name.length-1] === ']') {
      var count = name.match(/(.*)\[(\d+)\]$/);
      if (count) {
        var ArrayType = require('./array');
        name = count[1];
        count = +count[2];
        if (typeof label === 'string') {
          return new ArrayType(label, lookupType(name), count);
        } else {
          var type = lookupType(name);
          if (type === name) {
            return new ArrayType(name, count);
          } else {
            name = type.name + 'x' + count;
            return new ArrayType(name, type, count);
          }
        }
      }
    }
    return name in types ? types[name] : name;
  } else {
    return name;
  }
}


// ########################
// ### Genesis for Type ###
// ########################

function Type(ctor, proto){
  ctor.prototype = eval('(function Empty'+ctor.name.replace(/Type$/,'T')+'(){})');
  if (hasProto) {
    ctor.prototype.__proto__ = Type;
  } else {
    copy(Type, ctor.prototype);
  }
  ctor.prototype.Type = ctor.name;
  ctor.prototype.constructor = ctor,
  ctor.prototype.inspect = inspectors('Type', ctor.name);
  proto.inspect = inspectors('Data', ctor.name);
  ctor.prototype.prototype = copy(proto, Object.create(Data));
}

//Type.__proto__ = EventEmitter.prototype;

copy({
  Class: 'Type',
  toString: function toString(){ return '[object Type]' },
  array: function array(n){ return new (require('./array'))(this, n) },
  isInstance: function isInstance(o){ return this.prototype.isPrototypeOf(o) },
}, Type);

Array.apply(null, Array(20)).forEach(function(n, i){
  Object.defineProperty(Type, i, {
    configurable: true,
    get: function(){ return this.array(i) }
  });
});

function createInterface(type, name, ctor){
  var iface = Function(name+'Constructor', 'return function '+name+'(buffer, offset, values){ return new '+name+'Constructor(buffer, offset, values) }')(ctor);

  hidden.value = function rename(name){
    return ctor.prototype.constructor = createInterface(type, name, ctor);
  }
  Object.defineProperty(iface, 'rename', hidden);

  if (hasProto) {
    iface.__proto__ = type.prototype;
  } else {
    copy(type, iface);
  }

  iface.prototype = ctor.prototype;

  if (name) registerType(name, iface);
  return copy(ctor, iface);
}

function Subtype(name, bytes, ctor){
  ctor.bytes = bytes;
  ctor.prototype.bytes = bytes;
  ctor.prototype = copy(ctor.prototype, Object.create(this.prototype.prototype));
  return ctor.prototype.constructor = createInterface(this, name, ctor);
}


// ########################
// ### Genesis for Data ###
// ########################

var Data = Type.prototype = {
  __proto__: EventEmitter.prototype,
  Class: 'Data',
  toString: function toString(){ return '[object Data]' },
  rebase: function rebase(buffer){
    if (buffer == null) {
      buffer = new DataBuffer(this.bytes);
      buffer.fill(0);
    } else {
      buffer = new DataBuffer(buffer);
    }
    api(this, 'buffer', buffer);
  },
  realign: function realign(offset){
    api(this, 'offset', offset || 0);
  },
  clone: function clone(){
    return new this.constructor(this.buffer, this.offset);
  },
  copy: function copy(buffer, offset){
    var copied = new this.constructor(buffer, offset);
    this.buffer.copy(copied.buffer, copied.offset, this.offset, this.offset + this.bytes);
    return copied;
  },
  cast: function cast(type, align){
    if (typeof (type = lookupType(type)) === 'string') throw new TypeError('Unknown type "'+type+'"');
    if (type.bytes < this.bytes) throw new RangeError('Tried to cast to a smaller size "'+type.name+'"');
    if (this.buffer.length < type.bytes) throw new RangeError('Type is bigger than this buffer: "'+type.name+'"');
    align = (type.bytes === this.bytes || !align) ? 0 : align < 0 ? this.bytes-type.bytes : +align;
    return new type(this.buffer, this.offset + align);
  }
};


function copy(from, to, hidden){
  Object[hidden ? 'getOwnPropertyNames' : 'keys'](from).forEach(function(key){
    var desc = Object.getOwnPropertyDescriptor(from, key);
    desc.enumerable = false;
    Object.defineProperty(to, key, desc);
  });
  return to;
}
