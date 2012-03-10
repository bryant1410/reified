var D = require('./utility').descriptor;

module.exports = {
  Type: Type,
  Data: Data,
  Block: Block
};

var ArrayType = require('./array');



// #########################################
// ### Genesis for the Constructor Types ###
// #########################################

function Type(){ throw new Error('Abstract method called') }

Object.defineProperties(Type,{
  _Class:    D.___('DataType'),
  prototype: D.___(Data),
});



// ######################################
// ### Genesis for the Instance Types ###
// ######################################

function Data(){ throw new Error('Abstract method called') }

Object.defineProperties(Data, {
  _Class: D.___('Data'),
  array:  D._CW(array)
});

function array(n){
  return new ArrayType(this._DataType, n);
}


Object.defineProperty(Data.prototype, 'update', D._CW(update));

/**
 * Updates the reference of an existing JS wrapper to pointer to a new memory block of the same type.
 */
function update(val){
  if (!u.isObject(this) || this._Class !== 'Data') {
    throw new TypeError('Method is not generic');
  }
  var R = this._DataType._Convert(val);
  var deRefed = R._Value['get' + ffi.TYPE_TO_POINTER_METHOD_MAP[R._DataType]](val);
  this._Value = new Pointer(this.bytes);
  this._Value._putPointer(deRefed);
}


// ########################################
// ### Genesis for the Pointer Wrappers ###
// ########################################

function Block(){}

Object.defineProperties(Block,{
  _Class: D.___('Block'),
});
