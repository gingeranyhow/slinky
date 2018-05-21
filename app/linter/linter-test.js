import test from 'ava';
let hasLineErrors = require('./ink-linter.js');

test('character tags are invalid', t => {
  let tags = [
    '>>emote.HANK:happy',
    '>>paxEnter',
    '>>emote:FIONA.happy >>intensity:high',
    '>>react:SAM.angry >>intensity:low',
    '* (onlyU) We went out LINA: >>emote:happy'
    ] // Same is only referenced in react

  for (let tag of tags) {
    t.true(hasLineErrors(tag, 0, 'test.js'));
  }
});

test('character tags are valid', t => {
  let tags = [
    'FIONA: Hey there! >>emote:happy',
    'FIONA: Hey there! >>emote:happy >>intensity:high',
    'FIONA: >>paxEnter',
    '>>paxLeft: SAM',
    'LUKE: Nooo!!!! I don’t want to! Let me out! Let me out! Let me out! >>react:surprise'
    ]

  for (let tag of tags) {
    t.false(hasLineErrors(tag, 0, 'test.js'))
  }
});

test('ignore all lines that are commented', t => {
  let tags = [
    '// >>emote:happy',
    '   //>>intensity.high'
    ]

  for (let tag of tags) {
    t.false(hasLineErrors(tag, 0, 'test.js'))
  }
});



test('Reject with invalid params if tag has param validation', t => {
  let tags = [
    'FIONA: Hey there! >>intensity: 80%',
    'FIONA: hey >>intensity:S',
    'LINA: hey >> intensity:Lo',
    '>>cutCamera:LinaPO'
  ];

  for (let tag of tags) {
    t.true(hasLineErrors(tag, 0, 'test.js'))
  }
});

test('Accept with valid required params if tag has param validation', t => {
  let tags = [
    'FIONA: Hey there! >>intensity: high',
    'FIONA: hey >>intensity:l',
    'LINA: hey >> intensity:m',
    '>>cutCamera:LinaPOV',
    '>>cutCamera:HOODCAM'
  ];

  for (let tag of tags) {
    t.false(hasLineErrors(tag, 0, 'test.js'))
  }
});

test('accept looser spacing', t => {
  let tags =[
    'ANTHONY: Where does this end?  >>emote: angry >>intensity:med',
    'RISA: That woman died. >> emote: sad >>intensity:med',
  ];
  for (let tag of tags) {
    t.false(hasLineErrors(tag, 0, 'test.js'))
  }
})

test('handle Ink tags prior to the name on line-first', t => {
  let tags = [
    '*  (onlyUCanDecide) LINA: Only you can decide that. >>react:shrug',
    '    SAM: so sorry... >>emote:sad',
    '*   LINA: This is ridiculous. >>react:squint',
    '    * * LINA: >>emote:happy',
    '- ANGELO: Hi >>emote:flirty >>intensity:high',
    '*  {isYellow()} LINA: Ecstatic.[] I love what I do. >>react:smile',
    '*  {not WhatIsADoctor} LINA: Wait, I thought you were a doctor. >>react:surprise',
    '+ LINA: I do want to {GuessedChloeJob:guess anymore|guess}. >>react:shake -> LinaWontGuess',
    '* (KnowsAngeloDrives) LINA: Um... >>emote:anxious'
  ]

  for (let tag of tags) {
    t.false(hasLineErrors(tag, 0, 'test.js'))
  }
})


test.skip('Ignore ink tags prior to the name when ink tags have colons', t => {
  let tags = [
    '  {isRed(): RISA: Well the important thing is to ensure the safety of all, right? >>react:awkward }',
    'Cute:RISA: okay >>emote:sad'
    ]

  for (let tag of tags) {
    t.false(hasLineErrors(tag, 0, 'test.js'))
  }
})

test('Test valid story tags with parameters', t => {
    let tags = [
      '>>cutCamera:paxLeft',
      '>>pause:4']

    for (let tag of tags) {
      // t.true(findLineErrors(tag, 1, 'hi'));
      t.false(hasLineErrors(tag, 0, 'test.js'))
    }
});

test('Do not throw errors for pause story tags with decimal', t => {
    let tags = [
      '>>pause:1.5',
      '>>pause:0.7']

    for (let tag of tags) {
      t.false(hasLineErrors(tag, 0, 'test.js'))
    }
});


test('Test story tags missing required parameters', t => {
    t.true(hasLineErrors('>>cutCamera', 0, 'test.js'));
    t.true(hasLineErrors('>>pause', 0, 'test.js'));

    let tags = [
      '>>cutCamera',
      '>>pause',
      '>>intensity 40%'];

    for (let tag of tags) {
      t.true(hasLineErrors(tag, 0, 'test.js'))
    }
});
 
test('valid UI tags should be accepted', t => {
  t.false(hasLineErrors('>>UIView:MapView.RideDetails'));
})

test('Simple tags are recognized', t => {
    t.false(hasLineErrors('>>saveGame', 0, 'test.js'));
})

test("Inline logic doesn't trip up character tags", t => {
    let lines = [
        "{isRed(): RISA: Well, of course we'll see, but the important thing is to ensure the safety of all, right? >>react:awkward }",
        "* LINA: {isNegative(): You're seriously asking me if I'm|...Am I} okay with my job being eliminated?",
        "   {Cute:LINA: Oh yeah, I was destined for greatness 'til the RSI. >>react:wink}"];
    
        for (let line of lines) {
            t.false(hasLineErrors(line, 0, 'test.js'));
        }
})