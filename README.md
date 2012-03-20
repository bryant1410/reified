# Reified - Binary data mapping for JS

StructTypes, ArrayTypes, NumberTypes. Create views on top of buffers that allow easy conversion to and from binary data.

```
npm install reified
```

It's currently set up for node but I'm ALMOST done making it browser ready. Just need to clean up dependencies, but the underlying data abstractions are complete and working just fine.

# Overview
All of the following APIs are used in conjunction with Buffers. The purpose is to seamlessly give JavaScript mapping to an underlying set of bytes. Multiple different reified structures can point to the same underlying data. It's the same concept as DataView, except much more awesome.

The following examples use reified's option to automatically allocate a buffer during construction, but any of them also work when provided an existing buffer and optional offset. The real power is loading a file or chunk of memory and mapping a protocol or file format seamlessly from bytes to JavaScript and back.

#### NumericType
Float32, Float64, Int8, Uint8, Int16, Uint16, Int32, Uint32, Int64, Uint64

```javascript
var reified = require('reified');
var int32 = reified('Uint32', 10000000) <Uint32> 10000000
var int16 = reified('Uint16', int32)    <Uint16> 38528
var int8 = reified('Uint8', int16)      <Uint8>  128

int8.write(100)
<Uint32> 9999972
<Uint16> 38500
<Uint8>  100
```

#### ArrayType
A constructor constructor for array types. These are containers for multiples values that are of the same type. The member type can be any type, simple or complex.

```javascript
var int32x4x4x2 = reified('Int32[4][4][2]')
//or
var Int32 = reified('Int32')
var int32x4x4x2 = Int32[4][4][2]
//-->
‹Int32x4x4x2›(128b)[ 2 ‹Int32x4x4›(64b)[ 4 ‹Int32x4›(16b)[ 4 ‹Int32› ] ] ]

var array = new int32x4x4x2
//or
var array = new reified('Int32[4][4][2]')
//or
var array = new Int32[4][4][2]
//-->
<Int32x4x4x2>
[ <Int32x4x4>
  [ <Int32x4> [ <Int32> 0, <Int32> 0, <Int32> 0, <Int32> 0 ],
    <Int32x4> [ <Int32> 0, <Int32> 0, <Int32> 0, <Int32> 0 ],
    <Int32x4> [ <Int32> 0, <Int32> 0, <Int32> 0, <Int32> 0 ],
    <Int32x4> [ <Int32> 0, <Int32> 0, <Int32> 0, <Int32> 0 ] ],
  <Int32x4x4>
  [ <Int32x4> [ <Int32> 0, <Int32> 0, <Int32> 0, <Int32> 0 ],
    <Int32x4> [ <Int32> 0, <Int32> 0, <Int32> 0, <Int32> 0 ],
    <Int32x4> [ <Int32> 0, <Int32> 0, <Int32> 0, <Int32> 0 ],
    <Int32x4> [ <Int32> 0, <Int32> 0, <Int32> 0, <Int32> 0 ] ] ]

array.reify()
//-->
[ [ [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ] ],
  [ [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ] ] ]
```

#### StructType
A constructor constructor that is used to build Struct constructors. These can be complex data structures that contain multiple levels of smaller structs and simple data types.

```javascript
var Point = reified('Point', { x: Uint32, y: Uint32 });
var Color = reified('Color', { r: 'Uint8', g: 'Uint8', b: 'Uint8' })
var Pixel = reified('Pixel', { point: Point, color: Color });

var Triangle = reified('Triangle', Pixel[3]);
//-->
‹Triangle›(33b)
[ 3 ‹Pixel›(11b)
  | point: ‹Point›(8b) { x: ‹Uint32› | y: ‹Uint32› }
  | color: ‹RGB›(3b) { r: ‹Uint8› | g: ‹Uint8› | b: ‹Uint8› } ]

var tri = new Triangle([
  { point: { x:  0, y: 0 }, color: { r: 255, g: 255, b: 255 } },
  { point: { x:  5, y: 5 }, color: { r: 255, g:   0, b:   0 } },
  { point: { x: 10, y: 0 }, color: { r: 0,   g:   0, b: 128 } }
])

//-->
<Triangle>
[ <Pixel>
  | point: <Point> { x: <Uint32> 0 | y: <Uint32> 0 }
  | color: <Color> { r: <Uint8> 255 | g: <Uint8> 255 | b: <Uint8> 255 },
  <Pixel>
  | point: <Point> { x: <Uint32> 5 | y: <Uint32> 5 }
  | color: <Color> { r: <Uint8> 255 | g: <Uint8> 0 | b: <Uint8> 0 },
  <Pixel>
  | point: <Point> { x: <Uint32> 10 | y: <Uint32> 0 }
  | color: <Color> { r: <Uint8> 0 | g: <Uint8> 0 | b: <Uint8> 128 } ]

tri.reify()
//-->
[ { point: { x: 0, y: 0 }, color: { r: 255, g: 255, b: 255 } },
  { point: { x: 5, y: 5 }, color: { r: 255, g: 0, b: 0 } },
  { point: { x: 10, y: 0 }, color: { r: 0, g: 0, b: 128 } } ]
```
#### BitfieldType
A constructor constructor to create bitfields which seamlessly map between bits and a set of flags.

```javascript
var DescriptorFlags = reified('DescriptorFlags', {
  ENUMERABLE   : 1,
  CONFIGURABLE : 2,
  READONLY     : 3,
  WRITABLE     : 4,
  FROZEN       : 5,
  HIDDEN       : 6,
  NOTPRIVATE   : 7,
}, 1);

‹DescriptorFlags›(8bit)
  0x1   ENUMERABLE
  0x2   CONFIGURABLE
  0x3   READONLY
  0x4   WRITABLE
  0x5   FROZEN
  0x6   HIDDEN
  0x7   NOTPRIVATE

var desc = new DescriptorFlags;
desc.HIDDEN = true;
{ ‹DescriptorFlags›
  ENUMERABLE:   false,
  CONFIGURABLE: true,
  READONLY:     true,
  WRITABLE:     true,
  FROZEN:       true,
  HIDDEN:       true,
  NOTPRIVATE:   true }

desc.read()
 6
```


# Terminology

At the top level is the Type constructors, listed above. `new ArrayType` creates an instance of _‹ArrayT›_, `new StructType` creates an instance of _‹StructT›_ etc. _‹Type›_ is used to indicate something common to all instances of all types. _‹StructT›_ is used to indicate something common to all instances of StructTypes. `‹Type›.__proto__` is one of the top level Type constructors' prototypes like `ArrayType.prototype`. `ArrayType.protoype.__proto__` and the others share a common genesis, the top level `Type`.

A _‹Type›_ is the constructor for a given type of `<Data>`, so `‹Type›.prototype = <Data>`. `<Data>.__proto__` is one of the top level types' prototypes, `‹Type›.prototype.prototype`, like `NumericType.prototype.prototype`, referred to as `NumericData`. Finally, `NumericData.__proto__` and the others share a common genesis, the top level `Data`.

## Cavaeats/Notes

Currently, index and field accessors on arrays and structs are lazily created and defined. This means something like `Object.keys(<Data>)` isn't reliable. The purpose of this is so that a JavaScript representation of data isn't created until it's actually needed, otherwise simply using _reified_ would use more memory than the data it's providing a view for. This will be addressed with an optional add-on component implementing Harmony Proxies. The trade-off is that these require running Node with a special flag, or in browsers require special flags, dev versions, etc.


# ‹Type›

##Defining a ‹Type›

Aside from the provided _‹NumericT›_'s you will be providing your own definitions. _‹Types›_ are built kind of like using legos; you can use any _‹Types›_ in creating the definition for a _‹StructT›_ or _‹ArrayT›_.

When defining a type, the `name` is optional but it allows you to reference the type by name either using the primary interface exported, the `reified` function, or when defining new types. It also helps format inspection output better and is used in debug output.

* `new StructType(name, definition)` - Definition is an object with the desired structure, where the keys will be the fieldnames and the values are either _‹StructT›_ instances or their names.
* `new ArrayType(name, memberType, count)` - memberType is the _‹Type›_ to be used for members, count is the preset length for each instance of `<Array>`.
* `new BitfieldType(name, flags, bytes)` - Flags can be an array of flag names, where each name is mapped to a bit, or an object mapping names to their numeric value. An object is useful for when there's composite values that flip multiple bits. Bytes is optional to specifically set the amount of bytes for an instance. Otherwise this is the minimal amount of bytes needed to contain the specified flags.
* `new NumericType(name, bytes)` - currently an internal API, used to initialize the preset numeric types

The base export function `reified` is a shortcut for all of these constructors.

* `reified('Uint8')` - returns the _‹Type›_ that matches the name
* `reified('Uint8[10]')` - returns an _‹ArrayT›_ for the specified type and size
* `reified('Uint8[10][10][10]')` - arrays can be nested arbitrarily
* `reified('Octets', 'Uint8[10]')` - A label can also be specified
* `reified('RenameOctets', Octets)` - If the second parameter is a _‹Type›_ and there's no third parameter the type is renamed
* `reified('OctetSet', 'Octets', 10)` - An array is created if the third parameter is a number and the second resolves to a _‹Type›_
* `reified('RGB', { r: 'Uint8', g: 'Uint8', b: 'Uint8'})` - If the second parameter is a non-type object then a _‹StructT›_ is created
* `reified('Bits', 2)` - If the first parameter is a new name and the second parameter is a number a _‹BitfieldT›_ is created with the specified bytes.
* `reified('Flags', [array of flags...], 2)` - If the second parameter is an array a _‹BitfieldT›_ is created, optionally with bytes specified.
* `reified('FlagObject', { object of flags...}, 2)` - If the second parameter is a non-type object and the third is a number then a _‹BitfieldT›_ is created using the object as a flags object.

## ‹Type› as constructor

In the following, buffer can be either a buffer itself or something that has a buffer property as well, so it'll work with any ArrayBuffer, or a `<Data>` instance.
Value can be either a JS value/object with the same structure (keys, indices, number, etc.) as the type or an instance of `<Data>` that maps to the ‹Type›. Value can also be a buffer in which case the data will be reified to JS then written out, thus copying the data. `new` is optional.

* `new ‹Type›(buffer, offset, value)` - instance using buffer, at `offset || 0`, optionally initialized with value.
* `new ‹Type›(value)` - allocates new buffer initialized with value
* `new reified('TypeName', buffer, offset, value)` - a shortcut for the above (`new` required)
* `reified.data('TypeName', buffer, offset, value)` - also a shortcut for the above

## ‹Type› static functions and properties

* `‹Type›.isInstance(o)` - checks if a given `<Data>` is an instance of the _‹Type›_. This also works on each top level Type, `ArrayType.isInstance(o)`, and even `Type.istance(o)` if it's `<Data>` of any kind
* `‹Type›.bytes` - byteSize of an instance of the Type
* `‹Type›.array(n)` - create a new ‹ArrayT› from ‹Type› with _n_ size
* `‹Type›[1..20]` - shortcut for `‹Type›.array(n)` for __n__'s up to 20
* `‹StructT›.fields` - frozen structure reference with fieldName --> Data that constructs it
* `‹StructT›.names`  - array of field names
* `‹StructT›.offsets` - bytes offsets for each member
* `‹ArrayT›.memberType` - the _‹Type›_ the array is made of
* `‹ArrayT›.count` - length for instances of `<Array>`.
* `‹BitfieldT›.flags` - object containing flag names and the value they map to


## `<Data>` methods and properties

`<Data>` instances are constructed by `‹Type›`'s. They are the interface that directly maps to memory and modifies it.

## Common

* `<Data>.bytes` - same as ‹Type›.bytes
* `<Data>.DataType` - number type name or 'array' or 'struct' or 'bitfield'
* `<Data>.write(value)` - primarily for setting the value of the whole thing at once depending on type
* `<Data>.reify()` - recursively convert to JavaScript objects/values
* `<Data>.fill([value])` - fills each distinct area of the type with value or 0. (array indices, struct members, same as write for number)
* `<Data>.rebase([buffer])` - switch to another buffer or allocates a new buffer
* `<Data>.realign(offset)` - changes the offset on the current buffer
* `<Data>.clone()` - create a copy of `<Data>` pointing to the same buffer and offset
* `<Data>.copy([buffer], [offset])` - create a copy of `<Data>` pointing to the provided buffer and offset or new buffer and 0, copying buffer data byte for byte
* `<Data> accessor [get]` - returns the `<Data>` instance for that field, not the reified value. To get the value: `instance[indexOrField].reify()`
* `<Data> accessor [set]` - sets the value, mapping the structure in terms of arrays and objects to indices and fields.

## Struct

* `<Struct>.fieldName` - field based accessors

## Array

* `<Array>.write(value, [index], [offset])` - optionally start from given array index on the type, with optional offset as the starting index for reading from the source
* `<Array>[0...length]` - index based accessor
* `<Array>.map` - Array.prototype.map
* `<Array>.forEach` - Array.prototype.forEach
* `<Array>.reduce` - Array.prototype.reduce

## Bitfield

* `<Bitfield>.write(value)` - writes the underlying data as a single number
* `<Bitfield>.read()` - reads the underlying data as a single number
* `<Bitfield>.get(index)` - get bit at index
* `<Bitfield>.set(index)` - set bit at index to 1
* `<Bitfield>.unset(index)` - set bit at index to 0
* `<Bitfield>[0...length]` - index based accessor
* `<Bitfield>.flagName` - flag based accessor, which can set multiple bits at once based on initial definition
* `<Bitfield>.map` - Array.prototype.map
* `<Bitfield>.forEach` - Array.prototype.forEach
* `<Bitfield>.reduce` - Array.prototype.reduce
* `<Bitfield>.toString` - String of the bits in 1's and 0's

# More Example Usage

## Indexed Bitfield
```javascript
var bitfield = new BitfieldType(4)
 ‹Bitfield›(32bit)

var bits = new bitfield
 ‹Bitfield›[00000000000000000000000000000000]

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

## .lnk File Format
```javascript
var CLSID = new ArrayType('CLSID', Uint8, 16)
var FILETIME = new StructType('FILETIME ', { Low: Uint32, High: Uint32 })
var LinkFlags = new BitfieldType('LinkFlags', ['HasLinkTargetIDList','HasLinkInfo','HasName','HasRelativePath',
  'HasWorkingDir','HasArguments','HasIconLocation','IsUnicode','ForceNoLinkInfo','HasExpString','RunInSeparateProcess',
  'UNUSED1','HasDarwinID','RunAsUser','HasExpIcon','NoPidAlias','UNUSED2','RunWithShimLayer','ForceNoLinkTrack',
  'EnableTargetMetadata','DisableLinkPathTracking','DisableKnownFolderTracking','DisableKnownFolderAlias',
  'AllowLinkToLink','UnaliasOnSave','PreferEnvironmentPath','KeepLocalIDListForUNCTarget'
]);
var FileAttributesFlags = new BitfieldType('FileAttributesFlags', ['READONLY','HIDDEN','SYSTEM','UNUSED1','DIRECTORY','ARCHIVE',
  'UNUSED2','NORMAL','TEMPORARY','SPARSE_FILE','REPARSE_POINT','COMPRESSED','OFFLINE','NOT_CONTENT_INDEXED','ENCRYPTED'
])
var ShellLinkHeader = new StructType('ShellLinkHeader', {
  HeaderSize: Uint32,
  LinkCLSID:  CLSID,
  LinkFlags:  LinkFlags,
  FileAttributes: FileAttributesFlags,
  CreationTime:  FILETIME,
  AccessTime:  FILETIME,
  WriteTime:  FILETIME,
  FileSize: Uint32,
  IconIndex: Int32,
  ShowCommand: Uint32
});
//-->
‹ShellLinkHeader›(62b)
| HeaderSize:     ‹Uint32›
| LinkCLSID:      ‹CLSID›(16b)[ 16 ‹Uint8› ]
| LinkFlags:      ‹LinkFlags›(32bit)
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
| FileAttributes: ‹FileAttributesFlags›(16bit)
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
| CreationTime:   ‹FILETIME›(8b) { Low: ‹Uint32› | High: ‹Uint32› }
| AccessTime:     ‹FILETIME›(8b) { Low: ‹Uint32› | High: ‹Uint32› }
| WriteTime:      ‹FILETIME›(8b) { Low: ‹Uint32› | High: ‹Uint32› }
| FileSize:       ‹Uint32›
| IconIndex:      ‹Int32›
| ShowCommand:    ‹Uint32›
```

## TODO

* Remove all dependence on __proto__ for host agnostic usage. Once that's done the question remains whether to use it when possible or to have parity across implementations.
* APIs/wrappers for handling indiration (pointers), as the initial use case is for FFI.
* An optional extended JS interface implementing Harmony Proxies to smooth over the rough edges and make usage easier.
* Dynamic mapping of structures that use indirection, for example the TTF font file format with header tables and pointer rich structures.
* String handling and the dynamic sizing that goes along with that.
* Make it work in browsers with ArrayBuffers and DataView. This can probably be done with a modified ViewBuffer built on top of DataView/ArrayBuffer instead of node's Buffer, along with some tweaks to incompatible code.
* After making it work with DataViews, find more optimization points. Many of these will likely be engine specific.



## License

(The MIT License)

Copyright (c) 2012 Brandon Benvie <brandon@bbenvie.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.