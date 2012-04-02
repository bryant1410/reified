"use strict";

var DataBuffer  = require('./buffer');
var utility    = require('./utility');
var isObject   = utility.isObject;

var hasProto = !!Function.__proto__;
var types = {};


module.exports = {
  Type: Type,
  Subtype: Subtype,
  lookupType: lookupType,
  registerType: registerType,
  types: types,
  isBuffer: function(o){
    return DataBuffer.isBuffer(o) || DataBuffer.isDataBuffer(o);
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
  if (typeof name !== 'string') {
    return name;
  }

  // pointer type
  if (name[0] === '*') {
    name = name.slice(1);
    var type = lookupType(name);
    if (typeof type !== 'string') {
      if (typeof label === 'string') {
        name = label;
      }
      return createType('pointer', name, type);
    }
  }

  if (name[name.length-1] === ']') {
    var count = name.match(/(.*)\[(\d+)\]$/);
    if (!count) {
      return name in types ? types[name] : name;
    }

    name = count[1];
    count = +count[2];
    if (name === 'Char') {
      return new superTypes['CharArray'](count);
    }
    if (typeof label === 'string') {
      return createType('array', label, lookupType(name), count);
    } else {
      if (type === 'Char') {
        return createType('string', count);
      }
      var type = lookupType(name);
      if (type === name) {
        return createType('array', name, count);
      } else {
        name = type.name + 'x' + count;
        return createType('array', name, type, count);
      }
    }
  }

  return name in types ? types[name] : name;
}


// ########################
// ### Genesis for Type ###
// ########################

var superTypes = {};

function createType(name, a, b, c){
  var type = require('./'+name);
  return new type(a, b, c);
}

function Type(ctor, proto){
  ctor.prototype = eval('(function Empty'+ctor.name.replace(/Type$/,'T')+'(){})');
  if (hasProto) {
    ctor.prototype.__proto__ = Type;
  } else {
    copy(Type, ctor.prototype);
  }
  ctor.prototype.Type = ctor.name;
  ctor.prototype.constructor = ctor;
  if (typeof imports === 'undefined') {
    ctor.prototype.inspect = require('./inspect')('Type', ctor.name);
    proto.inspect = require('./inspect')('Data', ctor.name);
  }
  ctor.prototype.prototype = copy(proto, Object.create(Data));
  types[ctor.name.replace(/Type$/,'')] = ctor;
}

copy({
  Class: 'Type',
  toString: function toString(){ return '[object '+this.name+'Type]' },
  array: function array(n){ return createType('array', this, n) },
  isInstance: function isInstance(o){ return this.prototype.isPrototypeOf(o) },
}, Type);

Array.apply(null, Array(20)).forEach(function(n, i){
  Object.defineProperty(Type, i, {
    configurable: true,
    get: function(){ return this.array(i) }
  });
});
Object.defineProperty(Type, 'ptr', {
  configurable: true,
  get: function(){ return createType('pointer', this) }
});

function createInterface(type, name, ctor){
  var functionName = name.replace(/[^\w0-9_$]/g, '');
  if (name[0] === '*') {
    var count = name.match(/^[*]+/)[0].length;
    functionName = Array(count + 1).join('Ptr_') + functionName;
  }
  var src = 'return function '+functionName+'(data, offset, values){ return new '+functionName+'Ctor(data, offset, values) }';
  var iface = Function(functionName+'Ctor', src)(ctor);

  api(iface, 'rename', function rename(name){
    return ctor.prototype.constructor = createInterface(type, name, ctor);
  })
  api(iface, 'displayName', name);

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
  //__proto__: EventEmitter.prototype,
  Class: 'Data',
  toString: function toString(){ return '[object '+this.constructor.displayName+']' },
  rebase: function rebase(data){
    if (data == null) {
      data = new DataBuffer(this.bytes);
      data.fill(0);
    } else if (data._data) {
      data = new DataBuffer(data._data);
    } else {
      data = new DataBuffer(data);
    }
    api(this, '_data', data);
  },
  realign: function realign(offset){
    this._offset = +offset || 0;
  },
  clone: function clone(){
    return new this.constructor(this._data, this._offset);
  },
  copy: function copy(data, offset){
    return new this.constructor(this._data.clone());
  },
  cast: function cast(type, align){
    if (typeof (type = lookupType(type)) === 'string') throw new TypeError('Unknown type "'+type+'"');
    if (type.bytes < this.bytes) throw new RangeError('Tried to cast to a smaller size "'+type.name+'"');
    if (this._data.length < type.bytes) throw new RangeError('Type is bigger than this buffer: "'+type.name+'"');
    align = (type.bytes === this.bytes || !align) ? 0 : align < 0 ? this.bytes-type.bytes : +align;
    return new type(this._data, this._offset + align);
  },
  ptr: function ptr(){
    var pointerType = lookupType('*'+this.constructor.displayName);
    return new pointerType(this);
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
