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
