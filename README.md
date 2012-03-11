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

* __NumericTypes__ - Each a constructor with the form of `new type(value, buffer)`
  * 1 byte  - `int8,  uint8`
  * 2 bytes - `int16, uint16`
  * 4 bytes - `int32, uint32, float32`
  * 8 bytes - `int64, uint64, float64`

* __StructType__ - A constructor constructor that is used to build Struct constructors. These can be complex data structures that contain multiple levels of smaller structs and simple data types.

* __ArrayType__ - A constructor constructor for array types. These are containers for multiples values that are of the same type (same memory size footprint).

* __Blocks__ - These represent the layer closest to the raw data. They encapsulate the information needed
           to read and modify the memory associated with a higher level construct.
  * __NumberBlock__ - Represents a single number's memory from the NumericTypes.
  * __StructBlock__ - Represents an instance of a specific struct type and its mapping to and from memory
  * __ArrayBlock__ - Represents an instance of an array and its mapping to and from memory.

* __Reference__ - A reference adds one level of indiraction to a provided value. In order to extract the value you have to dereference it via the Reference object that now has it stashed somewhere. Also provides tools to make it easier to reference multiple values like arrays.



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