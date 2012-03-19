var tap = require("tap");
var test = tap.test;
var Buffer = require('../lib/buffer');
var reified;

test('load', function(t){
  t.ok(reified = require('../'), 'reified loaded');
  t.similar(Object.keys(reified).sort(), ['data','defaultEndian','isData','isType'], 'reified has all expected enumerable names');
  t.similar(Object.getOwnPropertyNames(reified).sort(), ['ArrayType','BitfieldType','NumericType','StructType','ViewBuffer','arguments','caller','data','defaultEndian','isData','isType','length','name','prototype'], 'reified has all expected names');
  t.end();
});

test('reified as Type constructor', function(t){
  t.equal(reified('Int32'), reified.NumericType.Int32, 'returns correct existing type');
  var int8x10 = reified('Int8[10]');
  var Int8 = reified('Int8');
  t.equal(int8x10.prototype.DataType, 'array', 'name with bracket syntax creates array');
  t.equal(int8x10.count, 10, 'array is correct length');
  t.equal(int8x10.name, 'Int8x10', 'array is correct name');
  t.equal(int8x10, reified('Int8[10]'), 'matching name and type is not recreated');
  t.equal(int8x10, Int8[10], 'bracket notation also returns existing type');
  int8x10.rename('Renamed');
  var instance = new int8x10;
  t.equal(instance.constructor.name, 'Renamed', 'renaming changes existing prototypes');
  t.equal(reified('RGB', { r: 'UInt8', g: 'UInt8', b: 'UInt8' }).inspect(), '‹RGB›(3b) { r: ‹UInt8› | g: ‹UInt8› | b: ‹UInt8› }', 'StructType created');
  t.end();
});

test('reified as Data constructor', function(t){
  var Int32 = reified('Int32');
  var int32 = new reified('Int32', 10000);
  t.equal(reified('Int32'), int32.constructor, 'using new produces constructs Data');
  t.equal(int32.reify(), 10000, 'passes value to real constructor');
  t.similar(new reified('Int32[2][2]').reify(), [[0,0],[0,0]], 'string constructs multidimensional arrays');
  t.similar(new reified(Int32[2][2]).reify(), [[0,0],[0,0]], 'types constructs multidimensional arrays');
  t.similar(new reified(Int32[2][2], [[1,2],[3,4]]).reify(), [[1,2],[3,4]], 'multidimensional init values are passed');
  function OCT(n){ return [n,0,0,0] }
  var flatten = Function.call.bind([].concat, []);
  var buff = new Buffer(flatten(OCT(1), OCT(2), OCT(3), OCT(4)));
  t.similar(new reified(Int32[2][2], buff).reify(), [[1,2],[3,4]], 'Provided buffer reifies correctly');
  t.end();
});


//`reified('UInt8')` - returns the _‹Type›_ that matches the name
//`reified('UInt8[10]')` - returns an _‹ArrayT›_ for the specified type and size
//`reified('UInt8[10][10][10]')` - arrays can be nested arbitrarily
//`reified('Octets', 'UInt8[10]')` - A label can also be specified
//`reified('RenameOctets', Octets)` - If the second parameter is a _‹Type›_ and there's no third parameter the type is renamed
//`reified('OctetSet', 'Octets', 10)` - An array is created if the third parameter is a number and the second resolves to a _‹Type›_
//`reified('RGB', { r: 'UInt8', g: 'UInt8', b: 'UInt8'})` - If the second parameter is a non-type object then a _‹StructT›_ is created
//`reified('Bits', 2)` - If the first parameter is a new name and the second parameter is a number a _‹BitfieldT›_ is created with the specified bytes.
//`reified('Flags', [array of flags...], 2)` - If the second parameter is an array a _‹BitfieldT›_ is created, optionally with bytes specified.
//`reified('FlagObject', { object of flags...}, 2)` - If the second parameter is a non-type object and the third is a number then a _‹BitfieldT›_ is created using the object as a flags object.