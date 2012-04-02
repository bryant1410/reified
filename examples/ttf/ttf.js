var fs = require('fs');
var path = require('path');
var exists = fs.existsSync || path.existsSync;

var vendors = require('./vendors');
var labels = require('./labels');



module.exports = Font;

// There's essentially type styles of usage. One which is more declarative like this
// One where everything uses the `reified` function magic. It's mostly a matter of style.

var reified   = require('reified'),
    BitfieldT = reified.BitfieldType,
    StructT   = reified.StructType,
    ArrayT    = reified.ArrayType,
    CharT     = reified.CharType,
    PointerT  = reified.PointerType,
    NumT      = reified.NumericType,
    Int8      = NumT.Int8,
    Int16     = NumT.Int16,
    Int32     = NumT.Int32,
    Int64     = NumT.Int64,
    Uint8     = NumT.Uint8,
    Uint16    = NumT.Uint16,
    Uint32    = NumT.Uint32,
    Uint64    = NumT.Uint64,
    Float32   = NumT.Float32,
    Float64   = NumT.Float64;


reified.defaultEndian = 'BE';

var flatten = Function.apply.bind([].concat, []);
function inspect(o){ console.log(require('util').inspect(o, false, 6)) }




function Font(buffer, filename){
  this.filename = filename;
  this.name = filename.slice(0, -path.extname(filename).length);

  // FontIndex is the entry point
  this.index = new FontIndex(buffer);
  this.tables = new TableHead[this.index.tableCount](buffer, this.index.bytes);
  this.tables.forEach(function(table){
    var tag = table.tag.reify();
    if (tag in TableTypes) {
      table.contents.cast(TableTypes[tag]);
    }
  })

  inspect(this.reify());
}

Font.fontFolder = ({
  win32:  '/Windows/fonts',
  darwin: '/Library/Fonts',
  linux:  '/usr/share/fonts/truetype'
}[process.platform]);

Font.listFonts = function listFonts(){ return fs.readdirSync(Font.fontFolder) }

Font.load = function load(filename){
  var resolved = path._makeLong(path.resolve(Font.fontFolder, filename));
  if (exists(resolved)) {
    return new Font(fs.readFileSync(resolved), filename);
  } else {
    throw new Error(resolved + ' not found');
  }
}

Font.prototype.reify = function reify(){
  return Object.keys(this).reduce(function(r,s){
    r[s] = this[s].reify ? this[s].reify() : this[s];
    return r;
  }.bind(this), {});
}


// ###########################
// ### Commonly used Types ###
// ###########################

var Point = new StructT('Point', {
  x: Int16,
  y: Int16
});

var Metrics = new StructT('Metrics', {
  size: Point,
  position: Point
});

var LongDateTime = new StructT('LongDateTime', {
  lo: Uint32,
  hi: Uint32
});

var Tag = new CharT(4);

var Version = new ArrayT('Version', Uint8, 4);

Version.prototype.reify = function(){
  return this.join('');
}

// ###############################################################################
// ### FontIndex starts the file and tells the number of Tables in the Index  ####
// ###############################################################################


var FontIndex = new StructT('FontIndex', {
  version    : new ArrayT('TTFVersion', 'Uint8', 4),
  tableCount : Uint16,
  range      : Uint16,
  selector   : Uint16,
  shift      : Uint16
});

FontIndex.fields.version.prototype.reify = function(){
  var val =  this.join('');
  return val === '0100' ? 'TrueType' : val === 'OTTO' ? 'OpenType' : 'Unknown';
}

// ######################################################################
// ### After the FontIndex are TableHeads with pointers to each table ###
// ######################################################################

var TableHead = new StructT('Table', {
  tag        : Tag,
  checksum   : Uint32,
  contents   : reified.VoidPtr,
  length     : Uint32
});

var TableTypes = {};


// ##################################################################################
// ### OS2 is the 'compatability' table containing a lot of useful stats and info ###
// ##################################################################################

// ### PANOSE is a set of 10 bitfields whose mapping is in labels.json ###
Object.keys(labels.panose).forEach(function(label){
  labels.panose[label] = new BitfieldT(label, labels.panose[label], 1);
});

// ### Unicode pages are 4 bitfields mapping to blocks which map to ranges, labels.json ###
var UnicodePages = new StructT('UnicodePages', labels.unicodeBlocks.reduce(function(ret, blocks, index){
  ret[index] = new BitfieldT('UnicodePages'+index, blocks, 4);

  ret[index].prototype.reify = function(){
    return flatten(reified.reify(this).map(function(s){
      return s.split(',').map(function(ss){ return labels.unicodeRanges[ss] });
    }));
  }

  return ret;
}, {}));

UnicodePages.prototype.reify = function(){
  var ret = reified.reify(this);
  return Object.keys(ret).reduce(function(r,s){
    return r.concat(ret[s]);
  }, []).sort();
}

TableTypes['OS/2'] = new StructT('OS2', {
  version      : Uint16,
  avgCharWidth : Int16,
  weightClass  : Uint16,
  widthClass   : Uint16,
  typer        : Uint16,
  subscript    : Metrics,
  superscript  : Metrics,
  strikeout    : new StructT('Strikeout',
  { size         : Int16,
    position     : Int16 }),
  class        : Int8[2],
  panose       : new StructT('PANOSE', labels.panose),
  unicodePages : UnicodePages,
  vendorID     : Tag,
  selection    : Uint16,
  firstChar    : Uint16,
  lastChar     : Uint16,
  typographic  : new StructT('Typographic',
  { ascender     : Int16,
    descender    : Int16,
    lineGap      : Int16 }),
  winTypograph : new StructT('WindowsTypographic',
  { ascender     : Uint16,
    descender    : Uint16 }),
  codePages1   : new BitfieldT('CodePages1', labels.codePageNames[0], 4),
  codePages2   : new BitfieldT('CodePages2', labels.codePageNames[1], 4),
  xHeight      : Int16,
  capHeight    : Int16,
  defaultChar  : Uint16,
  breakChar    : Uint16,
  maxContext   : Uint16
});

TableTypes['OS/2'].prototype.reify = function(){
  var val = reified.reify(this);
  val.weightClass = labels.weights[val.weightClass / 100 - 1];
  val.widthClass = labels.widths[val.widthClass - 1];
  val.vendorID in vendors && (val.vendorID = vendors[val.vendorID]);
  return val;
};


TableTypes.head = new StructT('Head', {
  version          : Version,
  fontRevision     : Int32 ,
  checkSumAdj      : Uint32,
  magicNumber      : Uint32,
  flags            : Uint16,
  unitsPerEm       : Uint16,
  created          : LongDateTime,
  modified         : LongDateTime,
  min              : Point,
  max              : Point,
  macStyle         : Uint16,
  lowestRecPPEM    : Uint16,
  fontDirHint      : Int16,
  indexToLocFormat : Int16,
  glyphDataFormat  : Int16,
});


var NameIndex = new StructT('NameIndex', {
  format     : Uint16,
  length     : Uint16,
  contents : Uint16
});

var NameRecord = new StructT('NameRecord', {
  platformID : Uint16,
  encodingID : Uint16,
  languageID : Uint16,
  nameID     : Uint16,
  length     : Uint16,
  contents : Uint16,
});

//console.log(Font.listFonts());
Font.load('DejaVuSansMono.ttf');