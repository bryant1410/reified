module.exports = {
  NumericTypes: require('./lib/numeric'),
  StructType:   require('./lib/struct'),
  ArrayType:    require('./lib/array'),
  NumberBlock:  require('./lib/blocks').NumberBlock,
  StructBlock:  require('./lib/blocks').StructBlock,
  ArrayBlock:   require('./lib/blocks').ArrayBlock,
  Reference:    require('./lib/blocks').Reference,
}
