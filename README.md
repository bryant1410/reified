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

* NumericTypes - Each a constructor with the form of `new type(value, buffer)`
  * int8    : 1 bytes
  * uint8   : 1 bytes
  * int16   : 2 bytes
  * uint16  : 2 bytes
  * int32   : 4 bytes
  * uint32  : 4 bytes
  * int64   : 8 bytes
  * uint64  : 8 bytes
  * float32 : 4 bytes
  * float64 : 8 bytes

* StructType
* ArrayType

* Blocks - These represent the layer closest to the raw data. They encapsulate the information needed
           to read and modify the memory associated with a higher level construct.
  * NumberBlock - Represents a single number's memory from the NumericTypes.
  * StructBlock - Represents an instance of a specific struct type and its mapping to and from memory
  * ArrayBlock - Represents an instance of an array and its mapping to and from memory.

* Reference - A reference adds one level of indiraction to a provided value. In order to extract the value you have to back through the specific Referencer in order to dereference it. Also provides tools to make it easier to reference multiple values like arrays.



## Conversions

Not all in here yet and many belong in ffi, just notes for me for now.


 API Function  | input           | output                      |  implementation
---------------|-----------------|-----------------------------|-----------------------
Reify          |          type A | JSobj                       |                    
Reify          |      ref type A | JSobj                       |                    
Reify          |  numeric type A | JSval                       |                    
Convert        |           JSobj | type A                      |  alloc             
Cast           |  numeric type A | numeric type B              |  reinterpret POD   
Cast           |           JSval | numeric type A              |  reinterpret type B
CCast          |       any ref A | any ref B <= size A         |  replace ptr?      
CCast          |  numeric type A | numeric type B, <= size A   |  reinterpret       
CCast          |           JSval | to C, cast, reiify toJSval  |  alloc then free   
CCast          |          type A | ?                           |                    
Deref          |      ref type A | type A                      |  free?             
Deref          |          type A | JSobj                       |  free?             
Deref          |  numeric type A | JSval or error?             |                    
Reference      |           JSobj | JSobj ref outside heap?     |                    
Reference      |          type A | ref type A                  |                    
Reference      |      ref type A | ref ref ?                   |                    
Type Construct |           JSObj | type A                      |                    