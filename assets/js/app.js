/* 1. Global Statements
 * ============== */

// reference Firebase
trainRef = new Firebase('https://sgtrains.firebaseio.com/');

/* set up vars for later interval for every minute of the hour
 * Source: http://stackoverflow.com/questions/23449917/
 * run-js-function-every-new-minute */

// get current seconds remaining in the current minute
var time = new Date();
var milliRemaining = (60 - time.getSeconds()) * 1000;


/* 2. Functions
 * ============ */
var interface = {
	
	// a. properties

	// b. methods

	// trainSetter: send form data to Firebase
	trainSetter : function(){
		// catch inputs
		var name = $('#name-input').val().trim();
		var dest = $('#dest-input').val().trim();
		var first = $('#first-input').val().trim();
		var freq = $('#freq-input').val().trim();

		// push inputs in firebase
		trainRef.push({
			name: name,
			dest: dest,
			first: first,
			freq: freq,
			dateAdded: Firebase.ServerValue.TIMESTAMP
		})
	},

	// trainGetter: retrieve form data from Firebase
	trainGetter : function(snapshot) {
		console.log(snapshot);
		
		// catch data from Firebase
		var name = snapshot.val().name;
		var dest = snapshot.val().dest;
		var first = snapshot.val().first;
		var freq = snapshot.val().freq;

		// catch current
		var m_current = moment();

		// make a string with only the current day
		var m_current_day = m_current.format('YYYY-MM-DD');

		// make first train moment
		// using the first train's time along with the current day
		var m_first = moment(m_current_day + ' ' + first, 'YYYY-MM-DD hh:mm A');

		/* calculate when the next arrival time will be 
		 * using freq, the m_current and m_first obj's, 
		 * and a flag for our while loop */
		
		// this will stay true until m_first passes m_current
		var beforeCurrent = true;

		// make an arrival moment, which will morph in the while loop
		var m_arrival = m_first;

		// add freq to m_arrival until it passes m_current.
		// (this will give us the latest arrival time).
		while(beforeCurrent) {
			m_arrival.add(freq, 'minutes')
			if (m_arrival.isAfter(m_current)) {
				beforeCurrent = false;
			}
		}

		// subtract m_arrival from m_current  
		// to get the minutes until train arrives
		var duration = moment.duration(m_first.diff(m_current));
		var durationString = Math.ceil(duration.asMinutes());

		// append to table
		$('#train-table').find('tbody')
			.append($('<tr>')
				.append( $('<td>')
					.text(name)
				)
				.append( $('<td>')
					.text(dest)
				)
				.append( $('<td>')
					.text(freq)
					.addClass('freq-row')
				)
				.append( $('<td>')
					.text(m_arrival.format('hh:mm A'))
					.addClass('arrival-row')
				)
				.append( $('<td>')
					.text(durationString)
					.addClass('next-row')
				)
			)
		;
	},

	trainMinute : function() {
		// catch current time
		var m_current = moment().tz("America/New_York");
		// make a string with only the current day
		var m_current_day = m_current.format('YYYY-MM-DD');

		// catch the times and rates in the table, save as arr's
		var freqs = $("td.freq-row").map(function() {
									return Number($(this).text());
							 	}).get();

		var arrivals = $("td.arrival-row").map(function() {
									return moment(m_current_day + " " + $(this).text(), 'YYYY-MM-DD hh:mm A').tz("America/New_York");
							 	}).get();

		var nexts = $("td.next-row").map(function() {
									return Number($(this).text());
							 	}).get();

		// FOR LOOP
		for (var i = 0; i < arrivals.length; i++) {

			// if an arrival time falls after current time, major edits
			if (arrivals[i].isBefore(m_current)) {

				// this will stay true until m_arrival passes m_current
				var beforeCurrent = true;

				// make an arrival moment, which will morph in the while loop
				var m_arrival = arrivals[i];

				// keep adding to m_arrival until it's a valid arrival time
				while(beforeCurrent) {
					m_arrival.add(freqs[i], 'minutes')
					if (m_arrival.isAfter(m_current)) {
						beforeCurrent = false;
					}
				}

				// edit the rows
				var arrRow = $("td.arrival-row")[i];
				$(arrRow).text(m_arrival.format("hh:mm A"));
				var nextRow = $("td.next-row")[i]
				$(nextRow).text(freqs[i]);
			}
			// if not, just change the next arrival change
			else {

				// bring down next num by a minute
				nexts[i]--;

				//edit the html
				var nextRow = $("td.next-row")[i];
				$(nextRow).text(nexts[i]);
			}
		}
	}
}


/* 3. Calls
 * ======== */

// submit button
$('#train-form').on('click', '#submit', function() {
	interface.trainSetter();
	return false;
});

// firebase updates
trainRef.orderByChild("dateAdded").limitToLast(3)
.on("child_added", function(childSnapshot, prevChildKey) {
	interface.trainGetter(childSnapshot);
});

// set up a timeinterval using the actual minutes of the hour
setTimeout(function() {
	interface.trainMinute();
	var intervalID = setInterval(function() { 
		interface.trainMinute()
	}, 60000)
}, milliRemaining);

