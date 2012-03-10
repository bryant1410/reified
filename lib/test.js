require('./utility').MAKE_ALL_ENUMERABLE();

delete Buffer.prototype.inspect;

var NumericTypes = require('./numeric');
var ArrayType = require('./array');
var StructType = require('./struct');

// local scope ahoy
for (var k in NumericTypes) eval('var '+k+' = NumericTypes.'+k);



var RGBarray = new ArrayType(uint8, 3);
console.log('||Array Constructor||\n')
console.log(RGBarray);

var DeepSkyBlue = new RGBarray([0,150,255]);
console.log('\n\n\n===Array Prototype===\n')
console.log(DeepSkyBlue);


console.log('\n\n\n')


var RGBstruct = new StructType({ red: uint8, green: uint8, blue: uint8 });
console.log('\n\n\n||Struct Constructor||\n')
console.log(RGBstruct);

var Fuschia = new RGBstruct({ red: 255, green: 0, blue: 255 });
console.log('\n\n\n===Struct Prototype===\n')
console.log(Fuschia);