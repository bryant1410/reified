

module.exports = {
  descriptor: desc,
  isObject: isObject,
  bitsFor: bitsFor
};

function bitsFor(n){ return Math.log(n) / Math.LN2 }

function isObject(o){ return Object(o) === o }

function desc(flags, value){
  return {
    value        : value,
    configurable : Boolean(flags & CONFIGURABLE),
    enumerable   : Boolean(flags & ENUMERABLE),
    writable     : Boolean(flags & WRITABLE),
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

desc.___ = desc.bind(null, PRIVATE     );
desc.E__ = desc.bind(null, ENUMERABLE  );
desc._C_ = desc.bind(null, CONFIGURABLE);
desc.EC_ = desc.bind(null, READONLY    );
desc.__W = desc.bind(null, WRITABLE    );
desc.E_W = desc.bind(null, FROZEN      );
desc._CW = desc.bind(null, HIDDEN      );
desc.ECW = desc.bind(null, NORMAL      );
