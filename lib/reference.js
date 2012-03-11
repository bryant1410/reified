module.exports = Reference;

/**
 * A Reference is an opaque value that is the vehicle for indiration, like pointers, without doing anything about
 * managing data types. Rough concept and just to get something in here to replace pointers for pure JS implementation.
 */
function Reference(type, offset, buffer){
  var offset = 0;
  this.bytes = types.bytes;
  this.type = type.constructor;

  this.deref = function deref(){
    this.offset = 0;
    return new type(buffer, offset);
  }

  this.write = function write(v){
    if (Object(v) === v && '_Value' in v) {
      buffer[arguments[0]].apply(buffer, [].slice.call(arguments, 1));
    }
  }

  this.cast = function cast(type){
    return new Reference(type, offset, buffer);
  }

  this.clone = function clone(){
    var ret = Object.create(Reference.prototype);
    Object.getOwnPropertyNames(self).forEach(function(prop){
      ret[prop] = self[prop];
    });
    addNext(ret);
    return ret;
  }

  // simplifies arrays
  function addNext(o){
    o.next = function next(v){
      var ret = self.clone();
      ret.offset = (offset += type.bytes);
      if (v) ret.write(v);
      return ret;
    }
  }
  addNext(this);
}

Reference.prototype = {
  constructor: Reference,
};
