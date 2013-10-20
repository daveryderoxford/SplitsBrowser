(function () {

    var formatTime = SplitsBrowser.formatTime;
    var parseTime = SplitsBrowser.parseTime;

    module("Time");

    QUnit.test("Can format a null number of seconds ", function(assert) {
        assert.equal(formatTime(null), SplitsBrowser.NULL_TIME_PLACEHOLDER);
    });

    QUnit.test("Can format zero seconds as a string ", function(assert) {
        assert.equal(formatTime(0), "00:00");
    });

    QUnit.test("Can format three seconds as a string", function(assert) {
        assert.equal(formatTime(3), "00:03");
    });

    QUnit.test("Can format fifteen seconds as a string", function(assert) {
        assert.equal(formatTime(15), "00:15");
    });

    QUnit.test("Can format one minute as a string", function(assert) {
        assert.equal(formatTime(60), "01:00");
    });

    QUnit.test("Can format one minute one second as a string", function(assert) {
        assert.equal(formatTime(60 + 1), "01:01");
    });

    QUnit.test("Can format eleven minutes forty-two seconds as a string", function(assert) {
        assert.equal(formatTime(11 * 60 + 42), "11:42");
    });

    QUnit.test("Can format an hour as a string", function(assert) {
        assert.equal(formatTime(60 * 60), "1:00:00");
    });

    QUnit.test("Can format three hours, fifty-two minutes and seventeen seconds as a string", function(assert) {
        assert.equal(formatTime(3 * 60 * 60 + 52 * 60 + 17), "3:52:17");
    });

    QUnit.test("Can format minus three seconds as a string", function(assert) {
        assert.equal(formatTime(-3), "-00:03");
    });

    QUnit.test("Can format minus fifteen seconds as a string", function(assert) {
        assert.equal(formatTime(-15), "-00:15");
    });

    QUnit.test("Can format minus one minute as a string", function(assert) {
        assert.equal(formatTime(-60), "-01:00");
    });

    QUnit.test("Can format minus one minute one second as a string", function(assert) {
        assert.equal(formatTime(-60 - 1), "-01:01");
    });

    QUnit.test("Can format minus eleven minutes forty-two seconds as a string", function(assert) {
        assert.equal(formatTime(-11 * 60 - 42), "-11:42");
    });

    QUnit.test("Can format minus an hour as a string", function(assert) {
        assert.equal(formatTime(-60 * 60), "-1:00:00");
    });

    QUnit.test("Can format minus three hours, fifty-two minutes and seventeen seconds as a string", function(assert) {
        assert.equal(formatTime(-3 * 60 * 60 - 52 * 60 - 17), "-3:52:17");
    });
    
    QUnit.test("Can parse a zero minute zero second string to zero", function (assert) {
        assert.equal(parseTime("0:00"), 0);
    });
    
    QUnit.test("Can parse a one minute two second string with single minute digit to 62 seconds", function (assert) {
        assert.equal(parseTime("1:02"), 62);
    });
   
    QUnit.test("Can parse a one minute two second string with two-digit minutes to 62 seconds", function (assert) {
        assert.equal(parseTime("01:02"), 62);
    });
   
    QUnit.test("Can parse large time in minutes and seconds correctly", function (assert) {
        assert.equal(parseTime("1479:36"), 1479 * 60 + 36);
    });
   
    QUnit.test("Can parse zero hour zero minute zero second time to zero", function (assert) {
        assert.equal(parseTime("0:00:00"), 0);
    });
   
    QUnit.test("Can parse one hour two minute three second time correctly", function (assert) {
        assert.equal(parseTime("1:02:03"), 3600 + 2 * 60 + 3);
    });
   
    QUnit.test("Can parse large time in hours, minutes and seconds correctly", function (assert) {
        assert.equal(parseTime("781:49:18"), 781 * 3600 + 49 * 60 + 18);
    });
   
    QUnit.test("Can parse null value placeholder back to null", function (assert) {
        assert.strictEqual(parseTime(SplitsBrowser.NULL_TIME_PLACEHOLDER), null);
    });
})();