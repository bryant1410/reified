var inspect = require('../lib/utility').inspect;
require('../lib/utility').MAKE_ALL_ENUMERABLE();

//delete Buffer.prototype.inspect;

var reify = require('../')
var Numerics = reify.Numeric;
var ArrayType = reify.Array;
var StructType = reify.Struct;
var BitfieldType = reify.Bitfield;

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
                        "var inst = new int32x4x4x2",
                        "inst.reify()"] ]
]);

section("StructType", [
  [ "Simple", [ "var RGB = new StructType('RGB', { r: UInt8, g: UInt8, b: UInt8 })",
                "var fuschia = new RGB({ r: 255, g: 0, b: 255 })",
                "var deepSkyBlue = new RGB({ r: 0, g: 150, b: 255 })" ] ],
  [ "Nested", [ "var Border = new StructType('Border', { top: RGB, right: RGB, bottom: RGB, left: RGB })",
                "new Border({ top: fuschia, right: deepSkyBlue, bottom: fuschia, left: deepSkyBlue })" ] ],
]);


section("Bitfield", [
  [ "Indexed", [ "var bitfield = new BitfieldType(2)",
                 "var bits = new bitfield",
                 "bits.write(0); bits",
                 "bits[12] = true; bits[1] = true; bits;",
                 "bits.read()",
                 "bits.reify()" ] ],
  [ "Flags",   [ "var Desc = new BitfieldType('DescriptorFlags', "+
                 "['ENUMERABLE','CONFIGURABLE','WRITABLE'])",
                 "inst = new Desc ",
                 "inst.ENUMERABLE = true; inst",
                 "inst.buffer",
                 "inst.read()",
                 "inst.write(1 << 2 | 1 << 4)",
                 "inst.read()" ] ]
]);

section("Cominations", [
  [ ".lnk File Format", [ "var CLSID = new ArrayType('CLSID', 'UInt8', 16)",
                          "var LinkFlags = new BitfieldType('LinkFlags', ['HasLinkTargetIDList','HasLinkInfo','HasName','HasRelativePath',\n"+
                          "  'HasWorkingDir','HasArguments','HasIconLocation','IsUnicode','ForceNoLinkInfo','HasExpString','RunInSeparateProcess',\n"+
                          "  'UNUSED1','HasDarwinID','RunAsUser','HasExpIcon','NoPidAlias','UNUSED2','RunWithShimLayer','ForceNoLinkTrack',\n"+
                          "  'EnableTargetMetadata','DisableLinkPathTracking','DisableKnownFolderTracking','DisableKnownFolderAlias',\n"+
                          "  'AllowLinkToLink','UnaliasOnSave','PreferEnvironmentPath','KeepLocalIDListForUNCTarget'\n]);",
                          "var FileAttributesFlags = new BitfieldType('FileAttributesFlags', ['READONLY','HIDDEN','SYSTEM','UNUSED1','DIRECTORY','ARCHIVE',\n"+
                          "  'UNUSED2','NORMAL','TEMPORARY','SPARSE_FILE','REPARSE_POINT','COMPRESSED','OFFLINE','NOT_CONTENT_INDEXED','ENCRYPTED'\n])",
                          "var FILETIME = new StructType('FILETIME', { Low: UInt32, High: UInt32 })",
                          ["var ShellLinkHeader = new StructType('ShellLinkHeader', {",
                          "  HeaderSize: UInt32,",
                          "  LinkCLSID:  CLSID,",
                          "  LinkFlags:  LinkFlags,",
                          "  FileAttributes: FileAttributesFlags,",
                          "  CreationTime:  FILETIME,",
                          "  AccessTime:  'FILETIME',",
                          "  WriteTime:  FILETIME,",
                          "  FileSize: UInt32,",
                          "  IconIndex: Int32,",
                          "  ShowCommand: UInt32",
                          "});"].join('\n'),
                          "new ShellLinkHeader"]],
  [ "Graphics",   [ "var Point = new StructType('Point', { x: UInt32, y: UInt32 });",
                    "var Color = new StructType('Color', { r: UInt8, g: UInt8, b: UInt8 });",
                    "var Pixel = new StructType('Pixel', { point: Point, color: Color });",
                    "var Triangle = new ArrayType('Triangle', Pixel, 3);",
                    "var white = new Color({ r: 255, g: 255, b: 255 });",
                    "var red = new Point({ r: 255, g: 0, b: 0 });",
                    "var origin = new Point({ x: 0, y: 0 });",
                    "var defaults = new Pixel({ point: origin, color: white });",
                    ["var tri = new Triangle([",
                    "  defaults,",
                    "  { point: { x:  5, y: 5 }, color: red },",
                    "  { point: { x: 10, y: 0 }, color: { r: 0, g: 0, b: 128 } }",
                    "])"].join('\n'),
                    "var tri2 = tri.copy()",
                    "tri2[0].point.x = 500; tri",
                    "tri.reify()",
                    "tri2.reify()",
                    ]]
]);

