## Reified - ES6 Binary Data Spec++

This is currently a Work In Progress but it's coming along quickly. The goal is, at baseline, full implementation of the ES6 Binary Data API (which is itself incomplete currently but close enough).

http://wiki.ecmascript.org/doku.php?id=harmony:binary_data_semantics

## Goals

* Equally usable for mapping data from files, data streams, and in memory data structures (FFI)
* Thus ability to apply the constructs provided to different underlying data providers
* Some level of support for dynamic allocation of memory in cases where your producing structures in memory (as opposed to IO) without C++ support
* Beyond the ES6 API, good apis/wrappers for handling indiration (pointers), as the initial use case is for FFI
* Across the board ability to handle complex and nested structures.
* An optional extended JS interface implementing Harmony Proxies to smooth over the rough edges and make usage easier.
* Dynamic mapping of structures (useful for mapping out files like TTF font file format for example with header tables and pointer rich structures) is something I want to do is harder and lower priority.

## API

* NumericTypes
  * 1 byte  - `Int8,  Uint8`
  * 2 bytes - `Int16, Uint16`
  * 4 bytes - `Int32, Uint32, Float`
  * 8 bytes - `Int64, Uint64, Double`

* StructType - A constructor constructor that is used to build Struct constructors. These can be complex data structures that contain multiple levels of smaller structs and simple data types.

* ArrayType - A constructor constructor for array types. These are containers for multiples values that are of the same type (same memory size footprint).


## Debug Dump Showing Usage


## NumericType

### Instances
```
var int32 = new UInt32(10000000)
 <UInt32 10000000>

var int16 = new UInt16(int32)
 <UInt16 38528>

var int8 = new UInt8(int16)
 <UInt8 128>

```

### Shared Data
```
int8.write(100)
 <UInt8 100>

int32
 <UInt32 9999972>

int16
 <UInt16 38500>

int8
 <UInt8 100>

```

## ArrayType

### Simple
```
var RGBarray = new ArrayType('RGB', UInt8, 3)
//-->
{ [Function: RGB]
  isInstance: [Function: isInstance],
  elementType: { [Function: UInt8] bytes: 1 },
  bytes: 3,
  count: 3 }


new RGBarray([0, 150, 255])
 [ [Array: RGB] <UInt8 0>, <UInt8 150>, <UInt8 255> ]

```

### Multidimension
```
var int32x4 = new ArrayType(Int32, 4)
//-->
{ [Function: Int32x4Array]
  isInstance: [Function: isInstance],
  elementType: { [Function: Int32] bytes: 4 },
  bytes: 16,
  count: 4 }


var int32x4x4 = new ArrayType(int32x4, 4)
//-->
{ [Function: Int32x4x4Array]
  isInstance: [Function: isInstance],
  elementType: 
   { [Function: Int32x4Array]
     isInstance: [Function: isInstance],
     elementType: { [Function: Int32] bytes: 4 },
     bytes: 16,
     count: 4 },
  bytes: 64,
  count: 4 }


var int32x4x4x2 = new ArrayType(int32x4x4, 2)
//-->
{ [Function: Int32x4x4x2Array]
  isInstance: [Function: isInstance],
  elementType: 
   { [Function: Int32x4x4Array]
     isInstance: [Function: isInstance],
     elementType: 
      { [Function: Int32x4Array]
        isInstance: [Function: isInstance],
        elementType: [Object],
        bytes: 16,
        count: 4 },
     bytes: 64,
     count: 4 },
  bytes: 128,
  count: 2 }


new int32x4
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ]

new int32x4x4
//-->
[ [Array: Int32x4x4Array]
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ],
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ],
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ],
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ] ]


new int32x4x4x2
//-->
[ [Array: Int32x4x4x2Array]
 [ [Array: Int32x4x4Array]
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ],
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ],
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ],
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ] ],
 [ [Array: Int32x4x4Array]
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ],
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ],
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ],
 [ [Array: Int32x4Array] <Int32 0>, <Int32 0>, <Int32 0>, <Int32 0> ] ] ]


```

## StructType

### Simple
```
var RGB = new StructType('RGB', { red: UInt8, green: UInt8, blue: UInt8 })
//-->
{ [Function: RGB]
  isInstance: [Function: isInstance],
  fields: 
   { red: { [Function: UInt8] bytes: 1 },
     green: { [Function: UInt8] bytes: 1 },
     blue: { [Function: UInt8] bytes: 1 } },
  offsets: { red: 0, green: 1, blue: 2 },
  names: [ 'red', 'green', 'blue' ],
  bytes: 3 }


var fuschia = new RGB({ red: 255, green: 0, blue: 255 })
//-->
{ [Struct: RGB] red: <UInt8 255>, green: <UInt8 0>, blue: <UInt8 255> }


var deepSkyBlue = new RGB({ red: 0, green: 150, blue: 255 })
//-->
{ [Struct: RGB] red: <UInt8 0>, green: <UInt8 150>, blue: <UInt8 255> }


```

