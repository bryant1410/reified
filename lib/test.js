var inspect = require('util').inspect;
require('./utility').MAKE_ALL_ENUMERABLE();

//delete Buffer.prototype.inspect;


var Numerics = require('./numeric');
var ArrayType = require('./array');
var StructType = require('./struct');

// local scope ahoy
for (var k in Numerics) eval('var '+k+' = Numerics.'+k);





function showCode(code, result){
  console.log('//-->');
  console.log(result);
}

function section(label, codeArray){
  console.log('### '+label);
  while (codeArray.length) {
    var item = codeArray.shift();
    console.log('\n#### '+item[0]);
    console.log('```');
    var codes = Array.isArray(item[1]) ? item[1] : [item[1]];
    while (codes.length) {
      var code = codes.shift();
      var result = eval(code);
      if (code.slice(0,3) === 'var') {
        result = eval(code.split(' ')[1]);
      }
      result = inspect(result);
      if (!~result.indexOf('\n') && result.length + code.length < 80) {
        console.log(code + '\n '+result+'\n');
      } else {
        console.log(code + '\n//-->\n'+result+'\n\n');
      }
    }
    console.log('```');
  }
  console.log('');
}



section("NumericType", [
  [ "Instances", [ "var int32 = new UInt32(10000000)",
                   "var int16 = new UInt16(int32)",
                   "var int8 = new UInt8(int16)" ] ],
  [ "Shared Data", [ "int8.write(100)",
                     "int32",
                     "int16",
                     "int8" ] ]
]);

section("ArrayType", [
  [ "Simple", [ "var RGBarray = new ArrayType('RGB', UInt8, 3)",
                "new RGBarray([0, 150, 255])" ] ],
  [ "Multidimension", [ "var int32x4 = new ArrayType(Int32, 4)",
                        "var int32x4x4 = new ArrayType(int32x4, 4)",
                        "var int32x4x4x2 = new ArrayType(int32x4x4, 2)",
                        "new int32x4",
                        "new int32x4x4",
                        "new int32x4x4x2" ] ]
]);

section("StructType", [
  [ "Simple", [ "var RGB = new StructType('RGB', { r: UInt8, g: UInt8, b: UInt8 })",
                "var fuschia = new RGB({ r: 255, g: 0, b: 255 })",
                "var deepSkyBlue = new RGB({ r: 0, g: 150, b: 255 })" ] ],
  [ "Nested", [ "var Border = new StructType('Border', { top: RGB, right: RGB, bottom: RGB, left: RGB })",
                "fuschia = fuschia.reify()",
                "new Border({ top: fuschia, right: fuschia, bottom: fuschia, left: fuschia })" ] ],
]);





// console.log(new int32x2x2x4);

