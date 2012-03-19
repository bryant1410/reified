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

  if (global.Buffer) {
    var BuffBuffer = exporter(function BuffBuffer(subject, encoding, offset){
      if (Buffer.isBuffer(subject)) {
        Buffer.call(this, subject.parent, encoding || subject.length, offset || subject.offset);
      } else {
        Buffer.apply(this, arguments);
      }
    })

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
      toString: toString,
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

  if (global.DataView) {
    var DataBuffer = exporter(function DataBuffer(buffer, offset, length){
      if (typeof buffer === 'number') {
        length = length || buffer;
        offset = offset || 0;
        buffer = new ArrayBuffer(buffer);
      } else if ('buffer' in buffer) {
        while (buffer.buffer) {
          buffer = buffer.buffer;
        }
      }
      offset = offset || 0;
      length = length || buffer.byteLength || buffer.length;
      this.buffer = buffer;
      this.octets = new Uint8Array(buffer, offset, length);
      this.view = new DataView(buffer, offset, length);
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
      fill: function(v){ v = v || 0; var i = this.length; while (i--) this.octets[i] = v; },
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
      toString: toString,
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

}(Function('return this')(),
function(item){
  if (typeof module === 'undefined') {
    this[item.name] = item;
  } else {
    module.exports[item.name] = item;
  }
  return item;
});