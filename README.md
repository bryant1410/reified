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