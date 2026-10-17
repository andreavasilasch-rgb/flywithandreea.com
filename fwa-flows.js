/* fwa-flows.js - everything the chat says.
 *
 * This is the only file to edit when you want to change a question, add an
 * option, or soften a line. The widget itself never needs touching.
 *
 * THE SHAPE OF A STEP
 *   ask      the line shown to the visitor
 *   type     'text'  they type
 *            'chips' they tap one of several
 *            'multi' they tap as many as apply, then Done
 *            'say'   nothing is asked, the line just appears
 *            'end'   the last line
 *   field    where the answer is filed
 *   options  the chips
 *   next     {'option': 'step id'} to jump somewhere, '__end' to finish
 *   when     {field:'pets', is:'Yes'} shows the step only if that holds
 *   hint     grey placeholder in the box
 *   optional adds a Skip chip
 *   raw      a description box. Whatever is typed is the answer, even if it
 *            contains a word like budget or cancel. Only the card and abuse
 *            guards still apply.
 *
 * THE TONE
 *   Apple's service shape: Approach, Probe, Present, Listen, End. A warm first
 *   line, questions that say why they are being asked, a clear handover, room
 *   for someone to say something unexpected, and a proper goodbye.
 *   Short sentences. No exclamation marks. No sales words. Never a price, a
 *   promise or a medical opinion.
 */
window.FWA_FLOWS = {


  /* ======================================================= THE SUMMARY
   * What each answer is called when the chat reads everything back, and the
   * order it reads them in. A question with no label here is simply left out
   * of the summary, which is how the housekeeping answers stay out of it.
   */
  labels: {
    freeform: 'In your words',
    from: 'From', to: 'To', trip: 'Trip',
    when: 'When', date: 'Date', time: 'Time', time_exact: 'Time',
    pax: 'Passengers', occasion: 'Occasion',
    airport_pref: 'Airport', aircraft: 'Aircraft', flown_aircraft: 'Flown before',
    budget_value: 'Budget',
    pets: 'Pets', pet_detail: 'Pet', smoking: 'Smoking',
    luggage: 'Luggage', luggage_count: 'Pieces', luggage_detail: 'Also bringing',
    commodity: 'Cargo', weight: 'Weight', largest_piece: 'Largest piece',
    dangerous_goods: 'Dangerous goods', dg_detail: 'Dangerous goods',
    temperature: 'Temperature',
    patient_age: 'Patient age', mobility: 'Travels', setting: 'Patient is',
    receiving_hospital: 'Receiving hospital', medical_report: 'Medical report',
    equipment: 'Equipment', patient_weight: 'Patient weight',
    infection: 'Isolation', escorts: 'Travelling with',
    notes: 'Notes',
    name: 'Name', contact_by: 'Reply by', contact: 'Contact'
  },
  order: ['freeform', 'from', 'to', 'airport_pref', 'trip', 'when', 'date',
          'time', 'time_exact', 'pax', 'occasion', 'commodity', 'weight',
          'largest_piece', 'dangerous_goods', 'dg_detail', 'temperature',
          'patient_age', 'mobility', 'receiving_hospital', 'medical_report',
          'equipment', 'patient_weight', 'infection', 'escorts',
          'aircraft', 'flown_aircraft', 'budget_value',
          'pets', 'pet_detail', 'smoking', 'luggage', 'luggage_count',
          'luggage_detail', 'notes', 'name', 'contact_by', 'contact'],

  /* ================================================================ APPROACH */
  open: {
    ask: 'Welcome to Fly With Andreea. I am her digital assistant.\n\nWhat can she '
      + 'help you with today?',
    options: ['A private jet', 'A group', 'Cargo', 'Air ambulance'],
    map: { 'A private jet': 'jet', 'A group': 'group', 'Cargo': 'cargo',
           'Air ambulance': 'medical' }
  },

  /* ============================================================= PRIVATE JET */
  jet: {
    label: 'Private jet charter',
    minutes: 'about a minute and a half',
    steps: [
      /* Everybody is offered the short way out before the questions start. The
         ones who hate being walked through things take it, and Andreea still
         gets a name and a number. */
      { type: 'say', ask: 'Great. A few questions and Andreea will put a written '
        + 'quote together for you. It takes about 1 min 30 sec and there is no '
        + 'obligation at the end of it.' },

      { id: 'intro', type: 'chips', field: 'entry',
        ask: 'Or tell me the whole trip in one message and Andreea will sort it out.',
        options: ['Answer a few questions', 'Tell it in one message'],
        next: { 'Tell it in one message': 'dump' } },

      { id: 'dump', type: 'text', field: 'freeform', raw: true, goto: 'name',
        when: { field: 'entry', is: 'Tell it in one message' },
        ask: 'Of course. Tell me everything in your own words and Andreea will take '
          + 'it from there.',
        hint: 'Where from, where to, when, and how many' },

      { id: 'from', type: 'text', field: 'from',
        ask: 'Where would you like to fly from?',
        hint: 'A city or an airport' },

      { id: 'to', type: 'text', field: 'to',
        ask: 'And where to?',
        hint: 'A city or an airport' },

      { id: 'trip', type: 'chips', field: 'trip',
        ask: 'Is this one way, or will you be coming back?',
        options: ['One way', 'Return', 'More than 2 legs'] },

      { id: 'when', type: 'chips', field: 'when',
        ask: 'When are you hoping to travel?',
        options: ['A specific date', 'Within the week', 'As soon as possible',
                  'Still flexible'],
        next: { 'A specific date': 'whendate' } },

      { id: 'whendate', type: 'text', field: 'date', raw: true,
        when: { field: 'when', is: 'A specific date' },
        ask: 'Which date, or dates?',
        hint: 'For example 14 November, back on the 17th' },

      { id: 'time', type: 'chips', field: 'time',
        ask: 'And what time of day suits you best?',
        options: ['Morning', 'Afternoon', 'Evening', 'Any time', 'A specific time'],
        next: { 'A specific time': 'timeexact' } },

      { id: 'timeexact', type: 'text', field: 'time_exact', raw: true,
        when: { field: 'time', is: 'A specific time' },
        ask: 'What time were you thinking?',
        hint: 'For example wheels up by 09:00' },

      /* Typed, not tapped. A band is no use here: 8 passengers and 9 are two
         different aircraft, and anyone enquiring already knows the number. */
      { id: 'pax', type: 'text', field: 'pax',
        ask: 'How many of you will be flying?',
        hint: 'The exact number, including children' },

      { id: 'name', type: 'text', field: 'name',
        ask: 'May I take your name?',
        hint: 'A first name is plenty' },

      { id: 'how', type: 'chips', field: 'contact_by',
        ask: 'And how would you like Andreea to come back to you?',
        options: ['WhatsApp', 'A call', 'Email'] },

      { id: 'contact', type: 'text', field: 'contact',
        ask: 'Perfect. What is the best {X}?',
        vary: { 'WhatsApp': 'number for WhatsApp', 'A call': 'number to call you on',
                'Email': 'email address' } },

      /* ---- Present. The lead is safe from here, the rest is a bonus ---- */
      { type: 'say', ask: 'Thank you. This is enough for Andreea to start looking '
        + 'for options and send you a quote.' },

      { id: 'hinge', type: 'chips',
        ask: 'If you have another thirty seconds, 5 more details let her match the '
          + 'right aircraft first time rather than coming back to ask. Shall we?',
        options: ['Yes, go on', 'No, that is everything'],
        next: { 'No, that is everything': '__end' } },

      /* Named back to them, so it reads as a real question rather than a form
         field. Le Bourget against Charles de Gaulle is a different flight, a
         different arrival and a different price, and most people do not know
         the smaller field is there to be asked for. */
      { id: 'airport', type: 'text', field: 'airport_pref', raw: true, optional: true,
        when: { field: 'entry', is: 'Answer a few questions' },
        ask: 'If {from} or {to} has more than one airport, which would you prefer?',
        hint: 'Or tap Skip and Andreea will advise' },

      { id: 'acpref', type: 'chips', field: 'aircraft_pref',
        ask: 'Do you have a type of aircraft in mind?',
        options: ['Any, Andreea chooses', 'I have a preference'],
        next: { 'I have a preference': 'actype' } },

      { id: 'actype', type: 'chips', field: 'aircraft',
        when: { field: 'aircraft_pref', is: 'I have a preference' },
        ask: 'Which would you prefer?',
        options: ['Piston', 'Turbo Prop', 'Entry Level Jet', 'Light Jet',
                  'Super Light Jet', 'Midsize Jet', 'Super Midsize Jet', 'Heavy Jet',
                  'VIP Airliner', 'Airliner', 'Not sure, any'] },


      { id: 'flown', type: 'chips', field: 'flown_before',
        ask: 'Have you flown on an aircraft you particularly liked?',
        options: ['No particular preference', 'Yes, I will name it'],
        next: { 'Yes, I will name it': 'flownwhich' } },

      { id: 'flownwhich', type: 'text', field: 'flown_aircraft', raw: true,
        when: { field: 'flown_before', is: 'Yes, I will name it' },
        ask: 'Which was it?',
        hint: 'The type, or whatever you remember of it' },

      { id: 'budget', type: 'chips', field: 'budget',
        ask: 'Should you have a budget range in mind, you are welcome to share it '
          + 'so that Andreea can take it into account. This is entirely optional.',
        options: ['I have a budget in mind', 'I would rather see the options first',
                  'I prefer not to say'],
        next: { 'I have a budget in mind': 'budgetval' } },

      { id: 'budgetval', type: 'text', field: 'budget_value', raw: true,
        when: { field: 'budget', is: 'I have a budget in mind' },
        ask: 'What range should she work to?',
        hint: 'For example 30 to 40 thousand euro' },

      { id: 'pets', type: 'chips', field: 'pets',
        ask: 'Will any pets be travelling with you? They are very welcome.',
        options: ['No', 'Yes'],
        next: { 'Yes': 'petdetail' } },

      { id: 'petdetail', type: 'text', field: 'pet_detail', raw: true,
        when: { field: 'pets', is: 'Yes' },
        ask: 'Lovely. What breed, and roughly what weight? It decides where they can '
          + 'settle on board.',
        hint: 'For example a cocker spaniel, around 14 kg' },

      { id: 'smoking', type: 'chips', field: 'smoking',
        ask: 'Would you like a cabin where smoking is permitted? Only some aircraft '
          + 'allow it.',
        options: ['No', 'Yes'] },

      { id: 'bags', type: 'chips', field: 'luggage',
        ask: 'Nearly done. What are you bringing with you?',
        options: ['Hand luggage only', 'Normal suitcases', 'Skis or golf clubs',
                  'Something large or unusual'] },

      /* The kind of bag is only half the answer. 4 people with 4 large cases
         do not fit in a light jet, and the hold is usually what decides the
         aircraft rather than the seats. So the count is asked, and typed. */
      { id: 'bagcount', type: 'text', field: 'luggage_count', raw: true,
        ask: 'And how many pieces altogether?',
        hint: 'Including hand luggage' },

      { id: 'bagdetail', type: 'text', field: 'luggage_detail', raw: true,
        when: { field: 'luggage', is: 'Something large or unusual' },
        ask: 'Tell me what it is and Andreea will make sure it fits.',
        hint: 'For example a cello, or 2 bicycles' },


      /* Read it all back before anything is handed over. A PA confirms. */
      { id: 'review', type: 'review', field: 'review',
        ask: 'Allow me to confirm the details before I pass your enquiry to '
          + 'Andreea.',
        options: ['Everything is correct', 'Something needs changing'],
        next: { 'Something needs changing': 'amend' } },

      { id: 'amend', type: 'text', field: 'amendment', raw: true,
        when: { field: 'review', is: 'Something needs changing' },
        ask: 'Of course. What should I change?',
        hint: 'Write the correction and I will note it' },

      { type: 'end' }
    ]
  },

  /* ============================================================ GROUP CHARTER */
  group: {
    label: 'Group charter',
    minutes: 'about a minute',
    steps: [
      { type: 'say', ask: 'Certainly. Groups take a little more planning, so a few '
        + 'questions and Andreea will come back with the options worth considering. '
        + 'About 1 min 20 sec.' },

      { id: 'intro', type: 'chips', field: 'entry',
        ask: 'Or tell me the whole trip in one message and Andreea will sort it out.',
        options: ['Answer a few questions', 'Tell it in one message'],
        next: { 'Tell it in one message': 'dump' } },

      { id: 'dump', type: 'text', field: 'freeform', raw: true, goto: 'name',
        when: { field: 'entry', is: 'Tell it in one message' },
        ask: 'Of course. Tell me everything in your own words and Andreea will take '
          + 'it from there.',
        hint: 'Where from, where to, when, and how many people' },

      { id: 'from', type: 'text', field: 'from',
        ask: 'Where is the group flying from?', hint: 'A city or an airport' },

      { id: 'to', type: 'text', field: 'to',
        ask: 'And where to?', hint: 'A city or an airport' },

      { id: 'size', type: 'text', field: 'pax',
        ask: 'How many people will be travelling?',
        hint: 'The exact number if you have it' },

      { id: 'kind', type: 'chips', field: 'occasion',
        ask: 'And what brings everyone together? It changes which aircraft suit you.',
        options: ['Corporate travel', 'A sports team', 'A wedding or family',
                  'An incentive trip', 'Film or production', 'Religious travel',
                  'Something else'] },

      { id: 'trip', type: 'chips', field: 'trip',
        ask: 'One way, or returning together?',
        options: ['One way', 'Return', 'Several legs'] },

      { id: 'when', type: 'chips', field: 'when',
        ask: 'When are you planning to travel?',
        options: ['A specific date', 'Within the month', 'As soon as possible',
                  'Still flexible'],
        next: { 'A specific date': 'whendate' } },

      { id: 'whendate', type: 'text', field: 'date', raw: true,
        when: { field: 'when', is: 'A specific date' },
        ask: 'Which date, or dates?', hint: 'For example 3 March, back on the 7th' },

      { id: 'time', type: 'chips', field: 'time',
        ask: 'And what time of day?',
        options: ['Morning', 'Afternoon', 'Evening', 'Any time', 'A specific time'],
        next: { 'A specific time': 'timeexact' } },

      { id: 'timeexact', type: 'text', field: 'time_exact', raw: true,
        when: { field: 'time', is: 'A specific time' },
        ask: 'What time were you thinking?',
        hint: 'For example wheels up by 09:00' },

      { id: 'name', type: 'text', field: 'name',
        ask: 'May I take your name?', hint: 'A first name is plenty' },

      { id: 'how', type: 'chips', field: 'contact_by',
        ask: 'How would you like Andreea to reach you?',
        options: ['WhatsApp', 'A call', 'Email'] },

      { id: 'contact', type: 'text', field: 'contact',
        ask: 'Thank you. What is the best {X}?',
        vary: { 'WhatsApp': 'number for WhatsApp', 'A call': 'number to call you on',
                'Email': 'email address' } },

      { type: 'say', ask: 'Thank you. This is enough for Andreea to start looking '
        + 'for options and send you a quote.' },

      { id: 'hinge', type: 'chips',
        ask: '3 more questions would save a round of emails later. Do you have a '
          + 'moment?',
        options: ['Yes, of course', 'No, that is everything'],
        next: { 'No, that is everything': '__end' } },

      { id: 'airport', type: 'text', field: 'airport_pref', raw: true, optional: true,
        when: { field: 'entry', is: 'Answer a few questions' },
        ask: 'If {from} or {to} has more than one airport, which would you prefer? '
          + 'A group often moves faster through a quieter field, though the larger '
          + 'one may be the only one that takes the aircraft.',
        hint: 'Or tap Skip and Andreea will advise' },


      { id: 'budget', type: 'chips', field: 'budget',
        ask: 'Should you have a budget range in mind, you are welcome to share it '
          + 'so that Andreea can take it into account. This is entirely optional.',
        options: ['I have a budget in mind', 'I would rather see the options first',
                  'I prefer not to say'],
        next: { 'I have a budget in mind': 'budgetval' } },

      { id: 'budgetval', type: 'text', field: 'budget_value', raw: true,
        when: { field: 'budget', is: 'I have a budget in mind' },
        ask: 'What range should she work to?',
        hint: 'For example 30 to 40 thousand euro' },

      { id: 'bags', type: 'chips', field: 'luggage',
        ask: 'What is everyone bringing?',
        options: ['Normal suitcases', 'Sports equipment',
                  'Instruments or production gear', 'Unusually heavy or bulky',
                  'Not sure yet'] },

      { id: 'extras', type: 'text', field: 'notes', raw: true, optional: true,
        ask: 'And is there anything else that matters to you? Catering, timings, '
          + 'accessibility, anyone travelling who needs a little extra care.',
        hint: 'Or tap Skip' },


      /* Read it all back before anything is handed over. A PA confirms. */
      { id: 'review', type: 'review', field: 'review',
        ask: 'Allow me to confirm the details before I pass your enquiry to '
          + 'Andreea.',
        options: ['Everything is correct', 'Something needs changing'],
        next: { 'Something needs changing': 'amend' } },

      { id: 'amend', type: 'text', field: 'amendment', raw: true,
        when: { field: 'review', is: 'Something needs changing' },
        ask: 'Of course. What should I change?',
        hint: 'Write the correction and I will note it' },

      { type: 'end' }
    ]
  },

  /* ============================================================ CARGO CHARTER */
  cargo: {
    label: 'Cargo charter',
    minutes: 'about a minute',
    steps: [
      { type: 'say', ask: 'Of course. A few details about the shipment and Andreea '
        + 'will find the right aircraft for it. About 2 minutes.' },

      { id: 'intro', type: 'chips', field: 'entry',
        ask: 'Or tell me the whole job in one message and Andreea will sort it out.',
        options: ['Answer a few questions', 'Tell it in one message'],
        next: { 'Tell it in one message': 'dump' } },

      { id: 'dump', type: 'text', field: 'freeform', raw: true, goto: 'name',
        when: { field: 'entry', is: 'Tell it in one message' },
        ask: 'Of course. Tell me everything in your own words and Andreea will take '
          + 'it from there.',
        hint: 'Where from, where to, what it is, and roughly what it weighs' },

      { id: 'from', type: 'text', field: 'from',
        ask: 'Where is the cargo collecting from?', hint: 'A city or an airport' },

      { id: 'to', type: 'text', field: 'to',
        ask: 'And where is it going?', hint: 'A city or an airport' },

      /* Cargo has no hinge to hang this on, and it matters more here than
         anywhere: the freight terminal, the customs post and the night curfew
         are all decided by which field it lands at. */
      { id: 'airport', type: 'text', field: 'airport_pref', raw: true, optional: true,
        ask: 'If {from} or {to} has more than one airport, which would you prefer? '
          + 'Handling and customs can differ between them.',
        hint: 'Or tap Skip and Andreea will advise' },

      { id: 'what', type: 'text', field: 'commodity', raw: true,
        ask: 'What are you sending?',
        hint: 'For example machine parts, or pharmaceuticals' },

      { id: 'weight', type: 'chips', field: 'weight',
        ask: 'Roughly what does the whole consignment weigh?',
        options: ['Under 500 kg', '500 kg to 2 t', '2 to 10 t', '10 to 40 t',
                  'Over 40 t', 'Not sure yet'] },

      { id: 'piece', type: 'text', field: 'largest_piece', raw: true, optional: true,
        ask: 'And the largest single piece, roughly, in length, width and height? It '
          + 'decides which aircraft doors it will pass through.',
        hint: 'For example 2.4 by 1.2 by 1.5 m' },

      { id: 'dg', type: 'chips', field: 'dangerous_goods',
        ask: 'Does any of it count as dangerous goods? Batteries, aerosols, fuels, '
          + 'chemicals, anything pressurised. It is fine either way, it only changes '
          + 'the paperwork.',
        options: ['No', 'Yes', 'I am not sure'],
        next: { 'Yes': 'dgdetail' } },

      { id: 'dgdetail', type: 'text', field: 'dg_detail', raw: true,
        when: { field: 'dangerous_goods', is: 'Yes' },
        ask: 'Thank you for saying. What is it, and do you have a UN number for it?',
        hint: 'If you do not know the number, just describe it' },

      { id: 'temp', type: 'chips', field: 'temperature',
        ask: 'Does it need to be kept at a temperature?',
        options: ['No', 'Chilled', 'Frozen', 'Not sure'] },

      { id: 'when', type: 'chips', field: 'when',
        ask: 'When does it need to move?',
        options: ['Today or tomorrow', 'This week', 'A specific date', 'Flexible'],
        next: { 'A specific date': 'whendate' } },

      { id: 'whendate', type: 'text', field: 'date', raw: true,
        when: { field: 'when', is: 'A specific date' },
        ask: 'Which date?', hint: 'For example 22 November' },

      /* Time of day matters here for the handling agent and for any night
         curfew at either end, not for anyone's convenience. */
      { id: 'time', type: 'chips', field: 'time',
        ask: 'And what time of day?',
        options: ['Morning', 'Afternoon', 'Evening', 'Any time', 'A specific time'],
        next: { 'A specific time': 'timeexact' } },

      { id: 'timeexact', type: 'text', field: 'time_exact', raw: true,
        when: { field: 'time', is: 'A specific time' },
        ask: 'What time?', hint: 'For example on the ground by 14:00' },


      { id: 'budget', type: 'chips', field: 'budget',
        ask: 'Should you have a budget range in mind, you are welcome to share it '
          + 'so that Andreea can take it into account. This is entirely optional.',
        options: ['I have a budget in mind', 'I would rather see the options first',
                  'I prefer not to say'],
        next: { 'I have a budget in mind': 'budgetval' } },

      { id: 'budgetval', type: 'text', field: 'budget_value', raw: true,
        when: { field: 'budget', is: 'I have a budget in mind' },
        ask: 'What range should she work to?',
        hint: 'For example 30 to 40 thousand euro' },

      { id: 'name', type: 'text', field: 'name',
        ask: 'May I take your name?', hint: 'And your company, if there is one' },

      { id: 'how', type: 'chips', field: 'contact_by',
        ask: 'How would you like Andreea to come back to you?',
        options: ['WhatsApp', 'A call', 'Email'] },

      { id: 'contact', type: 'text', field: 'contact',
        ask: 'Thank you. What is the best {X}?',
        vary: { 'WhatsApp': 'number for WhatsApp', 'A call': 'number to call you on',
                'Email': 'email address' } },


      /* Read it all back before anything is handed over. A PA confirms. */
      { id: 'review', type: 'review', field: 'review',
        ask: 'Allow me to confirm the details before I pass your enquiry to '
          + 'Andreea.',
        options: ['Everything is correct', 'Something needs changing'],
        next: { 'Something needs changing': 'amend' } },

      { id: 'amend', type: 'text', field: 'amendment', raw: true,
        when: { field: 'review', is: 'Something needs changing' },
        ask: 'Of course. What should I change?',
        hint: 'Write the correction and I will note it' },

      { type: 'end' }
    ]
  },

  /* ============================================================ AIR AMBULANCE
   * The shortest flow on purpose, and the only one that takes the contact
   * details before it asks anything clinical. Someone writing this is
   * frightened, and if they give up halfway Andreea should still be able to
   * reach them.
   *
   * It does not offer a telephone number, invite anyone to ring, or say that
   * anyone answers at any hour. This is an enquiry for a medical flight, not
   * an emergency line, and nothing here should read as though it were one.
   */
  medical: {
    label: 'Air ambulance',
    minutes: 'about a minute',
    urgent: true,
    steps: [
      /* No sympathy, and no claims about Andreea.
       *
       * Sympathy is presumed here, not earned. At this point nobody has said
       * anything: they have tapped a button. A good share of these enquiries
       * come from an insurer's assistance desk or a hospital discharge office,
       * on their fourth transfer of the morning, and being commiserated with
       * is at best odd. And for the relative who really is frightened, a
       * machine saying it is sorry is thin comfort.
       *
       * So the opening promises the one thing it can actually deliver, which
       * is brevity, and then gets on with it. Competence is the comfort. */
      { type: 'say', ask: 'Of course. I will keep this short.' },

      { id: 'intro', type: 'chips', field: 'entry',
        ask: 'A few questions, or tell me the whole of it in one message, whichever '
          + 'is easier for you.',
        options: ['Answer a few questions', 'Tell it in one message'],
        next: { 'Tell it in one message': 'dump' } },

      { id: 'dump', type: 'text', field: 'freeform', raw: true, goto: 'name',
        when: { field: 'entry', is: 'Tell it in one message' },
        ask: 'Of course. Tell me what you can, in your own words.',
        hint: 'Where the patient is, where they need to go, and when' },

      /* Asked as a city, because "in hospital" is the answer the old wording
         invited and it is no use at all: an aircraft is quoted from a place,
         not from a building. The hospital name is welcome as well, which is
         why it comes second in the hint rather than first. */
      { id: 'from', type: 'text', field: 'from',
        ask: 'Which city is the patient in?',
        hint: 'A city or an airport, and the hospital name if you have it' },

      { id: 'to', type: 'text', field: 'to',
        ask: 'Where does the patient need to go?',
        hint: 'A city or an airport, and the hospital name if you have it' },

      /* In the core, directly after the route, because from, to, date and
         time are the 4 things without which there is nothing to quote. */
      { id: 'when', type: 'chips', field: 'when',
        ask: 'When must the patient travel?',
        options: ['As soon as possible', 'A specific date'],
        next: { 'A specific date': 'whendate' } },

      { id: 'whendate', type: 'text', field: 'date', raw: true,
        when: { field: 'when', is: 'A specific date' },
        ask: 'Which date, and what time if you know it?',
        hint: 'For example 14 November, leaving in the morning' },

      { id: 'name', type: 'text', field: 'name',
        ask: 'May I take your name, and how you are related to the patient?',
        hint: 'For example Maria, his daughter' },

      { id: 'how', type: 'chips', field: 'contact_by',
        ask: 'How would you like Andreea to reach you?',
        options: ['WhatsApp', 'A call', 'Email'] },

      { id: 'contact', type: 'text', field: 'contact',
        ask: 'Thank you. What is the best {X}?',
        vary: { 'WhatsApp': 'number for WhatsApp', 'A call': 'number to call you on',
                'Email': 'email address' } },

      { type: 'say', ask: 'Thank you. Andreea has that now and will come back to '
        + 'you.\n\nA few more details while you are here will let her have answers '
        + 'ready when she does.' },

      /* A way out, for the same reason the other 3 flows have one. Somebody
         who has already written everything in one message, or who has simply
         had enough, should not have to answer 5 more questions to be done. */
      { id: 'hinge', type: 'chips',
        ask: 'Shall we go on? You can stop here just as easily, and Andreea will '
          + 'ask when she comes back to you.',
        options: ['Yes, go on', 'I would rather stop here'],
        next: { 'I would rather stop here': '__end' } },

      /* Typed, like the passenger count and the bag count. A band is no use
         to a flight doctor: 65 or older covers 65 and 95, and for a baby the
         difference between 3 days and 3 months decides the equipment. */
      { id: 'age', type: 'text', field: 'patient_age',
        ask: 'How old is the patient?',
        hint: 'In years, or in weeks for a baby' },

      /* The one that decides the aircraft. A stretcher needs a cabin
         configured for it and a door it will pass through, a seated patient
         does not, and the difference is most of the cost. */
      { id: 'mobility', type: 'chips', field: 'mobility',
        ask: 'How will the patient need to travel?',
        options: ['On a stretcher', 'Seated', 'I am not sure'] },

      /* A transfer cannot be booked without somewhere to land them. Asked
         plainly, because not yet is a perfectly normal answer and Andreea
         would rather know now than on the day. */
      { id: 'receiving', type: 'chips', field: 'receiving_hospital',
        ask: 'Do you have the approval of the receiving hospital?',
        options: ['Yes', 'Not yet', 'I am not sure'] },

      { id: 'report', type: 'chips', field: 'medical_report',
        ask: 'Is there a medical report from the treating doctor?',
        options: ['Yes, I have it', 'Not yet', 'I can ask for one'] },

      { id: 'equip', type: 'multi', field: 'equipment',
        ask: 'Do you know what the patient will need on board? Tap anything that '
          + 'applies, and please do not worry if you are not sure. The flight doctor '
          + 'decides this properly.',
        options: ['I do not know yet', 'Ventilator', 'Monitor', 'Defibrillator',
                  'Infusion pump', 'ECMO', 'Incubator'] },

      /* Every medical transfer form asks this, and it is asked here for the
         same reason: a stretcher has to be lifted through a door. It carries
         a Skip, because it is a personal thing to be asked by a website. */
      { id: 'weight', type: 'text', field: 'patient_weight', raw: true, optional: true,
        ask: 'Roughly what does the patient weigh? It decides how they can be '
          + 'carried and loaded.',
        hint: 'An approximate figure is fine' },

      { id: 'infection', type: 'chips', field: 'infection',
        ask: 'Is there anything infectious, or any need for isolation?',
        options: ['No', 'Yes', 'I am not sure'] },

      { id: 'escort', type: 'text', field: 'escorts', raw: true,
        ask: 'Will anyone be travelling with the patient?',
        hint: 'How many, or none' },


      /* Read it all back before anything is handed over. A PA confirms. */
      { id: 'review', type: 'review', field: 'review',
        ask: 'Allow me to confirm the details before I pass your enquiry to '
          + 'Andreea.',
        options: ['Everything is correct', 'Something needs changing'],
        next: { 'Something needs changing': 'amend' } },

      { id: 'amend', type: 'text', field: 'amendment', raw: true,
        when: { field: 'review', is: 'Something needs changing' },
        ask: 'Of course. What should I change?',
        hint: 'Write the correction and I will note it' },

      { type: 'end' }
    ]
  },

  /* ================================================================== END */
  /* ================================================================== END
   * No response time is offered, because nobody can honestly offer one, and
   * no claim is made that anything was delivered. What is promised is only
   * what is true: it has been recorded, and it will be answered by the method
   * they chose.
   */
  endings: {
    jet: 'Thank you, {name}. I have recorded your requirements for Andreea to '
      + 'review.\n\nThe next step is to assess the available options and verify '
      + 'the operational details before preparing a proposal. I cannot give you a '
      + 'response time, as her schedule varies, but your enquiry is recorded and '
      + 'she will follow up by {by}.\n\nIf you would like to add anything in the '
      + 'meantime, you are welcome to do so here.',
    group: 'Thank you, {name}. I have recorded the group\u2019s requirements for '
      + 'Andreea to review.\n\nThe next step is to assess aircraft suitability and '
      + 'routing before a proposal can be prepared. I cannot give you a response '
      + 'time, as her schedule varies, but your enquiry is recorded and she will '
      + 'follow up by {by}.\n\nIf you would like to add anything in the meantime, '
      + 'you are welcome to do so here.',
    cargo: 'Thank you, {name}. I have recorded the shipment details for Andreea to '
      + 'review.\n\nThe next step is to assess suitable aircraft and handling '
      + 'arrangements, which remain subject to operational feasibility and the '
      + 'required approvals. I cannot give you a response time, as her schedule '
      + 'varies, but your enquiry is recorded and she will follow up by {by}.'
      + '\n\nIf you would like to add anything in the meantime, you are welcome to '
      + 'do so here.',
    medical: 'Thank you, {name}. I have recorded the essential details for Andreea '
      + 'to review.\n\nMedical suitability, operational feasibility and the '
      + 'transport arrangements have to be assessed by qualified people, so I '
      + 'cannot confirm acceptance or a response time on their behalf. Your '
      + 'enquiry is recorded and she will follow up by {by}.\n\nIf anything '
      + 'changes in the meantime, write it here and she will see it.'
  },

  byWord: { 'WhatsApp': 'WhatsApp', 'A call': 'telephone', 'Email': 'email' },

  /* ========================================================= LISTEN, off topic
   * The widget says the line, then repeats the question it was on, so nothing
   * is lost. Order matters. The first match wins.
   *
   * `always` means look for this even while an answer is expected. Only the
   * patterns that could never be a real answer carry it. "Where from?" is
   * never answered with "hello" or "I want to speak to a real person", so
   * those are safe. `admin` and `safety` are not, because a cargo shipment
   * really can be insurance documents going through customs, so those are
   * only looked for when the sentence is shaped like a question.
   */
  aside: [
    /* Checked first, and in every flow, because the one thing that must never
       be collected here is the one thing a trusting person might volunteer. */
    { k: 'sensitive', always: true,
      re: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b|\b(cvv|card number|credit card|passport number|iban|sort code|medical record|medical records)\b/i,
      say: 'Please do not send card details, passport numbers or medical records '
        + 'through this window. It is not the place for them, and Andreea will '
        + 'never ask for them in a chat.' },

    { k: 'medical', only: 'medical', always: true,
      re: /(will (he|she|they) (be )?(ok|okay|alright|survive))|should (he|she|they)|is it safe for (him|her|them)|(diagnos|prognos|condition|treatment)|how (ill|sick|bad)/i,
      say: 'I am not able to give you a medical opinion, and I would not want to '
        + 'guess at something this important. The flight doctor will go through all '
        + 'of it with you, and Andreea will put you in touch with them.' },

    { k: 'price', always: true,
      re: /(how much|what.*cost|\bprice|\bquote\b|cheap|expensive|budget|per hour)/i,
      say: 'It depends on the route, the aircraft and the date, so any number I gave '
        + 'you now would be a guess, and you deserve better than a guess. Andreea '
        + 'quotes a real figure in writing, with no obligation and nothing hidden in '
        + 'it.' },

    { k: 'operator', always: true,
      re: /(do you own|are you an operator|whose (plane|jet|aircraft)|is this your (plane|jet|fleet))/i,
      say: 'Andreea is a broker rather than an operator. She holds no aircraft of her '
        + 'own, which is rather the point. She goes out to the operators each time and '
        + 'brings you the right aircraft for that flight, not the one she happens to '
        + 'own.' },

    { k: 'safety',
      re: /(safe\b|safety|certif|licen[cs]|insur|argus|wyvern|audit|accident|crash)/i,
      say: 'A fair thing to ask. Andreea checks the operator certification and '
        + 'insurance on every single flight before she puts it to you, and she will '
        + 'show you the paperwork for your aircraft if you would like to see it.' },

    { k: 'empty', always: true,
      re: /(empty ?leg|repositioning|last minute deal|discount|offer)/i,
      say: 'Empty legs are on the site under Empty Legs, and they do come and go '
        + 'quickly. Tell Andreea the route you want and she will watch for one for '
        + 'you.' },

    { k: 'admin',
      re: /(cancel|refund|deposit|\bpay\b|payment|invoice|contract|terms|visa|customs|insurance claim)/i,
      say: 'That varies by operator and by route, so Andreea will answer it herself '
        + 'rather than let me give you half an answer.' },

    /* `escalate` stops the script. Carrying on with the questions after
       somebody has asked for a person is the rudest thing a chat can do.
       No reply time is offered, because none can honestly be offered. */
    { k: 'human', always: true, escalate: true,
      re: /((speak|talk|chat)\s+(to|with)\s+\w*\s*(you|someone|a person|a human|andreea|a real)|real person|human being|an agent|call me back|get me a human)/i,
      say: 'Of course. I will stop the questions here and pass this straight to '
        + 'Andreea. She reads everything written in this window. I am not able to '
        + 'say when she will reply, as her schedule varies, but she has your '
        + 'enquiry.\n\nYou are welcome to add anything while you wait.' },

    { k: 'hello', always: true,
      re: /^(hi|hey|hello|good (morning|afternoon|evening))\b[\s\S]{0,12}$/i,
      say: 'Hello, and welcome.' },

    { k: 'thanks', always: true,
      re: /^(thanks|thank you|thx|merci|gracias|grazie)\b[\s\S]{0,12}$/i,
      say: 'You are very welcome.' }
  ],

  /* The line for when it simply does not know, which should never sound like a
   * failure, because it is not one. */
  unknown: 'That is exactly the sort of thing Andreea answers herself, and she will. '
    + 'She reads everything written here.',

  resume: 'Now, where were we.',

  /* A hard stop. No cleverness, no engagement. */
  rude: {
    re: /(f[u\*@]ck|sh[i\*@]t|bitch|bastard|idiot|moron|scam|fraud)/i,
    say: 'I would rather not go on like this. If something has gone wrong, Andreea '
      + 'would genuinely like to hear about it at andreea@flywithandreea.com.'
  }
};
