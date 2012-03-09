module.exports = {
  NumericTypes: require('./numeric'),
  ArrayType: require('./array')
};

// var ArrayType = require('./array');
// var Numeric = require('./numeric');
// for (var k in Numeric) eval('var '+k+' = Numeric.'+k);
// var RGB = new ArrayType(uint8, 3);
// var dsb = new RGB([100,200,155]);
// console.log(dsb[1]);
