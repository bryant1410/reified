"use strict";

module.exports = ViewBuffer;


// A child of Buffer that simplifies integration with reifies' uses

function ViewBuffer(subject, encoding, offset){
  this.endianness = 'LE';
  if (Buffer.isBuffer(subject)) {
    Buffer.call(this, subject.parent, encoding || subject.length, offset || subject.offset);
  } else {
    Buffer.apply(this, arguments);
  }
}

ViewBuffer.isInstance = function isInstance(o){ return ViewBuffer.prototype.isPrototypeOf(o) }

var buff = Buffer.prototype;


ViewBuffer.prototype = {
  __proto__: buff,
  constructor: ViewBuffer,
  slice: function(start, end){ return new ViewBuffer(buff.slice.apply(this, arguments)) },
  clone: function(){ return new ViewBuffer(this) },
  inspect: function(){ return '<View'+buff.inspect.call(this).slice(1) }
};

[8, 16, 32].forEach(function(bits){
  ['UInt', 'Int'].forEach(function(name){
    var read = 'read'+name+bits;
    var write = 'write'+name+bits;
    if (bits === 8) {
      ViewBuffer.prototype[read] = function(offset){ return buff[read].call(this, offset || 0) }
      ViewBuffer.prototype[write] = function(value, offset){ return buff[write].call(this, value || 0, offset || 0) }
    } else {
      ViewBuffer.prototype[read] = function(offset){ return buff[read+this.endianness].call(this, offset || 0) }
      ViewBuffer.prototype[write] = function(value, offset){ return buff[write+this.endianness].call(this, value || 0, offset || 0) }
    }
  });
});
