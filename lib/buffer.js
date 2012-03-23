"use strict";


module.exports = DataBuffer;

var types = ['Int8', 'Int16', 'Int32', 'Uint8', 'Uint16', 'Uint32', 'Float32', 'Float64'];

function bits(n){ return Math.log(n) / Math.LN2 }
function bytesFor(n){ return ((bits(n) / 8) | 0) + 1 }

function copy(to, from){
  Object.keys(from).forEach(function(key){
    var desc = Object.getOwnPropertyDescriptor(from, key);
    Object.defineProperty(to, key, desc);
  });
  return to;
}


// if (typeof Buffer !== 'function'){
//   var Buffer = function Buffer(subject, offset, length){
//     return new ArrayBuffer(subject, offset, length);
//   }
//   Buffer.isBuffer = function isBuffer(o){
//     return o instanceof ArrayBuffer;
//   }
// }


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
    this.view = (offset || length) ? new DataView(subject, offset || 0, length) :  new DataView(subject);
  } else if (DataBuffer.isDataBuffer(subject)) {
    this.view = new DataView(subject.buffer, offset, length);
  }
  this.bytes = this.view.byteLength;
  this.buffer = this.view.buffer;
  this.offset = this.view.byteOffset;
}

DataBuffer.isDataBuffer = function isDataBuffer(o){ return DataBuffer.prototype.isPrototypeOf(o) }

function toNum(n){ return isFinite(n) ? +n : 0 }
function toNumOrUndef(n){ if (isFinite(n)) return +n }
function toUint8(x) { return (x >>> 0) & 0xff }

DataBuffer.prototype = {
  constructor: DataBuffer,
  endianness: 'BE',
  subarray: function(start, end){
    start = toNum(start);
    end = toNumOrUndef(end - start);
    return new DataBuffer(this.buffer, start, end);
  },
  typed: function(type, offset, length){
    type = ArrayBuffers[type+'Array'];
    var maxLength = this.bytes / type.BYTES_PER_ELEMENT | 0;
    offset = toNum(offset);
    length = toNum(length) || maxLength - offset;
    return new type(this.buffer, offset, length)
  },
  copy: function(target, targetOffset, start, end){
    if (isFinite(target)) {
      end = start, start = targetOffset, targetOffset = target;
      target = null;
    }
    targetOffset = toNum(targetOffset);
    start = toNum(start);
    end = toNum(end) || this.bytes - start;
    if (start > end) throw new Error('End less than start');
    if (start < 0) throw new RangeError('Start less than zero');
    if (end > this.bytes) throw new RangeError('End outside buffer');
    var length = end - start;
    if (!target) {
      target = new Buffer(length);
    } else {
      if (target.length < length) length = target.length;
    }

    var buffer = new DataBuffer(target, targetOffset, length);
    var source = this.subarray(start, end);
    for (var i=0; i<length; i++) {
      buffer.writeUint8(i, source.readUint8(i));
    }
    return buffer;
  },
  clone: function(){
    var buffer = new DataBuffer(this.buffer);
    for (var i=0; i<this.offset-1; i++) {
      buffer.writeUint8(i, this.readUint8(i));
    }
    return buffer;
  },
  fill: function(v){
    v = toNum(v);
    var buff = new Uint8Array(this.buffer);
    for (var i=0; i < this.offset; i++) {
      buff[i] = v;
    }
  },
  map: function(){
    return [].map.apply(this.typed('Uint8'), arguments);
  },
  slice: function(offset, length, encoding){
    offset = toNum(offset);
    var end = isFinite(length) ? toNum(length) + offset : this.bytes - offset;
    return this.subarray(offset, end).toString(encoding || 'ascii');
  },
  inspect: function(){
    return '<DataBuffer '+this.bytes+'b>';
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
    return this.view['get'+type](toNum(offset), this.endianness === 'BE');
  }
  DataBuffer.prototype['write'+type] = function(offset, value){
    return this.view['set'+type](toNum(offset), toNum(value), this.endianness === 'BE');
  }
});


Array.apply(null, Array(20)).forEach(function(n, index){
  Object.defineProperty(DataBuffer.prototype, index, {
    configurable: true,
    get: function(){ return this.readUint8(index) },
    set: function(v){ return this.writeUint8(index, v) }
  })
});
