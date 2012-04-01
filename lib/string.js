"use strict";

var genesis = require('./genesis');
var DataBuffer  = require('./buffer');
var numeric = require('./numeric');
var ArrayType = require('./array');
var StringSubtype = genesis.Subtype.bind(CharArrayType);

module.exports = CharArrayType;


var char = String.fromCharCode;
var code = Function.call.bind(''.charCodeAt);

var ucs2 = function(){
  var a = 0x3ff,
      o = 0x10000,
      x = o - 0x800,
      y = o - 0x2400,
      z = o - 0x2800;
  return function ucs2(v) {
    if (typeof v === 'string') {
      var r = code(v, 0);
      return r & x === z ? o + ((r & a) << 10) + (code(v, 1) & a) : r;
    } else if (isFinite(v)) {
      return v >= o ? char((v -= o) >>> 10 & a | z) + char(y | v & a) : char(v);
    }
  }
}()


var cache = [];

function CharArrayType(data, offset, value){
  var length;
  if (typeof data === 'number') {
    length = data;
    data = null;
  } else if (typeof data === 'string') {
    length = data.length;
    value = data;
    data = null;
  } else if (data.bytes || data.byteLength) {
    length = data.bytes || data.byteLength;
  }
  var bytes = length;

  if (!(bytes in cache)) {
    var CharArray = StringSubtype('CharArray'+bytes, bytes, function CharArray(data, offset, value){
      if (!data) data = new DataBuffer(this.bytes);
      this.rebase(data);
      genesis.api(this, '_offset', offset || 0);

      value && this.write(value);
      this.emit('construct');
    });
    CharArray.bytes = bytes;
    CharArray.prototype.bytes = bytes;
    cache[bytes] = CharArray;
  } else {
    var CharArray = cache[bytes];
  }

  if (data || value) {
    if (!data) data = new DataBuffer(bytes || value);
    return new CharArray(data, offset, value);
  } else {
    return CharArray;
  }
}

genesis.Type(CharArrayType, {
  DataType: 'string',
  Subtype: 'CharArray',
  fill: function fill(v){ this.write(0, v || 0) },
  reify: function reify(){
    return this._data.subarray(this._offset, this.bytes).map(function(str){
      return  ucs2(str);
    });
  },
  write: function write(value, index){
    var isString = typeof value === 'string';
    if (isFinite(index)) {
      if (isString) value = ucs2(value);
      this._data.writeUint8(index, value);
    } else if (typeof value === 'string' || value && 'length' in value) {
      for (var i=0; i<value.length && i<this.bytes; i++) {
        this._data.writeUint8(this._offset+i, ucs2(value[i]));
      }
    }
  },
});



function Char(data, offset, value){
  if (typeof data === 'string' || typeof data === 'number' || !data) {
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
Char.prototype = {
  length: 1,
  Subtype: 'CharArray',
  bytes: 1,
  write: function write(v, i){
    this._data.writeUint8(this._offset, typeof v === 'string' ? ucs2(v[i || 0]) : v);
    return this;
  },
  reify: function reify(deallocate){
    var val = this.reified =  ucs2(this._data.readUint8(this._offset, 1));
    this.emit('reify', val);
    val = this.reified;
    delete this.reified;
    return val;
  },
  toNumber: function toNumber(v){
    return this._data.readUint8(this._offset);
  }
};

Char.__proto__ = CharArrayType.prototype;
Char.constructor = CharArrayType;
Char.prototype.__proto__ = CharArrayType.prototype.prototype;
Char.bytes = Char.prototype.bytes = Char.prototype.length = 1
Char.prototype.constructor = Char;

cache[1] = Char;