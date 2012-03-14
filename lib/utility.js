"use strict";

module.exports = {
  isObject: isObject,
  sLoop: sLoop,
  desc: desc,
  MAKE_ALL_ENUMERABLE: function makeEnumerable(){ desc.allEnumerable = true },
};

function isObject(o){ return Object(o) === o }

function sLoop(n, cb){ return Array.apply(null, Array(n)).map(Function.call.bind(cb), this); }



function desc(flags, value){
  return {
    value        : value,
    enumerable   : desc.allEnumerable || Boolean(flags & ENUMERABLE),
    configurable : Boolean(flags & CONFIGURABLE),
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

function attachFlags(o){
  o.___ = desc.bind(null, PRIVATE     );
  o.E__ = desc.bind(null, ENUMERABLE  );
  o._C_ = desc.bind(null, CONFIGURABLE);
  o.EC_ = desc.bind(null, READONLY    );
  o.__W = desc.bind(null, WRITABLE    );
  o.E_W = desc.bind(null, FROZEN      );
  o._CW = desc.bind(null, HIDDEN      );
  o.ECW = desc.bind(null, NORMAL      );
}

attachFlags(desc);