# Reified - Binary data mapping for JS

StructTypes, ArrayTypes, NumberTypes. Create views on top of buffers that allow easy conversion to and from binary data.

## Goals

* Equally usable for mapping data from files, data streams, and in memory data structures (FFI)
* Thus ability to apply the constructs provided to different underlying data providers
* Some level of support for dynamic allocation of memory in cases where your producing structures in memory (as opposed to IO) without C++ support
* APIs/wrappers for handling indiration (pointers), as the initial use case is for FFI
* Across the board ability to handle complex and nested structures.
* An optional extended JS interface implementing Harmony Proxies to smooth over the rough edges and make usage easier.
* Dynamic mapping of structures (useful for mapping out files like TTF font file format for example with header tables and pointer rich structures) is something I want to do is harder and lower priority.

## Top level types

* NumericTypes
  * 1 byte  - `Int8,  UInt8`
  * 2 bytes - `Int16, UInt16`
  * 4 bytes - `Int32, UInt32, Float`
  * 8 bytes - `Int64, UInt64, Double`

* StructType - A constructor constructor that is used to build Struct constructors. These can be complex data structures that contain multiple levels of smaller structs and simple data types.

* ArrayType - A constructor constructor for array types. These are containers for multiples values that are of the same type (same memory size footprint).

* BitfieldType - A constructor constructor to create bitfields which seamlessly map between bits in to a set of flags and back to memory.

## API work in progress

#### Constructor/call primary interface

Buffer can be anything that has a buffer property as well, so it'll work with any ArrayBuffer, an instance of a reify Type, or whatever.
Value can also be a buffer in which case the data will reified to JS then written out (going to add raw buffer copy functions also).

* `[new ]AnyT(buffer, byteOffset, value)` - instance using buffer, at `byteOffset || 0`, optionally initialized with value
* `[new ]AnyT(value)` - allocates new buffer initialized with value
`new NumberT(value)` - new required here for NumberT
* `NumberT(value)` - for numbers, utility to cast a number to a type (doesn't use buffer to convert)

#### Static class functions

* `AnyT.isInstance(o)` - unified name for equivelent to Buffer.isBuffer since there's so many types
* `AnyT.bytes`         - byteSize of an instance of the Type
* `StructT.fields`     - frozen structure reference with fieldName --> AnyT that constructs it
* `StructT.names`      - array of field names
* `ArrayT.memberType` - points to AnyT that constructs the type it contains


#### Prototype methods //properties

* `AnyT.prototype.write(value) // primarily for setting the value of the whole thing at once depending on type
* `ArrayT.prototype.write(value, index) //optionally start from given index on the type itself
* `AnyT.prototype.reify() // recursively convert to javascript objects/values
* `AnyT.prototype.fill(value) // fills each distinct area of the type with value. (array indices, struct members, same as write for number)
* `AnyT.prototype.bytes // same as AnyT.bytes
* `AnyT.prototype.dataType // number type name or 'array' or 'struct'

__implemented for numbers, will be for Structs and Arrays soon__

* `AnyT.prototype.rebase(buffer, offset)` - update view to another buffer, offset defaulting to 0
* `AnyT.prototype.realign(offset)` - change offset of view, keeping buffer

__for both of the following it works the same. accessors that do the following__

* `[get]` - returns the type instance, not the reifyied value. To get the value you can do instance[indexOrField].reify()
* `[set]` - sets the underlying buffer to the value, framed through whatever structure is between you and the memory
* `ArrayT.prototype[0...length]` - index based accessor
* `StructT.prototype.fieldName` - field based accessors

__Todo functionality__

* AnyT.prototype.copy(bufferItem, startSource, startDest, length) // direct copying at buffer level to buffer or item.buffer
* AnyT.prototype.clone(bufferItem, offset) //copy in entirety to target buffer or item.buffer, initializing a new instance of the type over the * memory


## Debug Dump Showing Usage



### NumericType

#### Instances
```
var int32 = new UInt32(10000000)
 uint32<10000000>

var int16 = new UInt16(int32)
 uint16<38528>

var int8 = new UInt8(int16)
 uint8<128>

```

#### Shared Data
```
int8.write(100)
 uint8<100>

int32
 uint32<9999972>

int16
 uint16<38500>

int8
 uint8<100>

```

### ArrayType

#### Simple
```
var RGBarray = new ArrayType('RGB', UInt8, 3)
 ‹RGB›[3 ‹UInt8›]

new RGBarray([0, 150, 255])
 [ <RGB> uint8<0>, uint8<150>, uint8<255> ]

```

#### Multidimension
```
var int32x4 = new ArrayType(Int32, 4)
 ‹Int32x4›[4 ‹Int32›]

var int32x4x4 = new ArrayType(int32x4, 4)
 ‹Int32x4x4›[4 ‹Int32x4›[4 ‹Int32›]]

var int32x4x4x2 = new ArrayType(int32x4x4, 2)
//-->
‹Int32x4x4x2›[2 ‹Int32x4x4›[4 ‹Int32x4›[4 ‹Int32›]]]


new int32x4
 [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ]

new int32x4x4
//-->
[ <Int32x4x4>
  [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ],
  [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ],
  [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ],
  [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ] ]


new int32x4x4x2
//-->
[ <Int32x4x4x2>
  [ <Int32x4x4>
    [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ],
    [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ],
    [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ],
    [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ] ],
  [ <Int32x4x4>
    [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ],
    [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ],
    [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ],
    [ <Int32x4> int32<0>, int32<0>, int32<0>, int32<0> ] ] ]
```

### StructType

#### Simple
```
var RGB = new StructType('RGB', { r: UInt8, g: UInt8, b: UInt8 })
//-->
‹RGB› [ r: ‹UInt8› | g: ‹UInt8› | b: ‹UInt8› ]


var fuschia = new RGB({ r: 255, g: 0, b: 255 })
//-->
{ <RGB> r: uint8<255>, g: uint8<0>, b: uint8<255> }


var deepSkyBlue = new RGB({ r: 0, g: 150, b: 255 })
//-->
{ <RGB> r: uint8<0>, g: uint8<150>, b: uint8<255> }
```

#### Nested
```
var Border = new StructType('Border', { top: RGB, right: RGB, bottom: RGB, left: RGB })
//-->
‹Border›
| top:    ‹RGB› [ r: ‹UInt8› | g: ‹UInt8› | b: ‹UInt8› ]
| right:  ‹RGB› [ r: ‹UInt8› | g: ‹UInt8› | b: ‹UInt8› ]
| bottom: ‹RGB› [ r: ‹UInt8› | g: ‹UInt8› | b: ‹UInt8› ]
| left:   ‹RGB› [ r: ‹UInt8› | g: ‹UInt8› | b: ‹UInt8› ]


new Border({ top: fuschia, right: deepSkyBlue, bottom: fuschia, left: deepSkyBlue })
//-->
{ <Border>
  top: { <RGB> r: uint8<0>, g: uint8<150>, b: uint8<255> },
  right: { <RGB> r: uint8<0>, g: uint8<150>, b: uint8<255> },
  bottom: { <RGB> r: uint8<0>, g: uint8<150>, b: uint8<255> },
  left: { <RGB> r: uint8<0>, g: uint8<150>, b: uint8<255> } }
```

### Bitfield

#### Indexed
```
var bitfield = new BitfieldType(2)
 ‹Bitfield› (32bit)

var bits = new bitfield
 ‹Bitfield›[10100001000100000000000000000000]

bits.write(0); bits
 ‹Bitfield›[00000000000000000000000000000000]

bits[12] = true; bits[1] = true; bits;
//-->
‹Bitfield›[01000000000010000000000000000000]


bits.read()
 4098

bits.reify()
//-->
[ false, true, false, false, false, false, false, false, false, false, false,
  false, true, false, false, false, false, false, false, false, false, false,
  false, false, false, false, false, false, false, false, false, false ]
```

#### Flags
```
var Desc = new BitfieldType('DescriptorFlags', ['PRIVATE','ENUMERABLE','CONFIGURABLE','READONLY','WRITABLE','FROZEN','HIDDEN','NORMAL'])
//-->
‹DescriptorFlags› (8bit)
  0x1   PRIVATE
  0x2   ENUMERABLE
  0x4   CONFIGURABLE
  0x8   READONLY
  0x10  WRITABLE
  0x20  FROZEN
  0x40  HIDDEN
  0x80  NORMAL


inst = new Desc 
//-->
{ ‹DescriptorFlags›
  PRIVATE: false,
  ENUMERABLE: false,
  CONFIGURABLE: false,
  READONLY: false,
  WRITABLE: false,
  FROZEN: false,
  HIDDEN: false,
  NORMAL: false }


inst.ENUMERABLE = true; inst
//-->
{ ‹DescriptorFlags›
  PRIVATE: false,
  ENUMERABLE: true,
  CONFIGURABLE: false,
  READONLY: false,
  WRITABLE: false,
  FROZEN: false,
  HIDDEN: false,
  NORMAL: false }


inst.buffer
 <Buffer 02>

inst.read()
 2

inst.write(1 << 2 | 1 << 4)
//-->
{ ‹DescriptorFlags›
  PRIVATE: false,
  ENUMERABLE: false,
  CONFIGURABLE: true,
  READONLY: false,
  WRITABLE: true,
  FROZEN: false,
  HIDDEN: false,
  NORMAL: false }


inst.read()
 20
```

### Cominations


#### .lnk File Format
```
var CLSID = new ArrayType('CLSID', UInt8, 16)

var LinkFlags = new BitfieldType('LinkFlags', [
  'HasLinkTargetIDList','HasLinkInfo','HasName','HasRelativePath', 'HasWorkingDir','HasArguments',
  'HasIconLocation','IsUnicode', 'ForceNoLinkInfo','HasExpString','RunInSeparateProcess', 'UNUSED1',
  'HasDarwinID','RunAsUser','HasExpIcon','NoPidAlias','UNUSED2', 'RunWithShimLayer','ForceNoLinkTrack',
  'EnableTargetMetadata','DisableLinkPathTracking','DisableKnownFolderTracking','DisableKnownFolderAlias',
  'AllowLinkToLink','UnaliasOnSave','PreferEnvironmentPath','KeepLocalIDListForUNCTarget'
]);

var FileAttributesFlags = new BitfieldType('FileAttributesFlags', [
  'READONLY','HIDDEN','SYSTEM','UNUSED1','DIRECTORY','ARCHIVE',
  'UNUSED2','NORMAL','TEMPORARY','SPARSE_FILE','REPARSE_POINT',
  'COMPRESSED','OFFLINE','NOT_CONTENT_INDEXED','ENCRYPTED'
]);

var FILETIME = new StructType('FILETIME ', {
  LowDateTime: UInt32,
  HighDateTime: UInt32
})

var ShellLinkHeader = new StructType('ShellLinkHeader', {
  HeaderSize: UInt32,
  LinkCLSID:  CLSID,
  LinkFlags:  LinkFlags,
  FileAttributes: FileAttributesFlags,
  CreationTime:  FILETIME,
  AccessTime:  FILETIME,
  WriteTime:  FILETIME,
  FileSize: UInt32,
  IconIndex: Int32,
  ShowCommand: UInt32
});

//-->
‹ShellLinkHeader›
| HeaderSize:     ‹UInt32›
| LinkCLSID:      ‹CLSID›[16 ‹UInt8›]
| LinkFlags:      ‹LinkFlags› (32bit)
    0x1           HasLinkTargetIDList
    0x2           HasLinkInfo
    0x4           HasName
    0x8           HasRelativePath
    0x10          HasWorkingDir
    0x20          HasArguments
    0x40          HasIconLocation
    0x80          IsUnicode
    0x100         ForceNoLinkInfo
    0x200         HasExpString
    0x400         RunInSeparateProcess
    0x800         UNUSED1
    0x1000        HasDarwinID
    0x2000        RunAsUser
    0x4000        HasExpIcon
    0x8000        NoPidAlias
    0x10000       UNUSED2
    0x20000       RunWithShimLayer
    0x40000       ForceNoLinkTrack
    0x80000       EnableTargetMetadata
    0x100000      DisableLinkPathTracking
    0x200000      DisableKnownFolderTracking
    0x400000      DisableKnownFolderAlias
    0x800000      AllowLinkToLink
    0x1000000     UnaliasOnSave
    0x2000000     PreferEnvironmentPath
    0x4000000     KeepLocalIDListForUNCTarget
| FileAttributes: ‹FileAttributesFlags› (16bit)
    0x1      READONLY
    0x2      HIDDEN
    0x4      SYSTEM
    0x8      UNUSED1
    0x10     DIRECTORY
    0x20     ARCHIVE
    0x40     UNUSED2
    0x80     NORMAL
    0x100    TEMPORARY
    0x200    SPARSE_FILE
    0x400    REPARSE_POINT
    0x800    COMPRESSED
    0x1000   OFFLINE
    0x2000   NOT_CONTENT_INDEXED
    0x4000   ENCRYPTED
| CreationTime:   ‹FILETIME› [ LowDateTime: ‹UInt32› | HighDateTime: ‹UInt32› ]
| AccessTime:     ‹FILETIME› [ LowDateTime: ‹UInt32› | HighDateTime: ‹UInt32› ]
| WriteTime:      ‹FILETIME› [ LowDateTime: ‹UInt32› | HighDateTime: ‹UInt32› ]
| FileSize:       ‹UInt32›
| IconIndex:      ‹Int32›
| ShowCommand:    ‹UInt32›
```