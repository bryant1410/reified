var util = require('util');

var utility = require('./utility');
var maxLength = utility.maxLength;
var strlen = utility.strlen;
var indent = utility.indent;
var unique = utility.unique;
var pad = utility.pad;

var names = [ 'black',   'red',      'green',  'yellow',
              'blue',    'magenta',  'cyan',   'white',
              'bblack',  'bred',     'bgreen', 'byellow',
              'bblue',   'bmagenta', 'bcyan',  'bwhite', ];

var colors = {};
var esc = '\u001b[';
for (var i = 16; i-- > 0;) {
  colors[names[i]] = [esc+(i > 7 ? '1;':'')+(i%8+30)+'m',
                      esc+(i > 7 ?'2;':'')+'39m']
}
for (var i = 0; i++ < 8;) {
  names.push('bg'+names[i]);
  colors['bg'+names[i]] = [esc+(i+40)+'m', esc+'49m']
}
for (var i = 0; i++ < 8;) {
  names.push('bg'+names[i+8]);
  colors['bg'+names[i+8]] = [esc+(i+100)+'m', esc+'25;49m']
}


function color(text, name, brackets){
  if (color.useColor) {
    return colors[name][0]+text+colors[name][1];
  } else {
    return brackets ? brackets[0]+text+brackets[1] : text;
  }
}

names.forEach(function(n){
  color[n] = function(t, b){ return color(t, n, b) }
})


function getSettings(){
  var caller = getSettings.caller;
  while (caller = caller.caller) {
    if (caller.name === 'formatValue') {
      return caller.arguments[0] || {};
    }
  }
  return {};
}

module.exports = function(className, type){
  return function(depth){
    if (this && this.hasOwnProperty && this.hasOwnProperty('constructor')) {
      return '[Data Prototype]';
    }
    var settings = getSettings();
    color.useColor = !!(process && process.stdout._type === 'tty') || !!(settings.stylize ? settings.stylize.name === 'stylizeWithColor' : false);
    return inspectors[className][type](this, settings.showHidden, depth, color.useColor);
  }
}
var inspectors = {
  Type: {
    NumericType: function(object, showHidden, depth, useColor){
      if (Object.prototype.hasOwnProperty.call(object, 'Type')) return '[NumericType Prototype]';
      return color.bmagenta(object.name, '‹›');
    },
    ArrayType: function(object, showHidden, depth, useColor){
      if (Object.prototype.hasOwnProperty.call(object, 'Type')) return '[ArrayType Prototype]';
      var label = color.byellow(object.name, '‹›') + color.bblue('('+object.bytes+'b)');
      var memberType = util.inspect(object.memberType, showHidden, depth-1, useColor);
      if (~memberType.indexOf('\n') || strlen(memberType) > 60) {
        label += '\n';
        memberType = indent(memberType).slice(2);
      } else {
        label + ' '
      }
      return label+'[ '+object.count+' '+memberType+' ]';
    },
    StructType: function(object, showHidden, depth, useColor){
      if (Object.prototype.hasOwnProperty.call(object, 'Type')) return '[StructType Prototype]';
      var length = 0;
      var fields = unique(object.keys.concat(Object.keys(object)));
      fields = fields.map(function(field){
        field = [color.bwhite(field), util.inspect(object.fields[field], showHidden, depth-1, useColor)];
        length += strlen(field[0]) + strlen(field[1]);
        return field;
      });

      var label = color.bcyan(object.name, '‹›') + color.bblue('('+object.bytes+'b)');
      if (length > 60) {
        var max = maxLength(object.keys)+4;
        return label+'\n| '+fields.map(function(field){ return pad(color.bwhite(field[0]+':'), max) + field[1] }).join('\n| ');
      } else {
        return label+' { '+fields.map(function(field){ return color.bwhite(field[0]+': ')+field[1] }).join(' | ') + ' }';
      }
    },
    BitfieldType: function(object, showHidden, depth, useColor){
      if (Object.prototype.hasOwnProperty.call(object, 'Type')) return '[BitfieldType Prototype]';
      var label = color.bgreen(object.name || 'Bitfield', '‹›') + color.bblue('('+object.bytes*8+'bit)');
      var flags = Object.keys(object.flags);
      if (!flags.length) {
        return label;
      } else {
        return label+'\n'+flags.map(function(flag){
          return '  '+pad(color.bgreen('0x'+object.flags[flag].toString(16)), Math.log(object.bytes+1.3)*10|0) + flag;
        }).join('\n');
      }
    }
  },
  Data: {
    NumericType: function(object, showHidden, depth, useColor){
      if (!object.reify) return color.bred('[NumericData Prototype]');
      return color.magenta(object.Subtype, '<>')+' '+color.bmagenta(object.reify());
    },
    ArrayType: function(object, showHidden, depth, useColor){
      if (!object.constructor.memberType) return color.bred('[ArrayData Prototype]');
      var fields = util.inspect(object.map(function(item){ return item }), showHidden, depth-1, useColor);
      var sep = strlen(fields) > 60 ? '\n' : ' ';
      return color.yellow(object.constructor.name, '<>')+sep+fields;
    },
    StructType: function(object, showHidden, depth, useColor){
      if (!object.constructor.keys) return color.bred('[StructData Prototype]');
      var length = 0;
      var fields = unique((object.constructor.keys).concat(Object.keys(object)));
      var fields = fields.map(function(field){
        field = [field, util.inspect(object[field], showHidden, depth-1, useColor)];
        length += strlen(field[0]) + strlen(field[1]);
        return field;
      });

      var label = color.cyan(object.constructor.name, '<>');
      if (length > 60) {
        var max = maxLength(object.constructor.keys)+4;
        return label + '\n| '+fields.map(function(field){ return pad(field[0]+': ', max) + field[1] }).join('\n| ');
      } else {
        return label+' { '+fields.map(function(field){ return field.join(': ') }).join(' | ') + ' }';
      }
    },
    BitfieldType: function(object, showHidden, depth, useColor){
      if (!object.flags) return color.bred('[BitfieldData Prototype]');
      var label = color.green(object.constructor.name || 'Bitfield', '‹›');
      var flags = object.flags ? Object.keys(object.flags) : [];
      if (!flags.length) {
        return label + '['+object+']';
      } else {
        var max = maxLength(object.flags)+4;
        return '{ '+label +'\n  ' + flags.map(function(flag, index){
          return pad(color.bwhite(flag+':'), max) + color.green(object[flag]);
        }).join(',\n  ') + ' }';
      }
    }
  }
};