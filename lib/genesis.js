var D = require('./utility').desc;

module.exports = {
  Type: Type,
  Data: Data,
  canonical: canonical
};

var ArrayType = require('./array');



// #########################################
// ### Genesis for the Constructor Types ###
// #########################################

function Type(){ throw new Error('Abstract method called') }

Object.defineProperties(Type,{
  _Class:    D.___('DataType'),
});

Type.prototype = Data;

// ######################################
// ### Genesis for the Instance Types ###
// ######################################

function Data(){ throw new Error('Abstract method called') }

Object.defineProperties(Data, {
  _Class: D.___('Data'),
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
  if (!u.isObject(this) || this._Class !== 'Data') {
    throw new TypeError('Method is not generic');
  }
}

var types = {}

function canonical(name, type){
	if (1 in arguments) {
		types[name] = type;
	} else if (0 in arguments) {
		if (name in types) return types[name];
    if (Object(name) === name){
      if (name.constructor && (type=name.constructor.name) in types) return types[type];
      if ((type = Object.prototype.toString.call(name)) in types) return types[type];
    }
	} else {
		return types;
	}
}


canonical('Type', Type);
canonical('Data', Data);