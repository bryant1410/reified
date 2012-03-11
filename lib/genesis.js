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



// #########################################
// ### Genesis for the Constructor Types ###
// #########################################

function Type(){ throw new Error('Abstract method called') }

Object.defineProperties(Type,{
  toString: fakeClass('DataType'),
});

Type.prototype = Data;



// ######################################
// ### Genesis for the Instance Types ###
// ######################################

function Data(){ throw new Error('Abstract method called') }

Object.defineProperties(Data, {
  toString: fakeClass('Data'),
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
  if (!u.isObject(this) || this.toString() !== '[object Data]') {
    throw new TypeError('Method is not generic');
  }
}


// ################################################
// ### Genesis for the Background Store Wrapper ###
// ################################################

function Block(){}
Block.prototype = Object.create(Object.prototype, {
  constructor:   D.___(Block),
  toString: fakeClass('Block'),
});



function fakeClass(name){
  return {
    configurable: true,
    writable: true,
    value: function toString(){ return '[object '+name+']' }
  };
}