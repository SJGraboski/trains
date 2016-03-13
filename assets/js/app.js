/* 1. Global Vars
 * ============== */

trainRef = new Firebase('https://sgtrains.firebaseio.com/');

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
		console.log(first);
		var freq = snapshot.val().freq;

		// catch current
		m_current = moment();

		// make a string with only the current day
		m_current_day = m_current.format('YYYY-MM-DD');

		// make first train moment
		// using the first train's time along with the current day
		m_first = moment(m_current_day + ' ' + first, 'YYYY-MM-DD hh:mm A');
		console.log('first: ' + m_first.format('YYYY-MM-DD hh:mm A'));

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
			m_first.add(freq, 'minutes')
			if (m_first.isAfter(m_current)) {
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
				)
				.append( $('<td>')
					.text(m_arrival.format('hh:mm A'))
				)
				.append( $('<td>')
					.text(durationString)
				)
			)
		;
	}
}

/* 3. Calls
 * ======== */

// submit button
$('#train-form').on('click', '#submit', function() {
	interface.trainSetter();
	console.log("OK");
	return false;
})

// firebase updates
trainRef.orderByChild("dateAdded").limitToLast(3)
.on("child_added", function(childSnapshot, prevChildKey) {
	interface.trainGetter(childSnapshot);
})

// update site eve