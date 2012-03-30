var reified = function(global, imports){
!function(module, require){
imports['events'] = {};

Object.defineProperty(module, 'exports', {
  get: function(){ return imports['events'] },
  set: function(v){ imports['events'] = v }
});

// (The MIT License)
// Copyright (c) 2011 hij1nx http://www.twitter.com/hij1nx
// See either the included license for the full text or https://github.com/hij1nx/EventEmitter2

module.exports.EventEmitter = EventEmitter;


var isArray = Array.isArray;
var defaultMaxListeners = 10;

function init() {
  this._events = {};
}

function configure(conf) {
  if (conf) {
    conf.delimiter && (this.delimiter = conf.delimiter);
    conf.wildcard && (this.wildcard = conf.wildcard);
    if (this.wildcard) {
      this.listenerTree = {};
    }
  }
}

function EventEmitter(conf) {
  this._events = {};
  configure.call(this, conf);
}

//
// Attention, function return type now is array, always !
// It has zero elements if no any matches found and one or more
// elements (leafs) if there are matches
//
function searchListenerTree(handlers, type, tree, i) {
  if (!tree) {
    return [];
  }
  var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
      typeLength = type.length, currentType = type[i], nextType = type[i+1];
  if (i === typeLength && tree._listeners) {
    //
    // If at the end of the event(s) list and the tree has listeners
    // invoke those listeners.
    //
    if (typeof tree._listeners === 'function') {
      handlers && handlers.push(tree._listeners);
      return [tree];
    } else {
      for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
        handlers && handlers.push(tree._listeners[leaf]);
      }
      return [tree];
    }
  }

  if ((currentType === '*' || currentType === '**') || tree[currentType]) {
    //
    // If the event emitted is '*' at this part
    // or there is a concrete match at this patch
    //
    if (currentType === '*') {
      for (branch in tree) {
        if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
          listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
        }
      }
      return listeners;
    } else if(currentType === '**') {
      endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
      if(endReached && tree._listeners) {
        // The next element has a _listeners, add it to the handlers.
        listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
      }

      for (branch in tree) {
        if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
          if(branch === '*' || branch === '**') {
            if(tree[branch]._listeners && !endReached) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
            }
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
          } else if(branch === nextType) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
          } else {
            // No match on this one, shift into the tree but not in the type array.
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
          }
        }
      }
      return listeners;
    }

    listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
  }

  xTree = tree['*'];
  if (xTree) {
    //
    // If the listener tree will allow any match for this part,
    // then recursively explore all branches of the tree
    //
    searchListenerTree(handlers, type, xTree, i+1);
  }

  xxTree = tree['**'];
  if(xxTree) {
    if(i < typeLength) {
      if(xxTree._listeners) {
        // If we have a listener on a '**', it will catch all, so add its handler.
        searchListenerTree(handlers, type, xxTree, typeLength);
      }

      // Build arrays of matching next branches and others.
      for(branch in xxTree) {
        if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
          if(branch === nextType) {
            // We know the next element will match, so jump twice.
            searchListenerTree(handlers, type, xxTree[branch], i+2);
          } else if(branch === currentType) {
            // Current node matches, move into the tree.
            searchListenerTree(handlers, type, xxTree[branch], i+1);
          } else {
            isolatedBranch = {};
            isolatedBranch[branch] = xxTree[branch];
            searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
          }
        }
      }
    } else if(xxTree._listeners) {
      // We have reached the end and still on a '**'
      searchListenerTree(handlers, type, xxTree, typeLength);
    } else if(xxTree['*'] && xxTree['*']._listeners) {
      searchListenerTree(handlers, type, xxTree['*'], typeLength);
    }
  }

  return listeners;
}

function growListenerTree(type, listener) {

  type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

  //
  // Looks for two consecutive '**', if so, don't add the event at all.
  //
  for(var i = 0, len = type.length; i+1 < len; i++) {
    if(type[i] === '**' && type[i+1] === '**') {
      return;
    }
  }

  var tree = this.listenerTree;
  var name = type.shift();

  while (name) {

    if (!tree[name]) {
      tree[name] = {};
    }

    tree = tree[name];

    if (type.length === 0) {

      if (!tree._listeners) {
        tree._listeners = listener;
      }
      else if(typeof tree._listeners === 'function') {
        tree._listeners = [tree._listeners, listener];
      }
      else if (isArray(tree._listeners)) {

        tree._listeners.push(listener);

        if (!tree._listeners.warned) {

          var m = defaultMaxListeners;

          if (typeof this._events.maxListeners !== 'undefined') {
            m = this._events.maxListeners;
          }

          if (m > 0 && tree._listeners.length > m) {

            tree._listeners.warned = true;
            console.error('(node) warning: possible EventEmitter memory ' +
                          'leak detected. %d listeners added. ' +
                          'Use emitter.setMaxListeners() to increase limit.',
                          tree._listeners.length);
            console.trace();
          }
        }
      }
      return true;
    }
    name = type.shift();
  }
  return true;
};

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.

EventEmitter.prototype.delimiter = '.';

EventEmitter.prototype.setMaxListeners = function(n) {
  this._events || init.call(this);
  this._events.maxListeners = n;
};

EventEmitter.prototype.event = '';

EventEmitter.prototype.once = function(event, fn) {
  this.many(event, 1, fn);
  return this;
};

EventEmitter.prototype.many = function(event, ttl, fn) {
  var self = this;

  if (typeof fn !== 'function') {
    throw new Error('many only accepts instances of Function');
  }

  function listener() {
    if (--ttl === 0) {
      self.off(event, listener);
    }
    fn.apply(this, arguments);
  };

  listener._origin = fn;

  this.on(event, listener);

  return self;
};

EventEmitter.prototype.emit = function() {
  this._events || init.call(this);

  var type = arguments[0];

  if (type === 'newListener') {
    if (!this._events.newListener) { return false; }
  }

  // Loop through the *_all* functions and invoke them.
  if (this._all) {
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
    for (i = 0, l = this._all.length; i < l; i++) {
      this.event = type;
      this._all[i].apply(this, args);
    }
  }

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._all && !this._events.error && !(this.wildcard && this.listenerTree.error)) {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
    }
  }

  var handler;

  if(this.wildcard) {
    handler = [];
    var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
    searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
  }
  else {
    handler = this._events[type];
  }

  if (typeof handler === 'function') {
    this.event = type;
    if (arguments.length === 1) {
      handler.call(this);
    }
    else if (arguments.length > 1)
      switch (arguments.length) {
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        // slower
        default:
          var l = arguments.length;
          var args = new Array(l - 1);
          for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
          handler.apply(this, args);
      }
    return true;
  }
  else if (handler) {
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      this.event = type;
      listeners[i].apply(this, args);
    }
    return (listeners.length > 0) || this._all;
  }
  else {
    return this._all;
  }

};

EventEmitter.prototype.on = function(type, listener) {

  if (typeof type === 'function') {
    this.onAny(type);
    return this;
  }

  if (typeof listener !== 'function') {
    throw new Error('on only accepts instances of Function');
  }
  this._events || init.call(this);

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if(this.wildcard) {
    growListenerTree.call(this, type, listener);
    return this;
  }

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  }
  else if(typeof this._events[type] === 'function') {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }
  else if (isArray(this._events[type])) {
    // If we've already got an array, just append.
    this._events[type].push(listener);

    // Check for listener leak
    if (!this._events[type].warned) {

      var m = defaultMaxListeners;

      if (typeof this._events.maxListeners !== 'undefined') {
        m = this._events.maxListeners;
      }

      if (m > 0 && this._events[type].length > m) {

        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }
  }
  return this;
};

EventEmitter.prototype.onAny = function(fn) {

  if(!this._all) {
    this._all = [];
  }

  if (typeof fn !== 'function') {
    throw new Error('onAny only accepts instances of Function');
  }

  // Add the function to the event listener collection.
  this._all.push(fn);
  return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prototype.off = function(type, listener) {
  if (typeof listener !== 'function') {
    throw new Error('removeListener only takes instances of Function');
  }

  var handlers,leafs=[];

  if(this.wildcard) {
    var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
    leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
  }
  else {
    // does not use listeners(), so no side effect of creating _events[type]
    if (!this._events[type]) return this;
    handlers = this._events[type];
    leafs.push({_listeners:handlers});
  }

  for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
    var leaf = leafs[iLeaf];
    handlers = leaf._listeners;
    if (isArray(handlers)) {

      var position = -1;

      for (var i = 0, length = handlers.length; i < length; i++) {
        if (handlers[i] === listener ||
          (handlers[i].listener && handlers[i].listener === listener) ||
          (handlers[i]._origin && handlers[i]._origin === listener)) {
          position = i;
          break;
        }
      }

      if (position < 0) {
        return this;
      }

      if(this.wildcard) {
        leaf._listeners.splice(position, 1)
      }
      else {
        this._events[type].splice(position, 1);
      }

      if (handlers.length === 0) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }
    else if (handlers === listener ||
      (handlers.listener && handlers.listener === listener) ||
      (handlers._origin && handlers._origin === listener)) {
      if(this.wildcard) {
        delete leaf._listeners;
      }
      else {
        delete this._events[type];
      }
    }
  }

  return this;
};

EventEmitter.prototype.offAny = function(fn) {
  var i = 0, l = 0, fns;
  if (fn && this._all && this._all.length > 0) {
    fns = this._all;
    for(i = 0, l = fns.length; i < l; i++) {
      if(fn === fns[i]) {
        fns.splice(i, 1);
        return this;
      }
    }
  } else {
    this._all = [];
  }
  return this;
};

EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    !this._events || init.call(this);
    return this;
  }

  if(this.wildcard) {
    var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
    var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      leaf._listeners = null;
    }
  }
  else {
    if (!this._events[type]) return this;
    this._events[type] = null;
  }
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if(this.wildcard) {
    var handlers = [];
    var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
    searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
    return handlers;
  }

  this._events || init.call(this);

  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

EventEmitter.prototype.listenersAny = function() {

  if(this._all) {
    return this._all;
  }
  else {
    return [];
  }

};


}({}, function(n){ return imports[n] });


!function(module, require){
imports['./utility'] = {};

Object.defineProperty(module, 'exports', {
  get: function(){ return imports['./utility'] },
  set: function(v){ imports['./utility'] = v }
});

"use strict";

module.exports = {
  isObject: isObject,
  bytes: bytes,
  bits: bits,
  indent: indent,
  pad: pad,
  maxLength: maxLength,
  unique: unique,
  strlen: strlen
};

function isObject(o){ return Object(o) === o }

function bits(n){ return Math.log(n) / Math.LN2 }
function bytes(n){ return ((bits(n) / 8) | 0) + 1 }

function indent(str, amount){
  var space = Array((amount||2)+1).join(' ');
  return str.split('\n').map(function(line){ return space+line }).join('\n');
}

function pad(str, len){
  len -= strlen(str||'') + 1;
  return str + Array(len > 1 ? len : 1).join(' ');
}

function strlen(str){
  return str.replace(/\033\[(?:\d+;)*\d+m/g, '').length;
}

function maxLength(array){
  if (!Array.isArray(array)) {
    if (!isObject(array)) throw new TypeError('Max length called on non-object ' + array);
    array = Object.keys(array);
  }
  return array.reduce(function(max, item){ return Math.max(max, strlen(''+item)) }, 0);
}

function unique(a){
  return Object.keys(a.reduce(function(r,s){ return r[s]=1,r },{}));
}

}({}, function(n){ return imports[n] });


!function(module, require){
imports['./buffer'] = {};

Object.defineProperty(module, 'exports', {
  get: function(){ return imports['./buffer'] },
  set: function(v){ imports['./buffer'] = v }
});

"use strict";


module.exports = DataBuffer;

var types = ['Int8', 'Int16', 'Int32', 'Uint8', 'Uint16', 'Uint32', 'Float32', 'Float64'];

// Basic stand-in for Buffer in browsers that defers to ArrayBuffer
var Buffer = function(global){
  if ('Buffer' in global) return global.Buffer;

  function Buffer(subject, offset, length){
    return new ArrayBuffer(subject, offset, length);
  }
  Buffer.isBuffer = function isBuffer(o){
    return o instanceof ArrayBuffer;
  }
  return Buffer;
}(Function('return this')());

var ArrayBuffers = { ArrayBuffer:  ArrayBuffer };

function isArrayBuffer(o){
  return o instanceof ArrayBuffer || !!(o && o.constructor && o.constructor.name in ArrayBuffers);
}


function DataBuffer(subject, offset, length){
  if (!DataBuffer.prototype.isPrototypeOf(this)) return new DataBuffer(subject, offset, length);
  if (!subject) throw new Error('Tried to initialize with no usable length or subject');
  if (isArrayBuffer(subject)) {
    this.array = subject;
  }
  if (subject.buffer) {
    offset = (subject.offset || subject.byteOffset || 0) + (offset || 0);
    while (subject.buffer) subject = subject.buffer;
  }
  if (typeof subject === 'number') {
    this.view = new DataView(new Buffer(subject));
  } else if (Buffer.isBuffer(subject)) {
    this.view = new DataView(subject, offset, length);
  } else if (subject instanceof DataView) {
    offset = offset || subject.byteOffset;
    length = length || subject.byteLength;
    this.view = new DataView(subject.buffer, offset, length);
  } else if (DataBuffer.isDataBuffer(subject)) {
    this.view = new DataView(subject.buffer, subject.offset + offset, length || subject.length);
  }
  this.length = this.view.byteLength;
  this.buffer = this.view.buffer;
  this.offset = this.view.byteOffset;
}

DataBuffer.isBuffer = Buffer.isBuffer;
DataBuffer.isDataBuffer = function isDataBuffer(o){ return DataBuffer.prototype.isPrototypeOf(o) }

function toNum(n){ return isFinite(n) ? +n : 0 }
function toNumOrUndef(n){ if (isFinite(n)) return +n }
function toUint8(x) { return (x >>> 0) & 0xff }

DataBuffer.prototype = {
  constructor: DataBuffer,
  endianness: 'LE',

  subarray: function(start, end){
    start = toNum(start);
    end = toNumOrUndef(end);
    return new DataBuffer(this.view, start, end);
  },

  typed: function(type, offset, length){
    type = ArrayBuffers[type+'Array'];
    offset = toNum(offset);
    length = toNum(length) || this.length / type.BYTES_PER_ELEMENT | 0;
    return new type(this.view, offset, length)
  },

  copy: function(target, targetOffset, start, end){
    if (isFinite(target)) {
      end = start, start = targetOffset, targetOffset = target;
      target = null;
    }
    targetOffset = toNum(targetOffset);
    start = toNum(start);
    end = end ? +end : this.length - 1;
    if (start > end) throw new Error('End less than start');
    if (start < 0) throw new RangeError('Start less than zero');
    if (end >= this.length) throw new RangeError('End greater than length');
    var length = end - start;
    if (!target) {
      target = new Buffer(length);
    } else if (targetOffset + length > target.length) {
      length = target.length;
    }

    target = new DataBuffer(target, targetOffset, length).typed('Uint8');
    var source = this.subarray(start, end).typed('Uint8');
    for (var i=0; i<length; i++) {
      target[i] = source[i];
    }
    return target;
  },

  clone: function(){
    var buffer = new DataBuffer(new Buffer(this.length));
    for (var i=0; i < this.length; i++) {
      buffer.writeUint8(i, this.readUint8(i));
    }
    return buffer;
  },

  fill: function(v){
    v = toNum(v);
    var buff = this.typed('Uint8');
    for (var i=0; i < this.length; i++) {
      buff[i] = v;
    }
  },

  map: function(){
    return [].map.apply(this.typed('Uint8'), arguments);
  },

  slice: function(start, end, encoding){
    return this.subarray(start, end).toString(encoding || 'ascii');
  },

  toArray: function(type){
    return [].map.call(this.typed(type || 'Uint8'), function(x){ return x });
  },

  toString: function(encoding){
    switch (encoding) {
      case 'ascii':
        return this.map(function(val){
          return String.fromCharCode(val);
        }).join('');
      default:
        return this.map(function(v){
          return ('000'+v.toString(10)).slice(-3)
        })
          .join(' ')
          .split(/((?:\d\d\d ?){10}(?: ))/)
          .filter(Boolean)
          .map(Function.call.bind(''.trim))
          .join('\n')
    }
  }
}

types.forEach(function(type){
  ArrayBuffers[type+'Array'] = global[type+'Array'];
  DataBuffer.prototype['read'+type] = function(offset){
    return this.view['get'+type](toNum(offset), this.endianness === 'LE');
  }
  DataBuffer.prototype['write'+type] = function(offset, value){
    return this.view['set'+type](toNum(offset), toNum(value), this.endianness === 'LE');
  }
});


Array.apply(null, Array(20)).forEach(function(n, index){
  Object.defineProperty(DataBuffer.prototype, index, {
    configurable: true,
    get: function(){ return this.readUint8(index) },
    set: function(v){ return this.writeUint8(index, v) }
  })
});


}({}, function(n){ return imports[n] });


!function(module, require){
imports['./genesis'] = {};

Object.defineProperty(module, 'exports', {
  get: function(){ return imports['./genesis'] },
  set: function(v){ imports['./genesis'] = v }
});

"use strict";

var DataBuffer  = require('./buffer');
var utility    = require('./utility');
var isObject   = utility.isObject;
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
  if (typeof name === 'string') {
    if (name[name.length-1] === ']') {
      var count = name.match(/(.*)\[(\d+)\]$/);
      if (count) {
        var ArrayType = require('./array');
        var CharType = require('./string');
        name = count[1];
        count = +count[2];
        if (name === 'Char') {
          return new CharType(count);
        }
        if (typeof label === 'string') {
          return new ArrayType(label, lookupType(name), count);
        } else {
          if (type === 'Char') {
            return new CharType(count);
          }
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
  ctor.prototype.constructor = ctor;
  if (typeof imports === 'undefined') {
    ctor.prototype.inspect = require('./inspect')('Type', ctor.name);
    proto.inspect = require('./inspect')('Data', ctor.name);
  }
  ctor.prototype.prototype = copy(proto, Object.create(Data));
}

copy({
  Class: 'Type',
  toString: function toString(){ return '[object '+this.name+'Type]' },
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
  name = name.replace(/[^\w0-9_$]/g, '');
  var iface = Function(name+'Constructor', 'return function '+name+'(data, offset, values){ return new '+name+'Constructor(data, offset, values) }')(ctor);

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
  toString: function toString(){ return '[object '+this.constructor.name+']' },
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


}({}, function(n){ return imports[n] });


!function(module, require){
imports['./numeric'] = {};

Object.defineProperty(module, 'exports', {
  get: function(){ return imports['./numeric'] },
  set: function(v){ imports['./numeric'] = v }
});

"use strict";

var bits         = require('./utility').bits;
var genesis      = require('./genesis');
var NumericSubtype = genesis.Subtype.bind(NumericType);


module.exports = NumericType;


var types = {
     Int8: 1,
    Uint8: 1,
    Int16: 2,
   Uint16: 2,
    Int32: 4,
   Uint32: 4,
  Float32: 4,
  Float64: 8
};


/**
 * Coerce to number when appropriate and verify number against type storage
 */
function checkType(type, val){
  if (val && val.DataType) {
    if (val.DataType === 'numeric' && val.Subtype === 'Int64' || val.Subtype === 'Uint64') {
      if (type === 'Int64' || type === 'Uint64') {
        return val._data;
      } else {
        throw new RangeError(val + ' exceeds '+type+' capacity');
      }
    } else if (val.DataType === 'array' || val.DataType === 'struct') {
      if (val.bytes > types[type][0]) {
        throw new RangeError(val + ' exceeds '+type+' capacity');
      } else {
        val = val.reify();
      }
    } else {
      val = val.reify();
    }
  }
  if (!val) val = 0;
  if (typeof val === 'undefined') val = 0;
  if (isFinite(val)) {
    val = +val;
  } else {
    throw new TypeError('Invalid value for ' + type + ': ' + val.DataType);
  }
  if (val && bits(val) / 8 > types[type][0]) {
    throw new RangeError(val + ' exceeds '+type+' capacity');
  }
  return val;
}



// ###############################
// ### NumericType Constructor ###
// ###############################

function NumericType(name, bytes){

  // ############################
  // ### NumericT Constructor ###
  // ############################

  function NumericT(data, offset, value){
    if (typeof data === 'number' || !data) {
      value = data;
      data = null;
    }
    this.rebase(data);
    genesis.api(this, '_offset', +offset || 0);

    if (value != null) {
      this.write(value);
    }
    this.emit('construct');
  }

  // #####################
  // ### NumericT Data ###
  // #####################

  NumericT.prototype = {
    Subtype: name,
    write: function write(v){
      this._data['write'+name](this._offset, checkType(name, v));
      return this;
    },
    reify: function reify(deallocate){
      var val = this.reified = this._data['read'+name](this._offset);
      this.emit('reify', val);
      val = this.reified;
      delete this.reified;
      return val;
    },
  };

  return NumericSubtype(name, bytes, NumericT);
}


// ########################
// ### NumericType Data ###
// ########################

genesis.Type(NumericType, {
  DataType: 'numeric',
  fill: function fill(v){ this.write(0, v || 0) },
});


Object.keys(types).forEach(function(name){
  NumericType[name] = new NumericType(name, types[name]);
});


}({}, function(n){ return imports[n] });


!function(module, require){
imports['./struct'] = {};

Object.defineProperty(module, 'exports', {
  get: function(){ return imports['./struct'] },
  set: function(v){ imports['./struct'] = v }
});

"use strict";
var isObject      = require('./utility').isObject;
var genesis       = require('./genesis');
var StructSubtype = genesis.Subtype.bind(StructType);

module.exports = StructType;


// ##############################
// ### StructType Constructor ###
// ##############################

function StructType(name, fields){
  if (!fields) {
    fields = name;
    name = '';
  }

  var bytes = 0;
  var offsets = {};
  var keys = [];

  fields = Object.keys(fields).reduce(function(ret, name){
    ret[name] = genesis.lookupType(fields[name]);
    keys.push(name);
    offsets[name] = bytes;
    bytes += ret[name].bytes;
    return ret;
  }, {});

  // ###########################
  // ### StructT Constructor ###
  // ###########################

  function StructT(data, offset, values){
    if (!genesis.isBuffer(data)) {
      values = data;
      data = null;
    }
    this.rebase(data);
    genesis.api(this, '_offset', +offset || 0);

    if (values) {
      Object.keys(values).forEach(function(field){
        if (!field in fields) throw new Error('Invalid field "'+field+'"');
        field in fields && initField(this, StructT, field).write(values[field]);
     }, this);
    }
    this.emit('construct');
  }

  StructT.fields = fields;
  StructT.offsets = offsets;
  StructT.keys = keys;

  return defineFields(StructSubtype(name, bytes, StructT));
}

function initField(target, ctor, field){
  var block = new ctor.fields[field](target._data, target._offset + ctor.offsets[field]) ;
  Object.defineProperty(target, field, {
    enumerable: true,
    configurable: true,
    get: function(){ return block },
    set: function(v){
      if (v === null) {
        this.emit('deallocate', field);
        genesis.nullable(this, field);
        block = null;
      } else {
        block.write(v);
      }
    }
  });
  return block;
}

function defineFields(target){
  target.keys.forEach(function(field){
    Object.defineProperty(target.prototype, field, {
      enumerable: true,
      configurable: true,
      get: function(){ return initField(this, target, field) },
      set: function(v){ initField(this, target, field).write(v) }
    });
  });
  return target;
}

// #######################
// ### StructType Data ###
// #######################

genesis.Type(StructType, {
  DataType: 'struct',

  reify: function reify(deallocate){
    this.reified = this.constructor.keys.reduce(function(ret, field){
      ret[field] = this[field] == null ? initField(this, this.constructor, field).reify(deallocate) : this[field].reify(deallocate);
      if (deallocate) this[field] = null;
      return ret;
    }.bind(this), {});
    this.emit('reify', this.reified);
    var val = this.reified;
    delete this.reified;
    return val;
  },

  write: function write(o){
    if (isObject(o)) {
      if (o.reify) o = o.reify();
      Object.keys(o).forEach(function(field, current){
        current = o[field];
        if (current != null) {
          this[field] = current.reify ? current.reify() : current;
        } else if (current === null) {
          this[field] = null;
        }
      }, this);
    }
  },

  realign: function realign(offset, deallocate){
    this._offset = offset = +offset || 0;
    // use realiagn as a chance to DEALLOCATE since everything is being reset essentially
    Object.keys(this).forEach(function(field){
      if (deallocate) this[field] = null;
      else this[field].realign(offset);
    }, this);
  },

  fill: function fill(val){
    val = val || 0;
    this.constructor.keys.forEach(function(field){
      this[field] = val;
    }, this);
  },
});


}({}, function(n){ return imports[n] });


!function(module, require){
imports['./array'] = {};

Object.defineProperty(module, 'exports', {
  get: function(){ return imports['./array'] },
  set: function(v){ imports['./array'] = v }
});

"use strict";
var genesis = require('./genesis');
var ArraySubtype = genesis.Subtype.bind(ArrayType);

module.exports = ArrayType;

// #############################
// ### ArrayType Constructor ###
// #############################

function ArrayType(name, MemberType, length) {
  if (typeof name !== 'string' || typeof MemberType === 'number') {
    length = MemberType || 0;
    MemberType = genesis.lookupType(name);
    name = MemberType.name + 'x'+length;
  } else {
    MemberType = genesis.lookupType(MemberType);
  }
  if (genesis.lookupType(name) !== name) return genesis.lookupType(name);
  var bytes = MemberType.bytes * length;

  // ##########################
  // ### ArrayT Constructor ###
  // ##########################

  function ArrayT(data, offset, values){
    if (!genesis.isBuffer(data)) {
      values = data;
      data = null;
    }
    this.rebase(data);
    genesis.api(this, '_offset', offset || 0);

    values && Object.keys(values).forEach(function(i){
      initIndex(this, this.constructor.memberType, i).write(values[i]);
    }, this);
    this.emit('construct');
  }

  ArrayT.memberType = MemberType;
  ArrayT.keys = Array.apply(null, Array(length)).map(Function.call.bind(String));
  ArrayT.count = length;
  ArrayT.prototype.length = length;

  return defineIndices(ArraySubtype(name, bytes, ArrayT));
}


function initIndex(target, MemberType, index){
  var block = new MemberType(target._data, target._offset + index * MemberType.bytes);
  Object.defineProperty(target, index, {
    enumerable: true,
    configurable: true,
    get: function(){ return block },
    set: function(v){
      if (v === null) {
        this.emit('deallocate', index);
        genesis.nullable(this, index);
        block = null;
      } else {
        block.write(v)
      }
    }
  });
  return block;
}

function defineIndices(target){
  Array.apply(null, Array(target.count)).forEach(function(n, index){
    Object.defineProperty(target.prototype, index, {
      enumerable: true,
      configurable: true,
      get: function(){ return initIndex(this, target.memberType, index) },
      set: function(v){ initIndex(this, target.memberType, index).write(v) }
    });
  });
  return target;
}

// ######################
// ### ArrayType Data ###
// ######################

genesis.Type(ArrayType, {
  DataType: 'array',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,

  reify: function reify(deallocate){
    this.reified = [];
    for (var i=0; i < this.length; i++) {
       this.reified[i] = this[i].reify(deallocate);
      if (deallocate) this[i] = null;
    }
    this.emit('reify', this.reified);
    var output = this.reified;
    delete this.reified;
    return output;
  },

  write: function write(value, index, offset){
    if (value == null) throw new TypeError('Tried to write nothing');

    if (isFinite(index) && typeof offset === 'undefined' && !value.length) {
      // writing to specific index
      return this[index] = value;
    }

    index = +index || 0;
    offset = +offset || 0;

    // reify if needed, direct buffer copying doesn't happen here
    value = value.reify ? value.reify() : value;

    if (value && value.length) {
      // arrayish and offset + index are already good to go
      for (var index; index < this.length && index+offset < value.length; index++) {
        if (value[offset+index] === null) {
          this[index] = null;
        } else {
          this[index] = value[offset+index];
        }
      }
    } else {
      // last ditch, something will throw an error if this isn't an acceptable type
      this[index] = offset ? value[offset] : value;
    }
  },

  fill: function fill(val){
    val = val || 0;
    for (var i=0; i < this.length; i++) {
      this[i] = val;
    }
  },

  realign: function realign(offset, deallocate){
    this._offset = offset = +offset || 0;
    // use realiagn as a chance to deallocate since everything is being reset essentially
    Object.keys(this).forEach(function(i){
      if (isFinite(i)) {
        if (deallocate) this[i] = null;
        else this[i].realign(offset);
      }
    }, this);
  },
});


}({}, function(n){ return imports[n] });


!function(module, require){
imports['./bitfield'] = {};

Object.defineProperty(module, 'exports', {
  get: function(){ return imports['./bitfield'] },
  set: function(v){ imports['./bitfield'] = v }
});

"use strict";

var utility  = require('./utility');
var genesis  = require('./genesis');
var bytesFor = utility.bytes;
var bits     = utility.bits;
var BitfieldSubtype = genesis.Subtype.bind(BitfieldType);

var powers = Array.apply(null, Array(32)).map(Function.call.bind(Number)).map(Math.pow.bind(null, 2));

module.exports = BitfieldType;

// ################################
// ### BitfieldType Constructor ###
// ################################

function BitfieldType(name, flags, bytes){
  if (typeof name !== 'string') {
    bytes = flags;
    flags = name;
    name = '';
  }
  if (typeof flags === 'number') {
    bytes = flags;
    flags = [];
  }

  if (Array.isArray(flags)) {
    flags = flags.reduce(function(ret, name, index){
      ret[name] = 1 << index;
      return ret;
    }, {});
  }

  if (!(bytes > 0)) {
    bytes = bytesFor(max(flags)) ;
  }

  // #############################
  // ### BitfieldT Constructor ###
  // #############################

  function BitfieldT(data, offset, values) {
    if (!genesis.isBuffer(data)) {
      values = data || 0;
      data = null;
    }
    this.rebase(data);
    genesis.api(this, '_offset', +offset || 0);

    if (Array.isArray(values)) {
      values.forEach(function(flag){ this[flag] = true }, this);
    } else if (typeof values === 'number') {
      this.write(values);
    } else if (Object(values) === values){
      Object.keys(values).forEach(function(key){ this[key] = values[key] }, this);
    }
    this.emit('construct');
  };

  BitfieldT.keys = flags;

  // ######################
  // ### BitfieldT Data ###
  // ######################

  BitfieldT.prototype = {
    flags: flags,
    length: bytes * 8,
    toString: function toString(){
      return this === BitfieldT.prototype
                      ? '[object '+name+']'
                      : this.map(function(v){ return +v }).join('');
    }
  };

  return defineFlags(BitfieldSubtype(name, bytes, BitfieldT));
}


function defineFlags(target) {
  var largest = 0;
  Object.keys(target.keys).forEach(function(flag){
    var val = target.keys[flag];
    largest = Math.max(largest, val);
    Object.defineProperty(target.prototype, flag, {
      configurable: true,
      enumerable: true,
      get: function( ){ return (this.read() & val) > 0 },
      set: function(v){ this.write(v ? this.read() | val : this.read() & ~val) }
    })
  });
  Array.apply(null, Array(target.bytes * 8)).forEach(function(n, i){
    var power = powers[i];
    if (power > largest) return;
    Object.defineProperty(target.prototype, i, {
      configurable: true,
      enumerable: true,
      get: function( ){ return (this.read() & power) > 0 },
      set: function(v){ this.write(v ? this.read() | power : this.read() & ~power) }
    });
  });
  return target;
}



// #########################
// ### BitfieldType Data ###
// #########################

genesis.Type(BitfieldType, {
  DataType: 'bitfield',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,
  get: function get(i){
    return (this.read() & powers[i]) > 0;
  },
  set: function get(i){
    this.write(this.read() | powers[i]);
    return this;
  },
  unset: function unset(i){
    this.write(this.read() & ~powers[i]);
    return this;
  },
  write: function write(v){
    this._data['writeUint'+this.bytes*8](this._offset, v);
    return this;
  },
  read: function read(){
    return this._data['readUint'+this.bytes*8](this._offset);
  },
  reify: function reify(deallocate){
    var flags = Object.keys(this.flags);
    if (flags.length) {
        var val = this.reified = flags.reduce(function(ret, flag, i){
          if (this[flag]) ret.push(flag);
        return ret;
      }.bind(this), []);
    } else {
      var val = this.map(function(v){ return v });
    }
    this.emit('reify', val);
    val = this.reified;
    delete this.reified;
    if (deallocate) {
      this.emit('deallocate');
      delete this._data;
      delete this._offset;
    }
    return val;
  }
});

function max(arr){
  if (Array.isArray(arr)) return arr.reduce(function(r,s){ return Math.max(s, r) }, 0);
  else return Object.keys(arr).reduce(function(r,s){ return Math.max(arr[s], r) }, 0);
}

}({}, function(n){ return imports[n] });


!function(module, require){
imports['./index'] = {};

Object.defineProperty(module, 'exports', {
  get: function(){ return imports['./index'] },
  set: function(v){ imports['./index'] = v }
});

var genesis      = require('./genesis');
var DataBuffer   = require('./buffer');
var NumericType  = require('./numeric');
var StructType   = require('./struct');
var ArrayType    = require('./array');
var BitfieldType = require('./bitfield');
var CharType     = require('./string');



module.exports = reified;

function reified(type, subject, size, values){
  type = genesis.lookupType(type);
  if (reified.prototype.isPrototypeOf(this)) {
    return new type(subject, size, values);
  } else {
    subject = genesis.lookupType(subject);
    if (!subject) {
      if (type && type.name === 'CharArrayT') {
      }
      return type
    }
    if (subject === 'Char') return new CharType(type);
    if (typeof type === 'string') {
      if (subject.Class === 'Type') return subject.rename(type);
    }
    if (typeof subject === 'string' || subject.Class === 'Type') {
      return new reified.ArrayType(type, subject, size);
    } else if (typeof type === 'undefined') {
      console.log(subject)
    } else if (Array.isArray(subject) || typeof subject === 'number') {
      return new reified.BitfieldType(type, subject, size);
    } else {
      if (typeof type !== 'string' && typeof subject === 'undefined') {
        subject = type;
        type = '';
      }
      subject = Object.keys(subject).reduce(function(ret, key){
        if (subject[key].Class !== 'Type') {
          var fieldType = reified(subject[key]);
          if (!fieldType) return ret;
          if (typeof fieldType === 'string' || fieldType.Class !== 'Type') {
            ret[key] = reified(key, subject[key]);
          } else {
            ret[key] = fieldType;
          }
        } else {
          ret[key] = subject[key];
        }
        return ret;
      }, {});
      return new reified.StructType(type, subject);
    }
  }
}

// ## static functions

reified.data = function data(type, buffer, offset, values){
  type = genesis.lookupType(type);
  if (typeof type === 'string') throw new TypeError('Type not found "'+type+'"');
  return new type(buffer, offset, values);
}

reified.reify = function reify(data){
  return Object.getPrototypeOf(data).reify.call(data);
}

reified.isType = function isType(o){ return genesis.Type.isPrototypeOf(o) }
reified.isData = function isData(o){ return genesis.Type.prototype.isPrototypeOf(o) }

Object.defineProperty(reified, 'defaultEndian', {
  enumerable: true,
  configurable: true,
  get: function(){
    return DataBuffer.prototype.endianness;
  },
  set: function(v){
    if (v !== 'LE' && v !== 'BE') throw new Error('Endianness must be "BE" or "LE"');
    DataBuffer.prototype.endianness = v;
  }
});

// ## structures
genesis.api(reified, {
  Type:         genesis.Type,
  NumericType:  NumericType,
  StructType:   StructType,
  ArrayType:    ArrayType,
  BitfieldType: BitfieldType,
  DataBuffer:   DataBuffer,
  toString:     function toString(){ return '◤▼▼▼▼▼▼▼◥\n▶reified◀\n◣▲▲▲▲▲▲▲◢' },
});

function isSame(arr1, arr2){
  return !diff(arr1, arr2).length;
}

function diff(arr1, arr2){
  return arr1.filter(function(item){
    return !~arr2.indexOf(item);
  });
}

NumericType.Uint64 = new ArrayType('Uint64', 'Uint32', 2);
NumericType.Int64 = new ArrayType('Int64', 'Int32', 2);

var OctetString = new ArrayType('EightByteOctetString', 'Uint8', 8);

function octets(){ return new OctetString(this._data, this._offset) }
NumericType.Uint64.prototype.octets = octets;
NumericType.Int64.prototype.octets = octets;



}({}, function(n){ return imports[n] });

return imports["./index"];
}(this, {});
if (typeof module !=="undefined") module.exports = reified

/* 
 * DataView.js:
 * An implementation of the DataView class on top of typed arrays.
 * Useful for Firefox 4 which implements TypedArrays but not DataView.
 *
 * Copyright 2011, David Flanagan
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 *
 *   Redistributions of source code must retain the above copyright notice, 
 *   this list of conditions and the following disclaimer.
 *
 *   Redistributions in binary form must reproduce the above copyright notice, 
 *   this list of conditions and the following disclaimer in the documentation.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE 
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT 
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT 
 * OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

(function(global) {
    // If DataView already exists, do nothing
    if (global.DataView) return;

    // If ArrayBuffer is not supported, fail with an error
    if (!global.ArrayBuffer) fail("ArrayBuffer not supported");

    // If ES5 is not supported, fail
    if (!Object.defineProperties) fail("This module requires ECMAScript 5");

    // Figure if the platform is natively little-endian.
    // If the integer 0x00000001 is arranged in memory as 01 00 00 00 then
    // we're on a little endian platform. On a big-endian platform we'd get
    // get bytes 00 00 00 01 instead.
    var nativele = new Int8Array(new Int32Array([1]).buffer)[0] === 1;

    // A temporary array for copying or reversing bytes into.
    // Since js is single-threaded, we only need this one static copy
    var temp = new Uint8Array(8);

    // The DataView() constructor
    global.DataView = function DataView(buffer, offset, length) {
        if (!(buffer instanceof ArrayBuffer)) fail("Bad ArrayBuffer");

        // Default values for omitted arguments
        offset = offset || 0;
        length = length || (buffer.byteLength - offset);

        if (offset < 0 || length < 0 || offset+length > buffer.byteLength)
            fail("Illegal offset and/or length");

        // Define the 3 read-only, non-enumerable ArrayBufferView properties
        Object.defineProperties(this, {
            buffer: {
                value: buffer,
                enumerable:false, writable: false, configurable: false
            },
            byteOffset: {
                value: offset,
                enumerable:false, writable: false, configurable: false
            },
            byteLength: {
                value: length,
                enumerable:false, writable: false, configurable: false
            },
            _bytes: {
                value: new Uint8Array(buffer, offset, length),
                enumerable:false, writable: false, configurable: false
            }
        });
    }

    // The DataView prototype object
    global.DataView.prototype = {
        constructor: DataView,
        
        getInt8: function getInt8(offset) {
            return get(this, Int8Array, 1, offset);
        },
        getUint8: function getUint8(offset) {
            return get(this, Uint8Array, 1, offset);
        },
        getInt16: function getInt16(offset, le) {
            return get(this, Int16Array, 2, offset, le);
        },
        getUint16: function getUint16(offset, le) {
            return get(this, Uint16Array, 2, offset, le);
        },
        getInt32: function getInt32(offset, le) {
            return get(this, Int32Array, 4, offset, le);
        },
        getUint32: function getUint32(offset, le) {
            return get(this, Uint32Array, 4, offset, le);
        },
        getFloat32: function getFloat32(offset, le) {
            return get(this, Float32Array, 4, offset, le);
        },
        getFloat64: function getFloat32(offset, le) {
            return get(this, Float64Array, 8, offset, le);
        },

        
        setInt8: function setInt8(offset, value) {
            set(this, Int8Array, 1, offset, value);
        },
        setUint8: function setUint8(offset, value) {
            set(this, Uint8Array, 1, offset, value);
        },
        setInt16: function setInt16(offset, value, le) {
            set(this, Int16Array, 2, offset, value, le);
        },
        setUint16: function setUint16(offset, value, le) {
            set(this, Uint16Array, 2, offset, value, le);
        },
        setInt32: function setInt32(offset, value, le) {
            set(this, Int32Array, 4, offset, value, le);
        },
        setUint32: function setUint32(offset, value, le) {
            set(this, Uint32Array, 4, offset, value, le);
        },
        setFloat32: function setFloat32(offset, value, le) {
            set(this, Float32Array, 4, offset, value, le);
        },
        setFloat64: function setFloat64(offset, value, le) {
            set(this, Float64Array, 8, offset, value, le);
        }
    };

    // The get() utility function used by the get methods
    function get(view, type, size, offset, le) {
        if (offset === undefined) fail("Missing required offset argument");

        if (offset < 0 || offset + size > view.byteLength)
            fail("Invalid index: " + offset);

        if (size === 1 || !!le === nativele) { 
            // This is the easy case: the desired endianness 
            // matches the native endianness.

            // Typed arrays require proper alignment.  DataView does not.
            if ((view.byteOffset + offset) % size === 0) 
                return (new type(view.buffer, view.byteOffset+offset, 1))[0];
            else {
                // Copy bytes into the temp array, to fix alignment
                for(var i = 0; i < size; i++) 
                    temp[i] = view._bytes[offset+i];
                // Now wrap that buffer with an array of the desired type
                return (new type(temp.buffer))[0];
            }
        }
        else {
            // If the native endianness doesn't match the desired, then
            // we have to reverse the bytes
            for(var i = 0; i < size; i++)
                temp[size-i-1] = view._bytes[offset+i];
            return (new type(temp.buffer))[0];
        }
    }

    // The set() utility function used by the set methods
    function set(view, type, size, offset, value, le) {
        if (offset === undefined) fail("Missing required offset argument");
        if (value === undefined) fail("Missing required value argument");

        if (offset < 0 || offset + size > view.byteLength)
            fail("Invalid index: " + offset);

        if (size === 1 || !!le === nativele) { 
            // This is the easy case: the desired endianness 
            // matches the native endianness.
            if ((view.byteOffset + offset) % size === 0) {
                (new type(view.buffer,view.byteOffset+offset, 1))[0] = value;
            }
            else {
                (new type(temp.buffer))[0] = value;
                // Now copy the bytes into the view's buffer
                for(var i = 0; i < size; i++)
                    view._bytes[i+offset] = temp[i];
            }
        }
        else {
            // If the native endianness doesn't match the desired, then
            // we have to reverse the bytes
            
            // Store the value into our temporary buffer
            (new type(temp.buffer))[0] = value;

            // Now copy the bytes, in reverse order, into the view's buffer
            for(var i = 0; i < size; i++)
                view._bytes[offset+i] = temp[size-1-i];
        }
    }

    function fail(msg) { throw new Error(msg); }
}(this));
