//This is so no stable it's not even funny so be prepared for breakage.
//In node or chrome it requires you somehow load the included direct-proxies shim.
//I haven't set this up to work in Firefox correctly yet but it should basically be done by loading the shim unmodified (without the V8 wrapper).
//That said, it's pretty awesome if it you manage to get everything in the right place and it doesn't break.
//The expected result is illustrated as follows:

//var reify = require('./') //in this directory.
//var Pixel = reify('Pixel', { x: 'Uint32', y: 'Uint32', color: { r: 'Uint8', g: 'Uint8', b: 'Uint8' } });
//var red = Pixel({ x: 100, y: 100, color: { r: 255, g: 0, b: 0 } });
//console.log(red); //should look indentical to the object passed to Pixel
//console.log(reify.unwrap(red)._data) //should give the underlying DataBuffer

if (!module.proxyLoaded && typeof Proxy === 'object') {
  require('direct-proxies');
  module.proxyLoaded = true;
}

var reified = require('reified');

var wrapmap = new WeakMap;
var typemap = new WeakMap;
var proxies = new WeakMap;

function unwrapIface(o){ return wrapmap.get(o) }
function unwrapType(o){ return typemap.get(o) }
function unwrap(o){ return proxies.get(o) }
reified.unwrap = unwrap;

function dataWrap(data){
  var iface = {
    array: function(){ return Array.apply(null, Array(data.length)) },
    struct: function(){ return {} },
    numeric: function(){ return new Number },
    bitfield: function(){ return {} }
  }[data.DataType]();

  wrapmap.set(iface, data);
  typemap.set(iface, data.constructor);
  var proxy = Proxy(iface, handler(data));
  proxies.set(proxy, data);
  return proxy;
}



Array.isArray = function(orig){
  return function isArray(){
    var arr = arguments[0];
    if (Object(arr) === arr && proxies.has(arr)) {
      return unwrap(arr).DataType === 'array';
    } else {
      return orig(arr);
    }
  }
}(Array.isArray);

function unique(a){
  return Object.keys(a.reduce(function(r,s){ r[s]=1; return r },{}));
}

function rewrap(target, property){
  var val = unwrapIface(target)[property];
  return val.DataType === 'numeric' ? val.reify() : dataWrap(val);
}

function typeWrap(o){
  var proxy = Proxy(o, TypeHandler);
  wrapmap.set(proxy, o);
  return proxy;
}

var TypeHandler = {
  apply: function(target, receiver, args){
    return dataWrap(Reflect.construct(target, args));
  },
  construct: function(target, args){
    return dataWrap(Reflect.construct(target, args));
  }
};

function handler(of){
  if (of.DataType in DataHandler) {
    var handle = DataHandler[of.DataType];
  } else {
    var handle = DataHandler.prototype;
  }
  return Proxy({}, {
    get: function(t, trap){
      return function(target, name, args){
        if (trap === 'apply') name = '[[Call]]';
        if (trap === 'construct') args = name, name = '[[Construct]]';
        if (trap in handle) {
          var res = handle[trap].apply(handle, arguments);
        } else {
          var res = Reflect[trap].apply(handle, arguments);
        }
        //console.log(trap, name, res);
        return res;
      }
    }
  });
}

function DataHandler(type, traps){
  DataHandler[type] = this;
  this.type = type;
  for (var k in traps) {
    this[k] = traps[k];
  }
}

DataHandler.prototype = {
  getOwnPropertyNames: function(target){
    return unique(unwrapType(target).keys.concat(Reflect.getOwnPropertyNames(target)));
  },
  keys: function(target){
    return unique(unwrapType(target).keys.concat(Reflect.keys(target)));
  },
  getOwnPropertyDescriptor: function(target, name){
    var ret = Reflect.getOwnPropertyDescriptor(target, name);
    if (ret && ~unwrapType(target).keys.indexOf(name)) {
      ret.value = rewrap(target, name);
    }
    return ret;
  },
  enumerate: function(target){
    return Reflect.enumerate(target);
  },
  iterate: function(target){
    return Reflect.iterate(target);
  },
  get: function(target, name, receiver){
    if (name === '__proto__') {
      return Object.getPrototypeOf(target);
    } else if (~unwrapType(target).keys.indexOf(name)) {
      return rewrap(target, name);
    } else {
      return Reflect.get(target, name, receiver);
    }
  },
  set: function(target, name, value, receiver){
    if (name === '__proto__') {
      target.__proto__ = value;
    } else if (~unwrapType(target).keys.indexOf(name)) {
      unwrap(target)[name] = value;
    } else {
      Reflect.set(target, name, value, receiver);
    }
  },
  apply: function(target, receiver, args){
    return unwrapIface(target);
  }
};

new DataHandler('array', {});

new DataHandler('struct', {});


var reify = module.exports = Proxy(reified, {
  apply: function(target, receiver, args){
    return typeWrap(Reflect.apply(target, receiver, args));
  },
  construct: function(target, args){
    return dataWrap(Reflect.construct(target, args));
  }
});


/*

var traps = {
  getOwnPropertyDescriptor  : ['target', 'name']                       , //->  desc | undefined
  getOwnPropertyNames       : ['target']                               , //->  [ string ]
  defineProperty            : ['target', 'name', 'descriptor']         , //->  boolean
  preventExtensions         : ['target']                               , //->  boolean
  freeze                    : ['target']                               , //->  boolean
  seal                      : ['target']                               , //->  boolean
  deleteProperty            : ['target', 'name']                       , //->  boolean
  hasOwn                    : ['target', 'name']                       , //->  boolean
  has                       : ['target', 'name']                       , //->  boolean
  get                       : ['target', 'name', 'receiver']           , //->  any
  set                       : ['target', 'name', 'value', 'receiver']  , //->  boolean
  enumerate                 : ['target']                               , //->  [ string ]
  iterate                   : ['target']                               , //->  iterator
  keys                      : ['target']                               , //->  [ string ]
  apply                     : ['target', 'receiver', 'args']           , //->  any
  construct                 : ['target', 'args']                       , //->  any
};
*/