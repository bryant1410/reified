// The purpose of thise file is to create an baseline data API that will work either in Node or browsers
// Aside from a incredible amount of tiny differences in naming, there's also some practical differences
// That require trimming features and doing a bit of shimming. 

// The browser view primarily relies on UInt8Array octetstring for most of the utility functions and data manipulation
// Combined with DataView to provide the read/write functions for the 89number types.

// Node's buffer is able to inherit from Node's buffer and still be blessed with the magical external data priveledges
// so this greatly simplifies the Node side of it. That combined with node's buffer having a large amount of built in
// functionality and the remainder is primarily normalizing the interfaces to choose between little and big endian.

// Node provides separate LE and BE functions and no way to choose a default. DataView uses BE by default and accepts
// a boolean as an optional second/third parameter. Both of these have been abstracted away and the implemented API
// allows for specifying `endianness: 'LE' or 'BE'` on the buffer object itself.

!function(global, exporter){
  "use strict";


  function copy(to, from){
    Object.keys(from).forEach(function(key){
      var desc = Object.getOwnPropertyDescriptor(from, key);
      Object.defineProperty(to, key, desc);
    });
    return to;
  }

  function mapMethods(fn) {
    fn('Uint8', 'UInt8');
    fn('Int8', 'Int8');
    fn('Float32', 'Float', true);
    fn('Float64', 'Double', true);
    fn('Uint16', 'UInt16', true);
    fn('Int16', 'Int16', true);
    fn('Uint32', 'UInt32', true);
    fn('Int32', 'Int32', true);
  }

  var toString = function(){
    return this.map(function(v){
      return ('000'+v.toString(10)).slice(-3)
    })
      .join(' ')
      .split(/((?:\d\d\d ?){10}(?: ))/)
      .filter(Boolean)
      .map(Function.call.bind(''.trim))
      .join('\n')
  }
 
  // ##############################################################
  // ### Buffer that inherits from Node's Buffer and Normalizes ###
  // ##############################################################

  if (global.Buffer) {
    var BuffBuffer = exporter(function BuffBuffer(subject, encoding, offset){
      if (Buffer.isBuffer(subject)) {
        Buffer.call(this, subject.parent, encoding || subject.length, offset || subject.offset);
      } else {
        Buffer.apply(this, arguments);
      }
    });


    BuffBuffer.isInstance = function isInstance(o){ return BuffBuffer.prototype.isPrototypeOf(o) }
    var buff = Buffer.prototype;


    BuffBuffer.prototype = copy(Object.create(Buffer.prototype), {
      constructor: BuffBuffer,
      endianness: 'LE',
      map: Array.prototype.map,
      slice: function(start, end){ return new BuffBuffer(buff.slice.apply(this, arguments)) },
      clone: function(){ return new BuffBuffer(this) },
      fill: buff.fill,
      copy: buff.copy,
      //toString: toString,
      inspect: function(){ return '<Buff'+buff.inspect.call(this).slice(1) }
    });

    mapMethods(function(to, from, usesEndian){
      if (usesEndian) {
        BuffBuffer.prototype['read'+to]  = function(offset){ return buff['read'+from+this.endianness].call(this, offset || 0) }
        BuffBuffer.prototype['write'+to] = function(value, offset){ return buff['write'+from+this.endianness].call(this, value || 0, offset || 0) }
      } else {
        BuffBuffer.prototype['read'+to]  = function(offset){ return buff['read'+from].call(this, offset || 0) }
        BuffBuffer.prototype['write'+to] = function(value, offset){ return buff['write'+from].call(this, value || 0, offset || 0) }
      }
    });
  }

  // ###############################################################
  // ### Buffer for browsers that requires more help than Node's ###
  // ###############################################################

  if (global.DataView) {
    var DataBuffer = exporter(function DataBuffer(buffer, offset, length){
      if (typeof buffer === 'number') {
        length = length || buffer;
        offset = offset || 0;
        buffer = new ArrayBuffer(buffer);
        length = buffer.byteLength;
      } else if ('buffer' in buffer) {
        while (buffer.buffer) {
          buffer = buffer.buffer;
        }
      } else if (Array.isArray(buffer)) {
        var vals = buffer;
        buffer = new ArrayBuffer(vals);
        length = buffer.byteLength;
      }
      offset = offset || 0;
      length = length || buffer.byteLength || buffer.length;
      this.parent = buffer;
      this.octets = new Uint8Array(this.parent, offset, length);
      this.view = new DataView(this.parent, offset, length);
      this.length = length;
      this.offset = offset;
    });

    DataBuffer.isInstance = function isInstance(o){ return DataBuffer.prototype.isPrototypeOf(o) }

    DataBuffer.prototype = copy(Object.create(DataView.prototype), {
      constructor: DataBuffer,
      endianness: 'LE',
      get map(){ return Array.prototype.map.bind(this.octets) },
      slice: function(start, end){
        start = start || 0;
        end = end || 0;
        return new DataBuffer(this.octets.subarray(start, end), this.offset + start, end - start);
      },
      clone: function(){ return new DataBuffer(this) },
      fill: function(v){ [].forEach.call(this.octets, function(n,i){ this.writeUint8(v || 0, i) }, this);  },
      copy: function(target, targetStart, start, end){
        if (!DataBuffer.isInstance(target)) {
          target = new DataBuffer(target);
        }
        var targetLength = target.length || target.byteLength;
        start = start || 0;
        end = end || this.length;
        targetStart = targetStart || 0;

        if (targetLength === 0 || this.length === 0 || end === start) return 0;
        if (end < start)                                     throw new Error('End is before start');
        if (targetStart < 0 || targetStart >= targetLength)  throw new Error('targetStart out of bounds');
        if (start < 0 || start >= this.length)               throw new Error('sourceStart out of bounds');
        if (end < 0 || end > this.length)                    throw new Error('sourceEnd out of bounds');

        end = end > this.length ? this.length : end;

        if (targetLength - targetStart < end - start) {
          end = targetLength - targetStart + start;
        }

        var i = -1;
        while (i++ < end - start) {
          target[targetStart+i] = this[start+i];
        }
      },
      asciiSlice: function(from, to){
        from = from || 0;
        to = to || this.octets.byteLength;
        var buf = this.octets.subarray(from, to);
        return Array.prototype.map.call(buf, function(s){ return String.fromCharCode(s) }).join('');
      },
      //toString: toString,
      inspect: function(){ return '<Data'+buff.inspect.call(this.buffer).slice(1) }
    });



    Array.apply(null, Array(20)).forEach(function(n, index){
      Object.defineProperty(DataBuffer.prototype, index, {
        configurable: true,
        get: function(){ return this.octets[index] },
        set: function(v){ return this.octets[index] = v },
      })
    });

    mapMethods(function(to, from, usesEndian){
      if (usesEndian) {
        DataBuffer.prototype['read'+to]  = function(offset){ return this.view['get'+to].call(this.view, offset || 0, this.endianness === 'LE') }
        DataBuffer.prototype['write'+to] = function(value, offset){ return this.view['set'+to].call(this.view, offset || 0, value || 0, this.endianness === 'LE') }
      } else {
        DataBuffer.prototype['read'+to]  = function(offset){ return this.view['get'+to].call(this.view, offset || 0) }
        DataBuffer.prototype['write'+to] = function(value, offset){ return this.view['set'+to].call(this.view, offset || 0, value || 0) }
      }
    })
  } else {
    throw new Error ('No suitable backing store found');
  }

  BuffBuffer.isBuffer = BuffBuffer.isInstance;
  exporter(BuffBuffer, 'Buffer');


}(Function('return this')(),
function(item, name){
  if (typeof module === 'undefined') {
    this[name || item.name] = item;
  } else {
    module.exports[name || item.name] = item;
  }
  return item;
});
