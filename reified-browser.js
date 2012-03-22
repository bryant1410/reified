!function(global, exporter, EventEmitter){
"use strict";

var hasProto = !!Function.__proto__;
var types = {};
var nullable = D.nullable = { value: undefined, writable: true, configurable: true };
var hidden = D.hidden ={ configurable: true, writable: true, value: 0 };
var numTypes = {
     Int8: 1,
    Uint8: 1,
    Int16: 2,
   Uint16: 2,
    Int32: 4,
   Uint32: 4,
  Float32: 4,
  Float64: 8
};

function isObject(o){ return Object(o) === o }
function bits(n){ return Math.log(n) / Math.LN2 }
function bytesFor(n){ return ((bits(n) / 8) | 0) + 1 }
function toNum(n){ return isFinite(n) ? +n : 0 }
function toNumOrUndef(n){ if (isFinite(n)) return +n }
function toUint8(x) { return (x >>> 0) & 0xff }

function max(arr){
  if (Array.isArray(arr)) return arr.reduce(function(r,s){ return Math.max(s, r) }, 0);
  else return Object.keys(arr).reduce(function(r,s){ return Math.max(arr[s], r) }, 0);
}
function copy(from, to, hidden){
  Object[hidden ? 'getOwnPropertyNames' : 'keys'](from).forEach(function(key){
    var desc = Object.getOwnPropertyDescriptor(from, key);
    desc.enumerable = false;
    Object.defineProperty(to, key, desc);
  });
  return to;
}

function D(flags, value){
  return {
    value        : value,
    enumerable   : Boolean(flags & ENUMERABLE),
    configurable : Boolean(flags & CONFIGURABLE),
    writable     : Boolean(flags & WRITABLE)
  };
}
var PRIVATE      = 0,
    ENUMERABLE   = 1,
    CONFIGURABLE = 2,
    READONLY     = 3,
    WRITABLE     = 4,
    FROZEN       = 5,
    HIDDEN       = 6,
    NORMAL       = 7;

function attachFlags(o){
  o.___ = D.bind(null, PRIVATE     );
  o.E__ = D.bind(null, ENUMERABLE  );
  o._C_ = D.bind(null, CONFIGURABLE);
  o.EC_ = D.bind(null, READONLY    );
  o.__W = D.bind(null, WRITABLE    );
  o.E_W = D.bind(null, FROZEN      );
  o._CW = D.bind(null, HIDDEN      );
  o.ECW = D.bind(null, NORMAL      );
}

attachFlags(D);

var types = ['Int8', 'Int16', 'Int32', 'Uint8', 'Uint16', 'Uint32', 'Float32', 'Float64'];


if (typeof Buffer !== 'function'){
  var Buffer = function Buffer(subject, offset, length){
    return new ArrayBuffer(subject, offset, length);
  }
  Buffer.isBuffer = function isBuffer(o){
    return o instanceof ArrayBuffer;
  }
}


var ArrayBuffers = { ArrayBuffer:  ArrayBuffer };

function isArrayBuffer(o){
  return !!(o && o.constructor && o.constructor.name in ArrayBuffers);
}


function DataBuffer(subject, offset, length){
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
  }
  this.length = this.bytes = this.view.byteLength;
  this.buffer = this.view.buffer;
  this.offset = this.view.byteOffset;
}

DataBuffer.isBuffer = function isBuffer(o){ return DataBuffer.prototype.isPrototypeOf(o) }


DataBuffer.prototype = {
  constructor: DataBuffer,
  endianness: 'BE',
  subarray: function(start, end){
    start = toNum(start);
    end = toNumOrUndef(end - start);
    return new DataBuffer(this.view, start, end);
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
    var buffer = new DataBuffer(this.s);
    for (var i=0; i<this.s-1; i++) {
      buffer.writeUint8(i, this.readUint8(i));
    }
    return buffer;
  },
  fill: function(v){
    v = toNum(v);
    var buff = new Uint8Array(this.buffer);
    for (var i=0; i < this.s; i++) {
      buff[i] = v;
    }
  },
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
  ctor.prototype.prototype = copy(proto, Object.create(Data));
  ctor.toString = function(){ return '◀ '+ctor.name+' ▶' }
}



Type.Class = 'Type';
Type.array = function array(n){ return new ArrayType(this, n) }
Type.isInstance = function isInstance(o){ return this.prototype.isPrototypeOf(o) }


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

  iface.toString = function(){ return '‹' + name + '› <'+this.bytes+'b>'  }

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
  rebase: function rebase(buffer){
    if (buffer == null) {
      buffer = new DataBuffer(this.bytes);
      buffer.fill(0);
    } else {
      buffer = new DataBuffer(buffer);
    }
    hidden.value = buffer;
    Object.defineProperty(this, 'buffer', hidden);
  },
  clone: function clone(){
    return new this.constructor(this.buffer, this.offset);
  },
  toString: function toString(){ return '<' + this.constructor.name + '> ('+this.bytes+'b)' },
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


// #################################################
// ###               NumericTypes                ###
// #################################################


var NumericSubtype = Subtype.bind(NumericType);


/** * Coerce to number when appropriate and verify number against type storage */
function checkType(type, val){
  if (val && val.DataType) {
    if (val.DataType === 'numeric' && val.Subtype === 'Int64' || val.Subtype === 'Uint64') {
      if (type === 'Int64' || type === 'Uint64') {
        return val;
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

  function NumericT(buffer, offset, value){
    if (typeof buffer === 'number' || !buffer) {
      value = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    this.realign(offset);

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
      this.buffer['write'+name](this.offset, checkType(name, v));
      return this;
    },
    reify: function reify(deallocate){
      var val = this.reified = this.buffer['read'+name](this.offset);
      this.emit('reify', val);
      val = this.reified;
      return val;
    },
  };

  return NumericSubtype(name, bytes, NumericT);
}



// ########################
// ### NumericType Data ###
// ########################

Type(NumericType, {
  DataType: 'numeric',
  fill: function fill(v){ this.write(0, v || 0) },
  realign: function realign(offset){
    D.hidden.value = offset || 0;
    Object.defineProperty(this, 'offset', D.hidden);
  },
});


Object.keys(numTypes).forEach(function(name){
  NumericType[name] = new NumericType(name, numTypes[name]);
});


// ###############################################
// ###               ArrayTypes                ###
// ###############################################

var ArraySubtype = Subtype.bind(ArrayType);



// #############################
// ### ArrayType Constructor ###
// #############################

function ArrayType(name, MemberType, length) {
  if (typeof name !== 'string' || typeof MemberType === 'number') {
    length = MemberType || 0;
    MemberType = lookupType(name);
    name = MemberType.name + 'x'+length;
  } else {
    MemberType = lookupType(MemberType);
  }
  if (lookupType(name) !== name) return lookupType(name);
  var bytes = MemberType.bytes * length;

  // ##########################
  // ### ArrayT Constructor ###
  // ##########################

  function ArrayT(buffer, offset, values){
    if (!
      ViewBuffer.isBuffer(buffer)) {
      values = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    D.hidden.value = offset || 0;
    Object.defineProperty(this, 'offset', D.hidden);

    values && Object.keys(values).forEach(function(i){
      initIndex(this, MemberType, i).write(values[i]);
    }, this);
    this.emit('construct');
  }

  ArrayT.memberType = MemberType;
  ArrayT.count = length;
  ArrayT.prototype.length = length;

  return defineIndices(ArraySubtype(name, bytes, ArrayT));
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

Type(ArrayType, {
  DataType: 'array',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,

  reify: function reify(deallocate){
    var output = this.reified = [];
    for (var i=0; i < this.length; i++) {
      output[i] = this[i].reify(deallocate);
      if (deallocate) this[i] = null;
    }
    this.emit('reify', output);
    output = this.reified;
    delete this.reified;
    return output;
  },

  copy: function copy(buffer, offset){
    var copied = new this.constructor(buffer, offset);
    this.buffer.copy(copied.buffer, copied.offset, this.offset, this.offset + this.bytes);
    return copied;
  },

  write: function write(value, index, offset){
    if (value == null) throw new TypeError('Tried to write nothing');

    if (isFinite(index)) {
      // we have an index
      if (!isFinie(offset)) {
        // and no offset so it's going in
        return this[index] = value;
      } else {
        offset = +offset;
      }
      index = +index;
    } else {
      // prep for arrayish value
      index = 0;
      offset = +offset || 0;
    }

    // reify if needed, direct buffer copying doesn't happen here
    if (value.reify) value = value.reify();

    if (Array.isArray(value) || Object(value) === value && 'length' in value) {
      // arrayish and offset + index are already good to go
      while (index < this.length && offset < value.length) {
        var current = value[offset++];
        if (current != null) {
          this[index++] = current.reify ? current.reify() : current;
        } else if (current === null) {
          this[index++] = null;
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
    D.hidden.offset = (offset = +offset || 0);
    Object.defineProperty(this, 'offset', D.hidden);
    // use realiagn as a chance to DEALLOCATE since everything is being reset essentially
    Object.keys(this).forEach(function(i){
      if (isFinite(i)) {
        if (deallocate) this[i] = null;
        else this[i].realign(offset);
      }
    }, this);
  },
});


NumericType.Uint64 = new ArrayType('Uint64', 'Uint32', 2);
NumericType.Int64 = new ArrayType('Int64', 'Int32', 2);

var OctetString = new ArrayType('EightByteOctetString', 'Uint8', 8);

function octets(){ return new OctetString(this.buffer, this.offset) }
NumericType.Uint64.prototype.octets = octets;
NumericType.Int64.prototype.octets = octets;




// ###############################################
// ###               StructTypes               ###
// ###############################################

var StructSubtype = Subtype.bind(StructType);



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
  var names = [];

  fields = Object.keys(fields).reduce(function(ret, name){
    ret[name] = lookupType(fields[name]);
    names.push(name);
    offsets[name] = bytes;
    bytes += ret[name].bytes;
    return ret;
  }, {});

  // ###########################
  // ### StructT Constructor ###
  // ###########################

  function StructT(buffer, offset, values){
    if (!isBuffer(buffer)) {
      values = buffer;
      buffer = null;
    }
    this.rebase(buffer);
    this.realign(offset);

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
  StructT.names = names;

  return defineFields(StructSubtype(name, bytes, StructT));
}


function initField(target, ctor, field){
  var block = new ctor.fields[field](target.buffer, target.offset + ctor.offsets[field]) ;
  Object.defineProperty(target, field, {
    enumerable: true,
    configurable: true,
    get: function(){ return block },
    set: function(v){
      if (v === null) {
        // take null to mean full deallocate
        this.emit('deallocate', field);
        Object.defineProperty(this, field, D.nullable);
        delete this[field];
        block = null;
      } else {
        block.write(v);
      }
    }
  });
  return block;
}

function defineFields(target){
  target.names.forEach(function(field){
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

Type(StructType, {
  DataType: 'struct',

  reify: function reify(deallocate){
    this.reified = this.constructor.names.reduce(function(ret, field){
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
    D.hidden.value = offset || 0;
    Object.defineProperty(this, 'offset', D.hidden);
    Object.keys(this).forEach(function(field){
      if (deallocate) this[field] = null;
      else this[field].realign(offset);
    }, this);
  },

  fill: function fill(val){
    val = val || 0;
    this.constructor.names.forEach(function(field){
      this[field] = val;
    }, this);
  },
});


// ##############################################
// ###              BitfieldTypes             ###
// ##############################################
var powers = Array.apply(null, Array(32)).map(Function.call.bind(Number)).map(Math.pow.bind(null, 2));


var  BitfieldSubtype = Subtype.bind(BitfieldType);

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

  function BitfieldT(buffer, offset, values) {
    if (!Buffer.isBuffer(buffer)) {
      values = buffer || 0;
      buffer = null;
    }
    this.rebase(buffer);
    this.realign(offset);

    if (Array.isArray(values)) {
      values.forEach(function(flag){ this[flag] = true }, this);
    } else if (typeof values === 'number') {
      this.write(values);
    } else if (Object(values) === values){
      Object.keys(values).forEach(function(key){ this[key] = values[key] }, this);
    }
    this.emit('construct');
  };

  BitfieldT.flags = flags;

  // ######################
  // ### BitfieldT Data ###
  // ######################

  BitfieldT.prototype = {
    flags: flags,
    length: bytes * 8,
    toString: function toString(){ return this === BitfieldT.prototype ? '[BitfieldTData]' : this.map(function(v){ return +v }).join('') },
  };

  return defineFlags(BitfieldSubtype(name, bytes, BitfieldT));
}

function defineFlags(target) {
  var largest = 0;
  Object.keys(target.flags).forEach(function(flag){
    var val = target.flags[flag];
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

Type(BitfieldType, {
  DataType: 'bitfield',
  forEach: Array.prototype.forEach,
  reduce: Array.prototype.reduce,
  map: Array.prototype.map,
  get: function get(i){ return (this.read() & powers[i]) > 0 },
  set: function get(i){ this.write(this.read() | powers[i]); return this; },
  unset: function unset(i){ this.write(this.read() & ~powers[i]); return this; },
  write: function write(v){ this.buffer['writeUint'+this.bytes*8](this.offset, v); return this; },
  read: function read(){ return this.buffer['readUint'+this.bytes*8](this.offset) },
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
      delete this.buffer;
      delete this.offset;
    }
    return val;
  },
  realign: function realign(offset){
    hidden.value = offset || 0;
    Object.defineProperty(this, 'offset', hidden);
  },
});



// #############################################
// ###             API Entrypoint            ###
// #############################################

exporter(reified);

function reified(type, subject, size, values){

  type = lookupType(type);
  if (reified.prototype.isPrototypeOf(this)) {
    return new type(subject, size, values);
  } else {
    subject = lookupType(subject, type);
    if (!subject) {
      if (typeof type === 'string') {
        throw new TypeError('Subject is required when type not found');
      } else {
        return type;
      }
    }
    if (typeof type === 'string' && Class === 'Type') {
      return subject.rename(type);
    }
    if (typeof subject === 'string' || Class === 'Type') {
      return new reified.ArrayType(type, subject, size);
    } else if (Array.isArray(subject) || typeof subject === 'number' || size) {
      return new reified.BitfieldType(type, subject, size);
    } else {
      return new reified.StructType(type, subject);
    }
  }
}

// ## static functions

reified.data = function data(type, buffer, offset, values){
  type = lookupType(type);
  if (typeof type === 'string') throw new TypeError('Type not found "'+type+'"');
  return new type(buffer, offset, values);
}

reified.reify = function reify(data){
  return Object.getPrototypeOf(data).reify.call(data);
}

reified.isType = function isType(o){ return Type.isPrototypeOf(o) }
reified.isData = function isData(o){ return Type.prototype.isPrototypeOf(o) }

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

Object.defineProperties(reified, {
  Type:          D._CW(Type),
  NumericType:   D._CW(NumericType),
  StructType:    D._CW(StructType),
  ArrayType:     D._CW(ArrayType),
  BitfieldType:  D._CW(BitfieldType),
  DataBuffer:    D._CW(DataBuffer),
  toString:      D._CW(function toString(){ return '◤▼▼▼▼▼▼▼◥\n▶reified◀\n◣▲▲▲▲▲▲▲◢' }),
});










// ############################################
// ###             EventEmitter2            ###
// ############################################




}(Function('return this')(),
function(item, name){
  if (typeof module === 'undefined') {
    this[name || item.name] = item;
  } else {
    module.exports[name || item.name] = item;
  }
  return item;
}, function(undefined) {

// (The MIT License)
// Copyright (c) 2011 hij1nx http://www.twitter.com/hij1nx
// See either the included license file for the full text or one the following
//  https://github.com/Benvie/reified
//   https://github.com/hij1nx/EventEmitter2

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = new Object;
  }

  function configure(conf) {
    if (conf) {
      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.wildcard && (this.wildcard = conf.wildcard);
      if (this.wildcard) {
        this.listenerTree = new Object;
      }
    }
  }

  function EventEmitter(conf) {
    this._events = new Object;
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
        tree[name] = new Object;
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

  return EventEmitter;

}());
