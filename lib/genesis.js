"use strict";

/**
 * This file includes the highest level interfaces that are part of the ES6 spec. They're pretty much useless for our purposes
 * But they set the inheritance stage and are part of the API so they're here.
*/

var D     = require('./utility').desc;
var sLoop = require('./utility').sLoop;



module.exports = {
  Type: Type,
  Data: Data,
  Block: Block,
};

var ArrayType = require('./array');


var Class = function toString(){ return '[object '+this.Class+']' };

// #########################################
// ### Genesis for the Constructor Types ###
// #########################################

function Type(){
  this.__proto__ = Type;
  this.prototype = function(){};
  this.prototype.__proto__ = Type.prototype;
  Object.defineProperty(this.prototype, 'constructor', D._C_(this));
}

Object.defineProperties(Type, {
  Class: D._C_('DataType'),
  toString: D._CW(Class)
});

Type.prototype = Data;



// ######################################
// ### Genesis for the Instance Types ###
// ######################################

function Data(){ throw new Error('Abstract function called') }

Object.defineProperties(Data, {
  Class: D._C_('Data'),
  toString: D._CW(Class),
  array:  D._CW(array)
});

function array(n){
  return new ArrayType(this, n);
}


Object.defineProperty(Data.prototype, 'update', D._CW(update));

/**
 * Updates the reference of an existing JS wrapper to pointer to a new memory block of the same type.
 */
function update(val){
  if (!u.isObject(this) || this.Class !== 'Data') {
    throw new TypeError('Method is not generic');
  }
}


// ################################################
// ### Genesis for the Background Store Wrapper ###
// ################################################

function Block(){ throw new Error('Abstract function called') }

Object.defineProperties(Block, {
  Class: D._C_('Block'),
  toString: D._CW(Class),
});
