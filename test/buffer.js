var BuffBuffer;
var DataBuffer;
var buffB;
var dataB;
var tap = require("tap");
var test = tap.test;
var methods = ['Uint8', 'Int8', 'Float32', 'Float64', 'Uint16', 'Int16', 'Uint32', 'Int32'];

var b = new Buffer(100)

test('initialize', function(t){
  t.ok(BuffBuffer = require('../lib/buffer').BuffBuffer, 'BuffBuffer loaded');
  t.ok(DataBuffer = require('../lib/buffer').DataBuffer, 'DataBuffer loaded');
  t.ok(buffB = new BuffBuffer(b), 'new BuffBuffer(b)');
  t.ok(dataB = new DataBuffer(b), 'new DataBuffer(b)');
  console.log(buffB);
  console.log(dataB);
  t.equal(buffB+'', dataB+'', 'toString is '+dataB);
  t.end();
});


test('LE', function(t){
  methods.forEach(function(name){
    t.equal(buffB['read'+name](), dataB['read'+name](), 'read'+name+'() same result ' + dataB['read'+name]());
    buffB['write'+name](100, 10);
    t.equal(buffB['read'+name](10), dataB['read'+name](10), 'buffB write 100 and both read'+name+'(10) same result ' + dataB['read'+name](10));
    dataB['write'+name](50, 20);
    t.equal(buffB['read'+name](20), dataB['read'+name](20), 'dataB write 50 and both read'+name+'(20) same result ' + dataB['read'+name](20));
  });
  t.end()
})


test('BE', function(t){
  dataB.endianness = buffB.endianness = 'BE';
  methods.forEach(function(name){
    t.equal(buffB['read'+name](), dataB['read'+name](), 'read'+name+'() same result ' + dataB['read'+name]());
    buffB['write'+name](100, 10);
    t.equal(buffB['read'+name](10), dataB['read'+name](10), 'buffB write 100 and both read'+name+'(10) same result ' + dataB['read'+name](10));
    dataB['write'+name](50, 20);
    t.equal(buffB['read'+name](20), dataB['read'+name](20), 'dataB write 50 and both read'+name+'(20) same result ' + dataB['read'+name](20));
  });
  t.end()
});

test('indices', function(t){
  dataB.endianness = buffB.endianness = 'BE';
  for (var i = 0; i < 20; i++) {
    t.equal(buffB[i], dataB[i], i+' equal '+buffB[i]);
    buffB[i] = i*5;
    t.equal(i*5, dataB[i], i+' equal '+dataB[i]);
    dataB[i] = i*3;
    t.equal(i*3, buffB[i], i+' equal '+buffB[i]);
  }
  t.end()
});

test('slice', function(t){
  dataB = dataB.slice(10, 20);
  buffB = buffB.slice(10, 20);
  t.equal(dataB.length, 10, 'dataB length is 10');
  t.equal(buffB.length, 10, 'dataB length is 10');
  t.equal(buffB+'', dataB+'', 'toString is '+dataB);
  for (var i = 0; i < 10; i++) {
    t.equal(buffB[i], dataB[i], i+' equal '+buffB[i]);
    buffB[i] = i*5;
    t.equal(i*5, dataB[i], i+' equal '+dataB[i]);
    dataB[i] = i*3;
    t.equal(i*3, buffB[i], i+' equal '+buffB[i]);
  }
  t.end()
});

test('fill', function(t){
  dataB.fill(100);
  t.equal(buffB+'', '100 100 100 100 100 100 100 100 100 100', 'filled with 100');
  buffB.fill(30);
  t.equal(dataB+'', '030 030 030 030 030 030 030 030 030 030', 'filled with 30');
  t.end()
});

test('copy', function(t){
  buffB.writeUint32(5000000)
  buffB.copy(buffB, 4, 0, 4);
  t.equal(buffB.readUint32(4), 5000000, 'copy 5000000');
  dataB.writeUint32(1200000)
  dataB.copy(buffB, 4, 0, 4);
  t.equal(dataB.readUint32(4), 1200000, 'copy 1200000');
  t.end()
});