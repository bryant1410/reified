# TTF Font File Format

TTF file format mapping as an example and to explore the API. 

## Example reified output

```javascript
{ version: 'TrueType',
  tableCount: 18,
  range: 256,
  selector: 4,
  shift: 32,
  tables: 
   { FFTM: { tag: 'FFTM', checksum: 1407076357, byteOffset: 300, length: 28 },
     glyph_definition_data: 
      { tag: 'GDEF',
        checksum: 2053270988,
        byteOffset: 328,
        length: 176 },
     glyph_positioning_data: 
      { tag: 'GPOS',
        checksum: 1094198046,
        byteOffset: 504,
        length: 14582 },
     glyph_substitution_data: 
      { tag: 'GSUB',
        checksum: 1445877738,
        byteOffset: 15088,
        length: 1212 },
     compatibility: 
      { tag: 'OS/2',
        checksum: 2298243506,
        byteOffset: 16300,
        length: 86,
        table: 
         { version: 1,
           avgCharWidth: 1233,
           weightClass: 'Semi-light',
           widthClass: 'Medium',
           typer: 0,
           subscript: { size: { x: 1331, y: 1433 }, position: { x: 0, y: 286 } },
           superscript: { size: { x: 1331, y: 1433 }, position: { x: 0, y: 983 } },
           strikeout: { size: 102, position: 530 },
           class: [ 0, 0 ],
           panose: 
            { familyType: [ 'Script' ],
              serifStyle: [ 'Cove', 'Obtuse Cove', 'Obtuse Square Cove' ],
              weight: [ 'Light', 'Thin' ],
              proportion: [ 'Old Style', 'Expanded' ],
              contrast: [ 'None', 'Very Low' ],
              strokeVariation: [ 'Gradual/Horizontal' ],
              armStyle: [ 'Straight Arms/Vertical' ],
              letterform: [ 'Normal/Weighted' ],
              midline: [ 'Standard/Pointed' ],
              xHeight: [ 'Constant/Large' ] },
           unicodePages: 
            [ 'Basic Latin',
              'Latin-1 Supplement ',
              'Latin Extended-A ',
              'Latin Extended-B ',
              'IPA Extensions ',
              'Phonetic Extensions',
              'Phonetic Extensions Supplement ',
              'Spacing Modifier Letters ',
              'Modifier Tone Letters',
              'Combining Diacritical Marks',
              'Combining Diacritical Marks Supplement ',
              'Greek and Coptic ',
              'Cyrillic ',
              'Cyrillic Supplement',
              'Cyrillic Extended-A',
              'Cyrillic Extended-B',
              'Arabic ',
              'Arabic Supplement',
              'Lao',
              'Georgian ',
              'Georgian Supplement',
              'Latin Extended Additional',
              'Latin Extended-C ',
              'Latin Extended-D ',
              'Greek Extended ',
              'Superscripts And Subscripts',
              'Currency Symbols ',
              'Letterlike Symbols ',
              'Number Forms ',
              'Arrows ',
              'Supplemental Arrows-A',
              'Supplemental Arrows-B',
              'Miscellaneous Symbols and Arrows ',
              'Mathematical Operators ',
              'Supplemental Mathematical Operators',
              'Miscellaneous Mathematical Symbols-A ',
              'Miscellaneous Mathematical Symbols-B ',
              'Miscellaneous Technical',
              'Control Pictures ',
              'Box Drawing',
              'Block Elements ',
              'Geometric Shapes ',
              'Miscellaneous Symbols',
              'Dingbats ',
              'Non-Plane 0 *',
              'Private Use Area (plane 0) ',
              'Alphabetic Presentation Forms',
              'Arabic Presentation Forms-B',
              'Specials ',
              'Mathematical Alphanumeric Symbols' ],
           vendorID: 'PfEd',
           selection: 64,
           firstChar: 32,
           lastChar: 65535,
           typographic: { ascender: 1556, descender: -492, lineGap: 410 },
           winTypograph: { ascender: 1901, descender: 483 },
           codePages1: 
            [ '0',
              'Latin 1',
              'Latin 2: Eastern Europe',
              'Cyrillic',
              'Greek',
              'Turkish',
              'Arabic',
              'Windows Baltic',
              'Vietnamese',
              'Macintosh Character Set (US Roman)',
              'OEM Character Set' ],
           codePages2: 
            [ 'IBM Greek',
              'MS-DOS Russian',
              'MS-DOS Nordic',
              'Arabic',
              'MS-DOS Canadian French',
              'MS-DOS Icelandic',
              'MS-DOS Portuguese',
              'IBM Turkish',
              'IBM Cyrillic; primarily Russian',
              'Latin 2',
              'MS-DOS Baltic',
              'Greek; former 437 G',
              'WE/Latin 1' ],
           xHeight: 0,
           capHeight: 0,
           defaultChar: 5,
           breakChar: 0,
           maxContext: 3 } },
     character_code_mapping: 
      { tag: 'cmap',
        checksum: 230425762,
        byteOffset: 16388,
        length: 5538 },
     control_value: 
      { tag: 'cvt ',
        checksum: 3918989068,
        byteOffset: 21928,
        length: 560 },
     font_program: 
      { tag: 'fpgm',
        checksum: 1526885343,
        byteOffset: 22488,
        length: 172 },
     'grid-fitting_and_scan-conversion_procedure': { tag: 'gasp', checksum: 458759, byteOffset: 22660, length: 12 },
     glyph_outline: 
      { tag: 'glyf',
        checksum: 1883368785,
        byteOffset: 22672,
        length: 239352 },
     font_header: 
      { tag: 'head',
        checksum: 3992135760,
        byteOffset: 262024,
        length: 54 },
     horizontal_header: 
      { tag: 'hhea',
        checksum: 146276871,
        byteOffset: 262080,
        length: 36 },
     horizontal_metrics: 
      { tag: 'hmtx',
        checksum: 243468867,
        byteOffset: 262116,
        length: 6346 },
     glyph_location: 
      { tag: 'loca',
        checksum: 362015968,
        byteOffset: 268464,
        length: 12680 },
     maximum_profile: 
      { tag: 'maxp',
        checksum: 302449703,
        byteOffset: 281144,
        length: 32 },
     naming_table: 
      { tag: 'name',
        checksum: 1625352837,
        byteOffset: 281176,
        length: 8469 },
     glyph_name_and_postscript_compatibility: 
      { tag: 'post',
        checksum: 2878182796,
        byteOffset: 289648,
        length: 30055 },
     control_value_program: 
      { tag: 'prep',
        checksum: 986169351,
        byteOffset: 319704,
        length: 1819 } } }
```

## Pre reification

```javascript
<FontIndex>
| version:    <Version> [ <Uint8> 0, <Uint8> 1, <Uint8> 0, <Uint8> 0 ]
| tableCount: <Uint16> 18
| range:      <Uint16> 256
| selector:   <Uint16> 4
| shift:      <Uint16> 32
| tables:     <TableIndex>
[ <Table>
  | tag:        <Tag> [ <Uint32> 1179014221 ]
  | checksum:   <Uint32> 1407076357
  | byteOffset: <Uint32> 300
  | length:     <Uint32> 28,
  <Table>
  | tag:        <Tag> [ <Uint32> 1195656518 ]
  | checksum:   <Uint32> 2053270988
  | byteOffset: <Uint32> 328
  | length:     <Uint32> 176,
  <Table>
  | tag:        <Tag> [ <Uint32> 1196445523 ]
  | checksum:   <Uint32> 1094198046
  | byteOffset: <Uint32> 504
  | length:     <Uint32> 14582,
  <Table>
  | tag:        <Tag> [ <Uint32> 1196643650 ]
  | checksum:   <Uint32> 1445877738
  | byteOffset: <Uint32> 15088
  | length:     <Uint32> 1212,
  <Table>
  | tag:        <Tag> [ <Uint32> 1330851634 ]
  | checksum:   <Uint32> 2298243506
  | byteOffset: <Uint32> 16300
  | length:     <Uint32> 86
  | table:      <OS2>
  | version:      <Uint16> 1
  | avgCharWidth: <Int16> 1233
  | weightClass:  <Uint16> 400
  | widthClass:   <Uint16> 5
  | typer:        <Uint16> 0
  | subscript:    <Metrics>
  | size:     <Point> { x: <Int16> 1331 | y: <Int16> 1433 }
  | position: <Point> { x: <Int16> 0 | y: <Int16> 286 }
  | superscript:  <Metrics>
  | size:     <Point> { x: <Int16> 1331 | y: <Int16> 1433 }
  | position: <Point> { x: <Int16> 0 | y: <Int16> 983 }
  | strikeout:    <strikeout> { size: <Int16> 102 | position: <Int16> 530 }
  | class:        <Int8x2> [ <Int8> 0, <Int8> 0 ]
  | panose:       <PANOSE>
  | familyType:      { ‹familyType›
    Text and Display: false,
    Script:           true,
    Decorative:       false,
    Pictorial:        false }
  | serifStyle:      { ‹serifStyle›
    Cove:               true,
    Obtuse Cove:        true,
    Square Cove:        false,
    Obtuse Square Cove: true,
    Square:             false,
    Thin:               false,
    Bone:               false,
    Exaggerated:        false,
    Triangle:           false,
    Normal Sans:        false,
    Obtuse Sans:        false,
    Perp Sans:          false,
    Flared:             false,
    Rounded:            false }
  | weight:          { ‹weight›
    Very Light: false,
    Light:      true,
    Thin:       true,
    Book:       false,
    Medium:     false,
    Demi:       false,
    Bold:       false,
    Heavy:      false,
    Black:      false,
    Nord:       false }
  | proportion:      { ‹proportion›
    Old Style:      true,
    Modern:         false,
    Even Width:     false,
    Expanded:       true,
    Condensed:      false,
    Very Expanded:  false,
    Very Condensed: false,
    Monospaced:     false }
  | contrast:        { ‹contrast›
    None:        true,
    Very Low:    true,
    Low:         false,
    Medium Low:  false,
    Medium:      false,
    Medium High: false,
    High:        false,
    Very High:   false }
  | strokeVariation: { ‹strokeVariation›
    Gradual/Diagonal:     false,
    Gradual/Transitional: false,
    Gradual/Vertical:     false,
    Gradual/Horizontal:   true,
    Rapid/Vertical:       false,
    Rapid/Horizontal:     false,
    Instant/Vertical:     false }
  | armStyle:        { ‹armStyle›
    Straight Arms/Horizontal:       false,
    Straight Arms/Wedge:            false,
    Straight Arms/Vertical:         true,
    Straight Arms/Single Serif:     false,
    Straight Arms/Double Serif:     false,
    Non-Straight Arms/Horizontal:   false,
    Non-Straight Arms/Wedge:        false,
    Non-Straight Arms/Vertical:     false,
    Non-Straight Arms/Single Serif: false,
    Non-Straight Arms/Double Serif: false }
  | letterform:      { ‹letterform›
    Normal/Contact:     false,
    Normal/Weighted:    true,
    Normal/Boxed:       false,
    Normal/Flattened:   false,
    Normal/Rounded:     false,
    Normal/Off Center:  false,
    Normal/Square:      false,
    Oblique/Contact:    false,
    Oblique/Weighted:   false,
    Oblique/Boxed:      false,
    Oblique/Flattened:  false,
    Oblique/Rounded:    false,
    Oblique/Off Center: false,
    Oblique/Square:     false }
  | midline:         { ‹midline›
    Standard/Trimmed: false,
    Standard/Pointed: true,
    Standard/Serifed: false,
    High/Trimmed:     false,
    High/Pointed:     false,
    High/Serifed:     false,
    Constant/Trimmed: false,
    Constant/Pointed: false,
    Constant/Serifed: false,
    Low/Trimmed:      false,
    Low/Pointed:      false,
    Low/Serifed:      false }
  | xHeight:         { ‹xHeight›
    Constant/Small:    false,
    Constant/Standard: false,
    Constant/Large:    true,
    Ducking/Small:     false,
    Ducking/Standard:  false,
    Ducking/Large:     false }
  | unicodePages: <UnicodePages>
  | 0: { ‹UnicodePages0›
    0000-007F:                               true,
    0080-00FF:                               true,
    0100-017F:                               true,
    0180-024F:                               true,
    0250-02AF,1D00-1D7F,1D80-1DBF:           true,
    02B0-02FF,A700-A71F:                     true,
    0300-036F,1DC0-1DFF:                     true,
    0370-03FF:                               true,
    2C80-2CFF:                               false,
    0400-04FF,0500-052F,2DE0-2DFF,A640-A69F: true,
    0530-058F:                               false,
    0590-05FF:                               false,
    A500-A63F:                               false,
    0600-06FF,0750-077F:                     true,
    07C0-07FF:                               false,
    0900-097F:                               false,
    0980-09FF:                               false,
    0A00-0A7F:                               false,
    0A80-0AFF:                               false,
    0B00-0B7F:                               false,
    0B80-0BFF:                               false,
    0C00-0C7F:                               false,
    0C80-0CFF:                               false,
    0D00-0D7F:                               false,
    0E00-0E7F:                               false,
    0E80-0EFF:                               true,
    10A0-10FF,2D00-2D2F:                     true,
    1B00-1B7F:                               false,
    1100-11FF:                               false,
    1E00-1EFF,2C60-2C7F,A720-A7FF:           true,
    1F00-1FFF:                               true,
    2000-206F,2E00-2E7F:                     false }
  | 1: { ‹UnicodePages1›
    2070-209F:                                                               true,
    20A0-20CF:                                                               true,
    20D0-20FF:                                                               false,
    2100-214F:                                                               true,
    2150-218F:                                                               true,
    2190-21FF,27F0-27FF,2900-297F,2B00-2BFF:                                 true,
    2200-22FF,2A00-2AFF,27C0-27EF,2980-29FF:                                 true,
    2300-23FF:                                                               true,
    2400-243F:                                                               true,
    2440-245F:                                                               false,
    2460-24FF:                                                               false,
    2500-257F:                                                               true,
    2580-259F:                                                               true,
    25A0-25FF:                                                               true,
    2600-26FF:                                                               true,
    2700-27BF:                                                               true,
    3000-303F:                                                               false,
    3040-309F:                                                               false,
    30A0-30FF,31F0-31FF:                                                     false,
    3100-312F,31A0-31BF:                                                     false,
    3130-318F:                                                               false,
    A840-A87F:                                                               false,
    3200-32FF:                                                               false,
    3300-33FF:                                                               false,
    AC00-D7AF:                                                               false,
    D800-DFFF:                                                               true,
    10900-1091F:                                                             false,
    4E00-9FFF,2E80-2EFF,2F00-2FDF,2FF0-2FFF,3400-4DBF,20000-2A6DF,3190-319F: false,
    E000-F8FF:                                                               true,
    31C0-31EF,F900-FAFF,2F800-2FA1F:                                         false,
    FB00-FB4F:                                                               true,
    FB50-FDFF:                                                               false }
  | 2: { ‹UnicodePages2›
    FE20-FE2F:                               false,
    FE10-FE1F,FE30-FE4F:                     false,
    FE50-FE6F:                               false,
    FE70-FEFF:                               true,
    FF00-FFEF:                               false,
    FFF0-FFFF:                               true,
    0F00-0FFF:                               false,
    0700-074F:                               false,
    0780-07BF:                               false,
    0D80-0DFF:                               false,
    1000-109F:                               false,
    1200-137F,1380-139F,2D80-2DDF:           false,
    13A0-13FF:                               false,
    1400-167F:                               false,
    1680-169F:                               false,
    16A0-16FF:                               false,
    1780-17FF,19E0-19FF:                     false,
    1800-18AF:                               false,
    2800-28FF:                               false,
    A000-A48F,A490-A4CF:                     false,
    1700-171F,1720-173F,1740-175F,1760-177F: false,
    10300-1032F:                             false,
    10330-1034F:                             false,
    10400-1044F:                             false,
    1D000-1D0FF,1D100-1D1FF,1D200-1D24F:     false,
    1D400-1D7FF:                             true,
    FF000-FFFFD,100000-10FFFD:               false,
    FE00-FE0F,E0100-E01EF:                   false,
    E0000-E007F:                             false,
    1900-194F:                               false,
    1950-197F:                               false,
    1980-19DF:                               false }
  | 3: { ‹UnicodePages3›
    1A00-1A1F:                           false,
    2C00-2C5F:                           false,
    2D30-2D7F:                           false,
    4DC0-4DFF:                           false,
    A800-A82F:                           false,
    10000-1007F,10080-100FF,10100-1013F: false,
    10140-1018F:                         false,
    10380-1039F:                         false,
    103A0-103DF:                         false,
    10450-1047F:                         false,
    10480-104AF:                         false,
    10800-1083F:                         false,
    10A00-10A5F:                         false,
    1D300-1D35F:                         false,
    12000-123FF,12400-1247F:             false,
    1D360-1D37F:                         false,
    1B80-1BBF:                           false,
    1C00-1C4F:                           false,
    1C50-1C7F:                           false,
    A880-A8DF:                           false,
    A900-A92F:                           false,
    A930-A95F:                           false,
    AA00-AA5F:                           false,
    10190-101CF:                         false,
    101D0-101FF:                         false,
    102A0-102DF,10280-1029F,10920-1093F: false,
    1F030-1F09F,1F000-1F02F:             false }
  | vendorID:     <Tag> [ <Uint32> 1348879716 ]
  | selection:    <Uint16> 64
  | firstChar:    <Uint16> 32
  | lastChar:     <Uint16> 65535
  | typographic:  <typographic> { ascender: <Int16> 1556 | descender: <Int16> -492 | lineGap: <Int16> 410 }
  | winTypograph: <WindowsTypographic> { ascender: <Uint16> 1901 | descender: <Uint16> 483 }
  | codePages1:   { ‹CodePages1›
    0:                                    true,
    Latin 1:                              true,
    Latin 2: Eastern Europe:              true,
    Cyrillic:                             true,
    Greek:                                true,
    Turkish:                              true,
    Hebrew:                               false,
    Arabic:                               true,
    Windows Baltic:                       true,
    Vietnamese:                           true,
    Reserved for Alternate ANSI:          false,
    Thai:                                 false,
    JIS/Japan:                            false,
    Chinese Simplified-PRC/Singapore:     false,
    Korean Wansung:                       false,
    Chinese Traditional-Taiwan/Hong Kong: false,
    Korean Johab:                         false,
    Reserved for Alternate ANSI & OEM:    false,
    Macintosh Character Set (US Roman):   true,
    OEM Character Set:                    true,
    Symbol Character Set:                 false }
  | codePages2:   { ‹CodePages2›
    0:                               false,
    Reserved for OEM:                false,
    IBM Greek:                       true,
    MS-DOS Russian:                  true,
    MS-DOS Nordic:                   true,
    Arabic:                          true,
    MS-DOS Canadian French:          true,
    Hebrew:                          false,
    MS-DOS Icelandic:                true,
    MS-DOS Portuguese:               true,
    IBM Turkish:                     true,
    IBM Cyrillic; primarily Russian: true,
    Latin 2:                         true,
    MS-DOS Baltic:                   true,
    Greek; former 437 G:             true,
    Arabic; ASMO 708:                false,
    WE/Latin 1:                      true,
    US:                              false }
  | xHeight:      <Int16> 0
  | capHeight:    <Int16> 0
  | defaultChar:  <Uint16> 5
  | breakChar:    <Uint16> 0
  | maxContext:   <Uint16> 3,
  <Table>
  | tag:        <Tag> [ <Uint32> 1668112752 ]
  | checksum:   <Uint32> 230425762
  | byteOffset: <Uint32> 16388
  | length:     <Uint32> 5538,
  <Table>
  | tag:        <Tag> [ <Uint32> 1668707360 ]
  | checksum:   <Uint32> 3918989068
  | byteOffset: <Uint32> 21928
  | length:     <Uint32> 560,
  <Table>
  | tag:        <Tag> [ <Uint32> 1718642541 ]
  | checksum:   <Uint32> 1526885343
  | byteOffset: <Uint32> 22488
  | length:     <Uint32> 172,
  <Table>
  | tag:        <Tag> [ <Uint32> 1734439792 ]
  | checksum:   <Uint32> 458759
  | byteOffset: <Uint32> 22660
  | length:     <Uint32> 12,
  <Table>
  | tag:        <Tag> [ <Uint32> 1735162214 ]
  | checksum:   <Uint32> 1883368785
  | byteOffset: <Uint32> 22672
  | length:     <Uint32> 239352,
  <Table>
  | tag:        <Tag> [ <Uint32> 1751474532 ]
  | checksum:   <Uint32> 3992135760
  | byteOffset: <Uint32> 262024
  | length:     <Uint32> 54,
  <Table>
  | tag:        <Tag> [ <Uint32> 1751672161 ]
  | checksum:   <Uint32> 146276871
  | byteOffset: <Uint32> 262080
  | length:     <Uint32> 36,
  <Table>
  | tag:        <Tag> [ <Uint32> 1752003704 ]
  | checksum:   <Uint32> 243468867
  | byteOffset: <Uint32> 262116
  | length:     <Uint32> 6346,
  <Table>
  | tag:        <Tag> [ <Uint32> 1819239265 ]
  | checksum:   <Uint32> 362015968
  | byteOffset: <Uint32> 268464
  | length:     <Uint32> 12680,
  <Table>
  | tag:        <Tag> [ <Uint32> 1835104368 ]
  | checksum:   <Uint32> 302449703
  | byteOffset: <Uint32> 281144
  | length:     <Uint32> 32,
  <Table>
  | tag:        <Tag> [ <Uint32> 1851878757 ]
  | checksum:   <Uint32> 1625352837
  | byteOffset: <Uint32> 281176
  | length:     <Uint32> 8469,
  <Table>
  | tag:        <Tag> [ <Uint32> 1886352244 ]
  | checksum:   <Uint32> 2878182796
  | byteOffset: <Uint32> 289648
  | length:     <Uint32> 30055,
  <Table>
  | tag:        <Tag> [ <Uint32> 1886545264 ]
  | checksum:   <Uint32> 986169351
  | byteOffset: <Uint32> 319704
  | length:     <Uint32> 1819 ]
| bytes:      300
```