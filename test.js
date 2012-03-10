var ArrayType = require('./array');
var StructType = require('./struct');
var NumericTypes = require('./numeric');
for (var k in NumericTypes) eval('var '+k+' = NumericTypes.'+k);




var RGBarray = new ArrayType(uint8, 3);
var RGBstruct = new StructType({ red: uint8, green: uint8, blue: uint8 });

console.log(RGBarray);
console.log(RGBstruct);

var DeepSkyBlue = new RGBarray([0,150,255]);
var Fuschia = new RGBstruct({ red: 255, green: 0, blue: 255 });


console.log(DeepSkyBlue);
console.log(Fuschia);